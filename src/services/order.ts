import callApi from "@/helpers/callApi";
import type Order from "@/models/order";
import type { OrderItem, OrderStatus } from "@/models/order";

export async function GetOrders() {
  const res = await callApi().get("/orders");
  return (res.data?.orders ?? []) as Order[];
}

export async function GetSingleOrder({ orderId }: { orderId: number }) {
  const res = await callApi().get(`/orders/${orderId}`);
  return res.data as { order: Order };
}

export async function CreateOrder(values: {
  customerName: string;
  customerPhone: string;
  note?: string;
  items: Array<Pick<OrderItem, "productId" | "qty" | "variantId">>;
}) {
  return await callApi().post("/orders", values);
}

export async function UpdateOrderStatus(
  orderId: number,
  status: OrderStatus,
  extra?: { trackingCode?: string; carrier?: string },
) {
  return await callApi().post(`/orders/${orderId}/status`, {
    status,
    ...extra,
  });
}

export async function UpdateOrderTracking(
  orderId: number,
  values: { trackingCode?: string; carrier?: string },
) {
  const res = await callApi().post(`/orders/${orderId}/tracking`, values);
  return res.data?.order as Order;
}

export async function UpdatePackingNote(orderId: number, packingNote: string) {
  const res = await callApi().post(`/orders/${orderId}/packing-note`, {
    packingNote,
  });
  return res.data?.order as Order;
}
