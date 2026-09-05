"use client";

import { useState } from "react";
import ProductThumb from "@/components/shared/productThumb";

export default function ProductGallery({
  images,
  title,
  emoji,
}: {
  images: string[];
  title: string;
  emoji?: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (images.length === 0) {
    return <ProductThumb item={{ title, emoji }} className="h-72 sm:h-80" />;
  }

  return (
    <div>
      <ProductThumb
        item={{ image: current, title, emoji }}
        className="h-72 sm:h-80"
      />
      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`overflow-hidden rounded-xl ring-2 ${
                index === active ? "ring-[#1f4a45]" : "ring-transparent"
              }`}
              aria-label={`عکس ${(index + 1).toLocaleString("fa-IR")}`}
            >
              <ProductThumb
                item={{ image: src, title: `${title} ${index + 1}` }}
                className="h-16 w-16"
                compact
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
