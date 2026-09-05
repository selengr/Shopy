"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { GetCustomers, GetCustomer } from "@/services/customer";
import LoadingBox from "@/components/shared/loadingBox";
import EmptyList from "@/components/shared/emptyList";
import OrderStatusBadge from "@/components/orders/orderStatusBadge";
import { formatToman } from "@/helpers/catalog";
import { formatDay } from "@/helpers/orders";

export default function PanelCustomers() {
  const { data, isLoading } = useSWR("customers", GetCustomers);
  const [query, setQuery] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const { data: detail, isLoading: detailLoading } = useSWR(
    selectedPhone ? ["customer", selectedPhone] : null,
    ([, phone]) => GetCustomer(phone),
  );

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = query.trim();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.name.includes(q) ||
        item.phone.includes(q) ||
        item.phone.replace(/^0/, "").includes(q.replace(/^0/, "")),
    );
  }, [data, query]);

  if (isLoading && !data) return <LoadingBox />;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">مشتری‌ها</h1>
      <p className="mt-2 text-sm text-[#5c564d]">
        خریداران ثبت‌نام‌کرده و مهمان‌هایی که سفارش گذاشته‌اند — با تعداد سفارش و
        جمع خرید.
      </p>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="جستجو نام یا شماره…"
        className="mt-6 w-full max-w-md rounded-2xl border border-[#14110e]/10 bg-white px-3 py-2.5 text-sm"
      />

      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyList
            title="مشتری‌ای نیست"
            description="با اولین سفارش اینجا پر می‌شود"
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <ul className="space-y-3">
            {filtered.map((item) => {
              const active = selectedPhone === item.phone;
              return (
                <li key={item.phone}>
                  <button
                    type="button"
                    onClick={() => setSelectedPhone(item.phone)}
                    className={`w-full rounded-3xl border p-4 text-right transition ${
                      active
                        ? "border-[#1f4a45]/40 bg-[#1f4a45]/8"
                        : "border-[#14110e]/8 bg-white/85 shadow-sm hover:border-[#1f4a45]/25"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-lg font-semibold">
                          {item.name}
                        </p>
                        <p className="mt-1 text-sm text-[#5c564d]" dir="ltr">
                          {item.phone}
                        </p>
                      </div>
                      {item.registered && (
                        <span className="rounded-full bg-[#1f4a45]/10 px-2.5 py-0.5 text-[10px] text-[#1f4a45]">
                          حساب
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-[#6b6459]">
                      {item.orderCount.toLocaleString("fa-IR")} سفارش ·{" "}
                      {formatToman(item.totalSpent)}
                      {item.lastOrderAt
                        ? ` · آخرین ${formatDay(item.lastOrderAt)}`
                        : ""}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm">
            {!selectedPhone ? (
              <p className="text-sm text-[#6b6459]">
                یک مشتری را از لیست انتخاب کن.
              </p>
            ) : detailLoading && !detail ? (
              <LoadingBox />
            ) : !detail ? (
              <p className="text-sm text-[#6b6459]">پیدا نشد.</p>
            ) : (
              <div>
                <h2 className="font-display text-2xl font-semibold">
                  {detail.customer.name}
                </h2>
                <p className="mt-1 text-sm text-[#5c564d]" dir="ltr">
                  {detail.customer.phone}
                </p>
                <p className="mt-2 text-xs text-[#6b6459]">
                  {detail.customer.registered
                    ? "حساب فروشگاهی دارد"
                    : "فقط مهمان / سفارش"}{" "}
                  · {detail.customer.orderCount.toLocaleString("fa-IR")} سفارش ·{" "}
                  {formatToman(detail.customer.totalSpent)}
                </p>

                {detail.addresses.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-sm font-medium text-[#5c564d]">آدرس‌ها</h3>
                    <ul className="mt-2 space-y-2">
                      {detail.addresses.map((address) => (
                        <li
                          key={address.id}
                          className="rounded-2xl bg-[#f4efe6] px-3 py-2 text-sm text-[#5c564d]"
                        >
                          {address.label ? `${address.label} · ` : ""}
                          {address.city}، {address.street}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5">
                  <h3 className="text-sm font-medium text-[#5c564d]">سفارش‌ها</h3>
                  {detail.orders.length === 0 ? (
                    <p className="mt-2 text-sm text-[#6b6459]">سفارشی نیست</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {detail.orders.map((order) => (
                        <li key={order.id}>
                          <Link
                            href={`/panel/orders/${order.id}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#14110e]/8 px-3 py-2.5 text-sm hover:border-[#1f4a45]/30"
                          >
                            <span>
                              #{order.id.toLocaleString("fa-IR")} ·{" "}
                              {formatDay(order.created_at)}
                            </span>
                            <span className="flex items-center gap-2">
                              <OrderStatusBadge status={order.status} />
                              <span>{formatToman(order.total)}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
