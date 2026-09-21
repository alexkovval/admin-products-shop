import type { Product } from "./product";

export const ORDER_STATUSES = ["new", "paid", "shipped", "done", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Mirrors Order.TRANSITIONS on the backend; the server is still the source of truth.
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  new: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["done"],
  done: [],
  cancelled: [],
};

export interface OrderItem {
  id: number;
  product: Pick<Product, "id" | "name" | "brand" | "category" | "image_url">;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Order {
  id: number;
  customer: number;
  customer_name: string;
  status: OrderStatus;
  total: string;
  comment: string;
  items: OrderItem[];
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

export interface OrderListParams {
  search?: string;
  ordering?: string;
  page?: number;
  status?: string;
  customer?: number;
  date_from?: string;
  date_to?: string;
}

export interface OrderCreatePayload {
  customer: number;
  comment: string;
  items: { product: number; quantity: number }[];
}
