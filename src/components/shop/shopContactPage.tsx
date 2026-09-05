"use client";

import Link from "next/link";
import useSWR from "swr";
import { motion } from "motion/react";
import ShopShell from "@/components/shop/shopShell";
import LoadingBox from "@/components/shared/loadingBox";
import { GetShopSettingsPublic } from "@/services/settings";
import { defaultShopSettings } from "@/helpers/shopSettings";

export default function ShopContactPage() {
  const { data: settings, isLoading } = useSWR(
    "shop/settings",
    GetShopSettingsPublic,
    { revalidateOnFocus: false },
  );

  const shop = { ...defaultShopSettings(), ...(settings ?? {}) };
  const hasContact = Boolean(shop.phone || shop.instagram || shop.address);

  if (isLoading && !settings) {
    return (
      <ShopShell>
        <div className="py-16">
          <LoadingBox />
        </div>
      </ShopShell>
    );
  }

  return (
    <ShopShell flush>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 80% 0%, rgba(244,239,230,0.18), transparent 50%), linear-gradient(165deg, #1f4a45 0%, #1a3d39 55%, #f4efe6 55%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-24 sm:px-8 sm:pt-24 sm:pb-32">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-[#f4efe6]/70"
          >
            {shop.name}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="font-display mt-3 text-5xl font-bold tracking-tight text-[#f4efe6] sm:text-6xl"
          >
            تماس
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-4 max-w-md text-base leading-8 text-[#f4efe6]/75"
          >
            سفارش عمده، سوال ارسال، یا هر چیز دیگر — از همین راه‌ها به ما برس.
          </motion.p>
        </div>
      </section>

      <section className="-mt-16 bg-[#f4efe6] pb-16 sm:pb-20">
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid gap-0 overflow-hidden border border-[#14110e]/10 bg-white/90 shadow-[0_24px_60px_-36px_rgba(20,17,14,0.45)] sm:grid-cols-3"
          >
            {shop.phone ? (
              <a
                href={`tel:${shop.phone}`}
                className="block border-b border-[#14110e]/8 px-6 py-8 transition hover:bg-[#1f4a45]/[0.04] sm:border-b-0 sm:border-l sm:border-[#14110e]/8"
              >
                <p className="text-xs text-[#6b6459]">تلفن</p>
                <p className="font-display mt-3 text-2xl font-semibold" dir="ltr">
                  {shop.phone}
                </p>
                <p className="mt-2 text-sm text-[#1f4a45]">تماس بگیر →</p>
              </a>
            ) : null}
            {shop.instagram ? (
              <div className="border-b border-[#14110e]/8 px-6 py-8 sm:border-b-0 sm:border-l sm:border-[#14110e]/8">
                <p className="text-xs text-[#6b6459]">اینستاگرام</p>
                <p className="font-display mt-3 text-2xl font-semibold" dir="ltr">
                  @{shop.instagram}
                </p>
                <p className="mt-2 text-sm text-[#5c564d]">دایرکت خوش‌آمد</p>
              </div>
            ) : null}
            {shop.address ? (
              <div className="px-6 py-8">
                <p className="text-xs text-[#6b6459]">آدرس</p>
                <p className="font-display mt-3 text-2xl font-semibold leading-snug">
                  {shop.address}
                </p>
              </div>
            ) : null}
            {!hasContact && (
              <p className="col-span-full px-6 py-10 text-sm text-[#6b6459]">
                هنوز اطلاعات تماس در تنظیمات فروشگاه پر نشده.
              </p>
            )}
          </motion.div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href="/shop/track"
              className="rounded-full bg-[#1f4a45] px-5 py-2.5 text-sm text-white transition hover:-translate-y-0.5 hover:bg-[#173833]"
            >
              پیگیری سفارش
            </Link>
            <Link
              href="/shop"
              className="rounded-full px-5 py-2.5 text-sm ring-1 ring-[#14110e]/15 transition hover:bg-white"
            >
              بازگشت به فروشگاه
            </Link>
          </div>
        </div>
      </section>
    </ShopShell>
  );
}
