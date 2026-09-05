export type ProductVariant = {
  id: number;
  size?: string;
  color?: string;
  stock: number;
  /** optional price override; otherwise product.price */
  price?: number;
};

export default interface Product {
  id: number;
  title: string;
  category?: string;
  body: string;
  price: number;
  /** list / was price — display-only when higher than price */
  compareAtPrice?: number;
  user_id: number;
  created_at: string;
  stock?: number;
  emoji?: string;
  /** cover image (same as images[0] when gallery exists) */
  image?: string;
  /** optional gallery; first entry is the cover */
  images?: string[];
  title_en?: string;
  body_en?: string;
  ratingAvg?: number;
  reviewCount?: number;
  variants?: ProductVariant[];
  /** pin on the public shop homepage */
  featured?: boolean;
  /** false = archived / hidden from the public shop */
  active?: boolean;
}
