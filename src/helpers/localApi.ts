import { AxiosError, AxiosHeaders } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { iranianPhoneRegExp, normalizeIranianPhone } from "@/helpers/auth";
import { applyCoupon, normalizeCouponCode } from "@/helpers/coupons";
import { resolveShippingFee } from "@/helpers/shipping";
import {
  hasVariants,
  normalizeVariants,
  variantLabel,
  variantUnitPrice,
} from "@/helpers/variants";
import { normalizeImagesInput } from "@/helpers/productImages";
import { nextStatuses, canCustomerCancel } from "@/helpers/orders";
import { canRequestReturn } from "@/helpers/returns";
import { makeAuthority, makeRefId } from "@/helpers/payments";
import { averageRating, clampRating } from "@/helpers/reviews";
import { deliverOtpSms, shouldShowOtpHint } from "@/helpers/sms";
import { permissionsForRole, roleFromPermissions } from "@/helpers/roles";
import type { ShopRole } from "@/helpers/roles";
import type Product from "@/models/product";
import type Order from "@/models/order";
import type { OrderItem, OrderStatus } from "@/models/order";
import type { CouponType } from "@/models/coupon";
import type Address from "@/models/address";
import type { ReturnStatus } from "@/models/returnRequest";
import {
  ADMIN_PERMISSIONS,
  clearCustomerOtpHint,
  clearCustomerPendingOtp,
  clearCustomerSession,
  clearPendingOtp,
  clearOtpHint,
  clearSession,
  getAddresses,
  getCoupons,
  getCustomerPendingOtp,
  getCustomerSession,
  getCustomers,
  getPendingOtp,
  getProducts,
  getOrders,
  getReturns,
  getReviews,
  getSession,
  getShippingMethods,
  getShopSettings,
  getStockAlerts,
  getOrderNotifications,
  getUsers,
  nextId,
  publicUser,
  pushOrderNotification,
  randomOtp,
  randomToken,
  recordLowStockAlerts,
  saveAddresses,
  saveCoupons,
  saveCustomerOtpHint,
  saveCustomerPendingOtp,
  saveCustomerSession,
  saveCustomers,
  saveOtpHint,
  saveOrders,
  saveOrderNotifications,
  savePendingOtp,
  saveProducts,
  saveReviews,
  saveReturns,
  saveSession,
  saveShippingMethods,
  saveShopSettings,
  saveStockAlerts,
  saveUsers,
} from "@/helpers/localDb";

function pathOf(config: InternalAxiosRequestConfig) {
  const raw = config.url ?? "";
  const [pathname, query] = raw.split("?");
  return {
    path: pathname || "/",
    search: new URLSearchParams(query ?? ""),
  };
}

function bodyOf(config: InternalAxiosRequestConfig) {
  if (!config.data) return {};
  if (typeof config.data === "string") {
    try {
      return JSON.parse(config.data);
    } catch {
      return {};
    }
  }
  return config.data as Record<string, unknown>;
}

function ok(
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse {
  return {
    data,
    status,
    statusText: "OK",
    headers: {},
    config,
    request: {},
  };
}

function fail(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
) {
  return new AxiosError(
    "Request failed",
    status === 401 ? AxiosError.ERR_BAD_REQUEST : AxiosError.ERR_BAD_RESPONSE,
    config,
    undefined,
    {
      status,
      data,
      statusText: "Error",
      headers: new AxiosHeaders(),
      config,
    },
  );
}

function resolveCompareAtPrice(
  raw: unknown,
  price: number,
  config: InternalAxiosRequestConfig,
  allowClear = false,
): number | undefined {
  if (raw === undefined) return undefined;
  if (raw === "" || raw === null) {
    if (allowClear) return undefined;
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    if (allowClear) return undefined;
    return undefined;
  }
  if (value <= price) {
    throw fail(config, 422, {
      errors: { compareAtPrice: "قیمت قبلی باید از قیمت فروش بیشتر باشد" },
    });
  }
  return value;
}

/** Put sold units back on products / variants (cancel or return). */
function restoreOrderStock(items: OrderItem[], products: Product[]): Product[] {
  return products.map((product) => {
    const moves = items.filter((item) => item.productId === product.id);
    if (moves.length === 0) return product;
    if (hasVariants(product) && product.variants) {
      const variants = product.variants.map((variant) => {
        const qty = moves
          .filter((item) => item.variantId === variant.id)
          .reduce((sum, item) => sum + item.qty, 0);
        if (!qty) return variant;
        return { ...variant, stock: variant.stock + qty };
      });
      return {
        ...product,
        variants,
        stock: variants.reduce((sum, item) => sum + item.stock, 0),
      };
    }
    const qty = moves.reduce((sum, item) => sum + item.qty, 0);
    return { ...product, stock: (product.stock ?? 0) + qty };
  });
}

function restoreCouponUsage(order: Pick<Order, "couponCode">) {
  const code = order.couponCode?.trim();
  if (!code) return;
  const coupons = getCoupons();
  const index = coupons.findIndex((item) => item.code === code);
  if (index < 0) return;
  coupons[index] = {
    ...coupons[index],
    usedCount: Math.max(0, (coupons[index].usedCount ?? 0) - 1),
  };
  saveCoupons(coupons);
}

function applyOrderCancellation(order: Order) {
  saveProducts(restoreOrderStock(order.items, getProducts()));
  restoreCouponUsage(order);
}

export async function handleLocalRequest(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const method = (config.method ?? "get").toUpperCase();
  const { path, search } = pathOf(config);
  const body = bodyOf(config);

  if (method === "POST" && path === "/auth/register") {
    const name = String(body.name ?? "").trim();
    const phone = normalizeIranianPhone(String(body.phone ?? ""));
    const users = getUsers();

    if (name.length < 2) {
      throw fail(config, 422, { errors: { name: "نام را درست بنویس" } });
    }
    if (users.some((user) => user.phone === phone)) {
      throw fail(config, 422, {
        errors: { phone: "این شماره قبلا ثبت شده" },
      });
    }

    const user = {
      id: nextId(users),
      name,
      phone,
      permissions: users.length === 0 ? ADMIN_PERMISSIONS : [],
    };
    // first account is admin; later ones start as seller
    saveUsers([...users, user]);
    return ok(config, { user: publicUser(user) }, 201);
  }

  if (method === "POST" && path === "/auth/login") {
    const phone = normalizeIranianPhone(String(body.phone ?? ""));
    const user = getUsers().find((item) => item.phone === phone);
    if (!user) {
      throw fail(config, 422, {
        errors: { phone: "این شماره ثبت نشده. اول ثبت‌نام کن" },
      });
    }

    const token = randomToken();
    const code = randomOtp();
    savePendingOtp({ token, phone, code });

    const delivery = await deliverOtpSms(phone, code);
    const showHint = shouldShowOtpHint(delivery.sent);
    if (showHint) saveOtpHint(code);
    else clearOtpHint();

    return ok(config, {
      token,
      debug_code: showHint ? code : undefined,
      sms_sent: delivery.sent,
      sms_provider: delivery.provider,
    });
  }

  if (method === "POST" && path === "/auth/login/verify-phone") {
    const token = String(body.token ?? "");
    const code = String(body.code ?? "");
    const pending = getPendingOtp();

    if (!pending || pending.token !== token) {
      throw fail(config, 422, { errors: { code: "نشست ورود منقضی شده" } });
    }
    if (pending.code !== code) {
      throw fail(config, 422, { errors: { code: "کد درست نیست" } });
    }

    const stored = getUsers().find((item) => item.phone === pending.phone);
    if (!stored) {
      throw fail(config, 422, { errors: { code: "کاربر پیدا نشد" } });
    }

    const sessionToken = randomToken();
    const user = publicUser(stored);
    saveSession({ token: sessionToken, user });
    clearPendingOtp();
    return ok(config, { user: { ...user, token: sessionToken } });
  }

  if (method === "GET" && path === "/users") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    if (!session.user.permissions?.includes("manage_users")) {
      throw fail(config, 403, { message: "forbidden" });
    }
    return ok(config, {
      users: getUsers().map((user) => ({
        ...publicUser(user),
        phone: user.phone,
      })),
    });
  }

  const userRoleMatch = path.match(/^\/users\/(\d+)\/role$/);
  if (method === "POST" && userRoleMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    if (!session.user.permissions?.includes("manage_users")) {
      throw fail(config, 403, { message: "forbidden" });
    }

    const id = Number(userRoleMatch[1]);
    const role = String(body.role ?? "") as ShopRole;
    if (role !== "admin" && role !== "seller") {
      throw fail(config, 422, { errors: { role: "نقش درست نیست" } });
    }

    const users = getUsers();
    const index = users.findIndex((user) => user.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });

    const currentRole = roleFromPermissions(users[index].permissions);
    if (currentRole === "admin" && role === "seller") {
      const adminCount = users.filter(
        (user) => roleFromPermissions(user.permissions) === "admin",
      ).length;
      if (adminCount <= 1) {
        throw fail(config, 422, {
          errors: { role: "حداقل یک ادمین باید بماند" },
        });
      }
    }

    users[index] = {
      ...users[index],
      permissions: permissionsForRole(role),
    };
    saveUsers(users);

    if (session.user.id === id) {
      const nextUser = publicUser(users[index]);
      saveSession({ ...session, user: nextUser });
    }

    return ok(config, {
      user: {
        ...publicUser(users[index]),
        phone: users[index].phone,
      },
    });
  }

  if (method === "GET" && path === "/user") {
    const session = getSession();
    if (!session) {
      throw fail(config, 401, { message: "unauthenticated" });
    }
    return ok(config, { user: session.user });
  }

  if (method === "GET" && path === "/products") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });

    const page = Number(search.get("page") ?? 1) || 1;
    const perPage = Number(search.get("per_page") ?? 10) || 10;
    const q = String(search.get("q") ?? "")
      .trim()
      .toLowerCase();
    const all = getProducts().filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        String(item.id).includes(q) ||
        (item.title_en ?? "").toLowerCase().includes(q)
      );
    });
    const start = (page - 1) * perPage;
    const data = all.slice(start, start + perPage);
    return ok(config, {
      data,
      total_page: Math.max(1, Math.ceil(all.length / perPage)),
    });
  }

  const productMatch = path.match(/^\/products\/(\d+)$/);
  if (method === "GET" && productMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(productMatch[1]);
    const product = getProducts().find((item) => item.id === id);
    if (!product) throw fail(config, 404, { message: "not found" });
    return ok(config, { product });
  }

  if (method === "POST" && path === "/products/create") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const products = getProducts();
    const variants = normalizeVariants(body.variants);
    const stock = variants
      ? variants.reduce((sum, item) => sum + item.stock, 0)
      : Number(body.stock ?? 1);
    const price = Number(body.price ?? 0);
    const compareAtPrice = resolveCompareAtPrice(
      body.compareAtPrice,
      price,
      config,
      true,
    );
    const media = normalizeImagesInput(body.images, body.image);
    const product = {
      id: nextId(products),
      title: String(body.title ?? ""),
      title_en: String(body.title_en ?? "").trim() || undefined,
      category: String(body.category ?? body.category_id ?? ""),
      body: String(body.body ?? body.description ?? ""),
      body_en: String(body.body_en ?? "").trim() || undefined,
      price,
      compareAtPrice,
      user_id: session.user.id,
      created_at: new Date().toISOString(),
      stock,
      emoji: String(body.emoji ?? "📦"),
      image: media.image,
      images: media.images,
      variants,
      featured: Boolean(body.featured),
    };
    saveProducts([product, ...products]);
    return ok(config, { product }, 201);
  }

  const updateMatch = path.match(/^\/products\/(\d+)\/update$/);
  if (method === "POST" && updateMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(updateMatch[1]);
    const products = getProducts();
    const index = products.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    const variants =
      body.variants !== undefined
        ? normalizeVariants(body.variants)
        : products[index].variants;
    const stock = variants
      ? variants.reduce((sum, item) => sum + item.stock, 0)
      : Number(body.stock ?? products[index].stock ?? 0);
    const price = Number(body.price ?? products[index].price);
    const compareAtPrice =
      body.compareAtPrice !== undefined
        ? resolveCompareAtPrice(body.compareAtPrice, price, config, true)
        : products[index].compareAtPrice;
    const media =
      body.images !== undefined || body.image !== undefined
        ? normalizeImagesInput(
            body.images !== undefined
              ? body.images
              : body.image
                ? [body.image]
                : [],
            body.image,
          )
        : {
            image: products[index].image,
            images: products[index].images,
          };
    products[index] = {
      ...products[index],
      title: String(body.title ?? products[index].title),
      title_en:
        body.title_en !== undefined
          ? String(body.title_en).trim() || undefined
          : products[index].title_en,
      category: String(body.category ?? body.category_id ?? products[index].category),
      body: String(body.body ?? body.description ?? products[index].body),
      body_en:
        body.body_en !== undefined
          ? String(body.body_en).trim() || undefined
          : products[index].body_en,
      price,
      compareAtPrice,
      stock,
      emoji: String(body.emoji ?? products[index].emoji ?? "📦"),
      image: media.image,
      images: media.images,
      variants,
      featured:
        body.featured !== undefined
          ? Boolean(body.featured)
          : products[index].featured,
    };
    saveProducts(products);
    recordLowStockAlerts([products[index]]);
    return ok(config, { product: products[index] });
  }

  const featureMatch = path.match(/^\/products\/(\d+)\/feature$/);
  if (method === "POST" && featureMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(featureMatch[1]);
    const products = getProducts();
    const index = products.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    products[index] = {
      ...products[index],
      featured: !products[index].featured,
    };
    saveProducts(products);
    return ok(config, { product: products[index] });
  }

  const deleteMatch = path.match(/^\/products\/(\d+)\/delete$/);
  if (method === "POST" && deleteMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(deleteMatch[1]);
    saveProducts(getProducts().filter((item) => item.id !== id));
    return ok(config, { status: "success" });
  }

  if (method === "GET" && path === "/shop/products") {
    const reviews = getReviews();
    const products = getProducts().map((product) => {
      const list = reviews.filter((item) => item.productId === product.id);
      return {
        ...product,
        ratingAvg: averageRating(list),
        reviewCount: list.length,
      };
    });
    return ok(config, { products });
  }

  const shopProductMatch = path.match(/^\/shop\/products\/(\d+)$/);
  if (method === "GET" && shopProductMatch) {
    const id = Number(shopProductMatch[1]);
    const product = getProducts().find((item) => item.id === id);
    if (!product) throw fail(config, 404, { message: "not found" });
    const list = getReviews().filter((item) => item.productId === id);
    return ok(config, {
      product: {
        ...product,
        ratingAvg: averageRating(list),
        reviewCount: list.length,
      },
    });
  }

  const shopReviewsMatch = path.match(/^\/shop\/products\/(\d+)\/reviews$/);
  if (method === "GET" && shopReviewsMatch) {
    const id = Number(shopReviewsMatch[1]);
    const product = getProducts().find((item) => item.id === id);
    if (!product) throw fail(config, 404, { message: "not found" });
    const reviews = getReviews()
      .filter((item) => item.productId === id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return ok(config, {
      reviews,
      ratingAvg: averageRating(reviews),
      reviewCount: reviews.length,
    });
  }

  if (method === "POST" && shopReviewsMatch) {
    const id = Number(shopReviewsMatch[1]);
    const product = getProducts().find((item) => item.id === id);
    if (!product) throw fail(config, 404, { message: "not found" });

    const authorName = String(body.authorName ?? "").trim();
    const rating = clampRating(Number(body.rating ?? 0));
    const reviewBody = String(body.body ?? "").trim();

    if (authorName.length < 2) {
      throw fail(config, 422, { errors: { authorName: "نام را بنویس" } });
    }
    if (!Number.isFinite(Number(body.rating)) || Number(body.rating) < 1) {
      throw fail(config, 422, { errors: { rating: "امتیاز ۱ تا ۵ بده" } });
    }
    if (reviewBody.length < 3) {
      throw fail(config, 422, { errors: { body: "نظر کوتاه است" } });
    }

    const reviews = getReviews();
    const review = {
      id: nextId(reviews),
      productId: id,
      authorName,
      rating,
      body: reviewBody,
      created_at: new Date().toISOString(),
    };
    saveReviews([review, ...reviews]);
    return ok(config, { review }, 201);
  }

  if (method === "GET" && path === "/orders") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    return ok(config, { orders: getOrders() });
  }

  const orderMatch = path.match(/^\/orders\/(\d+)$/);
  if (method === "GET" && orderMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(orderMatch[1]);
    const order = getOrders().find((item) => item.id === id);
    if (!order) throw fail(config, 404, { message: "not found" });
    return ok(config, { order });
  }

  if (method === "POST" && (path === "/orders" || path === "/shop/orders")) {
    const session = getSession();
    if (path === "/orders" && !session) {
      throw fail(config, 401, { message: "unauthenticated" });
    }

    const customerName = String(body.customerName ?? "").trim();
    const customerPhone = normalizeIranianPhone(String(body.customerPhone ?? ""));
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (customerName.length < 2) {
      throw fail(config, 422, { errors: { customerName: "نام مشتری را بنویس" } });
    }
    if (!iranianPhoneRegExp.test(customerPhone)) {
      throw fail(config, 422, { errors: { customerPhone: "شماره درست نیست" } });
    }
    if (rawItems.length === 0) {
      throw fail(config, 422, { errors: { items: "حداقل یک محصول لازم است" } });
    }

    const products = getProducts();
    const items: OrderItem[] = [];
    const stockMoves: Array<{
      productId: number;
      variantId?: number;
      qty: number;
    }> = [];

    for (const raw of rawItems) {
      const row = raw as { productId?: number; qty?: number; variantId?: number };
      const product = products.find((item) => item.id === Number(row.productId));
      const qty = Number(row.qty ?? 0);
      if (!product || qty < 1) {
        throw fail(config, 422, { errors: { items: "محصول یا تعداد درست نیست" } });
      }

      if (hasVariants(product)) {
        const variantId = Number(row.variantId ?? 0);
        const variant = product.variants?.find((item) => item.id === variantId);
        if (!variant) {
          throw fail(config, 422, {
            errors: { items: `برای «${product.title}» سایز/رنگ را انتخاب کن` },
          });
        }
        if (variant.stock < qty) {
          throw fail(config, 422, {
            errors: {
              items: `موجودی «${product.title} (${variantLabel(variant)})» کافی نیست`,
            },
          });
        }
        items.push({
          productId: product.id,
          title: `${product.title} (${variantLabel(variant)})`,
          emoji: product.emoji ?? "📦",
          image: product.image,
          price: variantUnitPrice(product, variant),
          qty,
          variantId: variant.id,
          size: variant.size,
          color: variant.color,
        });
        stockMoves.push({ productId: product.id, variantId: variant.id, qty });
      } else {
        if ((product.stock ?? 0) < qty) {
          throw fail(config, 422, {
            errors: { items: `موجودی «${product.title}» کافی نیست` },
          });
        }
        items.push({
          productId: product.id,
          title: product.title,
          emoji: product.emoji ?? "📦",
          image: product.image,
          price: product.price,
          qty,
        });
        stockMoves.push({ productId: product.id, qty });
      }
    }

    const paymentMethod =
      String(body.paymentMethod ?? "cod") === "online" ? "online" : "cod";

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    let discount = 0;
    let couponCode: string | undefined;
    const rawCoupon = String(body.couponCode ?? "").trim();
    if (rawCoupon) {
      const code = normalizeCouponCode(rawCoupon);
      const coupons = getCoupons();
      const coupon = coupons.find((item) => item.code === code);
      if (!coupon) {
        throw fail(config, 422, { errors: { couponCode: "کد تخفیف پیدا نشد" } });
      }
      const applied = applyCoupon(coupon, subtotal);
      if (!applied.ok) {
        throw fail(config, 422, { errors: { couponCode: applied.message } });
      }
      discount = applied.discount;
      couponCode = coupon.code;
      const index = coupons.findIndex((item) => item.id === coupon.id);
      coupons[index] = {
        ...coupon,
        usedCount: (coupon.usedCount ?? 0) + 1,
      };
      saveCoupons(coupons);
    }

    const nextProducts = products.map((product) => {
      const moves = stockMoves.filter((move) => move.productId === product.id);
      if (moves.length === 0) return product;
      if (hasVariants(product) && product.variants) {
        const variants = product.variants.map((variant) => {
          const taken = moves
            .filter((move) => move.variantId === variant.id)
            .reduce((sum, move) => sum + move.qty, 0);
          if (!taken) return variant;
          return { ...variant, stock: variant.stock - taken };
        });
        return {
          ...product,
          variants,
          stock: variants.reduce((sum, item) => sum + item.stock, 0),
        };
      }
      const taken = moves.reduce((sum, move) => sum + move.qty, 0);
      return { ...product, stock: (product.stock ?? 0) - taken };
    });
    saveProducts(nextProducts);
    recordLowStockAlerts(nextProducts);

    const customerSession = getCustomerSession();
    const customerId =
      customerSession &&
      customerSession.customer.phone === customerPhone
        ? customerSession.customer.id
        : undefined;

    const goodsTotal = Math.max(0, subtotal - discount);
    const shippingMethodId = Number(body.shippingMethodId ?? 0);
    const shippingMethods = getShippingMethods();
    const shippingMethod =
      shippingMethods.find((item) => item.id === shippingMethodId) ??
      shippingMethods.find((item) => item.key === "pickup" && item.active) ??
      shippingMethods.find((item) => item.active);

    if (!shippingMethod) {
      throw fail(config, 422, {
        errors: { shippingMethodId: "روش ارسال پیدا نشد" },
      });
    }

    const shippingResult = resolveShippingFee(shippingMethod, goodsTotal);
    if (!shippingResult.ok) {
      throw fail(config, 422, {
        errors: { shippingMethodId: shippingResult.message },
      });
    }

    let orderAddress:
      | {
          label?: string;
          recipientName: string;
          phone: string;
          province: string;
          city: string;
          street: string;
          postalCode?: string;
        }
      | undefined;

    if (shippingMethod.requiresAddress) {
      const addressId = Number(body.addressId ?? 0);
      if (addressId > 0) {
        if (!customerId) {
          throw fail(config, 422, {
            errors: { addressId: "برای آدرس ذخیره‌شده باید وارد شوی" },
          });
        }
        const saved = getAddresses().find(
          (item) => item.id === addressId && item.customerId === customerId,
        );
        if (!saved) {
          throw fail(config, 422, {
            errors: { addressId: "آدرس پیدا نشد" },
          });
        }
        orderAddress = {
          label: saved.label,
          recipientName: saved.recipientName,
          phone: saved.phone,
          province: saved.province,
          city: saved.city,
          street: saved.street,
          postalCode: saved.postalCode,
        };
      } else {
        const raw = (body.address ?? {}) as Record<string, unknown>;
        const recipientName = String(raw.recipientName ?? customerName).trim();
        const addrPhone = normalizeIranianPhone(
          String(raw.phone ?? customerPhone),
        );
        const province = String(raw.province ?? "").trim();
        const city = String(raw.city ?? "").trim();
        const street = String(raw.street ?? "").trim();
        const postalCode = String(raw.postalCode ?? "").trim() || undefined;
        const label = String(raw.label ?? "").trim() || undefined;
        if (recipientName.length < 2) {
          throw fail(config, 422, {
            errors: { address: "نام گیرنده را بنویس" },
          });
        }
        if (!iranianPhoneRegExp.test(addrPhone)) {
          throw fail(config, 422, {
            errors: { address: "موبایل گیرنده درست نیست" },
          });
        }
        if (province.length < 2 || city.length < 2 || street.length < 5) {
          throw fail(config, 422, {
            errors: { address: "آدرس کامل را بنویس (استان، شهر، خیابان)" },
          });
        }
        orderAddress = {
          label,
          recipientName,
          phone: addrPhone,
          province,
          city,
          street,
          postalCode,
        };

        if (body.saveAddress && customerId) {
          const addresses = getAddresses();
          const next: Address = {
            id: nextId(addresses),
            customerId,
            label: label || "آدرس",
            recipientName,
            phone: addrPhone,
            province,
            city,
            street,
            postalCode,
            isDefault: addresses.filter((a) => a.customerId === customerId)
              .length === 0,
          };
          saveAddresses([next, ...addresses]);
        }
      }
    }

    const orders = getOrders();
    const order = {
      id: nextId(orders),
      customerName,
      customerPhone,
      items,
      subtotal,
      discount: discount || undefined,
      couponCode,
      shippingMethodId: shippingMethod.id,
      shippingTitle: shippingMethod.title,
      shippingFee: shippingResult.fee || undefined,
      address: orderAddress,
      total: goodsTotal + shippingResult.fee,
      status: "pending" as OrderStatus,
      note: String(body.note ?? "").trim() || undefined,
      created_at: new Date().toISOString(),
      paymentMethod: paymentMethod as "online" | "cod",
      customerId,
    };
    saveOrders([order, ...orders]);
    pushOrderNotification(order);
    void fetch("/api/notify/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        customerName: order.customerName,
        total: order.total,
        phone: order.customerPhone,
      }),
    }).catch(() => undefined);
    return ok(config, { order }, 201);
  }

  const shopOrderMatch = path.match(/^\/shop\/orders\/(\d+)$/);
  if (method === "GET" && shopOrderMatch) {
    const id = Number(shopOrderMatch[1]);
    const order = getOrders().find((item) => item.id === id);
    if (!order) throw fail(config, 404, { message: "not found" });
    return ok(config, { order });
  }

  if (method === "POST" && path === "/shop/orders/track") {
    const orderId = Number(body.orderId);
    const phone = normalizeIranianPhone(String(body.phone ?? ""));
    if (!Number.isFinite(orderId) || orderId < 1) {
      throw fail(config, 422, { errors: { orderId: "شماره سفارش درست نیست" } });
    }
    if (!iranianPhoneRegExp.test(phone)) {
      throw fail(config, 422, { errors: { phone: "شماره موبایل درست نیست" } });
    }
    const order = getOrders().find((item) => item.id === orderId);
    if (!order || order.customerPhone !== phone) {
      throw fail(config, 422, {
        errors: { orderId: "سفارش با این شماره پیدا نشد" },
      });
    }
    return ok(config, { order });
  }

  const paymentRequestMatch = path.match(
    /^\/shop\/orders\/(\d+)\/payment\/request$/,
  );
  if (method === "POST" && paymentRequestMatch) {
    const id = Number(paymentRequestMatch[1]);
    const orders = getOrders();
    const index = orders.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    const current = orders[index];
    if (current.status === "cancelled") {
      throw fail(config, 422, { errors: { status: "سفارش لغو شده" } });
    }
    if (current.status !== "pending") {
      throw fail(config, 422, { errors: { status: "قبلا پرداخت شده" } });
    }
    const authority = current.authority ?? makeAuthority();
    orders[index] = {
      ...current,
      paymentMethod: "online",
      authority,
    };
    saveOrders(orders);
    return ok(config, {
      authority,
      amount: current.total,
      orderId: current.id,
      redirectUrl: `/shop/gateway/${encodeURIComponent(authority)}`,
    });
  }

  const paymentBindMatch = path.match(
    /^\/shop\/orders\/(\d+)\/payment\/bind$/,
  );
  if (method === "POST" && paymentBindMatch) {
    const id = Number(paymentBindMatch[1]);
    const authority = String(body.authority ?? "").trim();
    if (!authority) {
      throw fail(config, 422, { errors: { authority: "کد تراکنش نیست" } });
    }
    const orders = getOrders();
    const index = orders.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    const current = orders[index];
    if (current.status !== "pending") {
      throw fail(config, 422, { errors: { status: "قبلا پرداخت شده" } });
    }
    orders[index] = {
      ...current,
      paymentMethod: "online",
      authority,
    };
    saveOrders(orders);
    return ok(config, { order: orders[index] });
  }

  const paymentGetMatch = path.match(/^\/shop\/payments\/([^/]+)$/);
  if (method === "GET" && paymentGetMatch) {
    const authority = decodeURIComponent(paymentGetMatch[1]);
    const order = getOrders().find((item) => item.authority === authority);
    if (!order) throw fail(config, 404, { message: "not found" });
    return ok(config, {
      authority,
      amount: order.total,
      orderId: order.id,
      customerName: order.customerName,
      status: order.status,
      paid: order.status !== "pending" && order.status !== "cancelled",
    });
  }

  if (method === "POST" && path === "/shop/payments/verify") {
    const authority = String(body.Authority ?? body.authority ?? "");
    const status = String(body.Status ?? body.status ?? "").toUpperCase();
    if (!authority) {
      throw fail(config, 422, { errors: { Authority: "کد تراکنش نیست" } });
    }
    const orders = getOrders();
    const index = orders.findIndex((item) => item.authority === authority);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    const current = orders[index];

    if (status !== "OK") {
      return ok(config, {
        verified: false,
        order: current,
        message: "پرداخت لغو یا ناموفق بود",
      });
    }

    if (current.status === "cancelled") {
      throw fail(config, 422, { errors: { status: "سفارش لغو شده" } });
    }

    if (current.status !== "pending") {
      return ok(config, {
        verified: true,
        order: current,
        refId: current.refId,
      });
    }

    const refId = String(body.refId ?? "").trim() || makeRefId();
    orders[index] = {
      ...current,
      status: "paid",
      paymentMethod: "online",
      paid_at: new Date().toISOString(),
      refId,
    };
    saveOrders(orders);
    return ok(config, {
      verified: true,
      order: orders[index],
      refId,
    });
  }

  const payMatch = path.match(/^\/orders\/(\d+)\/pay$/);
  if (method === "POST" && payMatch) {
    const id = Number(payMatch[1]);
    const methodName =
      String(body.method ?? "online") === "cod" ? "cod" : "online";
    const orders = getOrders();
    const index = orders.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    const current = orders[index];
    if (current.status === "cancelled") {
      throw fail(config, 422, { errors: { status: "سفارش لغو شده" } });
    }
    if (current.status !== "pending") {
      throw fail(config, 422, { errors: { status: "قبلا پرداخت شده" } });
    }
    orders[index] = {
      ...current,
      status: "paid",
      paymentMethod: methodName,
      paid_at: new Date().toISOString(),
      ...(methodName === "online"
        ? {
            authority: current.authority ?? makeAuthority(),
            refId: current.refId ?? makeRefId(),
          }
        : {}),
    };
    saveOrders(orders);
    return ok(config, { order: orders[index] });
  }

  const statusMatch = path.match(/^\/orders\/(\d+)\/status$/);
  if (method === "POST" && statusMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(statusMatch[1]);
    const next = String(body.status ?? "") as OrderStatus;
    const orders = getOrders();
    const index = orders.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    const current = orders[index];
    if (!nextStatuses(current.status).includes(next)) {
      throw fail(config, 422, { errors: { status: "این وضعیت مجاز نیست" } });
    }

    if (next === "cancelled") {
      applyOrderCancellation(current);
    }

    const trackingCode =
      body.trackingCode !== undefined
        ? String(body.trackingCode).trim() || undefined
        : current.trackingCode;
    const carrier =
      body.carrier !== undefined
        ? String(body.carrier).trim() || undefined
        : current.carrier;
    if (trackingCode && trackingCode.length > 80) {
      throw fail(config, 422, {
        errors: { trackingCode: "کد رهگیری خیلی بلند است" },
      });
    }
    if (carrier && carrier.length > 60) {
      throw fail(config, 422, {
        errors: { carrier: "نام شرکت پستی خیلی بلند است" },
      });
    }

    orders[index] = {
      ...current,
      status: next,
      ...(next === "paid"
        ? {
            paid_at: current.paid_at ?? new Date().toISOString(),
            paymentMethod: current.paymentMethod ?? "cod",
          }
        : {}),
      ...(next === "shipped"
        ? {
            trackingCode,
            carrier,
            shipped_at: current.shipped_at ?? new Date().toISOString(),
          }
        : {}),
    };
    saveOrders(orders);
    return ok(config, { order: orders[index] });
  }

  const trackingMatch = path.match(/^\/orders\/(\d+)\/tracking$/);
  if (method === "POST" && trackingMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(trackingMatch[1]);
    const orders = getOrders();
    const index = orders.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    const current = orders[index];
    if (current.status !== "shipped" && current.status !== "delivered") {
      throw fail(config, 422, {
        errors: { status: "فقط برای سفارش ارسال‌شده یا تحویل‌شده" },
      });
    }
    const trackingCode =
      body.trackingCode !== undefined
        ? String(body.trackingCode).trim() || undefined
        : current.trackingCode;
    const carrier =
      body.carrier !== undefined
        ? String(body.carrier).trim() || undefined
        : current.carrier;
    if (trackingCode && trackingCode.length > 80) {
      throw fail(config, 422, {
        errors: { trackingCode: "کد رهگیری خیلی بلند است" },
      });
    }
    if (carrier && carrier.length > 60) {
      throw fail(config, 422, {
        errors: { carrier: "نام شرکت پستی خیلی بلند است" },
      });
    }
    orders[index] = {
      ...current,
      trackingCode,
      carrier,
      shipped_at: current.shipped_at ?? new Date().toISOString(),
    };
    saveOrders(orders);
    return ok(config, { order: orders[index] });
  }

  const packingMatch = path.match(/^\/orders\/(\d+)\/packing-note$/);
  if (method === "POST" && packingMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(packingMatch[1]);
    const orders = getOrders();
    const index = orders.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    const packingNote = String(body.packingNote ?? "").trim() || undefined;
    if (packingNote && packingNote.length > 500) {
      throw fail(config, 422, {
        errors: { packingNote: "یادداشت بسته‌بندی خیلی بلند است" },
      });
    }
    orders[index] = { ...orders[index], packingNote };
    saveOrders(orders);
    return ok(config, { order: orders[index] });
  }

  if (method === "GET" && path === "/stock-alerts") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    return ok(config, { alerts: getStockAlerts() });
  }

  const alertReadMatch = path.match(/^\/stock-alerts\/(\d+)\/read$/);
  if (method === "POST" && alertReadMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(alertReadMatch[1]);
    const alerts = getStockAlerts();
    const index = alerts.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    alerts[index] = { ...alerts[index], read: true };
    saveStockAlerts(alerts);
    return ok(config, { alert: alerts[index] });
  }

  if (method === "POST" && path === "/stock-alerts/read-all") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const alerts = getStockAlerts().map((item) => ({ ...item, read: true }));
    saveStockAlerts(alerts);
    return ok(config, { alerts });
  }

  if (method === "GET" && path === "/notifications") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    return ok(config, { notifications: getOrderNotifications() });
  }

  const notificationReadMatch = path.match(/^\/notifications\/(\d+)\/read$/);
  if (method === "POST" && notificationReadMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(notificationReadMatch[1]);
    const items = getOrderNotifications();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    items[index] = { ...items[index], read: true };
    saveOrderNotifications(items);
    return ok(config, { notification: items[index] });
  }

  if (method === "POST" && path === "/notifications/read-all") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const items = getOrderNotifications().map((item) => ({
      ...item,
      read: true,
    }));
    saveOrderNotifications(items);
    return ok(config, { notifications: items });
  }

  if (method === "POST" && path === "/shop/coupons/validate") {
    const code = normalizeCouponCode(String(body.code ?? ""));
    const subtotal = Number(body.subtotal ?? 0);
    if (!code) {
      throw fail(config, 422, { errors: { code: "کد را بنویس" } });
    }
    const coupon = getCoupons().find((item) => item.code === code);
    if (!coupon) {
      throw fail(config, 422, { errors: { code: "کد تخفیف پیدا نشد" } });
    }
    const applied = applyCoupon(coupon, subtotal);
    if (!applied.ok) {
      throw fail(config, 422, { errors: { code: applied.message } });
    }
    return ok(config, {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: applied.discount,
      total: applied.total,
    });
  }

  if (method === "GET" && path === "/coupons") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    return ok(config, { coupons: getCoupons() });
  }

  if (method === "POST" && path === "/coupons") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const code = normalizeCouponCode(String(body.code ?? ""));
    const type = String(body.type ?? "percent") === "fixed" ? "fixed" : "percent";
    const value = Number(body.value ?? 0);
    if (!code || code.length < 3) {
      throw fail(config, 422, { errors: { code: "کد کوتاه است" } });
    }
    if (getCoupons().some((item) => item.code === code)) {
      throw fail(config, 422, { errors: { code: "این کد تکراری است" } });
    }
    if (type === "percent" && (value < 1 || value > 90)) {
      throw fail(config, 422, { errors: { value: "درصد بین ۱ تا ۹۰ باشد" } });
    }
    if (type === "fixed" && value < 1000) {
      throw fail(config, 422, { errors: { value: "مبلغ تخفیف کم است" } });
    }
    const coupons = getCoupons();
    const coupon = {
      id: nextId(coupons),
      code,
      type: type as CouponType,
      value,
      active: body.active === false ? false : true,
      minOrder: Number(body.minOrder ?? 0) || undefined,
      maxUses: Number(body.maxUses ?? 0) || undefined,
      usedCount: 0,
      created_at: new Date().toISOString(),
    };
    saveCoupons([coupon, ...coupons]);
    return ok(config, { coupon }, 201);
  }

  const couponToggleMatch = path.match(/^\/coupons\/(\d+)\/toggle$/);
  if (method === "POST" && couponToggleMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(couponToggleMatch[1]);
    const coupons = getCoupons();
    const index = coupons.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    coupons[index] = { ...coupons[index], active: !coupons[index].active };
    saveCoupons(coupons);
    return ok(config, { coupon: coupons[index] });
  }

  if (method === "POST" && path === "/shop/auth/register") {
    const name = String(body.name ?? "").trim();
    const phone = normalizeIranianPhone(String(body.phone ?? ""));
    if (name.length < 2) {
      throw fail(config, 422, { errors: { name: "نام را درست بنویس" } });
    }
    if (!iranianPhoneRegExp.test(phone)) {
      throw fail(config, 422, { errors: { phone: "شماره درست نیست" } });
    }
    const customers = getCustomers();
    if (customers.some((item) => item.phone === phone)) {
      throw fail(config, 422, {
        errors: { phone: "این شماره قبلا ثبت شده. وارد شو" },
      });
    }
    const customer = {
      id: nextId(customers),
      name,
      phone,
      created_at: new Date().toISOString(),
    };
    saveCustomers([...customers, customer]);
    const token = randomToken();
    const code = randomOtp();
    saveCustomerPendingOtp({ token, phone, code });
    const delivery = await deliverOtpSms(phone, code);
    const showHint = shouldShowOtpHint(delivery.sent);
    if (showHint) saveCustomerOtpHint(code);
    else clearCustomerOtpHint();
    return ok(
      config,
      {
        token,
        debug_code: showHint ? code : undefined,
        sms_sent: delivery.sent,
      },
      201,
    );
  }

  if (method === "POST" && path === "/shop/auth/login") {
    const phone = normalizeIranianPhone(String(body.phone ?? ""));
    const customer = getCustomers().find((item) => item.phone === phone);
    if (!customer) {
      throw fail(config, 422, {
        errors: { phone: "این شماره ثبت نشده. اول ثبت‌نام کن" },
      });
    }
    const token = randomToken();
    const code = randomOtp();
    saveCustomerPendingOtp({ token, phone, code });
    const delivery = await deliverOtpSms(phone, code);
    const showHint = shouldShowOtpHint(delivery.sent);
    if (showHint) saveCustomerOtpHint(code);
    else clearCustomerOtpHint();
    return ok(config, {
      token,
      debug_code: showHint ? code : undefined,
      sms_sent: delivery.sent,
    });
  }

  if (method === "POST" && path === "/shop/auth/verify") {
    const token = String(body.token ?? "");
    const code = String(body.code ?? "");
    const pending = getCustomerPendingOtp();
    if (!pending || pending.token !== token) {
      throw fail(config, 422, { errors: { code: "نشست ورود منقضی شده" } });
    }
    if (pending.code !== code) {
      throw fail(config, 422, { errors: { code: "کد درست نیست" } });
    }
    const customer = getCustomers().find((item) => item.phone === pending.phone);
    if (!customer) {
      throw fail(config, 422, { errors: { code: "مشتری پیدا نشد" } });
    }
    const sessionToken = randomToken();
    saveCustomerSession({ token: sessionToken, customer });
    clearCustomerPendingOtp();
    clearCustomerOtpHint();
    return ok(config, { customer, token: sessionToken });
  }

  if (method === "GET" && path === "/shop/auth/me") {
    const session = getCustomerSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    return ok(config, { customer: session.customer });
  }

  if (method === "POST" && path === "/shop/auth/logout") {
    clearCustomerSession();
    return ok(config, { status: "success" });
  }

  if (method === "GET" && path === "/shop/account/orders") {
    const session = getCustomerSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const orders = getOrders().filter(
      (item) =>
        item.customerId === session.customer.id ||
        item.customerPhone === session.customer.phone,
    );
    const returns = getReturns().filter(
      (item) =>
        item.customerId === session.customer.id ||
        item.customerPhone === session.customer.phone,
    );
    return ok(config, { orders, returns });
  }

  const cancelMatch = path.match(/^\/shop\/account\/orders\/(\d+)\/cancel$/);
  if (method === "POST" && cancelMatch) {
    const session = getCustomerSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(cancelMatch[1]);
    const orders = getOrders();
    const index = orders.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    const current = orders[index];
    if (
      current.customerId !== session.customer.id &&
      current.customerPhone !== session.customer.phone
    ) {
      throw fail(config, 404, { message: "not found" });
    }
    if (!canCustomerCancel(current)) {
      throw fail(config, 422, {
        errors: {
          status: "فقط سفارش‌های در انتظار یا پرداخت‌شده را می‌شود لغو کرد",
        },
      });
    }
    applyOrderCancellation(current);
    orders[index] = {
      ...current,
      status: "cancelled",
      note: current.note
        ? `${current.note} · لغو توسط مشتری`
        : "لغو توسط مشتری",
    };
    saveOrders(orders);
    return ok(config, { order: orders[index] });
  }

  if (method === "POST" && path === "/shop/account/returns") {
    const session = getCustomerSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const orderId = Number(body.orderId);
    const reason = String(body.reason ?? "").trim();
    if (!Number.isFinite(orderId) || orderId < 1) {
      throw fail(config, 422, { errors: { orderId: "سفارش درست نیست" } });
    }
    if (reason.length < 5) {
      throw fail(config, 422, {
        errors: { reason: "دلیل مرجوعی را کامل‌تر بنویس" },
      });
    }
    const order = getOrders().find((item) => item.id === orderId);
    if (
      !order ||
      (order.customerId !== session.customer.id &&
        order.customerPhone !== session.customer.phone)
    ) {
      throw fail(config, 404, { message: "not found" });
    }
    if (!canRequestReturn(order)) {
      throw fail(config, 422, {
        errors: { orderId: "فقط سفارش ارسال‌شده را می‌شود مرجوع کرد" },
      });
    }
    const existing = getReturns().find(
      (item) =>
        item.orderId === orderId &&
        (item.status === "pending" ||
          item.status === "approved" ||
          item.status === "refunded"),
    );
    if (existing) {
      throw fail(config, 422, {
        errors: { orderId: "برای این سفارش قبلا درخواست مرجوعی ثبت شده" },
      });
    }
    const returns = getReturns();
    const request = {
      id: nextId(returns),
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerId: session.customer.id,
      reason,
      status: "pending" as ReturnStatus,
      amount: order.total,
      paymentMethod: order.paymentMethod,
      created_at: new Date().toISOString(),
    };
    saveReturns([request, ...returns]);
    return ok(config, { return: request }, 201);
  }

  if (method === "GET" && path === "/shop/shipping-methods") {
    const methods = getShippingMethods().filter((item) => item.active);
    return ok(config, { methods });
  }

  if (method === "GET" && path === "/shipping-methods") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    return ok(config, { methods: getShippingMethods() });
  }

  if (method === "PATCH" && path.match(/^\/shipping-methods\/(\d+)$/)) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(path.split("/").pop());
    const methods = getShippingMethods();
    const index = methods.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    const current = methods[index];
    const fee =
      body.fee !== undefined ? Number(body.fee) : current.fee;
    const freeAbove =
      body.freeAbove === null || body.freeAbove === ""
        ? undefined
        : body.freeAbove !== undefined
          ? Number(body.freeAbove)
          : current.freeAbove;
    if (!Number.isFinite(fee) || fee < 0) {
      throw fail(config, 422, { errors: { fee: "هزینه درست نیست" } });
    }
    if (
      freeAbove !== undefined &&
      (!Number.isFinite(freeAbove) || freeAbove < 0)
    ) {
      throw fail(config, 422, {
        errors: { freeAbove: "آستانه ارسال رایگان درست نیست" },
      });
    }
    methods[index] = {
      ...current,
      fee,
      freeAbove,
      active:
        body.active !== undefined ? Boolean(body.active) : current.active,
      title:
        typeof body.title === "string" && body.title.trim()
          ? String(body.title).trim()
          : current.title,
      description:
        typeof body.description === "string" && body.description.trim()
          ? String(body.description).trim()
          : current.description,
    };
    saveShippingMethods(methods);
    return ok(config, { method: methods[index] });
  }

  if (method === "GET" && path === "/shop/account/addresses") {
    const session = getCustomerSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const addresses = getAddresses().filter(
      (item) => item.customerId === session.customer.id,
    );
    return ok(config, { addresses });
  }

  if (method === "POST" && path === "/shop/account/addresses") {
    const session = getCustomerSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const label = String(body.label ?? "").trim() || "آدرس";
    const recipientName = String(body.recipientName ?? "").trim();
    const phone = normalizeIranianPhone(String(body.phone ?? ""));
    const province = String(body.province ?? "").trim();
    const city = String(body.city ?? "").trim();
    const street = String(body.street ?? "").trim();
    const postalCode = String(body.postalCode ?? "").trim() || undefined;
    if (recipientName.length < 2) {
      throw fail(config, 422, {
        errors: { recipientName: "نام گیرنده را بنویس" },
      });
    }
    if (!iranianPhoneRegExp.test(phone)) {
      throw fail(config, 422, { errors: { phone: "شماره درست نیست" } });
    }
    if (province.length < 2 || city.length < 2 || street.length < 5) {
      throw fail(config, 422, {
        errors: { street: "آدرس کامل را بنویس" },
      });
    }
    const addresses = getAddresses();
    const mine = addresses.filter(
      (item) => item.customerId === session.customer.id,
    );
    const address: Address = {
      id: nextId(addresses),
      customerId: session.customer.id,
      label,
      recipientName,
      phone,
      province,
      city,
      street,
      postalCode,
      isDefault: Boolean(body.isDefault) || mine.length === 0,
    };
    let next = [address, ...addresses];
    if (address.isDefault) {
      next = next.map((item) =>
        item.customerId === session.customer.id && item.id !== address.id
          ? { ...item, isDefault: false }
          : item,
      );
    }
    saveAddresses(next);
    return ok(config, { address }, 201);
  }

  const addressMatch = path.match(/^\/shop\/account\/addresses\/(\d+)$/);
  if (addressMatch && (method === "DELETE" || method === "PATCH")) {
    const session = getCustomerSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(addressMatch[1]);
    const addresses = getAddresses();
    const index = addresses.findIndex(
      (item) => item.id === id && item.customerId === session.customer.id,
    );
    if (index < 0) throw fail(config, 404, { message: "not found" });

    if (method === "DELETE") {
      const removed = addresses[index];
      let next = addresses.filter((item) => item.id !== id);
      if (removed.isDefault) {
        const first = next.find(
          (item) => item.customerId === session.customer.id,
        );
        if (first) {
          next = next.map((item) =>
            item.id === first.id ? { ...item, isDefault: true } : item,
          );
        }
      }
      saveAddresses(next);
      return ok(config, { status: "success" });
    }

    const current = addresses[index];
    const updated: Address = {
      ...current,
      label:
        typeof body.label === "string" && body.label.trim()
          ? String(body.label).trim()
          : current.label,
      recipientName:
        typeof body.recipientName === "string" && body.recipientName.trim()
          ? String(body.recipientName).trim()
          : current.recipientName,
      phone:
        body.phone !== undefined
          ? normalizeIranianPhone(String(body.phone))
          : current.phone,
      province:
        typeof body.province === "string" && body.province.trim()
          ? String(body.province).trim()
          : current.province,
      city:
        typeof body.city === "string" && body.city.trim()
          ? String(body.city).trim()
          : current.city,
      street:
        typeof body.street === "string" && body.street.trim()
          ? String(body.street).trim()
          : current.street,
      postalCode:
        body.postalCode !== undefined
          ? String(body.postalCode).trim() || undefined
          : current.postalCode,
      isDefault:
        body.isDefault !== undefined
          ? Boolean(body.isDefault)
          : current.isDefault,
    };
    if (!iranianPhoneRegExp.test(updated.phone)) {
      throw fail(config, 422, { errors: { phone: "شماره درست نیست" } });
    }
    let next = [...addresses];
    next[index] = updated;
    if (updated.isDefault) {
      next = next.map((item) =>
        item.customerId === session.customer.id && item.id !== updated.id
          ? { ...item, isDefault: false }
          : item,
      );
    }
    saveAddresses(next);
    return ok(config, { address: updated });
  }

  if (method === "GET" && path === "/returns") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    return ok(config, { returns: getReturns() });
  }

  const returnResolveMatch = path.match(/^\/returns\/(\d+)\/(approve|reject)$/);
  if (method === "POST" && returnResolveMatch) {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const id = Number(returnResolveMatch[1]);
    const action = returnResolveMatch[2];
    const returns = getReturns();
    const index = returns.findIndex((item) => item.id === id);
    if (index < 0) throw fail(config, 404, { message: "not found" });
    const current = returns[index];
    if (current.status !== "pending") {
      throw fail(config, 422, {
        errors: { status: "این درخواست قبلا رسیدگی شده" },
      });
    }
    const sellerNote = String(body.sellerNote ?? "").trim() || undefined;
    const now = new Date().toISOString();

    if (action === "reject") {
      returns[index] = {
        ...current,
        status: "rejected",
        sellerNote,
        resolved_at: now,
      };
      saveReturns(returns);
      return ok(config, { return: returns[index] });
    }

    const orders = getOrders();
    const orderIndex = orders.findIndex((item) => item.id === current.orderId);
    if (orderIndex < 0) {
      throw fail(config, 404, { message: "order not found" });
    }
    const order = orders[orderIndex];
    if (order.status !== "shipped" && order.status !== "delivered") {
      throw fail(config, 422, {
        errors: { status: "وضعیت سفارش برای مرجوعی مناسب نیست" },
      });
    }

    const products = restoreOrderStock(order.items, getProducts());
    saveProducts(products);

    orders[orderIndex] = { ...order, status: "returned" };
    saveOrders(orders);

    const nextStatus: ReturnStatus =
      order.paymentMethod === "online" ? "refunded" : "approved";
    returns[index] = {
      ...current,
      status: nextStatus,
      sellerNote,
      resolved_at: now,
    };
    saveReturns(returns);
    return ok(config, { return: returns[index], order: orders[orderIndex] });
  }

  if (method === "GET" && path === "/shop/settings") {
    return ok(config, { settings: getShopSettings() });
  }

  if (method === "GET" && path === "/settings") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    return ok(config, { settings: getShopSettings() });
  }

  if (method === "POST" && path === "/settings") {
    const session = getSession();
    if (!session) throw fail(config, 401, { message: "unauthenticated" });
    const name = String(body.name ?? "").trim();
    if (name.length < 2) {
      throw fail(config, 422, { errors: { name: "نام فروشگاه را بنویس" } });
    }
    const settings = {
      name,
      tagline: String(body.tagline ?? "").trim() || undefined,
      phone: String(body.phone ?? "").trim() || undefined,
      instagram: String(body.instagram ?? "").trim().replace(/^@/, "") || undefined,
      address: String(body.address ?? "").trim() || undefined,
      invoiceFooter: String(body.invoiceFooter ?? "").trim() || undefined,
    };
    saveShopSettings(settings);
    return ok(config, { settings });
  }

  if (method === "POST" && path === "/auth/logout") {
    clearSession();
    return ok(config, { status: "success" });
  }

  return null;
}
