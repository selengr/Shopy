"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "react-toastify";
import ShopShell from "@/components/shop/shopShell";
import LoadingBox from "@/components/shared/loadingBox";
import EmptyList from "@/components/shared/emptyList";
import OrderStatusBadge from "@/components/orders/orderStatusBadge";
import {
  GetMyShopOrders,
  CancelMyShopOrder,
  GetShopCustomerMe,
  LoginShopCustomer,
  LogoutShopCustomer,
  RegisterShopCustomer,
  VerifyShopCustomer,
} from "@/services/shopAuth";
import { RequestShopReturn } from "@/services/returns";
import {
  CreateAddress,
  DeleteAddress,
  GetMyAddresses,
  UpdateAddress,
} from "@/services/shipping";
import { formatToman } from "@/helpers/catalog";
import { canCustomerCancel, formatDay } from "@/helpers/orders";
import { formatAddressLine } from "@/helpers/shipping";
import {
  canRequestReturn,
  returnStatusClass,
  returnStatusLabel,
} from "@/helpers/returns";
import { iranianPhoneRegExp, normalizeIranianPhone } from "@/helpers/auth";
import { readCustomerOtpHint } from "@/helpers/localDb";
import ValidationError from "@/exceptions/validationError";

type Mode = "login" | "register" | "verify";

export default function ShopAccountPage() {
  const { data: customer, mutate, error, isLoading } = useSWR(
    "shop/customer/me",
    GetShopCustomerMe,
    { shouldRetryOnError: false },
  );
  const { data: accountData, mutate: mutateOrders } = useSWR(
    customer ? "shop/account/orders" : null,
    GetMyShopOrders,
  );
  const orders = accountData?.orders;
  const returns = accountData?.returns ?? [];
  const { data: addresses, mutate: mutateAddresses } = useSWR(
    customer ? "shop/account/addresses" : null,
    GetMyAddresses,
  );

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addrLabel, setAddrLabel] = useState("خانه");
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addrBusy, setAddrBusy] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<number | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnBusy, setReturnBusy] = useState(false);
  const [cancelBusyId, setCancelBusyId] = useState<number | null>(null);

  const startAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeIranianPhone(phone);
    if (!iranianPhoneRegExp.test(normalized)) {
      toast.error("شماره موبایل درست نیست");
      return;
    }
    if (mode === "register" && name.trim().length < 2) {
      toast.error("نام را بنویس");
      return;
    }
    setSaving(true);
    try {
      const res =
        mode === "register"
          ? await RegisterShopCustomer({
              name: name.trim(),
              phone: normalized,
            })
          : await LoginShopCustomer(normalized);
      setToken(res.token);
      setHint(res.debug_code ?? readCustomerOtpHint());
      if (res.debug_code) toast.info(`کد تست: ${res.debug_code}`, { autoClose: 8000 });
      else if (res.sms_sent) toast.success("کد پیامک شد");
      setMode("verify");
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "انجام نشد"));
        return;
      }
      toast.error("انجام نشد");
    } finally {
      setSaving(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await VerifyShopCustomer({ token, code: code.trim() });
      await mutate();
      await mutateOrders();
      await mutateAddresses();
      toast.success("وارد شدی");
      setMode("login");
      setCode("");
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "کد درست نیست"));
        return;
      }
      toast.error("کد درست نیست");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await LogoutShopCustomer();
    await mutate(undefined, { revalidate: false });
    toast.info("خارج شدی");
  };

  const submitReturn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!returnOrderId) return;
    if (returnReason.trim().length < 5) {
      toast.error("دلیل مرجوعی را کامل‌تر بنویس");
      return;
    }
    setReturnBusy(true);
    try {
      await RequestShopReturn({
        orderId: returnOrderId,
        reason: returnReason.trim(),
      });
      setReturnOrderId(null);
      setReturnReason("");
      await mutateOrders();
      toast.success("درخواست مرجوعی ثبت شد");
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "ثبت نشد"));
        return;
      }
      toast.error("ثبت نشد");
    } finally {
      setReturnBusy(false);
    }
  };

  const addAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customer) return;
    const normalized = normalizeIranianPhone(addrPhone || customer.phone);
    if ((addrName || customer.name).trim().length < 2) {
      toast.error("نام گیرنده را بنویس");
      return;
    }
    if (!iranianPhoneRegExp.test(normalized)) {
      toast.error("شماره درست نیست");
      return;
    }
    if (
      province.trim().length < 2 ||
      city.trim().length < 2 ||
      street.trim().length < 5
    ) {
      toast.error("آدرس کامل را بنویس");
      return;
    }
    setAddrBusy(true);
    try {
      await CreateAddress({
        label: addrLabel.trim() || "آدرس",
        recipientName: (addrName || customer.name).trim(),
        phone: normalized,
        province: province.trim(),
        city: city.trim(),
        street: street.trim(),
        postalCode: postalCode.trim() || undefined,
      });
      setProvince("");
      setCity("");
      setStreet("");
      setPostalCode("");
      await mutateAddresses();
      toast.success("آدرس اضافه شد");
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "ذخیره نشد"));
        return;
      }
      toast.error("ذخیره نشد");
    } finally {
      setAddrBusy(false);
    }
  };

  const cancelOrder = async (orderId: number) => {
    if (!window.confirm("این سفارش لغو شود؟ موجودی برمی‌گردد.")) return;
    setCancelBusyId(orderId);
    try {
      await CancelMyShopOrder(orderId);
      await mutateOrders();
      toast.success("سفارش لغو شد");
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "لغو نشد"));
        return;
      }
      toast.error("لغو نشد");
    } finally {
      setCancelBusyId(null);
    }
  };

  return (
    <ShopShell>
      <h1 className="font-display text-3xl font-semibold">حساب مشتری</h1>
      <p className="mt-2 text-sm text-[#5c564d]">
        جدا از پنل فروشنده است. سفارش‌ها و آدرس‌هایت اینجا می‌ماند.
      </p>

      {isLoading && !customer && !error ? (
        <div className="mt-8">
          <LoadingBox />
        </div>
      ) : customer ? (
        <div className="mt-8 space-y-8">
          <div className="rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm">
            <p className="font-medium">{customer.name}</p>
            <p className="mt-1 text-sm text-[#5c564d]" dir="ltr">
              {customer.phone}
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 rounded-full px-4 py-2 text-sm ring-1 ring-[#14110e]/15"
            >
              خروج
            </button>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold">دفترچه آدرس</h2>
            <ul className="mt-4 space-y-3">
              {(addresses ?? []).map((addr) => (
                <li
                  key={addr.id}
                  className="rounded-3xl border border-[#14110e]/8 bg-white/85 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {addr.label}
                        {addr.isDefault ? " · پیش‌فرض" : ""}
                      </p>
                      <p className="mt-1 text-xs text-[#6b6459]">
                        {addr.recipientName} ·{" "}
                        <span dir="ltr">{addr.phone}</span>
                      </p>
                      <p className="mt-1 text-xs text-[#6b6459]">
                        {formatAddressLine(addr)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={async () => {
                            await UpdateAddress(addr.id, { isDefault: true });
                            await mutateAddresses();
                            toast.success("پیش‌فرض شد");
                          }}
                          className="rounded-full px-3 py-1 text-xs ring-1 ring-[#14110e]/15"
                        >
                          پیش‌فرض
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          await DeleteAddress(addr.id);
                          await mutateAddresses();
                          toast.info("حذف شد");
                        }}
                        className="rounded-full px-3 py-1 text-xs text-red-700 ring-1 ring-red-200"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <form
              onSubmit={addAddress}
              className="mt-4 grid gap-2 rounded-3xl border border-[#14110e]/8 bg-white/85 p-4 shadow-sm sm:grid-cols-2"
            >
              <input
                value={addrLabel}
                onChange={(event) => setAddrLabel(event.target.value)}
                placeholder="برچسب"
                className="rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
              />
              <input
                value={addrName || customer.name}
                onChange={(event) => setAddrName(event.target.value)}
                placeholder="نام گیرنده"
                className="rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
              />
              <input
                value={addrPhone || customer.phone}
                onChange={(event) => setAddrPhone(event.target.value)}
                placeholder="موبایل"
                inputMode="tel"
                dir="ltr"
                className="rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                placeholder="استان"
                className="rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
              />
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="شهر"
                className="rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
              />
              <textarea
                value={street}
                onChange={(event) => setStreet(event.target.value)}
                placeholder="خیابان، پلاک، واحد"
                rows={2}
                className="rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                placeholder="کد پستی (اختیاری)"
                dir="ltr"
                className="rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm sm:col-span-2"
              />
              <button
                type="submit"
                disabled={addrBusy}
                className="rounded-full bg-[#1f4a45] px-4 py-2.5 text-sm text-white disabled:opacity-50 sm:col-span-2"
              >
                {addrBusy ? "..." : "افزودن آدرس"}
              </button>
            </form>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold">سفارش‌های من</h2>
            {!orders || orders.length === 0 ? (
              <div className="mt-4">
                <EmptyList
                  title="هنوز سفارشی نیست"
                  description="از فروشگاه خرید کن"
                />
                <Link
                  href="/shop"
                  className="mt-3 inline-flex rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white"
                >
                  فروشگاه
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {orders.map((order) => {
                  const related = returns.find(
                    (item) => item.orderId === order.id,
                  );
                  return (
                    <li
                      key={order.id}
                      className="rounded-3xl border border-[#14110e]/8 bg-white/85 px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            #{order.id.toLocaleString("fa-IR")} ·{" "}
                            {formatToman(order.total)}
                          </p>
                          <p className="text-xs text-[#6b6459]">
                            {formatDay(order.created_at)}
                            {order.shippingTitle
                              ? ` · ${order.shippingTitle}`
                              : ""}
                            {order.couponCode ? ` · ${order.couponCode}` : ""}
                          </p>
                          {(order.carrier || order.trackingCode) && (
                            <p className="mt-1 text-xs text-emerald-800" dir="ltr">
                              {[order.carrier, order.trackingCode]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      {related && (
                        <p
                          className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs ${returnStatusClass(related.status)}`}
                        >
                          مرجوعی: {returnStatusLabel(related.status)}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {canCustomerCancel(order) && (
                          <button
                            type="button"
                            disabled={cancelBusyId === order.id}
                            onClick={() => cancelOrder(order.id)}
                            className="rounded-full px-3 py-1.5 text-xs text-red-700 ring-1 ring-red-200 disabled:opacity-50"
                          >
                            {cancelBusyId === order.id ? "..." : "لغو سفارش"}
                          </button>
                        )}
                        {canRequestReturn(order) && !related && (
                          <button
                            type="button"
                            onClick={() => {
                              setReturnOrderId(order.id);
                              setReturnReason("");
                            }}
                            className="rounded-full px-3 py-1.5 text-xs ring-1 ring-[#14110e]/15"
                          >
                            درخواست مرجوعی
                          </button>
                        )}
                        <Link
                          href={`/shop/track?orderId=${order.id}&phone=${encodeURIComponent(order.customerPhone)}`}
                          className="rounded-full px-3 py-1.5 text-xs ring-1 ring-[#14110e]/15"
                        >
                          پیگیری
                        </Link>
                      </div>
                      {returnOrderId === order.id && (
                        <form onSubmit={submitReturn} className="mt-3 space-y-2">
                          <textarea
                            value={returnReason}
                            onChange={(event) =>
                              setReturnReason(event.target.value)
                            }
                            rows={2}
                            placeholder="چرا می‌خوای مرجوع کنی؟"
                            className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={returnBusy}
                              className="rounded-full bg-[#1f4a45] px-3 py-1.5 text-xs text-white disabled:opacity-50"
                            >
                              {returnBusy ? "..." : "ثبت درخواست"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setReturnOrderId(null)}
                              className="rounded-full px-3 py-1.5 text-xs ring-1 ring-[#14110e]/15"
                            >
                              انصراف
                            </button>
                          </div>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : mode === "verify" ? (
        <form
          onSubmit={verify}
          className="mt-8 max-w-md space-y-4 rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm"
        >
          <p className="text-sm text-[#5c564d]">کد تایید را وارد کن</p>
          {hint && (
            <p className="rounded-full bg-[#1f4a45]/10 px-3 py-2 text-center text-sm text-[#1f4a45]">
              کد تست: {hint}
            </p>
          )}
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            dir="ltr"
            className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-center tracking-[0.3em]"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#1f4a45] px-4 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {saving ? "..." : "تایید و ورود"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={startAuth}
          className="mt-8 max-w-md space-y-4 rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm"
        >
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-3 py-1.5 ${
                mode === "login"
                  ? "bg-[#1f4a45] text-white"
                  : "ring-1 ring-[#14110e]/15"
              }`}
            >
              ورود
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-full px-3 py-1.5 ${
                mode === "register"
                  ? "bg-[#1f4a45] text-white"
                  : "ring-1 ring-[#14110e]/15"
              }`}
            >
              ثبت‌نام
            </button>
          </div>
          {mode === "register" && (
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="نام"
              className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
            />
          )}
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="09xxxxxxxxx"
            inputMode="tel"
            dir="ltr"
            className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#1f4a45] px-4 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {saving ? "..." : "دریافت کد"}
          </button>
        </form>
      )}
    </ShopShell>
  );
}
