import type Product from "@/models/product";

const WISHLIST_KEY = "shopy_wishlist";
const EMPTY_WISHLIST: WishlistItem[] = [];

export type WishlistItem = {
  productId: number;
  title: string;
  emoji?: string;
  image?: string;
  price: number;
};

let cachedRaw: string | null = null;
let cachedItems: WishlistItem[] = EMPTY_WISHLIST;

function canUseStorage() {
  return typeof window !== "undefined";
}

function parseWishlist(raw: string | null): WishlistItem[] {
  if (!raw) return EMPTY_WISHLIST;
  if (raw === cachedRaw) return cachedItems;
  try {
    const parsed = JSON.parse(raw) as WishlistItem[];
    cachedRaw = raw;
    cachedItems = Array.isArray(parsed) ? parsed : EMPTY_WISHLIST;
    return cachedItems;
  } catch {
    cachedRaw = raw;
    cachedItems = EMPTY_WISHLIST;
    return EMPTY_WISHLIST;
  }
}

export function readWishlist(): WishlistItem[] {
  if (!canUseStorage()) return EMPTY_WISHLIST;
  return parseWishlist(localStorage.getItem(WISHLIST_KEY));
}

/** Stable server/SSR snapshot for useSyncExternalStore */
export function getWishlistServerSnapshot(): WishlistItem[] {
  return EMPTY_WISHLIST;
}

export function writeWishlist(items: WishlistItem[]) {
  if (!canUseStorage()) return;
  const raw = JSON.stringify(items);
  localStorage.setItem(WISHLIST_KEY, raw);
  cachedRaw = raw;
  cachedItems = items.length === 0 ? EMPTY_WISHLIST : items;
  window.dispatchEvent(new Event("shopy-wishlist"));
}

export function subscribeWishlist(onStoreChange: () => void) {
  if (!canUseStorage()) return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === WISHLIST_KEY || event.key === null) onStoreChange();
  };
  window.addEventListener("shopy-wishlist", onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("shopy-wishlist", onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function isInWishlist(productId: number, items = readWishlist()) {
  return items.some((item) => item.productId === productId);
}

export function toggleWishlist(product: Product): WishlistItem[] {
  const items = readWishlist();
  const exists = items.some((item) => item.productId === product.id);
  const next = exists
    ? items.filter((item) => item.productId !== product.id)
    : [
        ...items,
        {
          productId: product.id,
          title: product.title,
          emoji: product.emoji,
          image: product.image,
          price: product.price,
        },
      ];
  writeWishlist(next);
  return next;
}

export function removeFromWishlist(productId: number): WishlistItem[] {
  const next = readWishlist().filter((item) => item.productId !== productId);
  writeWishlist(next);
  return next;
}

export function wishlistCount(items: WishlistItem[]) {
  return items.length;
}
