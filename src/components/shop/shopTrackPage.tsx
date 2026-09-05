"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { motion } from "motion/react";
import { toast } from "react-toastify";
import ShopShell from "@/components/shop/shopShell";
import ProductThumb from "@/components/shared/productThumb";
import LoadingBox from "@/components/shared/loadingBox";
import { TrackShopOrder } from "@/services/tracking";
import {
  TRACK_FLOW,
  formatShipmentTracking,
  isTrackStepDone,
} from "@/helpers/tracking";
import { formatToman } from "@/helpers/catalog";
import { formatDay, statusLabel } from "@/helpers/orders";
import { iranianPhoneRegExp, normalizeIranianPhone } from "@/helpers/auth";
import ValidationError from "@/exceptions/validationError";
import type Order from "@/models/order";

function TrackBody() {
  const search = useSearchParams();
  const paramId = search.get("orderId") ?? "";
  const paramPhone = search.get("phone") ?? "";
  const [orderId, setOrderId] = useState(paramId);
  const [phone, setPhone] = useState(paramPhone);
  const [manualOrder, setManualOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const autoPhone = paramPhone ? normalizeIranianPhone(paramPhone) : "";
  const canAuto =
    Boolean(paramId) &&
    Number(paramId) > 0 &&
    iranianPhoneRegExp.test(autoPhone);

  const { data: autoOrder, isLoading: autoLoading } = useSWR(
    canAuto ? ["shop/track", paramId, autoPhone] : null,
    ([, id, phoneValue]) =>
      TrackShopOrder({ orderId: Number(id), phone: String(phoneValue) }),
    { shouldRetryOnError: false },
  );

  const order = manualOrder ?? autoOrder ?? null;

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    const id = Number(orderId);
    const normalized = normalizeIranianPhone(phone);
    if (!Number.isFinite(id) || id < 1) {
      toast.error("شماره سفارش را درست بنویس");
      return;
    }
    if (!iranianPhoneRegExp.test(normalized)) {
      toast.error("شماره موبایل درست نیست");
      return;
    }

    setLoading(true);
    try {
      const found = await TrackShopOrder({ orderId: id, phone: normalized });
      setManualOrder(found);
    } catch (err) {
      setManualOrder(null);
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "سفارش پیدا نشد"));
        return;
      }
      toast.error("سفارش پیدا نشد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 65% 50% at 10% 0%, rgba(244,239,230,0.16), transparent 55%), linear-gradient(165deg, #1f4a45 0%, #1a3d39 50%, #f4efe6 50%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-28 sm:px-8 sm:pt-24 sm:pb-36">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl font-bold tracking-tight text-[#f4efe6] sm:text-6xl"
          >
            پیگیری سفارش
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-4 max-w-lg text-base leading-8 text-[#f4efe6]/75"
          >
            شماره سفارش و موبایلی که موقع خرید زدی را بنویس. نمونه:{" "}
            <span dir="ltr" className="text-[#f4efe6]">
              1048 · 09123334444
            </span>
          </motion.p>
        </div>
      </section>

      <section className="-mt-20 bg-[#f4efe6] pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={lookup}
            className="grid max-w-2xl gap-3 border border-[#14110e]/10 bg-white/95 p-5 shadow-[0_24px_60px_-36px_rgba(20,17,14,0.45)] sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6"
          >
            <label className="block text-sm">
              <span className="text-[#5c564d]">شماره سفارش</span>
              <input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                inputMode="numeric"
                dir="ltr"
                placeholder="1048"
                className="mt-1.5 w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[#5c564d]">موبایل</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                dir="ltr"
                placeholder="09xxxxxxxxx"
                className="mt-1.5 w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#1f4a45] px-6 py-2.5 text-sm text-white disabled:opacity-50 sm:mb-0.5"
            >
              {loading ? "..." : "پیگیری"}
            </button>
          </motion.form>

          {(autoLoading || loading) && !order && (
            <div className="mt-10">
              <LoadingBox />
            </div>
          )}

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]"
            >
              <div>
                <p className="text-sm text-[#1f4a45]">نتیجه</p>
                <h2 className="font-display mt-2 text-3xl font-semibold">
                  سفارش #{order.id.toLocaleString("fa-IR")}
                </h2>
                <p className="mt-2 text-sm text-[#5c564d]">
                  {formatDay(order.created_at)} · {statusLabel(order.status)} ·{" "}
                  {order.customerName}
                </p>

                {order.status === "cancelled" ? (
                  <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    این سفارش لغو شده است.
                  </p>
                ) : order.status === "returned" ? (
                  <p className="mt-6 border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
                    این سفارش مرجوع شده است.
                  </p>
                ) : (
                  <ol className="relative mt-8 space-y-0 border-r-2 border-[#14110e]/10 pr-6">
                    {TRACK_FLOW.map((step) => {
                      const done = isTrackStepDone(order.status, step.status);
                      const current = order.status === step.status;
                      return (
                        <li key={step.status} className="relative pb-6 last:pb-0">
                          <span
                            className={`absolute -right-[1.6rem] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                              done
                                ? "bg-[#1f4a45] text-white"
                                : "bg-white text-[#6b6459] ring-1 ring-[#14110e]/15"
                            }`}
                          >
                            {done ? "✓" : ""}
                          </span>
                          <p
                            className={`text-sm font-medium ${
                              current
                                ? "text-[#1f4a45]"
                                : done
                                  ? "text-[#14110e]"
                                  : "text-[#6b6459]"
                            }`}
                          >
                            {step.label}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                )}

                {formatShipmentTracking(order) && (
                  <div className="mt-6 border border-[#1f4a45]/20 bg-[#1f4a45]/5 px-4 py-3 text-sm text-[#1f4a45]">
                    <p className="font-medium">رهگیری مرسوله</p>
                    <p className="mt-1" dir="ltr">
                      {formatShipmentTracking(order)}
                    </p>
                  </div>
                )}
              </div>

              <div className="border border-[#14110e]/10 bg-white/90 p-5 sm:p-6">
                <h3 className="font-display text-xl font-semibold">اقلام</h3>
                <ul className="mt-4 divide-y divide-[#14110e]/8">
                  {order.items.map((item) => (
                    <li
                      key={`${item.productId}-${item.variantId ?? item.title}`}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <span className="flex items-center gap-3">
                        <span className="inline-block w-12 shrink-0">
                          <ProductThumb item={item} className="h-12" compact />
                        </span>
                        <span>
                          {item.title}
                          <span className="mr-2 text-xs text-[#6b6459]">
                            × {item.qty.toLocaleString("fa-IR")}
                          </span>
                        </span>
                      </span>
                      <span className="text-sm">
                        {formatToman(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-left font-display text-2xl font-semibold">
                  {formatToman(order.total)}
                </p>
              </div>
            </motion.div>
          )}

          <p className="mt-10">
            <Link href="/shop" className="text-sm text-[#1f4a45] hover:underline">
              بازگشت به فروشگاه
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

export default function ShopTrackPage() {
  return (
    <ShopShell flush>
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <LoadingBox />
          </div>
        }
      >
        <TrackBody />
      </Suspense>
    </ShopShell>
  );
}
