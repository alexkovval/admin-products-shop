import { isAxiosError } from "axios";
import { useState } from "react";
import { useCreateOrder } from "../hooks/useOrders";
import { useCustomers } from "../hooks/useCustomers";
import { useProducts } from "../hooks/useProducts";
import { useDebounce } from "../hooks/useDebounce";
import type { Customer } from "../types/customer";
import type { Product } from "../types/product";
import { ProductImage } from "./ProductImage";

interface Line {
  product: Product;
  quantity: number;
}

interface OrderCreateFormProps {
  onCancel: () => void;
  onCreated: (orderId: number) => void;
}

const inputClass = "w-full rounded border border-gray-300 px-3 py-2 text-sm";

export function OrderCreateForm({ onCancel, onCreated }: OrderCreateFormProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [comment, setComment] = useState("");

  const debouncedCustomer = useDebounce(customerQuery, 250);
  const debouncedProduct = useDebounce(productQuery, 250);
  const customers = useCustomers({ search: debouncedCustomer || undefined });
  const products = useProducts({ search: debouncedProduct || undefined, in_stock: true });
  const createOrder = useCreateOrder();

  const total = lines.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0);

  const addProduct = (product: Product) => {
    setLines((prev) =>
      prev.some((l) => l.product.id === product.id) ? prev : [...prev, { product, quantity: 1 }],
    );
    setProductQuery("");
  };

  const setQuantity = (productId: number, quantity: number) =>
    setLines((prev) =>
      prev.map((l) =>
        l.product.id === productId
          ? { ...l, quantity: Math.min(Math.max(1, quantity || 1), l.product.stock) }
          : l,
      ),
    );

  const removeLine = (productId: number) => setLines((prev) => prev.filter((l) => l.product.id !== productId));

  const serverErrors: string[] = [];
  if (createOrder.isError) {
    if (isAxiosError(createOrder.error) && createOrder.error.response?.status === 400) {
      const data = createOrder.error.response.data as Record<string, unknown>;
      for (const value of Object.values(data)) {
        serverErrors.push(...(Array.isArray(value) ? value.map(String) : [String(value)]));
      }
    } else {
      serverErrors.push("Failed to create the order. Please try again.");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || lines.length === 0) return;
    const order = await createOrder
      .mutateAsync({
        customer: customer.id,
        comment,
        items: lines.map((l) => ({ product: l.product.id, quantity: l.quantity })),
      })
      .catch(() => null);
    if (order) onCreated(order.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium">Customer</label>
        {customer ? (
          <div className="mt-1 flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm">
            <span>
              {customer.first_name} {customer.last_name}
              <span className="ml-2 text-slate-500">{customer.email}</span>
            </span>
            <button type="button" className="text-blue-600" onClick={() => setCustomer(null)}>
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Search customer by name or email…"
              className={inputClass}
            />
            <ul className="mt-1 max-h-40 overflow-y-auto rounded border border-slate-200">
              {customers.data?.results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setCustomer(c)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                  >
                    {c.first_name} {c.last_name}
                    <span className="ml-2 text-slate-500">{c.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Add products</label>
        <input
          value={productQuery}
          onChange={(e) => setProductQuery(e.target.value)}
          placeholder="Search in-stock products…"
          className={inputClass}
        />
        <ul className="mt-1 max-h-48 overflow-y-auto rounded border border-slate-200">
          {products.data?.results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => addProduct(p)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-blue-50"
              >
                <ProductImage product={p} />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="text-slate-500">
                  ${p.price} · {p.stock} left
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {lines.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-medium">Order items</div>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {lines.map((line) => (
              <li key={line.product.id} className="flex items-center gap-3 p-3">
                <ProductImage product={line.product} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{line.product.name}</div>
                  <div className="text-xs text-slate-500">
                    ${line.product.price} · max {line.product.stock}
                  </div>
                </div>
                <input
                  type="number"
                  min={1}
                  max={line.product.stock}
                  value={line.quantity}
                  onChange={(e) => setQuantity(line.product.id, Number(e.target.value))}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                  aria-label={`Quantity of ${line.product.name}`}
                />
                <button
                  type="button"
                  onClick={() => removeLine(line.product.id)}
                  aria-label={`Remove ${line.product.name}`}
                  className="text-slate-400 hover:text-red-600"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Comment</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className={inputClass} />
      </div>

      {serverErrors.length > 0 && (
        <ul className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {serverErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!customer || lines.length === 0 || createOrder.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {createOrder.isPending ? "Creating…" : "Create order"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={createOrder.isPending}
          className="rounded border border-gray-300 px-4 py-2 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
