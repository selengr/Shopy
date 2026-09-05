"use client";

import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { toast } from "react-toastify";
import {
  GetShopSettings,
  UpdateShopSettings,
} from "@/services/settings";
import LoadingBox from "@/components/shared/loadingBox";
import ValidationError from "@/exceptions/validationError";
import type ShopSettings from "@/models/shopSettings";
import { defaultShopSettings } from "@/helpers/shopSettings";

export default function PanelSettings() {
  const { data, isLoading } = useSWR("settings", GetShopSettings);
  const [draft, setDraft] = useState<Partial<ShopSettings> | null>(null);
  const [saving, setSaving] = useState(false);

  const settings = {
    ...defaultShopSettings(),
    ...(data ?? {}),
    ...(draft ?? {}),
  };

  const patch = (next: Partial<ShopSettings>) => {
    setDraft((prev) => ({ ...(prev ?? {}), ...next }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await UpdateShopSettings({
        name: settings.name.trim(),
        tagline: settings.tagline?.trim() || undefined,
        about: settings.about?.trim() || undefined,
        phone: settings.phone?.trim() || undefined,
        instagram: settings.instagram?.trim() || undefined,
        address: settings.address?.trim() || undefined,
        invoiceFooter: settings.invoiceFooter?.trim() || undefined,
      });
      setDraft(null);
      await globalMutate("settings", saved, false);
      await globalMutate("shop/settings", saved, false);
      toast.success("تنظیمات ذخیره شد");
    } catch (err) {
      if (err instanceof ValidationError) {
        const first = Object.values(err.messages)[0];
        const message = Array.isArray(first) ? first[0] : first;
        toast.error(String(message ?? "ذخیره نشد"));
        return;
      }
      toast.error("ذخیره نشد");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !data) return <LoadingBox />;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">تنظیمات فروشگاه</h1>
      <p className="mt-2 text-sm text-[#5c564d]">
        نام و تماس اینجا روی فروشگاه عمومی، فاکتور و برگه بسته‌بندی می‌آید.
      </p>

      <form
        onSubmit={save}
        className="mt-8 max-w-2xl space-y-4 rounded-3xl border border-[#14110e]/8 bg-white/85 p-5 shadow-sm"
      >
        <label className="block text-sm">
          <span className="mb-1 block text-[#5c564d]">نام فروشگاه</span>
          <input
            value={settings.name}
            onChange={(event) => patch({ name: event.target.value })}
            className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[#5c564d]">شعار کوتاه</span>
          <input
            value={settings.tagline ?? ""}
            onChange={(event) => patch({ tagline: event.target.value })}
            className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[#5c564d]">متن صفحه درباره</span>
          <textarea
            value={settings.about ?? ""}
            onChange={(event) => patch({ about: event.target.value })}
            rows={4}
            className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-[#5c564d]">تلفن</span>
            <input
              value={settings.phone ?? ""}
              onChange={(event) => patch({ phone: event.target.value })}
              dir="ltr"
              className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[#5c564d]">اینستاگرام</span>
            <input
              value={settings.instagram ?? ""}
              onChange={(event) => patch({ instagram: event.target.value })}
              dir="ltr"
              placeholder="without @"
              className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-[#5c564d]">آدرس</span>
          <input
            value={settings.address ?? ""}
            onChange={(event) => patch({ address: event.target.value })}
            className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[#5c564d]">متن پایین فاکتور</span>
          <textarea
            value={settings.invoiceFooter ?? ""}
            onChange={(event) => patch({ invoiceFooter: event.target.value })}
            rows={3}
            className="w-full rounded-2xl border border-[#14110e]/10 px-3 py-2.5"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#1f4a45] px-5 py-2.5 text-sm text-white disabled:opacity-50"
        >
          {saving ? "..." : "ذخیره"}
        </button>
      </form>
    </div>
  );
}
