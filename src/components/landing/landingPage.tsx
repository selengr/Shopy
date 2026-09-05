"use client";

import { useRef } from "react";
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import DashboardPreview from "@/components/landing/dashboardPreview";
import LandingHeader from "@/components/landing/header";
import Logo from "@/components/landing/logo";
import PhoneDemo from "@/components/landing/phoneDemo";

const features = [
  {
    icon: DevicePhoneMobileIcon,
    title: "ورود با موبایل",
    body: "شماره می‌دهی، کد می‌آید. لازم نیست رمز جدا حفظ کنی.",
  },
  {
    icon: CubeIcon,
    title: "فروشگاه عمومی",
    body: "ویترین، سبد، تخفیف، گالری، لیست انتظار ناموجود و پیگیری سفارش.",
  },
  {
    icon: ClipboardDocumentListIcon,
    title: "پنل فروشنده",
    body: "سفارش، مشتری‌ها، نظرات، مرجوعی، هشدار موجودی و آمار هفت‌روزه.",
  },
];

const steps = [
  { n: "۱", title: "حساب", body: "اسم و شماره. یک دقیقه." },
  { n: "۲", title: "کد", body: "پیامک یا کد تست روی صفحه." },
  { n: "۳", title: "کار", body: "فروشگاه را باز کن یا برو داخل پنل." },
];

function TiltFrame({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
    stiffness: 120,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), {
    stiffness: 120,
    damping: 18,
  });

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      onMouseMove={(event) => {
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        x.set((event.clientX - box.left) / box.width - 0.5);
        y.set((event.clientY - box.top) / box.height - 0.5);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="hidden lg:block"
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="landing min-h-screen overflow-x-hidden bg-[#f4efe6] text-[#14110e]">
      <LandingHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="landing-hero-glow pointer-events-none absolute inset-0" />
          <div className="landing-grid pointer-events-none absolute inset-0" />

          <div className="relative mx-auto max-w-6xl px-5 pt-12 pb-16 sm:px-8 lg:pt-16 lg:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="max-w-2xl"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1f4a45]/15 bg-white/70 px-3 py-1 text-xs text-[#1f4a45]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1f4a45] opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1f4a45]" />
                </span>
                پنل فارسی فروشگاه
              </span>
              <p className="font-display mt-5 text-5xl font-bold tracking-tight text-[#1f4a45] sm:text-6xl lg:text-7xl">
                Shopy
              </p>
              <h1 className="font-display mt-3 text-[1.85rem] font-semibold tracking-tight text-[#14110e] sm:text-4xl lg:text-[2.75rem]">
                فروشگاه را جمع‌وجور، جلو چشم نگه دار
              </h1>
              <p className="mt-5 max-w-xl text-base text-[#5c564d] sm:text-lg">
                ویترین عمومی، سفارش، پرداخت آزمایشی و آمار فروشنده — همه در یک
                اپ فارسی.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/register"
                  className="rounded-full bg-[#1f4a45] px-6 py-3 text-sm text-white transition hover:-translate-y-0.5 hover:bg-[#173833] hover:shadow-lg hover:shadow-[#1f4a45]/25"
                >
                  ساخت حساب
                </Link>
                <Link
                  href="/shop"
                  className="rounded-full border border-[#14110e]/12 bg-white/80 px-6 py-3 text-sm transition hover:bg-white"
                >
                  برو به فروشگاه
                </Link>
                <Link
                  href="/panel/analytics"
                  className="rounded-full px-4 py-3 text-sm text-[#1f4a45] transition hover:bg-white/80"
                >
                  آمار فروشنده
                </Link>
              </div>
            </motion.div>

            <div id="demo" className="mt-14 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <TiltFrame>
                <DashboardPreview />
              </TiltFrame>
              <div className="lg:hidden">
                <DashboardPreview />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.55 }}
                className="lg:pt-6"
              >
                <PhoneDemo />
                <p className="mt-4 text-sm text-[#6b6459]">
                  روی منوی داشبورد کلیک کن. سفارش‌ها را هم می‌شود دید.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="mb-8"
          >
            <p className="text-sm text-[#1f4a45]">امکانات</p>
            <h2 className="font-display mt-1 text-3xl font-semibold">همان چیزهایی که هر روز لازم است</h2>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className="rounded-3xl border border-[#14110e]/8 bg-white/75 p-6 shadow-[0_12px_40px_-24px_rgba(20,17,14,0.35)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f4a45]/10 text-[#1f4a45]">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="font-display mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#5c564d]">{feature.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="about" className="relative overflow-hidden border-y border-[#14110e]/8">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 55% 50% at 90% 20%, rgba(31,74,69,0.14), transparent 55%), linear-gradient(180deg, #efe8dc 0%, #f4efe6 100%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              className="max-w-2xl"
            >
              <p className="font-display text-5xl font-bold tracking-tight text-[#1f4a45] sm:text-6xl">
                Shopy
              </p>
              <h2 className="font-display mt-4 text-3xl font-semibold text-[#14110e]">
                پنل فروشگاه کوچک برای کار هر روز
              </h2>
              <p className="mt-5 text-base leading-8 text-[#5c564d]">
                از ورود با موبایل تا ویترین عمومی، سفارش، ارسال و آمار فروشنده —
                یک اپ فارسی که لازم نباشد ده تا ابزار جدا باز کنی. این صفحه خود
                محصول است؛ فروشگاه نمونه را از منوی بالا باز کن.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth/register"
                  className="rounded-full bg-[#1f4a45] px-6 py-3 text-sm text-white transition hover:-translate-y-0.5 hover:bg-[#173833]"
                >
                  ساخت حساب
                </Link>
                <Link
                  href="/shop"
                  className="rounded-full border border-[#14110e]/12 bg-white/80 px-6 py-3 text-sm transition hover:bg-white"
                >
                  دیدن فروشگاه نمونه
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
          <div className="overflow-hidden rounded-[2rem] bg-[#1f4a45] px-6 py-10 text-white sm:px-12 sm:py-14">
            <p className="text-sm text-white/60">سه قدم</p>
            <h2 className="font-display mt-2 text-2xl font-semibold sm:text-3xl">از شماره تا قفسه</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl bg-white/8 p-5 ring-1 ring-white/10"
                >
                  <span className="font-display text-3xl font-semibold text-[#e8c56b]">
                    {step.n}
                  </span>
                  <h3 className="font-display mt-3 text-lg font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/70">{step.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pt-2 pb-20 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-[#14110e]/8 bg-white/85 px-6 py-10 sm:flex-row sm:items-center sm:px-10"
          >
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                با Shopy از ویترین تا آمار، یک‌جا
              </h2>
              <p className="mt-2 text-sm text-[#5c564d]">
                ثبت‌نام رایگان است. بعدش فروشگاه یا پنل را باز کن.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="rounded-full bg-[#1f4a45] px-6 py-3 text-sm text-white transition hover:-translate-y-0.5 hover:bg-[#173833]"
            >
              برویم داخل
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-[#14110e]/8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center sm:px-8">
          <Logo />
          <div className="flex items-center gap-4 text-sm text-[#6b6459]">
            <p>پنل ادمین فروشگاه · ۲۰۲۶</p>
            <Link href="#about" className="text-[#1f4a45] hover:underline">
              درباره
            </Link>
            <Link href="/shop/contact" className="text-[#1f4a45] hover:underline">
              تماس
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
