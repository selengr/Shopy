"use client";

import { useState } from "react";
import Link from "next/link";
import { Form, Formik } from "formik";
import Logo from "@/components/landing/logo";
import LandingHeader from "@/components/landing/header";
import DashboardPreview from "@/components/landing/dashboardPreview";
import PhoneDemo from "@/components/landing/phoneDemo";
import LoginForm from "@/forms/auth/loginForm";
import RegisterForm from "@/forms/auth/registerForm";
import PhoneVerifyForm from "@/forms/auth/phoneVerifyForm";
import Input from "@/components/shared/form/input";
import Textarea from "@/components/shared/form/textarea";
import SelectBox from "@/components/shared/form/selectbox";
import Spinner from "@/components/icons/spinner";
import LoadingBox from "@/components/shared/loadingBox";
import EmptyList from "@/components/shared/emptyList";
import Modal from "@/components/shared/modal";
import DeleteConfirmation from "@/components/shared/deleteConfirmation";
import ReactCustomPaginate from "@/components/shared/reactCustomPaginate";
import ActiveLink from "@/components/shared/activeLink";
import ProductListItem from "@/components/admin/products/productListItem";
import ProductCard from "@/components/panel/productCard";
import UserInfo from "@/components/panel/userInfo";
import CreateProductForm from "@/forms/admin/product/createProductForm";
import type Product from "@/models/product";
import { useAppDispatch } from "@/hooks";
import { updatePhoneVerifyToken } from "@/store/auth";

const sections = [
  { id: "features", label: "امکانات" },
  { id: "landing", label: "لندینگ" },
  { id: "auth", label: "ورود و ثبت‌نام" },
  { id: "forms", label: "فرم‌ها" },
  { id: "shared", label: "قطعات مشترک" },
  { id: "admin", label: "ادمین" },
];

const sampleProduct: Product = {
  id: 99,
  title: "کفش اسپرت سفید",
  category: "2",
  body: "کفش روزمره برای تست کارت و لیست",
  price: 1280000,
  user_id: 1,
  created_at: new Date().toISOString(),
  stock: 12,
  emoji: "👟",
  image: "/products/shoes.jpg",
  featured: true,
};

function Block({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#14110e]/8 bg-white/80 p-5 shadow-sm sm:p-6">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {hint && <p className="mt-1 text-xs text-[#6b6459]">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function ProjectShowcase() {
  const dispatch = useAppDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [page, setPage] = useState(1);

  return (
    <div className="min-h-screen bg-[#f4efe6] text-[#14110e]">
      <div className="sticky top-0 z-30 border-b border-[#14110e]/8 bg-[#f4efe6]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <Logo />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-[#6b6459] sm:inline">صفحه تست</span>
            <Link href="/" className="rounded-full bg-[#1f4a45] px-4 py-1.5 text-white">
              خانه
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 pb-3 sm:px-8">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-full border border-[#14110e]/10 bg-white/70 px-3 py-1 text-xs hover:bg-white"
            >
              {section.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-14 px-5 py-10 sm:px-8">
        <section id="features">
          <h2 className="font-display text-2xl font-semibold">امکانات پروژه</h2>
          <p className="mt-2 text-sm text-[#5c564d]">
            مسیرهای واقعی اپ. بعضی‌ها ورود می‌خواهند.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/", title: "خانه", body: "لندینگ" },
              { href: "/shop", title: "فروشگاه", body: "ویترین عمومی، سبد، سفارش مهمان" },
              { href: "/shop/about", title: "درباره", body: "متن فروشگاه از تنظیمات" },
              { href: "/shop/contact", title: "تماس", body: "شماره و آدرس فروشگاه" },
              { href: "/shop/wishlist", title: "علاقه‌مندی", body: "لیست دلخواه روی همین دستگاه" },
              { href: "/shop/account", title: "حساب مشتری", body: "ورود خریدار و سفارش‌های من" },
              { href: "/shop/products/1", title: "جزئیات محصول", body: "گالری، نظر و امتیاز خریداران" },
              { href: "/shop/products/9", title: "ناموجود / انتظار", body: "فرم خبرم کن وقتی موجود شد" },
              { href: "/shop/track", title: "پیگیری سفارش", body: "وضعیت با شماره سفارش و موبایل" },
              { href: "/shop/pay/1", title: "پرداخت", body: "خلاصه سفارش و ورود به درگاه" },
              { href: "/auth/register", title: "ثبت‌نام", body: "اسم و موبایل" },
              { href: "/auth/login", title: "ورود", body: "شماره و کد تایید" },
              { href: "/auth/login/step-two", title: "تایید کد", body: "قدم دوم ورود" },
              { href: "/panel", title: "پنل کاربر", body: "خلاصه فروشگاه و نمونه‌ها" },
              { href: "/panel/analytics", title: "آمار فروش", body: "نمودار هفت‌روزه و پرفروش‌ها" },
              { href: "/panel/coupons", title: "کد تخفیف", body: "ساخت و فعال‌سازی کوپن" },
              { href: "/panel/shipping", title: "ارسال", body: "روش‌ها، هزینه و ارسال رایگان" },
              { href: "/panel/returns", title: "مرجوعی", body: "تایید یا رد درخواست برگشت" },
              { href: "/panel/waitlist", title: "لیست انتظار", body: "درخواست موجود شدن محصول" },
              { href: "/panel/customers", title: "مشتری‌ها", body: "خریداران و مهمان‌های سفارش" },
              { href: "/panel/reviews", title: "نظرات", body: "مخفی یا نمایش نظرات فروشگاه" },
              { href: "/panel/settings", title: "تنظیمات", body: "نام فروشگاه، تماس، فاکتور" },
              { href: "/panel/notifications", title: "اعلان‌ها", body: "سفارش‌های جدید برای فروشنده" },
              { href: "/panel/products", title: "کاتالوگ پنل", body: "محصولات نمونه با فیلتر" },
              { href: "/panel/orders", title: "سفارش‌ها", body: "لیست، وضعیت، سفارش دستی" },
              { href: "/panel/orders/1048/invoice", title: "فاکتور", body: "چاپ فاکتور سفارش نمونه" },
              { href: "/panel/orders/1048/packing", title: "بسته‌بندی", body: "برگه انبار با یادداشت فروشنده" },
              { href: "/panel/orders/create", title: "سفارش دستی", body: "ثبت سفارش تلفنی" },
              { href: "/admin", title: "داشبورد ادمین", body: "خلاصه مدیریت" },
              { href: "/admin/orders", title: "سفارش ادمین", body: "همان لیست در پنل ادمین" },
              { href: "/admin/products", title: "محصولات", body: "لیست، ساخت، ویرایش، حذف" },
              { href: "/admin/products/create", title: "ساخت محصول", body: "فرم محصول + سایز/رنگ" },
              { href: "/admin/users", title: "کاربران", body: "تغییر نقش ادمین و فروشنده" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-[#14110e]/8 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-[#1f4a45]/30"
              >
                <p className="font-display font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-[#6b6459]">{item.body}</p>
                <p dir="ltr" className="mt-2 text-left text-xs text-[#1f4a45]">
                  {item.href}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section id="landing" className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">لندینگ</h2>
          <Block title="Logo">
            <Logo />
          </Block>
          <Block title="LandingHeader" hint="هدر واقعی صفحه اول">
            <div className="overflow-hidden rounded-2xl border border-[#14110e]/8">
              <LandingHeader />
            </div>
          </Block>
          <Block title="DashboardPreview" hint="روی منو و ردیف‌ها کلیک کن">
            <DashboardPreview />
          </Block>
          <Block title="PhoneDemo" hint="ورود آزمایشی، پیامک نمی‌رود">
            <div className="max-w-md">
              <PhoneDemo />
            </div>
          </Block>
        </section>

        <section id="auth" className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">ورود و ثبت‌نام</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <Block title="LoginForm">
              <LoginForm
                setToken={(token) => dispatch(updatePhoneVerifyToken(token))}
              />
            </Block>
            <Block title="RegisterForm">
              <RegisterForm />
            </Block>
          </div>
          <Block title="PhoneVerifyForm" hint="اگر از فرم ورود کد گرفته باشی، اینجا کار می‌کند">
            <div className="max-w-md">
              <PhoneVerifyForm token="demo" />
            </div>
          </Block>
          <Block title="UserInfo" hint="اگر وارد شده باشی اسم را نشان می‌دهد">
            <UserInfo />
          </Block>
        </section>

        <section id="forms" className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">ورودی‌های فرم</h2>
          <Block title="Input / SelectBox / Textarea">
            <Formik
              initialValues={{ title: "", category: "", about: "" }}
              onSubmit={() => undefined}
            >
              <Form className="grid gap-4 sm:grid-cols-2">
                <Input name="title" label="عنوان" placeholder="مثلا کفش" />
                <SelectBox
                  name="category"
                  label="دسته‌بندی"
                  options={[
                    { label: "انتخاب کن", value: "" },
                    { label: "جاوااسکریپت", value: 1 },
                    { label: "php", value: 2 },
                  ]}
                />
                <div className="sm:col-span-2">
                  <Textarea name="about" label="توضیح" />
                </div>
              </Form>
            </Formik>
          </Block>
        </section>

        <section id="shared" className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">قطعات مشترک</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Block title="Spinner">
              <div className="flex h-16 items-center justify-center rounded-xl bg-[#1f4a45]">
                <Spinner />
              </div>
            </Block>
            <Block title="LoadingBox">
              <LoadingBox />
            </Block>
            <Block title="EmptyList" hint="تمام عرض">
              <EmptyList
                title="چیزی نیست"
                description="این همان حالت خالی لیست محصول است"
              />
            </Block>
            <Block title="ActiveLink">
              <div className="flex gap-3">
                <ActiveLink href="/test">
                  {({ active }) => (
                    <span
                      className={`rounded-full px-3 py-1 text-sm ${
                        active ? "bg-[#1f4a45] text-white" : "bg-white"
                      }`}
                    >
                      تست
                    </span>
                  )}
                </ActiveLink>
                <ActiveLink href="/">
                  {({ active }) => (
                    <span
                      className={`rounded-full px-3 py-1 text-sm ${
                        active ? "bg-[#1f4a45] text-white" : "bg-white"
                      }`}
                    >
                      خانه
                    </span>
                  )}
                </ActiveLink>
              </div>
            </Block>
          </div>
          <Block title="ReactCustomPaginate">
            <ReactCustomPaginate
              pageCount={6}
              page={page}
              onPageChangeHandler={({ selected }) => setPage(selected + 1)}
            />
            <p className="mt-2 text-xs text-[#6b6459]">صفحه فعلی: {page}</p>
          </Block>
          <Block title="Modal و DeleteConfirmation">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white"
              >
                باز کردن مودال
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-700"
              >
                تایید حذف
              </button>
            </div>
            {modalOpen && (
              <Modal setShow={setModalOpen}>
                <div className="m-8 inline-block w-full max-w-md rounded-2xl bg-white p-6 text-right">
                  <h3 className="font-display text-lg font-semibold">مودال</h3>
                  <p className="mt-2 text-sm text-[#5c564d]">
                    این همان پنجره مشترک پروژه است.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="mt-4 rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white"
                  >
                    بستن
                  </button>
                </div>
              </Modal>
            )}
            {deleteOpen && (
              <DeleteConfirmation
                title="حذف مورد نمایشی"
                description="این فقط تست است. چیزی از دیتابیس پاک نمی‌شود مگر تایید کنی."
                handleTrue={() => setDeleteOpen(false)}
                handleCancel={() => setDeleteOpen(false)}
              />
            )}
          </Block>
        </section>

        <section id="admin" className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">ادمین</h2>
          <Block title="ProductCard" hint="کارت محصول در پنل">
            <div className="max-w-xs">
              <ProductCard product={sampleProduct} />
            </div>
          </Block>
          <Block title="ProductListItem">
            <table className="min-w-full divide-y divide-gray-200 overflow-hidden rounded-xl bg-white">
              <tbody>
                <ProductListItem
                  product={sampleProduct}
                  mutateProducts={async () => undefined}
                />
              </tbody>
            </table>
          </Block>
          <Block title="CreateProductForm" hint="اگر وارد شده باشی در localStorage ذخیره می‌شود">
            <CreateProductForm />
          </Block>
        </section>
      </div>
    </div>
  );
}
