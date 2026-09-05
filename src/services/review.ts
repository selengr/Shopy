import callApi from "@/helpers/callApi";
import type Review from "@/models/review";
import type Product from "@/models/product";

export type PanelReview = Review & { productTitle: string };

export async function GetShopProduct(productId: number) {
  const res = await callApi().get(`/shop/products/${productId}`);
  return res.data as { product: Product };
}

export async function GetProductReviews(productId: number) {
  const res = await callApi().get(`/shop/products/${productId}/reviews`);
  return res.data as {
    reviews: Review[];
    ratingAvg: number;
    reviewCount: number;
  };
}

export async function CreateProductReview(
  productId: number,
  values: { authorName: string; rating: number; body: string },
) {
  const res = await callApi().post(`/shop/products/${productId}/reviews`, values);
  return res.data?.review as Review;
}

export async function GetPanelReviews() {
  const res = await callApi().get("/reviews");
  return (res.data?.reviews ?? []) as PanelReview[];
}

export async function HideReview(id: number) {
  const res = await callApi().post(`/reviews/${id}/hide`);
  return res.data?.review as Review;
}

export async function UnhideReview(id: number) {
  const res = await callApi().post(`/reviews/${id}/unhide`);
  return res.data?.review as Review;
}
