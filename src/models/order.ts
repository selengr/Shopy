export type OrderStatus =
  | "pending"
  | "paid"
  | "packed"
  | "shipped"
  | "delivered"
  | "returned"
  | "cancelled";

export interface OrderItem {
  productId: number;
  title: string;
  emoji: string;
  image?: string;
  price: number;
  qty: number;
  variantId?: number;
  size?: string;
  color?: string;
}

export default interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  note?: string;
  /** Seller-only note for warehouse / packing slip */
  packingNote?: string;
  created_at: string;
  paymentMethod?: "online" | "cod";
  paid_at?: string;
  /** Sandbox gateway authority (Zarinpal-shaped) */
  authority?: string;
  /** Payment confirmation code after verify */
  refId?: string;
  couponCode?: string;
  discount?: number;
  subtotal?: number;
  customerId?: number;
  shippingMethodId?: number;
  shippingTitle?: string;
  shippingFee?: number;
  /** Parcel tracking number (set when shipping) */
  trackingCode?: string;
  /** Carrier / courier name */
  carrier?: string;
  shipped_at?: string;
  address?: {
    label?: string;
    recipientName: string;
    phone: string;
    province: string;
    city: string;
    street: string;
    postalCode?: string;
  };
}
