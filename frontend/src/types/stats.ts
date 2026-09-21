import type { Product } from "./product";

export type StatsDays = 7 | 30 | 90;

export interface StatsSummary {
  days: StatsDays;
  revenue: number;
  orders: number;
  average_order: number;
  new_customers: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

type ProductInfo = Pick<Product, "id" | "name" | "brand" | "category" | "image_url">;

export interface TopProduct extends ProductInfo {
  units: number;
  revenue: number;
}

export interface LowStockProduct extends ProductInfo {
  stock: number;
}
