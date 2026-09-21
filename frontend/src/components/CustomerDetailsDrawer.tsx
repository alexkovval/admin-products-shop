import { isAxiosError } from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCustomer, useDeleteCustomer } from "../hooks/useCustomers";
import { useOrders } from "../hooks/useOrders";
import { ConfirmDialog } from "./ConfirmDialog";
import { CustomerEditForm } from "./CustomerEditForm";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { Spinner } from "./Spinner";

interface CustomerDetailsDrawerProps {
  id: number;
  onClose: () => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function CustomerDetailsDrawer({ id, onClose }: CustomerDetailsDrawerProps) {
  const { data: customer, isLoading, isError, refetch } = useCustomer(id);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteCustomer = useDeleteCustomer();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { data: orders } = useOrders({ customer: id, ordering: "-created_at" });

  const handleSaved = () => {
    setMode("view");
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2000);
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer.mutateAsync(id);
      onClose();
    } catch (error) {
      setConfirmingDelete(false);
      setDeleteError(
        isAxiosError(error) && error.response?.status === 409
          ? "This customer has orders and can't be deleted."
          : "Failed to delete the customer. Please try again.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Customer details</h2>
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
            Failed to load customer.
            <button type="button" className="ml-2 underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {customer && mode === "view" && (
          <div className="space-y-3">
            {showSavedMessage && <p className="text-sm text-green-600">Saved.</p>}
            <Field label="First name" value={customer.first_name} />
            <Field label="Last name" value={customer.last_name} />
            <Field label="Phone" value={customer.phone_number} />
            <Field label="Email" value={customer.email} />
            <Field label="Created" value={dateFormatter.format(new Date(customer.created_at))} />
            <Field label="Updated" value={dateFormatter.format(new Date(customer.updated_at))} />

            <div>
              <div className="text-xs uppercase text-gray-500">Orders ({orders?.count ?? 0})</div>
              {orders && orders.results.length > 0 && (
                <ul className="mt-1 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {orders.results.map((order) => (
                    <li key={order.id}>
                      <Link
                        to={`/orders?selected=${order.id}`}
                        className="flex items-center justify-between px-3 py-2 text-sm hover:bg-blue-50"
                      >
                        <span>
                          #{order.id}
                          <span className="ml-2 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          ${order.total}
                          <OrderStatusBadge status={order.status} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded border border-red-300 px-4 py-2 text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {customer && mode === "edit" && (
          <CustomerEditForm customer={customer} onCancel={() => setMode("view")} onSaved={handleSaved} />
        )}
      </div>

      {customer && (
        <ConfirmDialog
          open={confirmingDelete}
          title={`Delete ${customer.first_name} ${customer.last_name}? This can't be undone.`}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleDelete}
          isConfirming={deleteCustomer.isPending}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div>{value}</div>
    </div>
  );
}
