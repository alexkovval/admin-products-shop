import { useState } from "react";
import type { Product, ProductCategory } from "../types/product";

const CATEGORY_STYLES: Record<ProductCategory, { gradient: string; label: string }> = {
  skincare: { gradient: "from-emerald-200 to-teal-400", label: "Skincare" },
  makeup: { gradient: "from-rose-200 to-pink-400", label: "Makeup" },
  fragrance: { gradient: "from-violet-200 to-purple-400", label: "Fragrance" },
  hair: { gradient: "from-amber-200 to-orange-400", label: "Hair" },
  body: { gradient: "from-sky-200 to-blue-400", label: "Body" },
};

interface ProductImageProps {
  product: Pick<Product, "name" | "brand" | "category" | "image_url">;
  size?: "sm" | "lg";
}

export function ProductImage({ product, size = "sm" }: ProductImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = product.image_url && failedUrl !== product.image_url;
  const dimensions = size === "sm" ? "h-10 w-10 rounded-lg" : "h-48 w-full rounded-xl";

  if (showImage) {
    return (
      <img
        src={product.image_url}
        alt={product.name}
        onError={() => setFailedUrl(product.image_url)}
        className={`${dimensions} shrink-0 object-cover`}
      />
    );
  }

  const style = CATEGORY_STYLES[product.category];
  return (
    <div
      role="img"
      aria-label={product.name}
      className={`${dimensions} flex shrink-0 flex-col items-center justify-center bg-gradient-to-br ${style.gradient} text-white`}
    >
      {size === "sm" ? (
        <span className="text-sm font-semibold">{product.brand.charAt(0).toUpperCase()}</span>
      ) : (
        <>
          <span className="px-4 text-center text-lg font-semibold">{product.brand}</span>
          <span className="mt-1 text-xs tracking-widest uppercase opacity-80">{style.label}</span>
        </>
      )}
    </div>
  );
}
