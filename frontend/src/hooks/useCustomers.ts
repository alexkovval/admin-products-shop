import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCustomer, deleteCustomer, getCustomer, getCustomers, updateCustomer } from "../api/customers";
import type { Customer, CustomerListParams } from "../types/customer";

export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => getCustomers(params),
    placeholderData: keepPreviousData, // avoids table flicker while typing/paging
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
