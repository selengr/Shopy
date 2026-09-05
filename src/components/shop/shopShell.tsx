"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Logo from "@/components/landing/logo";
import { GetShopSettingsPublic } from "@/services/settings";
import {
  readLocale,
  subscribeLocale,
  writeLocale,
  type ShopLocale,
} from "@/helpers/locale";

export default function ShopShell({
  children,
  cartCount = 0,
  wishCount = 0,
  flush = false,
}: {
  children: React.ReactNode;
  cartCount?: number;
  wishCount?: number;
  /** Full-bleed pages (about / contact heroes) skip the content max-width wrapper */
  flush?: boolean;
}) {
  const locale = useSyncExternalStore(subscribeLocale, readLocale, () => "fa" as ShopLocale);
  const fa = locale === "fa";
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: settings } = useSWR("shop/settings", GetShopSettingsPublic, {
    revalidateOnFocus: false,
  });

  const links = [
    {
      href: "/shop",
      label: fa ? "فروشگاه" : "Shop",
      primary: true,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      href: "/shop/wishlist",
      label: fa ? "علاقه‌مندی" : "Wishlist",
      badge: wishCount > 0 ? wishCount : undefined,
    },
    { href: "/shop/about", label: fa ? "درباره" : "About" },
    { href: "/shop/track", label: fa ? "پیگیری" : "Track" },
    { href: "/shop/account", label: fa ? "حساب" : "Account" },
    { href: "/shop/contact", label: fa ? "تماس" : "Contact" },
    { href: "/panel", label: fa ? "پنل" : "Panel" },
  ];

  const localeButton = (
    <button
      type="button"
      onClick={() => writeLocale(fa ? "en" : "fa")}
      className="rounded-full px-3 py-1.5 text-[#3f3a33] ring-1 ring-[#14110e]/15"
      aria-label="Toggle language"
    >
      {fa ? "EN" : "FA"}
    </button>
  );

  const linkClass = (primary?: boolean) =>
    primary
      ? "rounded-full bg-[#1f4a45] px-3 py-1.5 font-medium text-white"
      : "rounded-full px-3 py-1.5 text-[#3f3a33] hover:bg-white/80";

  return (
    <div className="min-h-screen bg-[#f4efe6] font-sans text-[#14110e]" dir={fa ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-20 border-b border-[#14110e]/8 bg-[#f4efe6]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="min-w-0">
            <Logo />
            {settings?.tagline && (
              <p className="mt-0.5 hidden truncate text-xs text-[#6b6459] sm:block">
                {settings.tagline}
              </p>
            )}
          </div>

          <nav className="hidden items-center gap-2 text-[0.92rem] lg:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.primary)}>
                {link.label}
                {link.badge != null && (
                  <span
                    className={`mx-1.5 ${
                      link.primary
                        ? "rounded-full bg-white/20 px-1.5"
                        : "text-[#1f4a45]"
                    }`}
                  >
                    {link.badge.toLocaleString(fa ? "fa-IR" : "en-US")}
                  </span>
                )}
              </Link>
            ))}
            {localeButton}
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/shop"
              className="rounded-full bg-[#1f4a45] px-3 py-1.5 text-sm font-medium text-white"
            >
              {fa ? "فروشگاه" : "Shop"}
              {cartCount > 0 && (
                <span className="mx-1 rounded-full bg-white/20 px-1.5 text-xs">
                  {cartCount.toLocaleString(fa ? "fa-IR" : "en-US")}
                </span>
              )}
            </Link>
            {localeButton}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-full p-2 text-[#3f3a33] ring-1 ring-[#14110e]/15"
              aria-expanded={menuOpen}
              aria-label={fa ? "منو" : "Menu"}
            >
              {menuOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-[#14110e]/8 px-5 py-3 lg:hidden sm:px-8">
            <div className="flex flex-col gap-1 text-sm">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-[#3f3a33] hover:bg-white/80"
                >
                  <span>{link.label}</span>
                  {link.badge != null && (
                    <span className="text-[#1f4a45]">
                      {link.badge.toLocaleString(fa ? "fa-IR" : "en-US")}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      <div
        className={
          flush ? "" : "mx-auto max-w-6xl px-5 py-8 sm:px-8"
        }
      >
        {children}
      </div>
      <footer className="border-t border-[#14110e]/8 px-5 py-6 text-center text-xs text-[#6b6459] sm:px-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/shop/about" className="hover:text-[#1f4a45]">
            {fa ? "درباره" : "About"}
          </Link>
          <Link href="/shop/contact" className="hover:text-[#1f4a45]">
            {fa ? "تماس" : "Contact"}
          </Link>
          <Link href="/shop/track" className="hover:text-[#1f4a45]">
            {fa ? "پیگیری" : "Track"}
          </Link>
        </div>
        {(settings?.phone || settings?.instagram || settings?.address) && (
          <p className="mt-3">
            {[
              settings.phone,
              settings.instagram ? `@${settings.instagram}` : "",
              settings.address,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </footer>
    </div>
  );
}
