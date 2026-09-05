# Shopy

Small-shop admin panel. You log in with an Iranian phone number, manage products and orders, and there's a public storefront at `/shop` if you want customers to buy without calling you.

I started this around 2022 on Next.js 12, left it alone for a long time, then dragged it onto Next 16 / React 19 / Tailwind 4. Same idea, less ancient tooling.

## What it does

- phone login (local OTP hint, or Kavenegar if you wire SMS)
- seller panel for catalog, stock, orders, invoices
- roles so an admin can manage products and people
- public shop: browse, search, cart, guest checkout, order receipt
- payments: cash on delivery, a fake in-app gateway, or Zarinpal sandbox / live
- customers can track an order with the order id + phone (`/shop/track`)
- reviews on product pages, plus related products by category
- stock alerts when something drops to 5 or below
- wishlist on the shop (stays on that browser)
- simple analytics (`/panel/analytics`) and order notifications (`/panel/notifications`)
- FA/EN toggle on the shop catalog
- discount codes (`/panel/coupons` — try `WELCOME10`)
- customer accounts at `/shop/account` (separate from seller login)
- shipping methods (`/panel/shipping`) plus an address book on checkout / account
- size / color variants on products (pick them on the product page; edit in admin)
- returns / refunds (`/panel/returns`, request from `/shop/account` on shipped/delivered orders)
- packing slips with seller packing notes (`/panel/orders/[id]/packing`)
- shop settings (`/panel/settings`) — name, contact, invoice footer
- featured products — mark them in admin; they show up as «پیشنهادها» on `/shop`
- sale / compare-at prices on products (strikethrough «قبل» price in the shop)
- about / contact pages from shop settings
- order lifecycle through delivered; SEO basics (`robots`, `sitemap`, 404)
- shipment tracking codes when the seller marks an order as shipped
- product photo galleries (up to 6 images; first is the cover)
- customers can cancel pending / paid orders from `/shop/account`
- shop catalog sort (newest / price / rating) plus in-stock and on-sale filters

Default mode needs no backend: `NEXT_PUBLIC_LOCAL_AUTH=true`. Sign in as `09121111111`, grab the code from the toast / next screen (it stays up a bit longer so you can copy it), and you're in. Shop is `/shop`.

### Quick demo walk

1. Open `/shop` — featured section, then browse. Open the white sneakers for a 3-photo gallery. تیشرت and کیف have sale prices. «شال پاییزه» is sold out on purpose.
2. Add something to the cart (variant products open the product page). Try coupon `WELCOME10` or `SAVE50K`. Optional checkout note goes to the seller.
3. Checkout COD → you land on an order receipt. Track with the same phone, or try sample **1048** / `09123334444`.
4. Seller: `/auth/login` as `09121111111`, then `/panel` for orders / analytics / notifications. Move a packed order to shipped (add a tracking code) → delivered.
5. Customer account: `/shop/account` with e.g. `09129876543` (seeded buyer). Try cancelling pending order **1049**. Track **1045** / `09120001111` for a Tipax code. Returns: order **1045** is shipped and has a pending return in `/panel/returns`.
6. Staff without admin powers: `09122222222`.

Hard refresh once after pulling if seeded data looks old (local data version bumps wipe the mock DB).

### Optional: Kavenegar

```
SMS_PROVIDER=kavenegar
KAVENEGAR_API_KEY=your-key
KAVENEGAR_SENDER=10008663
NEXT_PUBLIC_SHOW_OTP_HINT=false
```

### Optional: Zarinpal

```
NEXT_PUBLIC_PAYMENT_DRIVER=zarinpal
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Sandbox merchant is fine for local tries. Callback hits `/shop/pay/callback`. If your phone can't reach localhost, tunnel it and point `NEXT_PUBLIC_APP_URL` at that URL.

When you eventually plug a real API in:

```
NEXT_PUBLIC_LOCAL_AUTH=false
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Deploy

Set `NEXT_PUBLIC_APP_URL` to your real public URL (no trailing slash). Sitemap, Open Graph, and Zarinpal callbacks use it — leaving the localhost default breaks those on a live host.

Also keep `NEXT_PUBLIC_LOCAL_AUTH=true` for the browser mock API demo. For a real backend, flip it off and point `NEXT_PUBLIC_API_URL` at your API.

```bash
npm run build
npm start
```

## Later

A hosted image CDN would help for large catalogs. Local multi-upload + data URLs / paths cover the demo for now.
