"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import type { KeyedMutator } from "swr";
import DeleteConfirmation from "@/components/shared/deleteConfirmation";
import ValidationError from "@/exceptions/validationError";
import { categoryLabel, formatToman } from "@/helpers/catalog";
import ProductThumb from "@/components/shared/productThumb";
import Product from "@/models/product";
import {
  DeleteProduct,
  ToggleProductArchive,
  ToggleProductFeatured,
} from "@/services/product";
import { isProductActive } from "@/helpers/catalog";

interface Props {
  product: Product;
  mutateProducts: KeyedMutator<{
    products: Product[];
    total_page: number;
  }>;
}

export default function ProductListItem({ product, mutateProducts }: Props) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [featuring, setFeaturing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const active = isProductActive(product);

  const deleteHandler = async () => {
    try {
      await DeleteProduct(product.id);
      await mutateProducts();
      toast.success("محصول مورد نظر با موفقیت حذف شد");
      setShowDeleteConfirmation(false);
    } catch (error) {
      if (error instanceof ValidationError) {
        Object.entries(error.messages).forEach(([, value]) => {
          const message = Array.isArray(value) ? value[0] : value;
          if (message) toast.error(String(message));
        });
        return;
      }

      toast.error("متاسفانه مشکلی در حذف محصول وجود دارد.");
    }
  };

  const toggleFeatured = async () => {
    setFeaturing(true);
    try {
      await ToggleProductFeatured(product.id);
      await mutateProducts();
      toast.success(
        product.featured ? "از پیشنهادها برداشته شد" : "به پیشنهادها اضافه شد",
      );
    } catch {
      toast.error("تغییر وضعیت نشد");
    } finally {
      setFeaturing(false);
    }
  };

  const toggleArchive = async () => {
    setArchiving(true);
    try {
      await ToggleProductArchive(product.id);
      await mutateProducts();
      toast.success(active ? "آرشیو شد (از فروشگاه مخفی)" : "دوباره فعال شد");
    } catch {
      toast.error("تغییر وضعیت نشد");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <tr className={active ? undefined : "bg-gray-50 text-gray-500"}>
      <td className="hidden">
        {showDeleteConfirmation && (
          <DeleteConfirmation
            title={`حذف محصول ${product.title}`}
            description="آیا از حذف محصول مورد نظر خود اطمینان دارید یا خیر؟ در صورت تایید اطلاعات قابل بازگشت نخواهد بود"
            handleTrue={deleteHandler}
            handleCancel={() => setShowDeleteConfirmation(false)}
          />
        )}
      </td>
      <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-10">
            <ProductThumb item={product} className="h-10" compact />
          </span>
          {product.id}
          {product.featured && (
            <span className="rounded-full bg-[#1f4a45]/10 px-2 py-0.5 text-[10px] text-[#1f4a45]">
              ویژه
            </span>
          )}
          {!active && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-700">
              آرشیو
            </span>
          )}
        </span>
      </td>
      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-900">
        {product.title}
      </td>
      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
        {categoryLabel(product.category)}
      </td>
      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
        {formatToman(product.price)}
      </td>
      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
        {(product.stock ?? 0).toLocaleString("fa-IR")}
      </td>
      <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
        <button
          type="button"
          disabled={archiving}
          onClick={toggleArchive}
          className="ml-4 text-[#5c564d] hover:underline disabled:opacity-50"
        >
          {active ? "آرشیو" : "فعال‌سازی"}
        </button>
        <button
          type="button"
          disabled={featuring || !active}
          onClick={toggleFeatured}
          className="ml-4 text-[#1f4a45] hover:underline disabled:opacity-50"
        >
          {product.featured ? "حذف ویژه" : "ویژه"}
        </button>
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="ml-4 text-indigo-600 hover:text-indigo-900"
        >
          ویرایش
        </Link>
        <button
          type="button"
          onClick={() => setShowDeleteConfirmation(true)}
          className="text-red-600 hover:text-red-900"
        >
          حذف
        </button>
      </td>
    </tr>
  );
}
