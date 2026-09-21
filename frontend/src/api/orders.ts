import type { Order, OrderCreatePayload, OrderListParams, OrderListResponse, OrderStatus } from "../types/order";
import { client } from "./client";

export const getOrders = (params: OrderListParams) =>
  client.get<OrderListResponse>("/orders/", { params }).then((r) => r.data);

export const getOrder = (id: number) => client.get<Order>(`/orders/${id}/`).then((r) => r.data);

export const createOrder = (data: OrderCreatePayload) =>
  client.post<Order>("/orders/", data).then((r) => r.data);

export const updateOrderStatus = (id: number, status: OrderStatus) =>
  client.patch<Order>(`/orders/${id}/`, { status }).then((r) => r.data);
