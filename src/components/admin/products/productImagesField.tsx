"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import ProductThumb from "@/components/shared/productThumb";
import { fileToProductImage } from "@/helpers/image";
import { MAX_PRODUCT_IMAGES } from "@/helpers/productImages";

export default function ProductImagesField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const images = value.filter(Boolean);
  const canAdd = images.length < MAX_PRODUCT_IMAGES;

  const pushImage = (next: string) => {
    const trimmed = next.trim();
    if (!trimmed) return;
    if (images.includes(trimmed)) {
      toast.info("این عکس از قبل هست");
      return;
    }
    if (!canAdd) {
      toast.error(`حداکثر ${MAX_PRODUCT_IMAGES} عکس`);
      return;
    }
    onChange([...images, trimmed]);
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-700">عکس‌های محصول</p>
      <p className="mt-1 text-xs text-[#6b6459]">
        اولی کاور فروشگاه است. تا {MAX_PRODUCT_IMAGES.toLocaleString("fa-IR")} عکس.
      </p>

      {images.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((src, index) => (
            <li
              key={`${src}-${index}`}
              className="relative rounded-2xl border border-[#14110e]/10 bg-white p-2"
            >
              <ProductThumb
                item={{ image: src, title: `عکس ${index + 1}` }}
                className="h-28"
              />
              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <span className="text-[#6b6459]">
                  {index === 0 ? "کاور" : `عکس ${(index + 1).toLocaleString("fa-IR")}`}
                </span>
                <span className="flex gap-2">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...images];
                        const [item] = next.splice(index, 1);
                        next.unshift(item);
                        onChange(next);
                      }}
                      className="text-[#1f4a45]"
                    >
                      کاور
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onChange(images.filter((_, i) => i !== index))}
                    className="text-red-700"
                  >
                    حذف
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <>
          <input
            type="url"
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                pushImage(urlDraft);
                setUrlDraft("");
              }
            }}
            placeholder="آدرس عکس را بچسبان و Enter بزن"
            className="mt-3 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1f4a45] focus:ring-[#1f4a45] focus:outline-none"
            dir="ltr"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => {
                pushImage(urlDraft);
                setUrlDraft("");
              }}
              className="rounded-full border border-[#14110e]/12 bg-white px-3 py-1.5"
            >
              افزودن لینک
            </button>
            <label className="cursor-pointer rounded-full border border-[#14110e]/12 bg-white px-3 py-1.5">
              {busy ? "در حال خواندن..." : "انتخاب فایل"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={busy}
                onChange={async (event) => {
                  const files = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  if (files.length === 0) return;
                  setBusy(true);
                  try {
                    const next = [...images];
                    for (const file of files) {
                      if (next.length >= MAX_PRODUCT_IMAGES) break;
                      const dataUrl = await fileToProductImage(file);
                      if (!next.includes(dataUrl)) next.push(dataUrl);
                    }
                    onChange(next);
                  } catch {
                    toast.error("یکی از فایل‌ها عکس نبود");
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
