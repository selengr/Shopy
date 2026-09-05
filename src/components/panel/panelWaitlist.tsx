"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "react-toastify";
import { GetWaitlist, MarkWaitlistDone } from "@/services/waitlist";
import LoadingBox from "@/components/shared/loadingBox";
import EmptyList from "@/components/shared/emptyList";
import { formatDay } from "@/helpers/orders";
import ValidationError from "@/exceptions/validationError";

export default function PanelWaitlist() {
  const { data, mutate, isLoading } = useSWR("waitlist", GetWaitlist);
  const [busyId, setBusyId] = useState<number | null>(null);

  const entries = data ?? [];
  const open = entries.filter((item) => !item.done);
  const done = entries.filter((item) => item.done);

  const markDone = async (id: number) => {
    setBusyId(id);
    try {
      await MarkWaitlistDone(id);
      toast.success("علامت‌گذاری شد");
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
      <h1 className="font-display text-3xl font-semibold">لیست انتظار</h1>
      <p className="mt-2 text-sm text-[#5c564d]">
        مشتری‌هایی که برای محصول ناموجود خواسته‌اند خبرشان کنی. بعد از تماس،
        «انجام شد» بزن.
      </p>

      {entries.length === 0 ? (
        <div className="mt-8">
          <EmptyList
            title="هنوز کسی ثبت نکرده"
            description="از صفحه محصول ناموجود در فروشگاه می‌توانند ثبت کنند"
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {open.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-[#5c564d]">
                باز ({open.length.toLocaleString("fa-IR")})
              </h2>
              <ul className="mt-3 space-y-3">
                {open.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/panel/products`}
                          className="font-display text-lg font-semibold text-[#1f4a45]"
                        >
                          {item.productTitle}
                        </Link>
                        <p className="mt-1 text-sm text-[#5c564d]">
                          {item.customerName} ·{" "}
                          <a
                            href={`tel:${item.customerPhone}`}
                            className="underline decoration-[#1f4a45]/30"
                            dir="ltr"
                          >
                            {item.customerPhone}
                          </a>
                        </p>
                        <p className="mt-1 text-xs text-[#6b6459]">
                          {formatDay(item.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => markDone(item.id)}
                        className="rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white disabled:opacity-40"
                      >
                        انجام شد
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-[#5c564d]">
                انجام‌شده ({done.length.toLocaleString("fa-IR")})
              </h2>
              <ul className="mt-3 space-y-3 opacity-70">
                {done.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-3xl border border-[#14110e]/8 bg-white/60 p-5"
                  >
                    <p className="font-display text-base font-semibold">
                      {item.productTitle}
                    </p>
                    <p className="mt-1 text-sm text-[#5c564d]">
                      {item.customerName} ·{" "}
                      <span dir="ltr">{item.customerPhone}</span>
                    </p>
                    <p className="mt-1 text-xs text-[#6b6459]">
                      {formatDay(item.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
