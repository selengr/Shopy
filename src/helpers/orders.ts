import type { OrderStatus } from "@/models/order";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "در انتظار" },
  { value: "paid", label: "پرداخت‌شده" },
  { value: "packed", label: "بسته‌بندی" },
  { value: "shipped", label: "ارسال‌شده" },
  { value: "delivered", label: "تحویل‌شده" },
  { value: "returned", label: "مرجوع" },
  { value: "cancelled", label: "لغو" },
];

export function statusLabel(status: OrderStatus) {
  return ORDER_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function statusClass(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "paid":
      return "bg-[#1f4a45]/10 text-[#1f4a45]";
    case "packed":
      return "bg-sky-100 text-sky-800";
    case "shipped":
      return "bg-emerald-100 text-emerald-800";
    case "delivered":
      return "bg-teal-100 text-teal-900";
    case "returned":
      return "bg-violet-100 text-violet-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
  }
}

export function nextStatuses(status: OrderStatus): OrderStatus[] {
  switch (status) {
    case "pending":
      return ["paid", "cancelled"];
    case "paid":
      return ["packed", "cancelled"];
    case "packed":
      return ["shipped"];
    case "shipped":
      return ["delivered"];
    default:
      return [];
  }
}

/** Buyer can cancel before packing starts. */
export function canCustomerCancel(order: { status: OrderStatus }) {
  return order.status === "pending" || order.status === "paid";
}

export function formatInvoiceDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDay(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function orderItemCount(items: { qty: number }[]) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}
