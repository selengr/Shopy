"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { GetProducts } from "@/services/product";
import ProductCard from "@/components/panel/productCard";
import LoadingBox from "@/components/shared/loadingBox";
import EmptyList from "@/components/shared/emptyList";
import { CATEGORIES, isProductActive } from "@/helpers/catalog";
import type Product from "@/models/product";

export default function PanelProducts() {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const { data, error } = useSWR(
    { url: "/panel/products-all", page: 1, per_page: 50 },
    GetProducts,
  );
  const loading = !data && !error;
  const filtered = useMemo(() => {
    const products: Product[] = data?.products ?? [];
    const needle = query.trim();
    return products.filter((item) => {
      const inCategory = category ? item.category === category : true;
      const inSearch = needle
        ? `${item.title} ${item.body}`.includes(needle)
        : true;
      const inArchive = showArchived ? true : isProductActive(item);
      return inCategory && inSearch && inArchive;
    });
  }, [category, data?.products, query, showArchived]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">کاتالوگ</h1>
      <p className="mt-2 text-sm text-[#5c564d]">
        محصولات نمونه به‌علاوه هر چیزی که خودت اضافه کرده باشی. آرشیو از فروشگاه
        مخفی است.
      </p>

      <label className="mt-6 block">
        <span className="sr-only">جستجو</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجو در نام یا توضیح"
          className="w-full rounded-2xl border border-[#14110e]/10 bg-white px-4 py-2.5 text-sm focus:border-[#1f4a45] focus:ring-[#1f4a45] sm:max-w-sm"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`rounded-full px-3 py-1.5 text-sm ${
            category === "" ? "bg-[#1f4a45] text-white" : "bg-white"
          }`}
        >
          همه
        </button>
        {CATEGORIES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setCategory(item.value)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              category === item.value ? "bg-[#1f4a45] text-white" : "bg-white"
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowArchived((value) => !value)}
          className={`rounded-full px-3 py-1.5 text-sm ${
            showArchived
              ? "bg-[#1f4a45] text-white"
              : "bg-white ring-1 ring-[#14110e]/10"
          }`}
        >
          نمایش آرشیو
        </button>
      </div>

      {loading ? (
        <div className="mt-6">
          <LoadingBox />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyList title="محصولی نیست" description="این دسته خالی است" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
