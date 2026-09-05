"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { toast } from "react-toastify";
import {
  GetSingleOrder,
  UpdateOrderStatus,
  UpdateOrderTracking,
  UpdatePackingNote,
} from "@/services/order";
import LoadingBox from "@/components/shared/loadingBox";
import OrderStatusBadge from "@/components/orders/orderStatusBadge";
import ProductThumb from "@/components/shared/productThumb";
import { formatDay, nextStatuses, statusLabel } from "@/helpers/orders";
import { paymentLabel } from "@/helpers/payments";
import { formatToman } from "@/helpers/catalog";
import { formatAddressLine } from "@/helpers/shipping";
import {
  SHIPPING_CARRIERS,
  formatShipmentTracking,
} from "@/helpers/tracking";
import type { OrderStatus } from "@/models/order";
import ValidationError from "@/exceptions/validationError";

export default function OrderDetail({
  params,
  backHref = "/panel/orders",
}: {
  params: Promise<{ orderId: string }>;
  backHref?: string;
}) {
  const { orderId } = use(params);
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR(
    { url: `/orders/${orderId}`, orderId: Number(orderId) },
    GetSingleOrder,
  );
  const order = data?.order;
  const [packingNote, setPackingNote] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [shipFormOpen, setShipFormOpen] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [savingShip, setSavingShip] = useState(false);

  const openShipForm = () => {
    setCarrier(order?.carrier || order?.shippingTitle || SHIPPING_CARRIERS[0]);
    setTrackingCode(order?.trackingCode ?? "");
    setShipFormOpen(true);
  };

  const changeStatus = async (status: OrderStatus) => {
    if (status === "shipped") {
      openShipForm();
      return;
    }
    try {
      await UpdateOrderStatus(Number(orderId), status);
      await mutate();
      await globalMutate("orders");
      toast.success(`وضعیت شد ${statusLabel(status)}`);
    } catch (err) {
      if (err instanceof ValidationError) {
        toast.error("این تغییر وضعیت مجاز نیست");
        return;
      }
      toast.error("وضعیت عوض نشد");
    }
  };

  const confirmShip = async () => {
    setSavingShip(true);
    try {
      if (order?.status === "shipped" || order?.status === "delivered") {
        await UpdateOrderTracking(Number(orderId), {
          carrier: carrier.trim() || undefined,
          trackingCode: trackingCode.trim() || undefined,
        });
        toast.success("کد رهگیری ذخیره شد");
      } else {
        await UpdateOrderStatus(Number(orderId), "shipped", {
          carrier: carrier.trim() || undefined,
          trackingCode: trackingCode.trim() || undefined,
        });
        toast.success(`وضعیت شد ${statusLabel("shipped")}`);
      }
      setShipFormOpen(false);
      await mutate();
      await globalMutate("orders");
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "ذخیره نشد"));
        return;
      }
      toast.error("ذخیره نشد");
    } finally {
      setSavingShip(false);
    }
  };

  const savePackingNote = async () => {
    if (!order) return;
    setSavingNote(true);
    try {
      await UpdatePackingNote(
        order.id,
        packingNote ?? order.packingNote ?? "",
      );
      setPackingNote(null);
      await mutate();
      toast.success("یادداشت بسته‌بندی ذخیره شد");
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "ذخیره نشد"));
        return;
      }
      toast.error("ذخیره نشد");
    } finally {
      setSavingNote(false);
    }
  };

  if (isLoading) return <LoadingBox />;
  if (error || !order) {
    return (
      <div>
        <p className="text-sm text-[#6b6459]">این سفارش پیدا نشد.</p>
        <button
          type="button"
          onClick={() => router.replace(backHref)}
          className="mt-3 text-sm text-[#1f4a45]"
        >
          برگشت به لیست
        </button>
      </div>
    );
  }

  const noteDraft = packingNote ?? order.packingNote ?? "";
  const shipmentLabel = formatShipmentTracking(order);

  return (
    <div>
      <Link href={backHref} className="text-sm text-[#1f4a45]">
        بازگشت به سفارش‌ها
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            سفارش #{order.id}
          </h1>
          <p className="mt-1 text-sm text-[#5c564d]">{formatDay(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/panel/orders/${order.id}/invoice`}
            className="rounded-full border border-[#14110e]/12 bg-white px-4 py-1.5 text-sm"
          >
            فاکتور
          </Link>
          <Link
            href={`/panel/orders/${order.id}/packing`}
            className="rounded-full border border-[#14110e]/12 bg-white px-4 py-1.5 text-sm"
          >
            بسته‌بندی
          </Link>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">اقلام</h2>
          <ul className="mt-3 divide-y divide-[#14110e]/8">
            {order.items.map((item) => (
              <li
                key={`${item.productId}-${item.title}`}
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
                <span className="text-sm">{formatToman(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          {(order.subtotal != null ||
            order.shippingFee != null ||
            order.discount) && (
            <div className="mt-4 space-y-1 border-t border-[#14110e]/8 pt-3 text-sm text-[#5c564d]">
              {order.subtotal != null && (
                <p className="flex justify-between gap-3">
                  <span>جمع کالا</span>
                  <span>{formatToman(order.subtotal)}</span>
                </p>
              )}
              {order.discount ? (
                <p className="flex justify-between gap-3 text-emerald-800">
                  <span>تخفیف</span>
                  <span>−{formatToman(order.discount)}</span>
                </p>
              ) : null}
              {order.shippingTitle && (
                <p className="flex justify-between gap-3">
                  <span>ارسال ({order.shippingTitle})</span>
                  <span>
                    {!order.shippingFee
                      ? "رایگان"
                      : formatToman(order.shippingFee)}
                  </span>
                </p>
              )}
            </div>
          )}
          <p className="mt-3 text-left font-medium">{formatToman(order.total)}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold">مشتری</h2>
            <p className="mt-2">{order.customerName}</p>
            <p className="mt-1 text-sm text-[#5c564d]" dir="ltr">
              {order.customerPhone}
            </p>
            {order.paymentMethod && (
              <p className="mt-3 text-sm text-[#5c564d]">
                پرداخت: {paymentLabel(order.paymentMethod)}
                {order.paid_at ? " · انجام شد" : ""}
                {order.refId ? ` · Ref ${order.refId}` : ""}
              </p>
            )}
            {order.couponCode && (
              <p className="mt-2 text-sm text-emerald-800">
                تخفیف {order.couponCode}
                {order.discount
                  ? ` · −${order.discount.toLocaleString("fa-IR")} تومان`
                  : ""}
              </p>
            )}
            {order.shippingTitle && (
              <p className="mt-2 text-sm text-[#5c564d]">
                ارسال: {order.shippingTitle}
              </p>
            )}
            {shipmentLabel && (
              <p className="mt-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                رهگیری مرسوله:{" "}
                <span dir="ltr" className="font-medium">
                  {shipmentLabel}
                </span>
              </p>
            )}
            {order.address && (
              <div className="mt-3 rounded-2xl bg-[#f4efe6] p-3 text-sm text-[#5c564d]">
                <p className="font-medium text-[#14110e]">
                  {order.address.label || "آدرس تحویل"}
                </p>
                <p className="mt-1">
                  {order.address.recipientName} ·{" "}
                  <span dir="ltr">{order.address.phone}</span>
                </p>
                <p className="mt-1">{formatAddressLine(order.address)}</p>
              </div>
            )}
            {order.note && (
              <p className="mt-3 rounded-2xl bg-[#f4efe6] p-3 text-sm text-[#5c564d]">
                یادداشت مشتری: {order.note}
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold">
              یادداشت بسته‌بندی
            </h2>
            <p className="mt-1 text-xs text-[#6b6459]">
              فقط برای انبار؛ روی برگه بسته‌بندی چاپ می‌شود.
            </p>
            <textarea
              value={noteDraft}
              onChange={(event) => setPackingNote(event.target.value)}
              rows={3}
              placeholder="مثلاً: جعبه جدا، کارت هدیه بگذار"
              className="mt-3 w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              disabled={savingNote}
              onClick={savePackingNote}
              className="mt-3 rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {savingNote ? "..." : "ذخیره یادداشت"}
            </button>
          </div>

          {(order.status === "shipped" || order.status === "delivered") && (
            <div className="rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">رهگیری مرسوله</h2>
                <button
                  type="button"
                  onClick={openShipForm}
                  className="text-sm text-[#1f4a45] hover:underline"
                >
                  ویرایش
                </button>
              </div>
              <p className="mt-2 text-sm text-[#5c564d]" dir="ltr">
                {shipmentLabel || "هنوز کد رهگیری ثبت نشده"}
              </p>
            </div>
          )}

          {(shipFormOpen || nextStatuses(order.status).includes("shipped")) &&
            shipFormOpen && (
              <div className="rounded-3xl border border-[#1f4a45]/25 bg-[#1f4a45]/[0.04] p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold">
                  {order.status === "shipped" || order.status === "delivered"
                    ? "ویرایش رهگیری"
                    : "ارسال سفارش"}
                </h2>
                <p className="mt-1 text-xs text-[#6b6459]">
                  کد رهگیری اختیاری است؛ مشتری در پیگیری می‌بیندش.
                </p>
                <label className="mt-3 block text-sm">
                  شرکت / روش
                  <select
                    value={carrier}
                    onChange={(event) => setCarrier(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#14110e]/10 bg-white px-3 py-2.5 text-sm"
                  >
                    {SHIPPING_CARRIERS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-3 block text-sm">
                  کد رهگیری
                  <input
                    value={trackingCode}
                    onChange={(event) => setTrackingCode(event.target.value)}
                    dir="ltr"
                    placeholder="مثلاً TIPAX-1045-8821"
                    className="mt-1 w-full rounded-2xl border border-[#14110e]/10 bg-white px-3 py-2.5 text-sm"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingShip}
                    onClick={confirmShip}
                    className="rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {savingShip
                      ? "..."
                      : order.status === "shipped" || order.status === "delivered"
                        ? "ذخیره"
                        : "تایید ارسال"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShipFormOpen(false)}
                    className="rounded-full px-4 py-2 text-sm ring-1 ring-[#14110e]/15"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}

          {nextStatuses(order.status).length > 0 && (
            <div className="rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold">تغییر وضعیت</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {nextStatuses(order.status).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => changeStatus(status)}
                    className={`rounded-full px-4 py-2 text-sm ${
                      status === "cancelled"
                        ? "border border-red-200 bg-white text-red-700"
                        : "bg-[#1f4a45] text-white"
                    }`}
                  >
                    {statusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
