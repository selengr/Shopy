import type { ProductVariant } from "@/models/product";

export type ProductVariantInput = {
  id?: number;
  size?: string;
  color?: string;
  stock: number;
  price?: number | "";
};

export interface CreateProductInterface {
  title: string;
  title_en: string;
  category_id: string;
  price: number;
  compareAtPrice: number | "";
  description: string;
  body_en: string;
  stock: number;
  emoji: string;
  image: string;
  images: string[];
  variants: ProductVariantInput[];
  featured: boolean;
}

export function emptyVariantRow(): ProductVariantInput {
  return { size: "", color: "", stock: 1, price: "" };
}

export function variantsFromProduct(
  variants?: ProductVariant[],
): ProductVariantInput[] {
  if (!variants?.length) return [];
  return variants.map((item) => ({
    id: item.id,
    size: item.size ?? "",
    color: item.color ?? "",
    stock: item.stock,
    price: item.price ?? "",
  }));
}
