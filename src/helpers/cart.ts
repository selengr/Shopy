import type Product from "@/models/product";
import type { ProductVariant } from "@/models/product";
import {
  hasVariants,
  productStock,
  variantLabel,
  variantUnitPrice,
} from "@/helpers/variants";

const CART_KEY = "shopy_cart";
const EMPTY_CART: CartLine[] = [];

export type CartLine = {
  productId: number;
  variantId?: number;
  size?: string;
  color?: string;
  title: string;
  emoji?: string;
  image?: string;
  price: number;
  qty: number;
};

let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY_CART;

function canUseStorage() {
  return typeof window !== "undefined";
}

function lineKey(productId: number, variantId?: number) {
  return `${productId}:${variantId ?? "base"}`;
}

function parseCart(raw: string | null): CartLine[] {
  if (!raw) return EMPTY_CART;
  if (raw === cachedRaw) return cachedLines;
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    cachedRaw = raw;
    cachedLines = Array.isArray(parsed) ? parsed : EMPTY_CART;
    return cachedLines;
  } catch {
    cachedRaw = raw;
    cachedLines = EMPTY_CART;
    return EMPTY_CART;
  }
}

export function readCart(): CartLine[] {
  if (!canUseStorage()) return EMPTY_CART;
  return parseCart(localStorage.getItem(CART_KEY));
}

/** Stable server/SSR snapshot for useSyncExternalStore */
export function getCartServerSnapshot(): CartLine[] {
  return EMPTY_CART;
}

export function writeCart(lines: CartLine[]) {
  if (!canUseStorage()) return;
  const raw = JSON.stringify(lines);
  localStorage.setItem(CART_KEY, raw);
  cachedRaw = raw;
  cachedLines = lines.length === 0 ? EMPTY_CART : lines;
  window.dispatchEvent(new Event("shopy-cart"));
}

export function clearCart() {
  if (!canUseStorage()) return;
  localStorage.removeItem(CART_KEY);
  cachedRaw = null;
  cachedLines = EMPTY_CART;
  window.dispatchEvent(new Event("shopy-cart"));
}

export function subscribeCart(onStoreChange: () => void) {
  if (!canUseStorage()) return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_KEY || event.key === null) onStoreChange();
  };
  window.addEventListener("shopy-cart", onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("shopy-cart", onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function addToCart(
  product: Product,
  qty = 1,
  variant?: ProductVariant,
): CartLine[] {
  const lines = readCart();
  if (hasVariants(product) && !variant) return lines;

  const stock = variant ? variant.stock : productStock(product);
  const existing = lines.find(
    (line) =>
      lineKey(line.productId, line.variantId) ===
      lineKey(product.id, variant?.id),
  );
  const nextQty = (existing?.qty ?? 0) + qty;
  if (nextQty > stock) return lines;

  const label = variant ? variantLabel(variant) : "";
  const title = label ? `${product.title} (${label})` : product.title;
  const price = variantUnitPrice(product, variant);

  let next: CartLine[];
  if (existing) {
    next = lines.map((line) =>
      lineKey(line.productId, line.variantId) ===
      lineKey(product.id, variant?.id)
        ? { ...line, qty: nextQty, price, title }
        : line,
    );
  } else {
    next = [
      ...lines,
      {
        productId: product.id,
        variantId: variant?.id,
        size: variant?.size,
        color: variant?.color,
        title,
        emoji: product.emoji,
        image: product.image,
        price,
        qty,
      },
    ];
  }
  writeCart(next);
  return next;
}

export function setCartQty(
  productId: number,
  qty: number,
  variantId?: number,
): CartLine[] {
  const lines = readCart()
    .map((line) =>
      lineKey(line.productId, line.variantId) === lineKey(productId, variantId)
        ? { ...line, qty }
        : line,
    )
    .filter((line) => line.qty > 0);
  writeCart(lines);
  return lines;
}

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.price * line.qty, 0);
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}
