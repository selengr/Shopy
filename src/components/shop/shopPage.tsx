"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "react-toastify";
import ShopShell from "@/components/shop/shopShell";
import ProductThumb from "@/components/shared/productThumb";
import LoadingBox from "@/components/shared/loadingBox";
import EmptyList from "@/components/shared/emptyList";
import { GetShopProducts, CreateShopOrder } from "@/services/shop";
import { ValidateShopCoupon } from "@/services/coupon";
import { GetShopCustomerMe } from "@/services/shopAuth";
import {
  CATEGORIES,
  categoryLabel,
  formatToman,
  hasSale,
  SHOP_SORT_OPTIONS,
  sortShopProducts,
  type ShopSort,
} from "@/helpers/catalog";
import ProductPrice from "@/components/shared/productPrice";
import {
  addToCart,
  cartCount,
  cartTotal,
  clearCart,
  readCart,
  setCartQty,
  subscribeCart,
} from "@/helpers/cart";
import {
  isInWishlist,
  readWishlist,
  subscribeWishlist,
  toggleWishlist,
  wishlistCount,
} from "@/helpers/wishlist";
import {
  localizedBody,
  localizedTitle,
  readLocale,
  subscribeLocale,
} from "@/helpers/locale";
import { productMatchesQuery } from "@/helpers/search";
import { PAYMENT_METHODS, type PaymentMethod } from "@/helpers/payments";
import { formatStars } from "@/helpers/reviews";
import { resolveShippingFee } from "@/helpers/shipping";
import { hasVariants, productStock } from "@/helpers/variants";
import { iranianPhoneRegExp, normalizeIranianPhone } from "@/helpers/auth";
import ValidationError from "@/exceptions/validationError";
import type Product from "@/models/product";
import {
  GetMyAddresses,
  GetShopShippingMethods,
} from "@/services/shipping";

export default function ShopPage() {
  const router = useRouter();
  const { data, error, mutate } = useSWR("shop/products", GetShopProducts);
  const { data: customer } = useSWR("shop/customer/me", GetShopCustomerMe, {
    shouldRetryOnError: false,
  });
  const { data: shippingMethods } = useSWR(
    "shop/shipping-methods",
    GetShopShippingMethods,
  );
  const { data: addresses, mutate: mutateAddresses } = useSWR(
    customer ? "shop/account/addresses" : null,
    GetMyAddresses,
  );
  const lines = useSyncExternalStore(subscribeCart, readCart, () => []);
  const wish = useSyncExternalStore(subscribeWishlist, readWishlist, () => []);
  const locale = useSyncExternalStore(subscribeLocale, readLocale, () => "fa" as const);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ShopSort>("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    total: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null);
  const [addressId, setAddressId] = useState<number | "new" | null>(null);
  const [addrLabel, setAddrLabel] = useState("خانه");
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [placedId, setPlacedId] = useState<number | null>(null);

  const checkoutName = name || customer?.name || "";
  const checkoutPhone = phone || customer?.phone || "";

  const loading = !data && !error;
  const subtotal = cartTotal(lines);
  const goodsTotal = appliedCoupon?.total ?? subtotal;
  const methods = shippingMethods ?? [];
  const selectedShipping =
    methods.find((item) => item.id === shippingMethodId) ??
    methods[0] ??
    null;
  const shippingResolved = selectedShipping
    ? resolveShippingFee(selectedShipping, goodsTotal)
    : null;
  const shippingFee =
    shippingResolved?.ok === true ? shippingResolved.fee : 0;
  const payable = goodsTotal + shippingFee;
  const savedAddresses = addresses ?? [];
  const needsAddress = selectedShipping?.requiresAddress ?? false;
  const usingNewAddress =
    needsAddress &&
    (addressId === "new" || addressId === null || savedAddresses.length === 0);
  const showFeatured =
    category === "" &&
    !query.trim() &&
    sort === "newest" &&
    !inStockOnly &&
    !onSaleOnly;
  const featured = useMemo(() => {
    if (!showFeatured) return [];
    return (data ?? []).filter((item) => item.featured && productStock(item) > 0);
  }, [data, showFeatured]);
  const filtered = useMemo(() => {
    const products = (data ?? []).filter((item) => {
      const inCategory = category ? item.category === category : true;
      if (!inCategory || !productMatchesQuery(item, query)) return false;
      if (inStockOnly && productStock(item) < 1) return false;
      if (onSaleOnly && !hasSale(item)) return false;
      return true;
    });
    return sortShopProducts(products, sort);
  }, [category, data, inStockOnly, onSaleOnly, query, sort]);

  const onAdd = (product: Product) => {
    if (hasVariants(product)) {
      router.push(`/shop/products/${product.id}`);
      return;
    }
    const before = lines.find((line) => line.productId === product.id)?.qty ?? 0;
    const next = addToCart(product);
    const after = next.find((line) => line.productId === product.id)?.qty ?? 0;
    if (after === before) {
      toast.error("موجودی این محصول تمام است");
      return;
    }
    setAppliedCoupon(null);
    toast.success(`${product.title} به سبد اضافه شد`);
  };

  const applyCode = async () => {
    if (!couponInput.trim()) {
      toast.error("کد تخفیف را بنویس");
      return;
    }
    if (lines.length === 0) {
      toast.error("سبد خالی است");
      return;
    }
    try {
      const result = await ValidateShopCoupon(couponInput, subtotal);
      setAppliedCoupon({
        code: result.code,
        discount: result.discount,
        total: result.total,
      });
      toast.success("کد تخفیف اعمال شد");
    } catch (err) {
      setAppliedCoupon(null);
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "کد معتبر نیست"));
        return;
      }
      toast.error("کد معتبر نیست");
    }
  };

  const checkout = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeIranianPhone(checkoutPhone);
    if (checkoutName.trim().length < 2) {
      toast.error("نام را بنویس");
      return;
    }
    if (!iranianPhoneRegExp.test(normalized)) {
      toast.error("شماره موبایل درست نیست");
      return;
    }
    if (lines.length === 0) {
      toast.error("سبد خالی است");
      return;
    }
    if (!selectedShipping) {
      toast.error("روش ارسال را انتخاب کن");
      return;
    }

    let payloadAddress:
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
    let payloadAddressId: number | undefined;

    if (selectedShipping.requiresAddress) {
      if (!usingNewAddress && typeof addressId === "number") {
        payloadAddressId = addressId;
      } else {
        const recipient = (addrName || checkoutName).trim();
        const addrNormalized = normalizeIranianPhone(addrPhone || checkoutPhone);
        if (recipient.length < 2) {
          toast.error("نام گیرنده را بنویس");
          return;
        }
        if (!iranianPhoneRegExp.test(addrNormalized)) {
          toast.error("موبایل گیرنده درست نیست");
          return;
        }
        if (province.trim().length < 2 || city.trim().length < 2 || street.trim().length < 5) {
          toast.error("آدرس کامل را بنویس");
          return;
        }
        payloadAddress = {
          label: addrLabel.trim() || undefined,
          recipientName: recipient,
          phone: addrNormalized,
          province: province.trim(),
          city: city.trim(),
          street: street.trim(),
          postalCode: postalCode.trim() || undefined,
        };
      }
    }

    setSaving(true);
    try {
      const order = await CreateShopOrder({
        customerName: checkoutName.trim(),
        customerPhone: normalized,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        shippingMethodId: selectedShipping.id,
        addressId: payloadAddressId,
        address: payloadAddress,
        saveAddress: Boolean(customer && saveAddress && payloadAddress),
        note: orderNote.trim() || undefined,
        items: lines.map((line) => ({
          productId: line.productId,
          qty: line.qty,
          variantId: line.variantId,
        })),
      });
      clearCart();
      setAppliedCoupon(null);
      setCouponInput("");
      setOrderNote("");
      setPlacedId(order.id);
      await mutate();
      if (customer) await mutateAddresses();
      if (paymentMethod === "online") {
        toast.success("برو برای پرداخت آزمایشی");
        router.push(`/shop/pay/${order.id}`);
        return;
      }
      toast.success("سفارش ثبت شد");
      router.push(
        `/shop/orders/${order.id}/confirm?phone=${encodeURIComponent(normalized)}`,
      );
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "سفارش ثبت نشد"));
        return;
      }
      toast.error("سفارش ثبت نشد");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ShopShell cartCount={cartCount(lines)} wishCount={wishlistCount(wish)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">فروشگاه</h1>
          <p className="mt-2 text-sm text-[#5c564d]">
            بدون ورود هم می‌شود خرید کرد. سفارش می‌رود داخل پنل فروشنده.
          </p>
        </div>
      </div>

      {placedId && paymentMethod !== "online" && (
        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          سفارش #{placedId.toLocaleString("fa-IR")} ثبت شد. فروشنده در پنل می‌بیندش.{" "}
          <Link href="/shop/track" className="underline underline-offset-2">
            پیگیری سفارش
          </Link>
        </div>
      )}

      <label className="mt-6 block sm:max-w-md">
        <span className="sr-only">جستجو</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجو: کفش، کیف، خانه..."
          className="w-full rounded-2xl border border-[#14110e]/10 bg-white px-4 py-2.5 text-sm focus:border-[#1f4a45] focus:ring-[#1f4a45]"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`rounded-full px-3 py-1.5 text-sm ${
            category === "" ? "bg-[#1f4a45] text-white" : "bg-white"
          }`}
        >
          همه
        </button>
        {CATEGORIES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setCategory(item.value)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              category === item.value ? "bg-[#1f4a45] text-white" : "bg-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-[#5c564d]">
          <span>مرتب‌سازی</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as ShopSort)}
            className="rounded-full border border-[#14110e]/10 bg-white px-3 py-1.5 text-sm"
          >
            {SHOP_SORT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setInStockOnly((value) => !value)}
          className={`rounded-full px-3 py-1.5 text-sm ${
            inStockOnly ? "bg-[#1f4a45] text-white" : "bg-white ring-1 ring-[#14110e]/10"
          }`}
        >
          فقط موجود
        </button>
        <button
          type="button"
          onClick={() => setOnSaleOnly((value) => !value)}
          className={`rounded-full px-3 py-1.5 text-sm ${
            onSaleOnly ? "bg-[#1f4a45] text-white" : "bg-white ring-1 ring-[#14110e]/10"
          }`}
        >
          فقط تخفیف‌دار
        </button>
        {(inStockOnly || onSaleOnly || sort !== "newest") && (
          <button
            type="button"
            onClick={() => {
              setSort("newest");
              setInStockOnly(false);
              setOnSaleOnly(false);
            }}
            className="text-xs text-[#1f4a45] hover:underline"
          >
            پاک کردن فیلترها
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          {loading ? (
            <LoadingBox />
          ) : filtered.length === 0 ? (
            <EmptyList
              title="چیزی پیدا نشد"
              description="عبارت، دسته یا فیلتر را عوض کن"
            />
          ) : (
            <>
              {featured.length > 0 && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-semibold">پیشنهادها</h2>
                  <p className="mt-1 text-sm text-[#6b6459]">
                    چند تا از بهترین‌ها برای شروع
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {featured.map((product) => {
                      const stock = productStock(product);
                      const needsOptions = hasVariants(product);
                      return (
                        <article
                          key={`feat-${product.id}`}
                          className="relative flex flex-col rounded-3xl border border-[#1f4a45]/25 bg-[#1f4a45]/[0.04] p-4 shadow-sm"
                        >
                          <span className="absolute top-3 left-3 rounded-full bg-[#1f4a45] px-2.5 py-0.5 text-[10px] text-white">
                            ویژه
                          </span>
                          <ProductThumb item={product} className="h-36" />
                          <p className="mt-3 text-xs text-[#1f4a45]">
                            {categoryLabel(product.category)}
                          </p>
                          <h3 className="font-display mt-1 text-lg font-semibold">
                            <Link
                              href={`/shop/products/${product.id}`}
                              className="hover:text-[#1f4a45]"
                            >
                              {localizedTitle(product, locale)}
                            </Link>
                          </h3>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <p className="text-sm font-medium">
                              <ProductPrice
                                price={product.price}
                                compareAtPrice={product.compareAtPrice}
                              />
                            </p>
                            <button
                              type="button"
                              disabled={stock < 1}
                              onClick={() => onAdd(product)}
                              className="rounded-full bg-[#1f4a45] px-3 py-1.5 text-xs text-white disabled:opacity-40"
                            >
                              {needsOptions ? "انتخاب" : "سبد"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((product) => {
                const stock = productStock(product);
                const needsOptions = hasVariants(product);
                return (
                  <article
                    key={product.id}
                    className="relative flex flex-col rounded-3xl border border-[#14110e]/8 bg-white/85 p-4 shadow-sm"
                  >
                    {product.featured && (
                      <span className="absolute top-3 left-3 z-10 rounded-full bg-[#1f4a45] px-2.5 py-0.5 text-[10px] text-white">
                        ویژه
                      </span>
                    )}
                    <ProductThumb item={product} className="h-40" />
                    <p className="mt-3 text-xs text-[#1f4a45]">
                      {categoryLabel(product.category)}
                    </p>
                    <h2 className="font-display mt-1 text-lg font-semibold">
                      <Link
                        href={`/shop/products/${product.id}`}
                        className="hover:text-[#1f4a45]"
                      >
                        {localizedTitle(product, locale)}
                      </Link>
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-[#6b6459]">
                      {localizedBody(product, locale)}
                    </p>
                    {needsOptions && (
                      <p className="mt-2 text-xs text-[#1f4a45]">سایز / رنگ دارد</p>
                    )}
                    {(product.reviewCount ?? 0) > 0 && (
                      <p className="mt-2 text-xs text-amber-800">
                        {formatStars(product.ratingAvg ?? 0)}{" "}
                        {(product.ratingAvg ?? 0).toLocaleString("fa-IR")} ·{" "}
                        {(product.reviewCount ?? 0).toLocaleString("fa-IR")} نظر
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <ProductPrice
                        price={product.price}
                        compareAtPrice={product.compareAtPrice}
                      />
                      <span
                        className={`text-xs ${
                          stock < 1 ? "font-medium text-red-700" : "text-[#6b6459]"
                        }`}
                      >
                        {stock < 1
                          ? "ناموجود"
                          : `${stock.toLocaleString("fa-IR")} عدد`}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={stock < 1}
                        onClick={() => onAdd(product)}
                        className="flex-1 rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white disabled:opacity-40"
                      >
                        {stock < 1
                          ? "ناموجود"
                          : needsOptions
                            ? "انتخاب گزینه"
                            : "افزودن به سبد"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = toggleWishlist(product);
                          toast.success(
                            isInWishlist(product.id, next)
                              ? "به علاقه‌مندی‌ها اضافه شد"
                              : "از علاقه‌مندی‌ها برداشته شد",
                          );
                        }}
                        className={`rounded-full px-3 py-2 text-sm ring-1 ${
                          isInWishlist(product.id, wish)
                            ? "bg-[#1f4a45]/10 text-[#1f4a45] ring-[#1f4a45]/20"
                            : "ring-[#14110e]/15"
                        }`}
                        aria-label="علاقه‌مندی"
                      >
                        {isInWishlist(product.id, wish) ? "♥" : "♡"}
                      </button>
                      <Link
                        href={`/shop/products/${product.id}`}
                        className="rounded-full px-3 py-2 text-sm ring-1 ring-[#14110e]/15"
                      >
                        نظرها
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
            </>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold">سبد خرید</h2>
          {lines.length === 0 ? (
            <p className="mt-3 text-sm text-[#6b6459]">هنوز چیزی برنداشتی.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lines.map((line) => (
                <li
                  key={`${line.productId}-${line.variantId ?? "base"}`}
                  className="flex items-center gap-3"
                >
                  <span className="inline-block w-12 shrink-0">
                    <ProductThumb item={line} className="h-12" compact />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.title}</p>
                    <p className="text-xs text-[#6b6459]">{formatToman(line.price)}</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={line.qty}
                    onChange={(event) =>
                      setCartQty(
                        line.productId,
                        Number(event.target.value) || 0,
                        line.variantId,
                      )
                    }
                    className="w-14 rounded-xl border border-[#14110e]/10 px-2 py-1 text-sm"
                  />
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-sm text-[#5c564d]">
            جمع کالا {formatToman(subtotal)}
          </p>
          {appliedCoupon && (
            <p className="mt-1 text-sm text-emerald-800">
              تخفیف {appliedCoupon.code}: −{formatToman(appliedCoupon.discount)}
            </p>
          )}
          {selectedShipping && (
            <p className="mt-1 text-sm text-[#5c564d]">
              ارسال ({selectedShipping.title}):{" "}
              {shippingFee === 0 ? "رایگان" : formatToman(shippingFee)}
            </p>
          )}
          <p className="mt-2 font-medium">قابل پرداخت {formatToman(payable)}</p>

          <form onSubmit={checkout} className="mt-4 space-y-3">
            {customer && (
              <p className="rounded-2xl bg-[#1f4a45]/5 px-3 py-2 text-xs text-[#1f4a45]">
                وارد شده‌ای به عنوان {customer.name}
              </p>
            )}
            <input
              value={checkoutName}
              onChange={(event) => setName(event.target.value)}
              placeholder="نام"
              className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
            />
            <input
              value={checkoutPhone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="موبایل"
              inputMode="tel"
              dir="ltr"
              className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
            />
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(event) => {
                  setCouponInput(event.target.value);
                  setAppliedCoupon(null);
                }}
                placeholder="کد تخفیف"
                dir="ltr"
                className="min-w-0 flex-1 rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={applyCode}
                className="rounded-full px-3 py-2 text-sm ring-1 ring-[#14110e]/15"
              >
                اعمال
              </button>
            </div>
            <p className="text-[11px] text-[#6b6459]">نمونه: WELCOME10 یا SAVE50K</p>

            <div className="space-y-2">
              <p className="text-xs font-medium text-[#5c564d]">روش ارسال</p>
              {methods.map((method) => {
                const resolved = resolveShippingFee(method, goodsTotal);
                const fee = resolved.ok ? resolved.fee : method.fee;
                const selected =
                  (shippingMethodId ?? methods[0]?.id) === method.id;
                return (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer flex-col rounded-2xl border px-3 py-2.5 text-sm ${
                      selected
                        ? "border-[#1f4a45] bg-[#1f4a45]/5"
                        : "border-[#14110e]/10"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2 font-medium">
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shipping"
                          checked={selected}
                          onChange={() => {
                            setShippingMethodId(method.id);
                            if (!method.requiresAddress) setAddressId(null);
                            else if (savedAddresses.length > 0) {
                              const preferred =
                                savedAddresses.find((a) => a.isDefault) ??
                                savedAddresses[0];
                              setAddressId(preferred.id);
                            } else {
                              setAddressId("new");
                            }
                          }}
                        />
                        {method.title}
                      </span>
                      <span className="text-xs text-[#5c564d]">
                        {fee === 0 ? "رایگان" : formatToman(fee)}
                      </span>
                    </span>
                    <span className="mt-1 text-xs text-[#6b6459]">
                      {method.description}
                      {method.freeAbove
                        ? ` · رایگان از ${formatToman(method.freeAbove)}`
                        : ""}
                    </span>
                  </label>
                );
              })}
            </div>

            {needsAddress && (
              <div className="space-y-2 rounded-2xl border border-[#14110e]/8 bg-white/60 p-3">
                <p className="text-xs font-medium text-[#5c564d]">آدرس تحویل</p>
                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    {savedAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`block cursor-pointer rounded-xl border px-3 py-2 text-sm ${
                          addressId === addr.id
                            ? "border-[#1f4a45] bg-[#1f4a45]/5"
                            : "border-[#14110e]/10"
                        }`}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <input
                            type="radio"
                            name="address"
                            checked={addressId === addr.id}
                            onChange={() => setAddressId(addr.id)}
                          />
                          {addr.label}
                          {addr.isDefault ? " · پیش‌فرض" : ""}
                        </span>
                        <span className="mt-1 block text-xs text-[#6b6459]">
                          {addr.province}، {addr.city}، {addr.street}
                        </span>
                      </label>
                    ))}
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="address"
                        checked={addressId === "new"}
                        onChange={() => setAddressId("new")}
                      />
                      آدرس جدید
                    </label>
                  </div>
                )}
                {usingNewAddress && (
                  <div className="space-y-2">
                    <input
                      value={addrLabel}
                      onChange={(event) => setAddrLabel(event.target.value)}
                      placeholder="برچسب (خانه / محل کار)"
                      className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
                    />
                    <input
                      value={addrName || checkoutName}
                      onChange={(event) => setAddrName(event.target.value)}
                      placeholder="نام گیرنده"
                      className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
                    />
                    <input
                      value={addrPhone || checkoutPhone}
                      onChange={(event) => setAddrPhone(event.target.value)}
                      placeholder="موبایل گیرنده"
                      inputMode="tel"
                      dir="ltr"
                      className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={province}
                        onChange={(event) => setProvince(event.target.value)}
                        placeholder="استان"
                        className="rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
                      />
                      <input
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        placeholder="شهر"
                        className="rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
                      />
                    </div>
                    <textarea
                      value={street}
                      onChange={(event) => setStreet(event.target.value)}
                      placeholder="خیابان، پلاک، واحد"
                      rows={2}
                      className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
                    />
                    <input
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      placeholder="کد پستی (اختیاری)"
                      dir="ltr"
                      className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
                    />
                    {customer && (
                      <label className="flex items-center gap-2 text-xs text-[#5c564d]">
                        <input
                          type="checkbox"
                          checked={saveAddress}
                          onChange={(event) =>
                            setSaveAddress(event.target.checked)
                          }
                        />
                        ذخیره در دفترچه آدرس
                      </label>
                    )}
                    {!customer && (
                      <p className="text-[11px] text-[#6b6459]">
                        برای ذخیره آدرس‌ها{" "}
                        <Link href="/shop/account" className="underline">
                          وارد حساب شو
                        </Link>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`flex cursor-pointer flex-col rounded-2xl border px-3 py-2.5 text-sm ${
                    paymentMethod === method.value
                      ? "border-[#1f4a45] bg-[#1f4a45]/5"
                      : "border-[#14110e]/10"
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                    />
                    {method.label}
                  </span>
                  <span className="mt-1 text-xs text-[#6b6459]">{method.hint}</span>
                </label>
              ))}
            </div>
            <textarea
              value={orderNote}
              onChange={(event) => setOrderNote(event.target.value)}
              placeholder="یادداشت سفارش (اختیاری)"
              rows={2}
              className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={saving || lines.length === 0}
              className="w-full rounded-full bg-[#1f4a45] px-4 py-2.5 text-sm text-white disabled:opacity-50"
            >
              {saving
                ? "در حال ثبت..."
                : paymentMethod === "online"
                  ? "ثبت و پرداخت"
                  : "ثبت سفارش"}
            </button>
          </form>
        </aside>
      </div>
    </ShopShell>
  );
}
