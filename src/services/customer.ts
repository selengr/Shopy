import callApi from "@/helpers/callApi";
import type { CustomerDirectoryRow } from "@/helpers/customers";
import type Order from "@/models/order";
import type Address from "@/models/address";

export async function GetCustomers() {
  const res = await callApi().get("/customers");
  return (res.data?.customers ?? []) as CustomerDirectoryRow[];
}

export async function GetCustomer(phone: string) {
  const res = await callApi().get(`/customers/${encodeURIComponent(phone)}`);
  return res.data as {
    customer: CustomerDirectoryRow;
    orders: Order[];
    addresses: Address[];
  };
}
