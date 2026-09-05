import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/shop",
        "/shop/about",
        "/shop/contact",
        "/shop/track",
        "/shop/wishlist",
      ],
      disallow: [
        "/admin",
        "/panel",
        "/auth",
        "/test",
        "/api",
        "/shop/pay",
        "/shop/gateway",
        "/shop/account",
        "/shop/orders",
      ],
    },
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
  };
}
