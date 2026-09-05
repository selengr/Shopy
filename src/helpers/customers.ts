import type Order from "@/models/order";
import type Customer from "@/models/customer";
import type Address from "@/models/address";

export type CustomerDirectoryRow = {
  phone: string;
  name: string;
  registered: boolean;
  customerId?: number;
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: string;
};

const SPENT_STATUSES = new Set([
  "paid",
  "packed",
  "shipped",
  "delivered",
  "returned",
]);

export function buildCustomerDirectory(
  customers: Customer[],
  orders: Order[],
): CustomerDirectoryRow[] {
  const byPhone = new Map<string, CustomerDirectoryRow>();

  for (const customer of customers) {
    byPhone.set(customer.phone, {
      phone: customer.phone,
      name: customer.name,
      registered: true,
      customerId: customer.id,
      orderCount: 0,
      totalSpent: 0,
    });
  }

  for (const order of orders) {
    const phone = order.customerPhone;
    const current = byPhone.get(phone);
    const spent = SPENT_STATUSES.has(order.status) ? order.total : 0;
    if (!current) {
      byPhone.set(phone, {
        phone,
        name: order.customerName,
        registered: false,
        orderCount: 1,
        totalSpent: spent,
        lastOrderAt: order.created_at,
      });
      continue;
    }
    current.orderCount += 1;
    current.totalSpent += spent;
    if (
      !current.lastOrderAt ||
      order.created_at.localeCompare(current.lastOrderAt) > 0
    ) {
      current.lastOrderAt = order.created_at;
      if (!current.registered) current.name = order.customerName;
    }
  }

  return [...byPhone.values()].sort((a, b) => {
    const aAt = a.lastOrderAt ?? "";
    const bAt = b.lastOrderAt ?? "";
    return bAt.localeCompare(aAt) || a.name.localeCompare(b.name, "fa");
  });
}

export function customerDetail(
  phone: string,
  customers: Customer[],
  orders: Order[],
  addresses: Address[],
) {
  const directory = buildCustomerDirectory(customers, orders);
  const row = directory.find((item) => item.phone === phone);
  if (!row) return null;
  const customerOrders = orders
    .filter((order) => order.customerPhone === phone)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const customerAddresses = row.customerId
    ? addresses.filter((item) => item.customerId === row.customerId)
    : [];
  return { customer: row, orders: customerOrders, addresses: customerAddresses };
}
