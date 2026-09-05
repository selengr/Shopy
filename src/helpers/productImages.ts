import type Product from "@/models/product";

const MAX_PRODUCT_IMAGES = 6;

/** Cover + gallery paths, de-duplicated, cover first. */
export function productImages(product: Pick<Product, "image" | "images">) {
  const list = [
    ...(product.images ?? []),
    product.image ? [product.image] : [],
  ].flat();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const value = String(raw ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
    if (out.length >= MAX_PRODUCT_IMAGES) break;
  }
  return out;
}

export function normalizeImagesInput(raw: unknown, fallbackImage?: string) {
  const fromArray = Array.isArray(raw)
    ? raw.map((item) => String(item ?? "").trim()).filter(Boolean)
    : [];
  const fallback = String(fallbackImage ?? "").trim();
  const list = fromArray.length ? fromArray : fallback ? [fallback] : [];
  const seen = new Set<string>();
  const images: string[] = [];
  for (const value of list) {
    if (seen.has(value)) continue;
    seen.add(value);
    images.push(value);
    if (images.length >= MAX_PRODUCT_IMAGES) break;
  }
  return {
    images: images.length ? images : undefined,
    image: images[0],
  };
}

export { MAX_PRODUCT_IMAGES };
