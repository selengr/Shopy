export default interface Review {
  id: number;
  productId: number;
  authorName: string;
  rating: number;
  body: string;
  created_at: string;
  /** seller hid from the public shop */
  hidden?: boolean;
}
