"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { toast } from "react-toastify";
import ShopShell from "@/components/shop/shopShell";
import ProductThumb from "@/components/shared/productThumb";
import LoadingBox from "@/components/shared/loadingBox";
import { TrackShopOrder } from "@/services/tracking";
import { TRACK_FLOW, formatShipmentTracking, isTrackStepDone } from "@/helpers/tracking";
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
      <Link href="/shop" className="text-sm text-[#1f4a45]">
        بازگشت به فروشگاه
      </Link>
      <h1 className="font-display mt-3 text-3xl font-semibold">پیگیری سفارش</h1>
      <p className="mt-2 text-sm text-[#5c564d]">
        شماره سفارش و موبایلی که موقع خرید زدی را بنویس. نمونه: سفارش ۱۰۴۸ با
        ۰۹۱۲۳۳۳۴۴۴۴
      </p>

      <form
        onSubmit={lookup}
        className="mt-8 max-w-md space-y-4 rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm"
      >
        <label className="block text-sm">
          شماره سفارش
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            inputMode="numeric"
            dir="ltr"
            placeholder="مثلاً 1048"
            className="mt-1 w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block text-sm">
          موبایل
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            dir="ltr"
            placeholder="09xxxxxxxxx"
            className="mt-1 w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#1f4a45] px-4 py-2.5 text-sm text-white disabled:opacity-50"
        >
          {loading ? "در حال جستجو..." : "پیگیری"}
        </button>
      </form>

      {(autoLoading || loading) && !order && (
        <div className="mt-8">
          <LoadingBox />
        </div>
      )}

      {order && (
        <div className="mt-10 space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold">
              سفارش #{order.id.toLocaleString("fa-IR")}
            </h2>
            <p className="mt-1 text-sm text-[#5c564d]">
              {formatDay(order.created_at)} · {statusLabel(order.status)} ·{" "}
              {order.customerName}
            </p>
          </div>

          {order.status === "cancelled" ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
              این سفارش لغو شده است.
            </p>
          ) : order.status === "returned" ? (
            <p className="rounded-2xl bg-violet-50 px-4 py-3 text-sm text-violet-900">
              این سفارش مرجوع شده است.
            </p>
          ) : (
            <ol className="relative space-y-0 border-r-2 border-[#14110e]/10 pr-6">
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
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-medium">رهگیری مرسوله</p>
              <p className="mt-1" dir="ltr">
                {formatShipmentTracking(order)}
              </p>
            </div>
          )}

          <div className="rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm">
            <h3 className="font-display text-lg font-semibold">اقلام</h3>
            <ul className="mt-3 divide-y divide-[#14110e]/8">
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
            <p className="mt-4 text-left font-display text-xl font-semibold">
              {formatToman(order.total)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function ShopTrackPage() {
  return (
    <ShopShell>
      <Suspense fallback={<LoadingBox />}>
        <TrackBody />
      </Suspense>
    </ShopShell>
  );
}
