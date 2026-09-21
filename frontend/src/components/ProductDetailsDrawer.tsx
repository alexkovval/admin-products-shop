import { isAxiosError } from "axios";
import { useState } from "react";
import { useDeleteProduct, useProduct } from "../hooks/useProducts";
import { ConfirmDialog } from "./ConfirmDialog";
import { ProductForm } from "./ProductForm";
import { ProductImage } from "./ProductImage";
import { Spinner } from "./Spinner";

interface ProductDetailsDrawerProps {
  id: number;
  onClose: () => void;
}

export function ProductDetailsDrawer({ id, onClose }: ProductDetailsDrawerProps) {
  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteProduct = useDeleteProduct();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(id);
      onClose();
    } catch (error) {
      setConfirmingDelete(false);
      setDeleteError(
        isAxiosError(error) && error.response?.status === 409
          ? "This product is used in orders and can't be deleted. Mark it inactive instead."
          : "Failed to delete the product. Please try again.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Product details</h2>
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
            Failed to load product.
            <button type="button" className="ml-2 underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {product && mode === "view" && (
          <div className="space-y-3">
            <ProductImage product={product} size="lg" />
            <Field label="Name" value={product.name} />
            <Field label="Brand" value={product.brand} />
            <Field label="Category" value={product.category} />
            <Field label="Price" value={`$${product.price}`} />
            <Field label="Stock" value={product.stock === 0 ? "Out of stock" : String(product.stock)} />
            <Field label="Status" value={product.is_active ? "Active" : "Inactive"} />
            {product.description && <Field label="Description" value={product.description} />}

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

        {product && mode === "edit" && (
          <ProductForm product={product} onCancel={() => setMode("view")} onSaved={() => setMode("view")} />
        )}
      </div>

      {product && (
        <ConfirmDialog
          open={confirmingDelete}
          title={`Delete ${product.name}? This can't be undone.`}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleDelete}
          isConfirming={deleteProduct.isPending}
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
