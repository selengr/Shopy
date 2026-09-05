"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import Logo from "@/components/landing/logo";
import useAuth from "@/hooks/useAuth";
import useLogout from "@/hooks/useLogout";
import User from "@/models/user";
import { GetNotifications } from "@/services/notification";

const links = [
  { href: "/panel", label: "خلاصه", exact: true },
  { href: "/panel/analytics", label: "آمار", exact: false },
  { href: "/panel/coupons", label: "تخفیف", exact: false },
  { href: "/panel/shipping", label: "ارسال", exact: false },
  { href: "/panel/returns", label: "مرجوعی", exact: false },
  { href: "/panel/waitlist", label: "انتظار", exact: false },
  { href: "/panel/orders", label: "سفارش‌ها", exact: false },
  { href: "/panel/products", label: "محصولات", exact: false },
  { href: "/panel/notifications", label: "اعلان‌ها", exact: false },
  { href: "/panel/settings", label: "تنظیمات", exact: false },
];

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const logout = useLogout();
  const access = new User(user);
  const { data: notifications } = useSWR("notifications", GetNotifications, {
    refreshInterval: 8000,
  });
  const unread = (notifications ?? []).filter((item) => !item.read).length;

  return (
    <div className="min-h-screen bg-[#f4efe6] font-sans text-[#14110e]">
      <header className="print:hidden sticky top-0 z-20 border-b border-[#14110e]/8 bg-[#f4efe6]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Logo />
          <nav className="flex items-center gap-1 overflow-x-auto text-[0.92rem]">
            {links.map((link) => {
              const active = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
              const isNotify = link.href === "/panel/notifications";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 whitespace-nowrap ${
                    active
                      ? "bg-[#1f4a45] font-medium text-white"
                      : "text-[#3f3a33] hover:bg-white/80"
                  }`}
                >
                  {link.label}
                  {isNotify && unread > 0 && (
                    <span
                      className={`mr-1.5 rounded-full px-1.5 text-xs ${
                        active ? "bg-white/20" : "bg-[#1f4a45]/15 text-[#1f4a45]"
                      }`}
                    >
                      {unread.toLocaleString("fa-IR")}
                    </span>
                  )}
                </Link>
              );
            })}
            {access.canAccess("manage_products") && (
              <Link
                href="/admin/products"
                className="rounded-full px-3 py-1.5 whitespace-nowrap text-[#3f3a33] hover:bg-white/80"
              >
                مدیریت
              </Link>
            )}
            <button
              type="button"
              onClick={() => logout("/")}
              className="rounded-full bg-[#1f4a45] px-3 py-1.5 font-medium text-white"
            >
              خروج
            </button>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 print:max-w-none print:px-0 print:py-0">{children}</div>
    </div>
  );
}
