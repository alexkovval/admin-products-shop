import { isAxiosError } from "axios";
import { useOrder, useUpdateOrderStatus } from "../hooks/useOrders";
import { NEXT_STATUSES, type OrderStatus } from "../types/order";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { ProductImage } from "./ProductImage";
import { Spinner } from "./Spinner";

interface OrderDetailsDrawerProps {
  id: number;
  onClose: () => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

const ACTION_LABELS: Record<OrderStatus, string> = {
  new: "New",
  paid: "Mark as paid",
  shipped: "Mark as shipped",
  done: "Mark as done",
  cancelled: "Cancel order",
};

function errorMessage(error: unknown) {
  if (isAxiosError(error) && error.response?.status === 400) {
    return Object.values(error.response.data as Record<string, string[]>).flat().join(" ");
  }
  return "Something went wrong. Please try again.";
}

export function OrderDetailsDrawer({ id, onClose }: OrderDetailsDrawerProps) {
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Order #{id}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner />
            <span>Loading…</span>
          </div>
        )}

        {isError && (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
            Failed to load order.
            <button type="button" className="ml-2 underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {order && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <OrderStatusBadge status={order.status} />
              <span className="text-sm text-slate-500">{dateFormatter.format(new Date(order.created_at))}</span>
            </div>

            <div>
              <div className="text-xs uppercase text-gray-500">Customer</div>
              <div>{order.customer_name}</div>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase text-gray-500">Items</div>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 p-3">
                    <ProductImage product={item.product} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-slate-800">{item.product.name}</div>
                      <div className="text-xs text-slate-500">
                        {item.quantity} × ${item.unit_price}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-slate-800">${item.line_total}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>${order.total}</span>
              </div>
            </div>

            {order.comment && (
              <div>
                <div className="text-xs uppercase text-gray-500">Comment</div>
                <div>{order.comment}</div>
              </div>
            )}

            {updateStatus.isError && <p className="text-sm text-red-600">{errorMessage(updateStatus.error)}</p>}

            {NEXT_STATUSES[order.status].length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {NEXT_STATUSES[order.status].map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: order.id, status: next })}
                    className={
                      next === "cancelled"
                        ? "rounded border border-red-300 px-4 py-2 text-red-700 disabled:opacity-50"
                        : "rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                    }
                  >
                    {ACTION_LABELS[next]}
                  </button>
                ))}
              </div>
            )}
            {order.status === "cancelled" && (
              <p className="text-sm text-slate-500">Cancelled: items were returned to stock.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
