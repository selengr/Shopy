export const CATEGORIES = [
  { value: "1", label: "پوشاک" },
  { value: "2", label: "کیف و کفش" },
  { value: "3", label: "اکسسوری" },
  { value: "4", label: "خانه" },
];

export function categoryLabel(id?: string) {
  return CATEGORIES.find((item) => item.value === id)?.label ?? "بدون دسته";
}

export function formatToman(price: number) {
  return `${Number(price || 0).toLocaleString("fa-IR")} تومان`;
}

export function hasSale(product: {
  price: number;
  compareAtPrice?: number;
}) {
  const compare = Number(product.compareAtPrice ?? 0);
  return compare > product.price && product.price >= 0;
}

export function salePercent(product: {
  price: number;
  compareAtPrice?: number;
}) {
  if (!hasSale(product)) return 0;
  const compare = Number(product.compareAtPrice);
  return Math.round(((compare - product.price) / compare) * 100);
}

export type ShopSort = "newest" | "price_asc" | "price_desc" | "rating";

export const SHOP_SORT_OPTIONS: { value: ShopSort; label: string }[] = [
  { value: "newest", label: "جدیدترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "rating", label: "بیشترین امتیاز" },
];

export function sortShopProducts<
  T extends {
    id: number;
    price: number;
    created_at?: string;
    ratingAvg?: number;
    reviewCount?: number;
  },
>(products: T[], sort: ShopSort) {
  const list = [...products];
  switch (sort) {
    case "price_asc":
      return list.sort((a, b) => a.price - b.price || b.id - a.id);
    case "price_desc":
      return list.sort((a, b) => b.price - a.price || b.id - a.id);
    case "rating":
      return list.sort(
        (a, b) =>
          (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) ||
          (b.reviewCount ?? 0) - (a.reviewCount ?? 0) ||
          b.id - a.id,
      );
    case "newest":
    default:
      return list.sort((a, b) => {
        const aTime = a.created_at ? Date.parse(a.created_at) : 0;
        const bTime = b.created_at ? Date.parse(b.created_at) : 0;
        return bTime - aTime || b.id - a.id;
      });
  }
}

export const categorySelectOptions = [
  { label: "لطفا یکی از دسته‌ها را انتخاب کنید", value: "" },
  ...CATEGORIES.map((item) => ({ label: item.label, value: item.value })),
];

export const PRODUCT_EMOJIS = [
  "👟",
  "👜",
  "👕",
  "👖",
  "🧢",
  "⌚",
  "🎒",
  "☕",
  "👗",
  "🧣",
  "💍",
  "🧴",
  "🏠",
  "📦",
];
