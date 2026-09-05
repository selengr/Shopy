import type ShopSettings from "@/models/shopSettings";

export function defaultShopSettings(): ShopSettings {
  return {
    name: "Shopy",
    tagline: "فروشگاه کوچک، سفارش آنلاین",
    about:
      "ما یک فروشگاه جمع‌وجوریم؛ محصول‌ها را با حوصله انتخاب می‌کنیم، موجودی را واقعی نگه می‌داریم و سفارش را تا درِ خانه پیگیری می‌کنیم. از ویترین تا ارسال، همه‌چیز شفاف است.",
    phone: "02191000000",
    instagram: "shopy.shop",
    address: "تهران",
    invoiceFooter: "از خریدت ممنونیم. سوالی داشتی با همین شماره تماس بگیر.",
  };
}

export function shopInitial(settings?: ShopSettings | null) {
  const name = settings?.name?.trim() || "Shopy";
  return name.charAt(0) || "ش";
}
