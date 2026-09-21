import type { OrderStatus } from "../types/order";

const STYLES: Record<OrderStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  paid: "bg-indigo-50 text-indigo-700",
  shipped: "bg-amber-50 text-amber-700",
  done: "bg-green-50 text-green-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STYLES[status]}`}>
      {status}
    </span>
  );
}
