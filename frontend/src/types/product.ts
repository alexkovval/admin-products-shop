export const PRODUCT_CATEGORIES = ["skincare", "makeup", "fragrance", "hair", "body"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: number;
  name: string;
  brand: string;
  category: ProductCategory;
  description: string;
  price: string;
  stock: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

export interface ProductListParams {
  search?: string;
  ordering?: string;
  page?: number;
  category?: string;
  in_stock?: boolean;
}

export type ProductPayload = Omit<Product, "id" | "created_at" | "updated_at">;
