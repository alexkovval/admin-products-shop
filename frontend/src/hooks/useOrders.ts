import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder, getOrder, getOrders, updateOrderStatus } from "../api/orders";
import type { OrderListParams, OrderStatus } from "../types/order";

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => getOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

// Orders change product stock, so product lists must refresh too.
function useInvalidateAfterOrderChange() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };
}

export function useCreateOrder() {
  const invalidate = useInvalidateAfterOrderChange();
  return useMutation({ mutationFn: createOrder, onSuccess: invalidate });
}

export function useUpdateOrderStatus() {
  const invalidate = useInvalidateAfterOrderChange();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => updateOrderStatus(id, status),
    onSuccess: invalidate,
  });
}
