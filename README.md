# Shopy

**Persian RTL commerce stack for small shops** — seller panel + public storefront in one Next.js app.

Phone OTP auth, catalog and inventory, orders through delivery, guest checkout, and optional live SMS / Zarinpal. Default demo mode runs entirely in the browser (`localStorage` mock API) so you can explore without a backend.

[Live idea](https://github.com/selengr/Shopy) · Stack: **Next.js 16 · React 19 · TypeScript · Tailwind 4 · Redux Toolkit · SWR**

---

## Highlights

| Area | What you get |
| --- | --- |
| **Auth** | Iranian mobile OTP (local hint or [Kavenegar](https://kavenegar.com)); seller roles (admin / staff) |
| **Seller panel** | Products, variants, galleries, archive, coupons, shipping, returns, waitlist, customers, review moderation, analytics, notifications, packing slips, invoices |
| **Storefront** | Browse / search / sort / filters, FA↔EN catalog, cart, wishlist, COD + online pay, order tracking, accounts, about & contact |
| **Ops** | Stock alerts, shipment tracking codes, sale prices, featured products, SEO (`robots`, `sitemap`, OG) |

Built as a portfolio-grade end-to-end demo of shop workflows — not a production SaaS backend.

---

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

| Role | Phone | Notes |
| --- | --- | --- |
| Admin seller | `09121111111` | OTP shown on screen in local mode |
| Staff | `09122222222` | No admin permissions |
| Seeded buyer | `09129876543` | `/shop/account` |

Public shop: `/shop` · Seller panel: `/panel` (after login)

> After pulling, hard-refresh once if mock data looks stale — bumping the local data version reseeds the demo DB.

---

## Demo walkthrough

1. **Shop** — `/shop`: featured products, sneakers gallery, sale prices on تیشرت / کیف, sold-out «شال پاییزه» (waitlist), archived ساعت مچی hidden from catalog.
2. **Checkout** — add to cart (variants open PDP). Coupons `WELCOME10` / `SAVE50K`. Optional note for the seller. COD → receipt; track with the same phone or sample **1048** / `09123334444`.
3. **Seller** — login `09121111111` → `/panel`: ship with tracking code, `/panel/waitlist`, `/panel/customers`, `/panel/reviews`.
4. **Buyer account** — `/shop/account` as `09129876543`: cancel pending **1049**; track **1045** / `09120001111` (Tipax); return on shipped **1045**.

---

## Configuration

Copy `.env.example` → `.env.local`. Important flags:

```bash
NEXT_PUBLIC_LOCAL_AUTH=true          # browser mock API (demo)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PAYMENT_DRIVER=local     # or zarinpal
SMS_PROVIDER=local                   # or kavenegar
```

### Optional: Kavenegar SMS

```bash
SMS_PROVIDER=kavenegar
KAVENEGAR_API_KEY=your-key
KAVENEGAR_SENDER=10008663
NEXT_PUBLIC_SHOW_OTP_HINT=false
```

### Optional: Zarinpal

```bash
NEXT_PUBLIC_PAYMENT_DRIVER=zarinpal
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=true
NEXT_PUBLIC_APP_URL=https://your-public-host
```

Callback path: `/shop/pay/callback`. Use a tunnel if the phone cannot reach localhost.

### Real API later

```bash
NEXT_PUBLIC_LOCAL_AUTH=false
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Deploy

1. Set `NEXT_PUBLIC_APP_URL` to the public origin (**no** trailing slash) — required for sitemap, Open Graph, and payment return URLs.
2. Keep `NEXT_PUBLIC_LOCAL_AUTH=true` for the mock demo, or point `NEXT_PUBLIC_API_URL` at your API.
3. Smoke-test on mobile; panel nav collapses under `xl`.

```bash
npm run build
npm start
```

---

## Project notes

- **UI** — RTL Persian, Estedad / IBM Plex Sans Arabic, cream + teal brand system.
- **Architecture** — App Router under `src/`; local mock lives in `helpers/localDb.ts` + `helpers/localApi.ts` when `NEXT_PUBLIC_LOCAL_AUTH=true`.
- **Scope** — Full commerce walkthrough for demos and interviews. Image CDN and a dedicated backend are intentional follow-ons, not blockers for evaluating the product surface.

---

## License

Private / portfolio project unless otherwise stated.
