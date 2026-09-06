# Shopy

A small-shop admin panel and a simple online store in one project.

You log in with an Iranian phone number, manage products and orders, and customers can buy from `/shop` without calling you.

I started this around 2022 on Next.js 12. Later I moved it to Next 16, React 19, and Tailwind 4. Same idea, newer tools.

## What it does

- login with phone + code (local demo code, or Kavenegar SMS if you set a key)
- seller panel for products, stock, and orders
- roles: admin can manage people; staff has fewer powers
- public shop: browse, search, cart, checkout
- payments: cash on delivery, fake in-app pay, or Zarinpal if you configure it
- order tracking with order id + phone (`/shop/track`)
- reviews, wishlist, coupons, shipping methods, returns
- variants (size / color), sale prices, photo galleries
- waitlist when something is sold out
- customers list and review moderation in the panel
- about and contact pages
- basic SEO (robots, sitemap, 404)

By default it needs no backend. Set `NEXT_PUBLIC_LOCAL_AUTH=true`, sign in as `09121111111`, copy the code from the screen, and you’re in.

### Try it quickly

1. Open `/shop`. Featured items show first. Sneakers have a few photos. Some items are on sale. «شال پاییزه» is sold out (you can join the waitlist). ساعت مچی is archived and hidden from the shop.
2. Add something to the cart. Try coupon `WELCOME10` or `SAVE50K`.
3. Checkout with cash on delivery. Track the order with the same phone, or sample **1048** / `09123334444`.
4. Seller login: `09121111111` → `/panel`. Ship an order (you can add a tracking code). Check waitlist, customers, and reviews.
5. Buyer account: `/shop/account` with `09129876543`. You can cancel pending order **1049**. Track **1045** / `09120001111` for a Tipax code. Returns use order **1045**.
6. Staff account (less access): `09122222222`.

If seeded data looks old after a pull, hard-refresh the browser once. That clears the local demo database when the version changes.

### Optional SMS (Kavenegar)

```
SMS_PROVIDER=kavenegar
KAVENEGAR_API_KEY=your-key
KAVENEGAR_SENDER=10008663
NEXT_PUBLIC_SHOW_OTP_HINT=false
```

### Optional payments (Zarinpal)

```
NEXT_PUBLIC_PAYMENT_DRIVER=zarinpal
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Callback is `/shop/pay/callback`. If your phone can’t reach localhost, use a tunnel and set `NEXT_PUBLIC_APP_URL` to that URL.

To point at a real API later:

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

Then open http://localhost:3000 in your browser.

## Deploy

Set `NEXT_PUBLIC_APP_URL` to your real site URL (no slash at the end). Sitemap, link previews, and payment return URLs need it.

Keep `NEXT_PUBLIC_LOCAL_AUTH=true` for the browser demo. For a real backend, turn it off and set `NEXT_PUBLIC_API_URL`.

```bash
npm run build
npm start
```

## Note

This is a full demo of a small shop — good for trying flows and showing the product. It’s not meant as a finished production backend. SMS and Zarinpal are optional when you have keys. A real image CDN can come later if the catalog gets big.
