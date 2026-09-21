import type { Product, ProductListParams, ProductListResponse, ProductPayload } from "../types/product";
import { client } from "./client";

export const getProducts = (params: ProductListParams) =>
  client.get<ProductListResponse>("/products/", { params }).then((r) => r.data);

export const getProduct = (id: number) =>
  client.get<Product>(`/products/${id}/`).then((r) => r.data);

export const createProduct = (data: ProductPayload) =>
  client.post<Product>("/products/", data).then((r) => r.data);

export const updateProduct = (id: number, data: Partial<ProductPayload>) =>
  client.patch<Product>(`/products/${id}/`, data).then((r) => r.data);

export const deleteProduct = (id: number) => client.delete(`/products/${id}/`);
