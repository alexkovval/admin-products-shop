import type { Order } from "../types/order";
import { OrderStatusBadge } from "./OrderStatusBadge";

const COLUMNS = [
  { field: "id", label: "Order" },
  { field: "", label: "Customer" },
  { field: "created_at", label: "Date" },
  { field: "", label: "Items" },
  { field: "total", label: "Total" },
  { field: "status", label: "Status" },
];

interface OrderTableProps {
  orders: Order[];
  ordering: string;
  onSortChange: (ordering: string) => void;
  onRowClick: (id: number) => void;
}

export function OrderTable({ orders, ordering, onSortChange, onRowClick }: OrderTableProps) {
  const activeField = ordering.replace(/^-/, "");
  const isDescending = ordering.startsWith("-");

  const toggleSort = (field: string) => {
    if (activeField !== field) onSortChange(field);
    else onSortChange(isDescending ? field : `-${field}`);
  };

  return (
    <div className="overflow-hidden overflow-x-auto rounded-xl border border-blue-100 shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-blue-600">
            {COLUMNS.map((column, index) => (
              <th key={index} className="p-0">
                {column.field ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(column.field)}
                    className="flex w-full items-center gap-1 px-4 py-3 text-xs font-semibold tracking-wide text-white uppercase hover:bg-blue-700"
                  >
                    {column.label}
                    {activeField === column.field && <span aria-hidden="true">{isDescending ? "▼" : "▲"}</span>}
                  </button>
                ) : (
                  <div className="px-4 py-3 text-xs font-semibold tracking-wide text-white uppercase">
                    {column.label}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-50 bg-white">
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => onRowClick(order.id)}
              className="cursor-pointer transition-colors hover:bg-blue-50"
            >
              <td className="px-4 py-3 font-medium text-slate-800">#{order.id}</td>
              <td className="px-4 py-3 text-slate-800">{order.customer_name}</td>
              <td className="px-4 py-3 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-slate-600">{order.items_count}</td>
              <td className="px-4 py-3 text-slate-800">${order.total}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
