import callApi from "@/helpers/callApi";
import type Customer from "@/models/customer";
import type Order from "@/models/order";
import type ReturnRequest from "@/models/returnRequest";

export async function RegisterShopCustomer(values: {
  name: string;
  phone: string;
}) {
  const res = await callApi().post("/shop/auth/register", values);
  return res.data as {
    token: string;
    debug_code?: string;
    sms_sent?: boolean;
  };
}

export async function LoginShopCustomer(phone: string) {
  const res = await callApi().post("/shop/auth/login", { phone });
  return res.data as {
    token: string;
    debug_code?: string;
    sms_sent?: boolean;
  };
}

export async function VerifyShopCustomer(values: {
  token: string;
  code: string;
}) {
  const res = await callApi().post("/shop/auth/verify", values);
  return res.data as { customer: Customer; token: string };
}

export async function GetShopCustomerMe() {
  const res = await callApi().get("/shop/auth/me");
  return res.data?.customer as Customer;
}

export async function LogoutShopCustomer() {
  await callApi().post("/shop/auth/logout");
}

export async function GetMyShopOrders() {
  const res = await callApi().get("/shop/account/orders");
  return {
    orders: (res.data?.orders ?? []) as Order[],
    returns: (res.data?.returns ?? []) as ReturnRequest[],
  };
}

export async function CancelMyShopOrder(orderId: number) {
  const res = await callApi().post(`/shop/account/orders/${orderId}/cancel`, {});
  return res.data?.order as Order;
}
