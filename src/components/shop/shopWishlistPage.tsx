"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "react-toastify";
import ShopShell from "@/components/shop/shopShell";
import ProductThumb from "@/components/shared/productThumb";
import EmptyList from "@/components/shared/emptyList";
import LoadingBox from "@/components/shared/loadingBox";
import { GetShopProducts } from "@/services/shop";
import {
  addToCart,
  cartCount,
  getCartServerSnapshot,
  readCart,
  subscribeCart,
} from "@/helpers/cart";
import ProductPrice from "@/components/shared/productPrice";
import {
  hasVariants,
  productStock,
} from "@/helpers/variants";
import {
  getWishlistServerSnapshot,
  readWishlist,
  removeFromWishlist,
  subscribeWishlist,
  wishlistCount,
} from "@/helpers/wishlist";

export default function ShopWishlistPage() {
  const wish = useSyncExternalStore(
    subscribeWishlist,
    readWishlist,
    getWishlistServerSnapshot,
  );
  const lines = useSyncExternalStore(
    subscribeCart,
    readCart,
    getCartServerSnapshot,
  );
  const { data, error } = useSWR("shop/products", GetShopProducts);
  const loading = !data && !error;

  const items = useMemo(() => {
    const products = data ?? [];
    return wish.map((line) => {
      const live = products.find((item) => item.id === line.productId);
      return {
        ...line,
        stock: live ? productStock(live) : 0,
        product: live,
        needsOptions: live ? hasVariants(live) : false,
      };
    });
  }, [data, wish]);

  return (
    <ShopShell cartCount={cartCount(lines)} wishCount={wishlistCount(wish)}>
      <h1 className="font-display text-3xl font-semibold">علاقه‌مندی‌ها</h1>
      <p className="mt-2 text-sm text-[#5c564d]">
        محصولاتی که برای بعد علامت زدی. فقط روی این دستگاه ذخیره می‌شوند.
      </p>

      {loading ? (
        <div className="mt-8">
          <LoadingBox />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyList
            title="لیست خالی است"
            description="از فروشگاه قلب را بزن تا اینجا بیاید"
          />
          <Link
            href="/shop"
            className="mt-4 inline-flex rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white"
          >
            برو به فروشگاه
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex flex-col rounded-3xl border border-[#14110e]/8 bg-white/85 p-4 shadow-sm"
            >
              <Link href={`/shop/products/${item.productId}`}>
                <ProductThumb item={item} className="h-40" />
              </Link>
              <h2 className="font-display mt-3 text-lg font-semibold">
                <Link href={`/shop/products/${item.productId}`}>{item.title}</Link>
              </h2>
              <div className="mt-1">
                <ProductPrice
                  price={item.product?.price ?? item.price}
                  compareAtPrice={item.product?.compareAtPrice}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.needsOptions ? (
                  <Link
                    href={`/shop/products/${item.productId}`}
                    className="rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white"
                  >
                    انتخاب گزینه
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={!item.product || item.stock < 1}
                    onClick={() => {
                      if (!item.product) return;
                      addToCart(item.product);
                      toast.success("به سبد اضافه شد");
                    }}
                    className="rounded-full bg-[#1f4a45] px-4 py-2 text-sm text-white disabled:opacity-40"
                  >
                    {item.stock < 1 ? "ناموجود" : "افزودن به سبد"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    removeFromWishlist(item.productId);
                    toast.info("از علاقه‌مندی‌ها برداشته شد");
                  }}
                  className="rounded-full px-4 py-2 text-sm ring-1 ring-[#14110e]/15"
                >
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ShopShell>
  );
}
