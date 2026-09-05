"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Logo from "@/components/landing/logo";

const links = [
  { href: "/shop", label: "فروشگاه" },
  { href: "#about", label: "درباره" },
  { href: "/shop/contact", label: "تماس" },
  { href: "#features", label: "امکانات" },
];

export default function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b backdrop-blur-md transition-all ${
        scrolled
          ? "border-[#14110e]/10 bg-[#f4efe6]/92 py-0 shadow-[0_8px_30px_-18px_rgba(20,17,14,0.35)]"
          : "border-transparent bg-[#f4efe6]/70"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 text-[0.92rem] text-[#3f3a33] md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative py-1 after:absolute after:right-0 after:bottom-0 after:h-px after:w-0 after:bg-[#1f4a45] after:transition-all hover:text-[#14110e] hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/auth/login"
            className="rounded-full px-4 py-2 text-sm text-[#3f3a33] transition hover:bg-[#14110e]/5"
          >
            ورود
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white transition hover:bg-[#173833] hover:shadow-lg hover:shadow-[#1f4a45]/20"
          >
            ساخت حساب
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-[#14110e] md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "بستن منو" : "باز کردن منو"}
        >
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#14110e]/8 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-1 text-[#3f3a33]"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/auth/login" className="pt-2 text-[#3f3a33]">
              ورود
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full bg-[#1f4a45] px-4 py-2 text-center text-white"
            >
              ساخت حساب
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
