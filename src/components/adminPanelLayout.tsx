"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Bars3BottomLeftIcon, BellIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import useAuth from "@/hooks/useAuth";
import SidebarLayout from "@/components/admin/layouts/sidebarLayout";
import User from "@/models/user";
import useLogout from "@/hooks/useLogout";
import { classNames } from "@/helpers/classNames";

interface Props {
  children: ReactNode;
  permissions?: string;
}

export default function AdminPanelLayout({ children, permissions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: userData, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const user = new User(userData);
  const logout = useLogout();

  useEffect(() => {
    if (!loading && !userData) {
      router.replace("/auth/login");
    }
  }, [loading, router, userData]);

  useEffect(() => {
    if (
      !loading &&
      permissions &&
      userData &&
      !new User(userData).canAccess(permissions)
    ) {
      router.replace("/admin");
    }
  }, [loading, permissions, router, userData]);

  const logoutHandler = async () => {
    await logout();
  };

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (pathname.startsWith("/admin/orders")) {
      router.push(`/admin/orders?q=${encodeURIComponent(q)}`);
      return;
    }
    router.push(`/admin/products?q=${encodeURIComponent(q)}&page=1`);
  };

  if (loading) {
    return (
      <div className="p-8 text-sm text-[#6b6459]">در حال بررسی ورود...</div>
    );
  }
  if (!userData) {
    return <div className="p-8 text-sm text-[#6b6459]">در حال انتقال...</div>;
  }
  if (permissions && !user.canAccess(permissions)) {
    return (
      <div className="p-8 text-sm text-[#6b6459]">در حال بررسی دسترسی...</div>
    );
  }

  return (
    <div>
      <SidebarLayout open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex flex-col md:pr-64">
        <div className="sticky top-0 z-10 flex h-16 shrink-0 bg-white shadow">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:ring-inset md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              <form className="flex w-full md:ml-0" onSubmit={onSearch}>
                <label htmlFor="search-field" className="sr-only">
                  Search
                </label>
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                    <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <input
                    id="search-field"
                    className="block h-full w-full border-transparent py-2 pr-8 pl-3 text-gray-900 placeholder-gray-500 focus:border-transparent focus:placeholder-gray-400 focus:ring-0 focus:outline-none sm:text-sm"
                    placeholder={
                      pathname.startsWith("/admin/orders")
                        ? "جستجوی سفارش (نام / موبایل / شماره)"
                        : "جستجوی محصول"
                    }
                    type="search"
                    name="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <Link
                href="/panel/notifications"
                className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </Link>

              <Menu as="div" className="relative ml-3">
                <MenuButton className="flex max-w-xs items-center rounded-full bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none">
                  <span className="sr-only">Open user menu</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                    {user.name?.slice(0, 1) ?? "S"}
                  </span>
                </MenuButton>
                <MenuItems className="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                  <MenuItem>
                    <a
                      href="/panel"
                      className={classNames(
                        "block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100",
                      )}
                    >
                      پروفایل
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <button
                      type="button"
                      onClick={logoutHandler}
                      className="block w-full px-4 py-2 text-right text-sm text-gray-700 data-focus:bg-gray-100"
                    >
                      خروج
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
