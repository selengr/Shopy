import type { UserType } from "@/models/user";
import type Product from "@/models/product";
import type Order from "@/models/order";
import type Review from "@/models/review";
import type Coupon from "@/models/coupon";
import type Customer from "@/models/customer";
import type Address from "@/models/address";
import type ShippingMethod from "@/models/shipping";
import type ReturnRequest from "@/models/returnRequest";
import type ShopSettings from "@/models/shopSettings";
import { seedShippingMethods } from "@/helpers/shipping";
import { defaultShopSettings } from "@/helpers/shopSettings";
import { productStock } from "@/helpers/variants";
import type { StockAlert } from "@/helpers/stockAlerts";
import { STOCK_ALERT_THRESHOLD } from "@/helpers/stockAlerts";
import type { OrderNotification } from "@/helpers/notifications";

const DATA_VERSION_KEY = "shopy_data_v";
const DATA_VERSION = "19";
const USERS_KEY = "shopy_users";
const PRODUCTS_KEY = "shopy_products";
const ORDERS_KEY = "shopy_orders";
const REVIEWS_KEY = "shopy_reviews";
const STOCK_ALERTS_KEY = "shopy_stock_alerts";
const NOTIFICATIONS_KEY = "shopy_order_notifications";
const COUPONS_KEY = "shopy_coupons";
const CUSTOMERS_KEY = "shopy_customers";
const ADDRESSES_KEY = "shopy_addresses";
const SHIPPING_KEY = "shopy_shipping_methods";
const RETURNS_KEY = "shopy_returns";
const SETTINGS_KEY = "shopy_shop_settings";
const CUSTOMER_SESSION_KEY = "shopy_customer_session";
const CUSTOMER_OTP_KEY = "shopy_customer_otp";
const SESSION_KEY = "shopy_session";
const OTP_KEY = "shopy_otp";
export const OTP_HINT_KEY = "shopy_otp_hint";
export const CUSTOMER_OTP_HINT_KEY = "shopy_customer_otp_hint";

export const ADMIN_PERMISSIONS = [
  "manage_products",
  "add_new_product",
  "manage_users",
];

export type StoredUser = UserType & { phone: string };

export type Session = {
  token: string;
  user: UserType;
};

export type PendingOtp = {
  token: string;
  phone: string;
  code: string;
};

export type CustomerSession = {
  token: string;
  customer: Customer;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function seedUsers(): StoredUser[] {
  return [
    {
      id: 1,
      name: "ادمین",
      phone: "09121111111",
      permissions: ADMIN_PERMISSIONS,
    },
    {
      id: 2,
      name: "علی رضایی",
      phone: "09122222222",
      permissions: [],
    },
  ];
}

function seedProducts(): Product[] {
  return [
    {
      id: 1,
      title: "کفش اسپرت سفید",
      title_en: "White sport shoes",
      category: "2",
      body: "کفش روزمره، سبک و مناسب پیاده‌روی",
      body_en: "Everyday sneakers, light and good for walking",
      price: 1280000,
      user_id: 1,
      created_at: new Date().toISOString(),
      stock: 11,
      emoji: "👟",
      image: "/products/shoes.jpg",
      images: [
        "/products/shoes.jpg",
        "/products/shoes-side.svg",
        "/products/shoes-top.svg",
      ],
      featured: true,
      variants: [
        { id: 1, size: "40", color: "سفید", stock: 3 },
        { id: 2, size: "41", color: "سفید", stock: 4 },
        { id: 3, size: "42", color: "سفید", stock: 2 },
        { id: 4, size: "41", color: "مشکی", stock: 2 },
      ],
    },
    {
      id: 2,
      title: "کیف چرم دستی",
      title_en: "Leather handbag",
      category: "2",
      body: "کیف چرم طبیعی برای استفاده روزانه",
      body_en: "Natural leather bag for daily use",
      price: 2450000,
      compareAtPrice: 2890000,
      user_id: 1,
      created_at: new Date().toISOString(),
      stock: 3,
      emoji: "👜",
      image: "/products/bag.jpg",
      variants: [
        { id: 1, color: "قهوه‌ای", stock: 2 },
        { id: 2, color: "مشکی", stock: 1 },
      ],
    },
    {
      id: 3,
      title: "تیشرت نخی",
      title_en: "Cotton t-shirt",
      category: "1",
      body: "تیشرت ساده نخی، چند رنگ",
      body_en: "Simple cotton tee in several colors",
      price: 320000,
      compareAtPrice: 420000,
      user_id: 1,
      created_at: new Date().toISOString(),
      stock: 25,
      emoji: "👕",
      image: "/products/tshirt.jpg",
      featured: true,
      variants: [
        { id: 1, size: "S", color: "سفید", stock: 4 },
        { id: 2, size: "M", color: "سفید", stock: 5 },
        { id: 3, size: "L", color: "سفید", stock: 3 },
        { id: 4, size: "S", color: "مشکی", stock: 3 },
        { id: 5, size: "M", color: "مشکی", stock: 5 },
        { id: 6, size: "L", color: "مشکی", stock: 3 },
        { id: 7, size: "M", color: "آبی", stock: 2 },
      ],
    },
    {
      id: 4,
      title: "شلوار جین",
      title_en: "Denim jeans",
      category: "1",
      body: "جین راسته، سایزهای مختلف",
      body_en: "Straight jeans in multiple sizes",
      price: 890000,
      user_id: 1,
      created_at: new Date().toISOString(),
      stock: 8,
      emoji: "👖",
      image: "/products/jeans.jpg",
      variants: [
        { id: 1, size: "30", color: "آبی روشن", stock: 2 },
        { id: 2, size: "32", color: "آبی روشن", stock: 3 },
        { id: 3, size: "34", color: "آبی تیره", stock: 2 },
        { id: 4, size: "36", color: "آبی تیره", stock: 1 },
      ],
    },
    {
      id: 5,
      title: "کلاه کپ",
      title_en: "Cap hat",
      category: "3",
      body: "کلاه نخی تابستانه",
      body_en: "Summer cotton cap",
      price: 180000,
      user_id: 1,
      created_at: new Date().toISOString(),
      stock: 15,
      emoji: "🧢",
      image: "/products/cap.jpg",
      featured: true,
      variants: [
        { id: 1, color: "مشکی", stock: 6 },
        { id: 2, color: "کرم", stock: 5 },
        { id: 3, color: "سبز", stock: 4 },
      ],
    },
    {
      id: 6,
      title: "ساعت مچی",
      title_en: "Wrist watch",
      category: "3",
      body: "ساعت ساده با بند چرم",
      body_en: "Simple watch with a leather strap",
      price: 1750000,
      user_id: 1,
      created_at: new Date().toISOString(),
      stock: 3,
      emoji: "⌚",
      image: "/products/watch.jpg",
    },
    {
      id: 7,
      title: "کوله‌پشتی",
      title_en: "Backpack",
      category: "2",
      body: "کوله روزمره برای لپ‌تاپ",
      body_en: "Everyday backpack for a laptop",
      price: 980000,
      user_id: 1,
      created_at: new Date().toISOString(),
      stock: 6,
      emoji: "🎒",
      image: "/products/backpack.jpg",
      variants: [
        { id: 1, color: "خاکستری", stock: 3 },
        { id: 2, color: "سرمه‌ای", stock: 3 },
      ],
    },
    {
      id: 8,
      title: "لیوان سرامیک",
      title_en: "Ceramic mug set",
      category: "4",
      body: "ست دو تایی لیوان دست‌ساز",
      body_en: "Handmade two-mug set",
      price: 240000,
      user_id: 1,
      created_at: new Date().toISOString(),
      stock: 18,
      emoji: "☕",
      image: "/products/mug.jpg",
    },
    {
      id: 9,
      title: "شال پاییزه",
      title_en: "Autumn scarf",
      category: "1",
      body: "شال نخی سبک — فعلاً تمام شده",
      body_en: "Light cotton scarf — currently sold out",
      price: 290000,
      user_id: 1,
      created_at: new Date().toISOString(),
      stock: 0,
      emoji: "🧣",
      image: "/products/tshirt.jpg",
    },
  ];
}

function daysAgo(days: number, hours = 10) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, 20, 0, 0);
  return date.toISOString();
}

function seedOrders(): Order[] {
  return [
    {
      id: 1048,
      customerName: "نگار احمدی",
      customerPhone: "09123334444",
      items: [
        {
          productId: 1,
          title: "کفش اسپرت سفید",
          emoji: "👟",
          image: "/products/shoes.jpg",
          price: 1280000,
          qty: 1,
          variantId: 2,
          size: "41",
          color: "سفید",
        },
        {
          productId: 5,
          title: "کلاه کپ",
          emoji: "🧢",
          image: "/products/cap.jpg",
          price: 180000,
          qty: 1,
          variantId: 1,
          color: "مشکی",
        },
      ],
      subtotal: 1460000,
      shippingMethodId: 2,
      shippingTitle: "پیک شهری",
      shippingFee: 0,
      total: 1460000,
      status: "pending",
      paymentMethod: "cod",
      note: "اگر کفش سایز ۴۰ تمام شد، ۴۱ بفرستید",
      packingNote: "جعبه کفش جدا، کلاه را داخل نگذار",
      address: {
        label: "خانه",
        recipientName: "نگار احمدی",
        phone: "09123334444",
        province: "تهران",
        city: "تهران",
        street: "ولیعصر، پلاک ۱۲۰",
        postalCode: "141574",
      },
      created_at: daysAgo(0, 9),
    },
    {
      id: 1047,
      customerName: "حسین مرادی",
      customerPhone: "09125556666",
      items: [
        {
          productId: 3,
          title: "تیشرت نخی",
          emoji: "👕",
          image: "/products/tshirt.jpg",
          price: 320000,
          qty: 2,
          variantId: 5,
          size: "M",
          color: "مشکی",
        },
      ],
      subtotal: 640000,
      discount: 64000,
      couponCode: "WELCOME10",
      shippingMethodId: 1,
      shippingTitle: "تحویل حضوری",
      shippingFee: 0,
      total: 576000,
      status: "paid",
      paymentMethod: "online",
      paid_at: daysAgo(0, 14),
      refId: "DEMO-1047",
      created_at: daysAgo(0, 14),
    },
    {
      id: 1046,
      customerName: "سارا محمدی",
      customerPhone: "09127778888",
      items: [
        {
          productId: 4,
          title: "شلوار جین",
          emoji: "👖",
          image: "/products/jeans.jpg",
          price: 890000,
          qty: 1,
          variantId: 2,
          size: "32",
          color: "آبی روشن",
        },
        {
          productId: 3,
          title: "تیشرت نخی",
          emoji: "👕",
          image: "/products/tshirt.jpg",
          price: 320000,
          qty: 1,
          variantId: 2,
          size: "M",
          color: "سفید",
        },
      ],
      subtotal: 1210000,
      shippingMethodId: 3,
      shippingTitle: "پست پیشتاز",
      shippingFee: 0,
      total: 1210000,
      status: "packed",
      paymentMethod: "cod",
      packingNote: "جین را تا نکن؛ تیشرت روی آن",
      address: {
        recipientName: "سارا محمدی",
        phone: "09127778888",
        province: "اصفهان",
        city: "اصفهان",
        street: "چهارباغ عباسی، پلاک ۴۵",
      },
      created_at: daysAgo(1, 16),
    },
    {
      id: 1045,
      customerName: "رضا کاظمی",
      customerPhone: "09120001111",
      items: [
        {
          productId: 2,
          title: "کیف چرم دستی",
          emoji: "👜",
          image: "/products/bag.jpg",
          price: 2450000,
          qty: 1,
          variantId: 1,
          color: "قهوه‌ای",
        },
      ],
      subtotal: 2450000,
      shippingMethodId: 4,
      shippingTitle: "تیپاکس",
      shippingFee: 65000,
      total: 2515000,
      status: "shipped",
      paymentMethod: "cod",
      carrier: "تیپاکس",
      trackingCode: "TIPAX-1045-8821",
      shipped_at: daysAgo(1, 18),
      address: {
        recipientName: "رضا کاظمی",
        phone: "09120001111",
        province: "فارس",
        city: "شیراز",
        street: "زند، کوچه ۷",
      },
      created_at: daysAgo(2, 11),
    },
    {
      id: 1044,
      customerName: "مینا کریمی",
      customerPhone: "09121234567",
      items: [
        {
          productId: 6,
          title: "ساعت مچی",
          emoji: "⌚",
          image: "/products/watch.jpg",
          price: 1750000,
          qty: 1,
        },
      ],
      total: 1750000,
      status: "cancelled",
      paymentMethod: "online",
      note: "مشتری پشیمان شد",
      created_at: daysAgo(3, 18),
    },
    {
      id: 1043,
      customerName: "امیر حسینی",
      customerPhone: "09129876543",
      customerId: 1,
      items: [
        {
          productId: 7,
          title: "کوله‌پشتی",
          emoji: "🎒",
          image: "/products/backpack.jpg",
          price: 980000,
          qty: 1,
          variantId: 2,
          color: "سرمه‌ای",
        },
        {
          productId: 8,
          title: "لیوان سرامیک",
          emoji: "☕",
          image: "/products/mug.jpg",
          price: 240000,
          qty: 2,
        },
      ],
      subtotal: 1460000,
      shippingMethodId: 2,
      shippingTitle: "پیک شهری",
      shippingFee: 0,
      total: 1460000,
      status: "delivered",
      paymentMethod: "cod",
      carrier: "پیک شهری",
      trackingCode: "COURIER-1043",
      shipped_at: daysAgo(3, 15),
      address: {
        label: "خانه",
        recipientName: "امیر حسینی",
        phone: "09129876543",
        province: "تهران",
        city: "تهران",
        street: "نیاوران، خیابان کامرانیه",
      },
      created_at: daysAgo(4, 12),
    },
  ];
}

function seedCustomers(): Customer[] {
  return [
    {
      id: 1,
      name: "امیر حسینی",
      phone: "09129876543",
      created_at: daysAgo(20, 10),
    },
  ];
}

function seedAddresses(): Address[] {
  return [
    {
      id: 1,
      customerId: 1,
      label: "خانه",
      recipientName: "امیر حسینی",
      phone: "09129876543",
      province: "تهران",
      city: "تهران",
      street: "نیاوران، خیابان کامرانیه",
      postalCode: "195574",
      isDefault: true,
    },
  ];
}

function seedNotifications(): OrderNotification[] {
  return [
    {
      id: 1,
      orderId: 1048,
      customerName: "نگار احمدی",
      total: 1460000,
      message: "سفارش جدید ثبت شد",
      created_at: daysAgo(0, 9),
      read: false,
    },
    {
      id: 2,
      orderId: 1047,
      customerName: "حسین مرادی",
      total: 576000,
      message: "پرداخت آنلاین تایید شد",
      created_at: daysAgo(0, 14),
      read: false,
    },
  ];
}

function seedStockAlerts(): StockAlert[] {
  return [
    {
      id: 1,
      productId: 2,
      title: "کیف چرم دستی",
      stock: 3,
      created_at: daysAgo(1, 8),
      read: false,
    },
    {
      id: 2,
      productId: 6,
      title: "ساعت مچی",
      stock: 3,
      created_at: daysAgo(2, 12),
      read: false,
    },
    {
      id: 3,
      productId: 9,
      title: "شال پاییزه",
      stock: 0,
      created_at: daysAgo(0, 15),
      read: false,
    },
  ];
}

function seedReviews(): Review[] {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      productId: 1,
      authorName: "نرگس",
      rating: 5,
      body: "کیفیت خوب بود، سایز هم درست درآمد.",
      created_at: now,
    },
    {
      id: 2,
      productId: 1,
      authorName: "امیر",
      rating: 4,
      body: "راحت بود، فقط کمی دیر رسید.",
      created_at: now,
    },
    {
      id: 3,
      productId: 2,
      authorName: "سارا",
      rating: 5,
      body: "چرمش عالی است.",
      created_at: now,
    },
  ];
}

function seedCoupons(): Coupon[] {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      code: "WELCOME10",
      type: "percent",
      value: 10,
      active: true,
      minOrder: 200000,
      maxUses: 100,
      usedCount: 0,
      created_at: now,
    },
    {
      id: 2,
      code: "SAVE50K",
      type: "fixed",
      value: 50000,
      active: true,
      minOrder: 500000,
      maxUses: 50,
      usedCount: 0,
      created_at: now,
    },
  ];
}

function seedReturns(): ReturnRequest[] {
  return [
    {
      id: 1,
      orderId: 1045,
      customerName: "رضا کاظمی",
      customerPhone: "09120001111",
      reason: "رنگ با عکس فرق داشت، می‌خوام عوض کنم",
      status: "pending",
      amount: 2450000,
      paymentMethod: "cod",
      created_at: daysAgo(0, 14),
    },
  ];
}

export function getUsers(): StoredUser[] {
  ensureSeed();
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  if (users.length === 0) {
    const seeded = seedUsers();
    writeJson(USERS_KEY, seeded);
    return seeded;
  }
  return users;
}

export function saveUsers(users: StoredUser[]) {
  writeJson(USERS_KEY, users);
}

export function getProducts(): Product[] {
  ensureSeed();
  const products = readJson<Product[] | null>(PRODUCTS_KEY, null);
  if (!products || products.length === 0) {
    const seeded = seedProducts();
    writeJson(PRODUCTS_KEY, seeded);
    return seeded;
  }
  return products;
}

function ensureSeed() {
  if (!canUseStorage()) return;
  if (localStorage.getItem(DATA_VERSION_KEY) === DATA_VERSION) return;
  writeJson(PRODUCTS_KEY, seedProducts());
  writeJson(ORDERS_KEY, seedOrders());
  writeJson(REVIEWS_KEY, seedReviews());
  writeJson(STOCK_ALERTS_KEY, seedStockAlerts());
  writeJson(NOTIFICATIONS_KEY, seedNotifications());
  writeJson(COUPONS_KEY, seedCoupons());
  writeJson(CUSTOMERS_KEY, seedCustomers());
  writeJson(ADDRESSES_KEY, seedAddresses());
  writeJson(SHIPPING_KEY, seedShippingMethods());
  writeJson(RETURNS_KEY, seedReturns());
  writeJson(SETTINGS_KEY, defaultShopSettings());
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  if (users.length === 0) writeJson(USERS_KEY, seedUsers());
  localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
}

export function getOrders(): Order[] {
  ensureSeed();
  const orders = readJson<Order[] | null>(ORDERS_KEY, null);
  if (!orders || orders.length === 0) {
    const seeded = seedOrders();
    writeJson(ORDERS_KEY, seeded);
    return seeded;
  }
  return orders;
}

export function saveOrders(orders: Order[]) {
  writeJson(ORDERS_KEY, orders);
}

export function saveProducts(products: Product[]) {
  writeJson(PRODUCTS_KEY, products);
}

export function getReviews(): Review[] {
  ensureSeed();
  const reviews = readJson<Review[] | null>(REVIEWS_KEY, null);
  if (!reviews) {
    const seeded = seedReviews();
    writeJson(REVIEWS_KEY, seeded);
    return seeded;
  }
  return reviews;
}

export function saveReviews(reviews: Review[]) {
  writeJson(REVIEWS_KEY, reviews);
}

export function getStockAlerts(): StockAlert[] {
  ensureSeed();
  return readJson<StockAlert[]>(STOCK_ALERTS_KEY, []);
}

export function saveStockAlerts(alerts: StockAlert[]) {
  writeJson(STOCK_ALERTS_KEY, alerts);
}

/** Create an unread alert when stock crosses into the low range. */
export function recordLowStockAlerts(products: Product[]) {
  const alerts = getStockAlerts();
  let next = [...alerts];
  let changed = false;

  for (const product of products) {
    const stock = productStock(product);
    if (stock > STOCK_ALERT_THRESHOLD) continue;
    const hasOpen = next.some(
      (alert) => alert.productId === product.id && !alert.read,
    );
    if (hasOpen) continue;
    next = [
      {
        id: nextId(next),
        productId: product.id,
        title: product.title,
        stock,
        created_at: new Date().toISOString(),
        read: false,
      },
      ...next,
    ].slice(0, 40);
    changed = true;
  }

  if (changed) saveStockAlerts(next);
}

export function getOrderNotifications(): OrderNotification[] {
  ensureSeed();
  return readJson<OrderNotification[]>(NOTIFICATIONS_KEY, []);
}

export function saveOrderNotifications(items: OrderNotification[]) {
  writeJson(NOTIFICATIONS_KEY, items);
}

export function pushOrderNotification(order: {
  id: number;
  customerName: string;
  total: number;
}) {
  const items = getOrderNotifications();
  const next: OrderNotification = {
    id: nextId(items),
    orderId: order.id,
    customerName: order.customerName,
    total: order.total,
    message: `سفارش جدید #${order.id} از ${order.customerName}`,
    created_at: new Date().toISOString(),
    read: false,
  };
  saveOrderNotifications([next, ...items].slice(0, 50));
  return next;
}

export function getCoupons(): Coupon[] {
  ensureSeed();
  const coupons = readJson<Coupon[] | null>(COUPONS_KEY, null);
  if (!coupons) {
    const seeded = seedCoupons();
    writeJson(COUPONS_KEY, seeded);
    return seeded;
  }
  return coupons;
}

export function saveCoupons(coupons: Coupon[]) {
  writeJson(COUPONS_KEY, coupons);
}

export function getCustomers(): Customer[] {
  ensureSeed();
  return readJson<Customer[]>(CUSTOMERS_KEY, []);
}

export function saveCustomers(customers: Customer[]) {
  writeJson(CUSTOMERS_KEY, customers);
}

export function getAddresses(): Address[] {
  ensureSeed();
  return readJson<Address[]>(ADDRESSES_KEY, []);
}

export function saveAddresses(addresses: Address[]) {
  writeJson(ADDRESSES_KEY, addresses);
}

export function getShippingMethods(): ShippingMethod[] {
  ensureSeed();
  const methods = readJson<ShippingMethod[] | null>(SHIPPING_KEY, null);
  if (!methods || methods.length === 0) {
    const seeded = seedShippingMethods();
    writeJson(SHIPPING_KEY, seeded);
    return seeded;
  }
  return methods;
}

export function saveShippingMethods(methods: ShippingMethod[]) {
  writeJson(SHIPPING_KEY, methods);
}

export function getReturns(): ReturnRequest[] {
  ensureSeed();
  return readJson<ReturnRequest[]>(RETURNS_KEY, []);
}

export function saveReturns(items: ReturnRequest[]) {
  writeJson(RETURNS_KEY, items);
}

export function getShopSettings(): ShopSettings {
  ensureSeed();
  const settings = readJson<ShopSettings | null>(SETTINGS_KEY, null);
  if (!settings || !settings.name?.trim()) {
    const seeded = defaultShopSettings();
    writeJson(SETTINGS_KEY, seeded);
    return seeded;
  }
  return settings;
}

export function saveShopSettings(settings: ShopSettings) {
  writeJson(SETTINGS_KEY, settings);
}

export function getCustomerSession(): CustomerSession | null {
  return readJson<CustomerSession | null>(CUSTOMER_SESSION_KEY, null);
}

export function saveCustomerSession(session: CustomerSession) {
  writeJson(CUSTOMER_SESSION_KEY, session);
}

export function clearCustomerSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

export function getCustomerPendingOtp(): PendingOtp | null {
  return readJson<PendingOtp | null>(CUSTOMER_OTP_KEY, null);
}

export function saveCustomerPendingOtp(otp: PendingOtp) {
  writeJson(CUSTOMER_OTP_KEY, otp);
}

export function clearCustomerPendingOtp() {
  if (!canUseStorage()) return;
  localStorage.removeItem(CUSTOMER_OTP_KEY);
}

export function saveCustomerOtpHint(code: string) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(CUSTOMER_OTP_HINT_KEY, code);
}

export function readCustomerOtpHint() {
  if (!canUseStorage()) return null;
  return sessionStorage.getItem(CUSTOMER_OTP_HINT_KEY);
}

export function clearCustomerOtpHint() {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(CUSTOMER_OTP_HINT_KEY);
}

export function getSession(): Session | null {
  return readJson<Session | null>(SESSION_KEY, null);
}

export function saveSession(session: Session) {
  writeJson(SESSION_KEY, session);
}

export function clearSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(SESSION_KEY);
}

export function getPendingOtp(): PendingOtp | null {
  return readJson<PendingOtp | null>(OTP_KEY, null);
}

export function savePendingOtp(otp: PendingOtp) {
  writeJson(OTP_KEY, otp);
}

export function clearPendingOtp() {
  if (!canUseStorage()) return;
  localStorage.removeItem(OTP_KEY);
}

export function saveOtpHint(code: string) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(OTP_HINT_KEY, code);
}

export function readOtpHint() {
  if (!canUseStorage()) return null;
  return sessionStorage.getItem(OTP_HINT_KEY);
}

export function clearOtpHint() {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(OTP_HINT_KEY);
}

export function nextId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function randomToken() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function publicUser(user: StoredUser): UserType {
  return {
    id: user.id,
    name: user.name,
    permissions: user.permissions,
  };
}
