"use client";

import { use, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "react-toastify";
import ShopShell from "@/components/shop/shopShell";
import ProductThumb from "@/components/shared/productThumb";
import LoadingBox from "@/components/shared/loadingBox";
import {
  CreateProductReview,
  GetProductReviews,
  GetShopProduct,
} from "@/services/review";
import { GetShopProducts } from "@/services/shop";
import { addToCart, cartCount, readCart, subscribeCart } from "@/helpers/cart";
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
import { categoryLabel } from "@/helpers/catalog";
import ProductGallery from "@/components/shop/productGallery";
import ProductPrice from "@/components/shared/productPrice";
import { productImages } from "@/helpers/productImages";
import { formatStars } from "@/helpers/reviews";
import { formatDay } from "@/helpers/orders";
import {
  findVariant,
  hasVariants,
  productStock,
  uniqueOptionValues,
  variantUnitPrice,
} from "@/helpers/variants";
import ValidationError from "@/exceptions/validationError";
import { JoinProductWaitlist } from "@/services/waitlist";

export default function ShopProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const id = Number(productId);
  const router = useRouter();
  const lines = useSyncExternalStore(subscribeCart, readCart, () => []);
  const wish = useSyncExternalStore(subscribeWishlist, readWishlist, () => []);
  const locale = useSyncExternalStore(subscribeLocale, readLocale, () => "fa" as const);
  const { data: productData, error, isLoading } = useSWR(
    { url: `/shop/products/${id}`, id },
    ({ id: productIdValue }) => GetShopProduct(productIdValue),
  );
  const { data: reviewData, mutate } = useSWR(
    { url: `/shop/products/${id}/reviews`, id },
    ({ id: productIdValue }) => GetProductReviews(productIdValue),
  );
  const { data: catalog } = useSWR("shop/products", GetShopProducts);

  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [waitName, setWaitName] = useState("");
  const [waitPhone, setWaitPhone] = useState("");
  const [waitSaving, setWaitSaving] = useState(false);
  const [waitJoined, setWaitJoined] = useState(false);

  const product = productData?.product;
  const reviews = reviewData?.reviews ?? [];
  const ratingAvg = reviewData?.ratingAvg ?? product?.ratingAvg ?? 0;
  const reviewCount = reviewData?.reviewCount ?? product?.reviewCount ?? 0;
  const related =
    product && catalog
      ? catalog
          .filter(
            (item) =>
              item.id !== product.id && item.category === product.category,
          )
          .slice(0, 4)
      : [];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await CreateProductReview(id, {
        authorName: authorName.trim(),
        rating,
        body: body.trim(),
      });
      setAuthorName("");
      setBody("");
      setRating(5);
      await mutate();
      toast.success("نظرت ثبت شد");
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "ثبت نشد"));
        return;
      }
      toast.error("ثبت نشد");
    } finally {
      setSaving(false);
    }
  };

  const submitWaitlist = async (event: React.FormEvent) => {
    event.preventDefault();
    setWaitSaving(true);
    try {
      await JoinProductWaitlist(id, {
        customerName: waitName.trim(),
        customerPhone: waitPhone.trim(),
      });
      setWaitJoined(true);
      setWaitName("");
      setWaitPhone("");
      toast.success("ثبت شد — وقتی موجود شد خبرت می‌کنیم");
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "ثبت نشد"));
        return;
      }
      toast.error("ثبت نشد");
    } finally {
      setWaitSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ShopShell cartCount={cartCount(lines)} wishCount={wishlistCount(wish)}>
        <LoadingBox />
      </ShopShell>
    );
  }

  if (error || !product) {
    return (
      <ShopShell cartCount={cartCount(lines)} wishCount={wishlistCount(wish)}>
        <p className="text-sm text-[#6b6459]">این محصول پیدا نشد.</p>
        <button
          type="button"
          onClick={() => router.replace("/shop")}
          className="mt-3 text-sm text-[#1f4a45]"
        >
          برگشت به فروشگاه
        </button>
      </ShopShell>
    );
  }

  const variantsOn = hasVariants(product);
  const sizes = uniqueOptionValues(product.variants ?? [], "size");
  const colors = uniqueOptionValues(product.variants ?? [], "color");
  const selected = variantsOn
    ? findVariant(product, { size: size || undefined, color: color || undefined })
    : undefined;
  const stock = variantsOn
    ? selected
      ? selected.stock
      : productStock(product)
    : productStock(product);
  const price = variantUnitPrice(product, selected);
  const wished = isInWishlist(product.id, wish);
  const canAdd = variantsOn ? Boolean(selected && selected.stock > 0) : stock > 0;
  const showWaitlist = productStock(product) === 0;

  return (
    <ShopShell cartCount={cartCount(lines)} wishCount={wishlistCount(wish)}>
      <Link href="/shop" className="text-sm text-[#1f4a45]">
        بازگشت به فروشگاه
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <ProductGallery
          images={productImages(product)}
          title={localizedTitle(product, locale)}
          emoji={product.emoji}
        />
        <div>
          <p className="text-xs text-[#1f4a45]">{categoryLabel(product.category)}</p>
          <h1 className="font-display mt-2 text-3xl font-semibold">
            {localizedTitle(product, locale)}
          </h1>
          <p className="mt-2 text-sm text-[#5c564d]">
            {localizedBody(product, locale)}
          </p>
          <div className="mt-4">
            <ProductPrice
              price={price}
              compareAtPrice={
                selected?.price != null ? undefined : product.compareAtPrice
              }
              size="lg"
            />
          </div>
          <p className="mt-2 text-sm text-[#6b6459]">
            {variantsOn && !selected
              ? `${productStock(product).toLocaleString("fa-IR")} عدد در کل`
              : `${stock.toLocaleString("fa-IR")} عدد`}{" "}
            ·{" "}
            {reviewCount > 0
              ? `${formatStars(ratingAvg)} ${ratingAvg.toLocaleString("fa-IR")} (${reviewCount.toLocaleString("fa-IR")} نظر)`
              : "هنوز نظری نیست"}
          </p>

          {sizes.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-medium text-[#5c564d]">سایز</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSize(value)}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      size === value
                        ? "bg-[#1f4a45] text-white"
                        : "ring-1 ring-[#14110e]/15"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-[#5c564d]">رنگ</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {colors.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setColor(value)}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      color === value
                        ? "bg-[#1f4a45] text-white"
                        : "ring-1 ring-[#14110e]/15"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canAdd}
              onClick={() => {
                if (variantsOn && !selected) {
                  toast.error("سایز یا رنگ را انتخاب کن");
                  return;
                }
                const before =
                  lines.find(
                    (line) =>
                      line.productId === product.id &&
                      line.variantId === selected?.id,
                  )?.qty ?? 0;
                const next = addToCart(product, 1, selected);
                const after =
                  next.find(
                    (line) =>
                      line.productId === product.id &&
                      line.variantId === selected?.id,
                  )?.qty ?? 0;
                if (after === before) {
                  toast.error("موجودی این گزینه تمام است");
                  return;
                }
                toast.success("به سبد اضافه شد");
              }}
              className="rounded-full bg-[#1f4a45] px-5 py-2.5 text-sm text-white disabled:opacity-40"
            >
              {!canAdd
                ? variantsOn && !selected
                  ? "انتخاب گزینه"
                  : "ناموجود"
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
              className={`rounded-full px-4 py-2.5 text-sm ring-1 ${
                wished
                  ? "bg-[#1f4a45]/10 text-[#1f4a45] ring-[#1f4a45]/20"
                  : "ring-[#14110e]/15"
              }`}
            >
              {wished ? "♥ در علاقه‌مندی‌ها" : "♡ علاقه‌مندی"}
            </button>
          </div>

          {showWaitlist && (
            <div className="mt-6 rounded-3xl border border-[#14110e]/10 bg-[#f4efe6]/80 p-4">
              {waitJoined ? (
                <p className="text-sm text-[#1f4a45]">
                  ثبت شد. وقتی دوباره موجود شد از همین شماره خبرت می‌کنیم.
                </p>
              ) : (
                <form onSubmit={submitWaitlist} className="space-y-3">
                  <div>
                    <p className="font-display text-base font-semibold">
                      خبرم کن وقتی موجود شد
                    </p>
                    <p className="mt-1 text-xs text-[#6b6459]">
                      نام و شماره را بگذار تا فروشنده خبرت کند.
                    </p>
                  </div>
                  <input
                    value={waitName}
                    onChange={(event) => setWaitName(event.target.value)}
                    placeholder="نام"
                    required
                    minLength={2}
                    className="w-full rounded-2xl border border-[#14110e]/10 bg-white px-3 py-2.5 text-sm"
                  />
                  <input
                    value={waitPhone}
                    onChange={(event) => setWaitPhone(event.target.value)}
                    placeholder="۰۹۱۲…"
                    inputMode="tel"
                    dir="ltr"
                    required
                    className="w-full rounded-2xl border border-[#14110e]/10 bg-white px-3 py-2.5 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={waitSaving}
                    className="rounded-full bg-[#1f4a45] px-4 py-2.5 text-sm text-white disabled:opacity-40"
                  >
                    {waitSaving ? "…" : "ثبت درخواست"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={submit}
          className="h-fit rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm"
        >
          <h2 className="font-display text-xl font-semibold">ثبت نظر</h2>
          <p className="mt-1 text-sm text-[#5c564d]">بدون ورود هم می‌شود نظر داد.</p>
          <label className="mt-4 block text-sm">
            نام
            <input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="mt-3 block text-sm">
            امتیاز
            <select
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="mt-1 w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} ستاره
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-sm">
            متن نظر
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full rounded-full bg-[#1f4a45] px-4 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {saving ? "در حال ثبت..." : "ارسال نظر"}
          </button>
        </form>

        <div>
          <h2 className="font-display text-xl font-semibold">نظرها</h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-[#6b6459]">اولین نفر باش که نظر می‌دهد.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-3xl border border-[#14110e]/8 bg-white/85 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{review.authorName}</p>
                    <span className="text-sm text-amber-700">
                      {formatStars(review.rating)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#5c564d]">{review.body}</p>
                  <p className="mt-2 text-xs text-[#6b6459]">
                    {formatDay(review.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">محصولات مرتبط</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/shop/products/${item.id}`}
                className="rounded-3xl border border-[#14110e]/8 bg-white/85 p-4 shadow-sm transition hover:border-[#1f4a45]/30"
              >
                <ProductThumb item={item} className="h-28" />
                <p className="mt-3 text-sm font-medium">
                  {localizedTitle(item, locale)}
                </p>
                <p className="mt-1 text-xs text-[#6b6459]">
                  <ProductPrice
                    price={item.price}
                    compareAtPrice={item.compareAtPrice}
                  />
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </ShopShell>
  );
}
