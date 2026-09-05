"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "react-toastify";
import {
  GetPanelReviews,
  HideReview,
  UnhideReview,
} from "@/services/review";
import LoadingBox from "@/components/shared/loadingBox";
import EmptyList from "@/components/shared/emptyList";
import { formatDay } from "@/helpers/orders";
import { formatStars } from "@/helpers/reviews";
import ValidationError from "@/exceptions/validationError";

export default function PanelReviews() {
  const { data, mutate, isLoading } = useSWR("panel-reviews", GetPanelReviews);
  const [busyId, setBusyId] = useState<number | null>(null);

  const reviews = data ?? [];

  const toggle = async (id: number, hidden?: boolean) => {
    setBusyId(id);
    try {
      if (hidden) {
        await UnhideReview(id);
        toast.success("نظر دوباره نمایش داده می‌شود");
      } else {
        await HideReview(id);
        toast.info("نظر از فروشگاه مخفی شد");
      }
      await mutate();
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "انجام نشد"));
        return;
      }
      toast.error("انجام نشد");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading && !data) return <LoadingBox />;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">نظرات</h1>
      <p className="mt-2 text-sm text-[#5c564d]">
        نظرات عمومی فروشگاه. مخفی کردن یعنی از صفحه محصول و میانگین امتیاز حذف
        می‌شود.
      </p>

      {reviews.length === 0 ? (
        <div className="mt-8">
          <EmptyList
            title="هنوز نظری نیست"
            description="وقتی مشتری نظر بگذارد اینجا می‌آید"
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className={`rounded-3xl border border-[#14110e]/8 p-5 shadow-sm ${
                review.hidden ? "bg-white/50 opacity-80" : "bg-white/85"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/shop/products/${review.productId}`}
                    className="font-display text-lg font-semibold text-[#1f4a45]"
                  >
                    {review.productTitle}
                  </Link>
                  <p className="mt-1 text-sm text-[#5c564d]">
                    {review.authorName} · {formatStars(review.rating)} ·{" "}
                    {formatDay(review.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {review.hidden && (
                    <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-[10px] text-gray-700">
                      مخفی
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={busyId === review.id}
                    onClick={() => toggle(review.id, review.hidden)}
                    className="rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white disabled:opacity-40"
                  >
                    {review.hidden ? "نمایش بده" : "مخفی کن"}
                  </button>
                </div>
              </div>
              <p className="mt-4 rounded-2xl bg-[#f4efe6] p-3 text-sm text-[#5c564d]">
                {review.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
