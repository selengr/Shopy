import type { OrderStatus } from "@/models/order";

export type TrackStep = {
  status: OrderStatus;
  label: string;
};

export const TRACK_FLOW: TrackStep[] = [
  { status: "pending", label: "ثبت شد" },
  { status: "paid", label: "پرداخت" },
  { status: "packed", label: "بسته‌بندی" },
  { status: "shipped", label: "ارسال" },
  { status: "delivered", label: "تحویل" },
];

export const SHIPPING_CARRIERS = [
  "پست پیشتاز",
  "تیپاکس",
  "چاپار",
  "پیک شهری",
  "سایر",
] as const;

export function formatShipmentTracking(order: {
  carrier?: string;
  trackingCode?: string;
}) {
  const parts = [order.carrier, order.trackingCode].filter(Boolean);
  return parts.length ? parts.join(" · ") : "";
}

export function trackStepIndex(status: OrderStatus) {
  if (status === "cancelled" || status === "returned") return -1;
  if (status === "delivered") return TRACK_FLOW.length - 1;
  const index = TRACK_FLOW.findIndex((step) => step.status === status);
  return index >= 0 ? index : 0;
}

export function isTrackStepDone(status: OrderStatus, stepStatus: OrderStatus) {
  if (status === "cancelled") return false;
  return trackStepIndex(status) >= trackStepIndex(stepStatus);
}
