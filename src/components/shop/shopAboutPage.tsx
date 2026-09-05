"use client";

import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { motion } from "motion/react";
import ShopShell from "@/components/shop/shopShell";
import LoadingBox from "@/components/shared/loadingBox";
import { GetShopSettingsPublic } from "@/services/settings";
import { defaultShopSettings } from "@/helpers/shopSettings";

const STORY = [
  {
    title: "انتخاب با حوصله",
    body: "هر محصول را قبل از گذاشتن در ویترین می‌بینیم و موجودی واقعی می‌گذاریم.",
  },
  {
    title: "سفارش شفاف",
    body: "از ثبت تا ارسال می‌توانی وضعیت را با شماره سفارش پیگیری کنی.",
  },
  {
    title: "پاسخ‌گو",
    body: "سوال داشتی؟ تماس، اینستاگرام یا صفحه تماس — هر طور راحت‌تری.",
  },
];

const STRIP = [
  { src: "/products/shoes.jpg", alt: "کفش" },
  { src: "/products/bag.jpg", alt: "کیف" },
  { src: "/products/tshirt.jpg", alt: "تیشرت" },
  { src: "/products/cap.jpg", alt: "کلاه" },
];

export default function ShopAboutPage() {
  const { data: settings, isLoading } = useSWR(
    "shop/settings",
    GetShopSettingsPublic,
    { revalidateOnFocus: false },
  );

  const shop = { ...defaultShopSettings(), ...(settings ?? {}) };
  const aboutText =
    shop.about?.trim() ||
    defaultShopSettings().about ||
    "فروشگاه کوچک با سفارش آنلاین.";

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
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(31,74,69,0.28), transparent 55%), radial-gradient(ellipse 45% 40% at 100% 80%, rgba(196,92,62,0.14), transparent 50%), linear-gradient(180deg, #1f4a45 0%, #243f3b 42%, #f4efe6 42%, #f4efe6 100%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-10 sm:px-8 sm:pt-24 sm:pb-14">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-6xl font-bold tracking-tight text-[#f4efe6] sm:text-7xl lg:text-8xl"
          >
            {shop.name}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-display mt-5 max-w-xl text-2xl font-semibold text-[#f4efe6]/95 sm:text-3xl"
          >
            {shop.tagline || "فروشگاه کوچک، سفارش آنلاین"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-5 max-w-lg text-base leading-8 text-[#f4efe6]/75"
          >
            {aboutText}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link
              href="/shop"
              className="rounded-full bg-[#f4efe6] px-6 py-3 text-sm font-medium text-[#1f4a45] transition hover:-translate-y-0.5"
            >
              دیدن محصولات
            </Link>
            <Link
              href="/shop/contact"
              className="rounded-full px-6 py-3 text-sm text-[#f4efe6] ring-1 ring-white/35 transition hover:bg-white/10"
            >
              تماس با ما
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative grid h-[220px] grid-cols-2 sm:h-[280px] sm:grid-cols-4"
        >
          {STRIP.map((image) => (
            <div key={image.src} className="relative">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
                priority
              />
            </div>
          ))}
        </motion.div>
      </section>

      <section className="bg-[#f4efe6]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-sm text-[#1f4a45]">چطور کار می‌کنیم</p>
          <h2 className="font-display mt-2 text-3xl font-semibold">
            سه‌تا اصل ساده
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {STORY.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.08 }}
              >
                <p className="font-display text-4xl font-semibold text-[#1f4a45]/25">
                  {(index + 1).toLocaleString("fa-IR")}
                </p>
                <h3 className="font-display mt-3 text-xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#5c564d]">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#14110e] text-[#f4efe6]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-16">
          <div>
            <p className="font-display text-3xl font-semibold sm:text-4xl">
              آماده‌ای بگردی؟
            </p>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/65">
              ویترین باز است. اگر سفارشی داری، از پیگیری سفارش وضعیتش را ببین.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-[#f4efe6] px-5 py-2.5 text-sm font-medium text-[#14110e] transition hover:-translate-y-0.5"
            >
              فروشگاه
            </Link>
            <Link
              href="/shop/track"
              className="rounded-full px-5 py-2.5 text-sm ring-1 ring-white/25 transition hover:bg-white/10"
            >
              پیگیری سفارش
            </Link>
          </div>
        </div>
      </section>
    </ShopShell>
  );
}
