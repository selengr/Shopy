"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ShopShell from "@/components/shop/shopShell";
import LoadingBox from "@/components/shared/loadingBox";
import ProductThumb from "@/components/shared/productThumb";
import { TrackShopOrder } from "@/services/tracking";
import { formatToman } from "@/helpers/catalog";
import { formatDay, statusLabel } from "@/helpers/orders";
import { formatShipmentTracking } from "@/helpers/tracking";
import { normalizeIranianPhone } from "@/helpers/auth";
import type Order from "@/models/order";

export default function ShopOrderConfirmPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId: orderIdParam } = use(params);
  const search = useSearchParams();
  const phoneParam = search.get("phone") ?? "";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const id = Number(orderIdParam);
      const phone = normalizeIranianPhone(phoneParam);
      if (!Number.isFinite(id) || id < 1 || !phone) {
        if (alive) {
          setFailed(true);
          setLoading(false);
        }
        return;
      }
      try {
        const found = await TrackShopOrder({ orderId: id, phone });
        if (alive) setOrder(found);
      } catch {
        if (alive) setFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orderIdParam, phoneParam]);

  const trackHref =
    order && phoneParam
      ? `/shop/track?orderId=${order.id}&phone=${encodeURIComponent(phoneParam)}`
      : "/shop/track";

  return (
    <ShopShell>
      {loading ? (
        <LoadingBox />
      ) : failed || !order ? (
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-display text-3xl font-semibold">سفارش پیدا نشد</h1>
          <p className="mt-2 text-sm text-[#5c564d]">
            اگر همین الان خرید کردی، از پیگیری با شماره سفارش و موبایل استفاده کن.
          </p>
          <Link
            href="/shop/track"
            className="mt-6 inline-flex rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white"
          >
            پیگیری سفارش
          </Link>
        </div>
      ) : (
        <div className="mx-auto max-w-lg">
          <p className="text-sm text-emerald-800">سفارش ثبت شد</p>
          <h1 className="font-display mt-1 text-3xl font-semibold">
            ممنون {order.customerName}
          </h1>
          <p className="mt-2 text-sm text-[#5c564d]">
            شماره سفارش را نگه دار؛ برای پیگیری به موبایل هم نیاز داری.
          </p>

          <div className="mt-6 rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm">
            <p className="text-xs text-[#6b6459]">شماره سفارش</p>
            <p className="font-display mt-1 text-3xl font-semibold" dir="ltr">
              #{order.id}
            </p>
            <p className="mt-3 text-sm text-[#5c564d]">
              {statusLabel(order.status)} · {formatDay(order.created_at)}
            </p>
            <p className="mt-1 text-sm font-medium">{formatToman(order.total)}</p>
            {order.shippingTitle && (
              <p className="mt-1 text-xs text-[#6b6459]">
                ارسال: {order.shippingTitle}
                {order.shippingFee
                  ? ` · ${formatToman(order.shippingFee)}`
                  : " · رایگان"}
              </p>
            )}
            {formatShipmentTracking(order) && (
              <p className="mt-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900" dir="ltr">
                {formatShipmentTracking(order)}
              </p>
            )}

            <ul className="mt-4 space-y-2 border-t border-[#14110e]/8 pt-4">
              {order.items.map((item) => (
                <li
                  key={`${item.productId}-${item.variantId ?? "base"}`}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="inline-block w-10 shrink-0">
                    <ProductThumb item={item} className="h-10" compact />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {item.title}
                    {(item.size || item.color) && (
                      <span className="text-[#6b6459]">
                        {" "}
                        ({[item.size, item.color].filter(Boolean).join(" / ")})
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-[#6b6459]">
                    ×{item.qty.toLocaleString("fa-IR")}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={trackHref}
              className="rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white"
            >
              پیگیری سفارش
            </Link>
            <Link
              href="/shop"
              className="rounded-full px-4 py-2 text-sm ring-1 ring-[#14110e]/15"
            >
              ادامه خرید
            </Link>
          </div>
        </div>
      )}
    </ShopShell>
  );
}
