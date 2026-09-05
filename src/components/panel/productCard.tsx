"use client";

import Link from "next/link";
import { categoryLabel, isProductActive } from "@/helpers/catalog";
import ProductPrice from "@/components/shared/productPrice";
import useAuth from "@/hooks/useAuth";
import User from "@/models/user";
import ProductThumb from "@/components/shared/productThumb";
import type Product from "@/models/product";

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const canEdit = new User(user).canAccess("manage_products");
  const stock = product.stock ?? 0;
  const active = isProductActive(product);

  return (
    <article className="relative flex flex-col rounded-3xl border border-[#14110e]/8 bg-white/85 p-4 shadow-sm">
      {product.featured && active && (
        <span className="absolute top-3 left-3 z-10 rounded-full bg-[#1f4a45] px-2.5 py-0.5 text-[10px] text-white">
          ویژه
        </span>
      )}
      {!active && (
        <span className="absolute top-3 left-3 z-10 rounded-full bg-gray-700 px-2.5 py-0.5 text-[10px] text-white">
          آرشیو
        </span>
      )}
      <ProductThumb item={product} className="h-36" />
      <p className="mt-3 text-xs text-[#1f4a45]">{categoryLabel(product.category)}</p>
      <h3 className="font-display mt-1 text-lg font-semibold">{product.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-[#6b6459]">{product.body}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <ProductPrice
          price={product.price}
          compareAtPrice={product.compareAtPrice}
        />
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
            stock > 5 ? "bg-[#1f4a45]/10 text-[#1f4a45]" : "bg-amber-100 text-amber-800"
          }`}
        >
          موجودی {stock.toLocaleString("fa-IR")}
        </span>
      </div>
      {canEdit && (
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="mt-3 text-left text-xs text-[#1f4a45]"
        >
          ویرایش
        </Link>
      )}
    </article>
  );
}
