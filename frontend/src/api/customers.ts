import type { Customer, CustomerListResponse, CustomerListParams } from "../types/customer";
import { client } from "./client";

export const getCustomers = (params: CustomerListParams) =>
  client.get<CustomerListResponse>("/customers/", { params }).then((r) => r.data);

export const getCustomer = (id: number) =>
  client.get<Customer>(`/customers/${id}/`).then((r) => r.data);

export const createCustomer = (data: Omit<Customer, "id" | "created_at" | "updated_at">) =>
  client.post<Customer>("/customers/", data).then((r) => r.data);

export const updateCustomer = (id: number, data: Partial<Customer>) =>
  client.patch<Customer>(`/customers/${id}/`, data).then((r) => r.data);

export const deleteCustomer = (id: number) => client.delete(`/customers/${id}/`);
