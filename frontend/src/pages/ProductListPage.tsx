import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { ProductDetailsDrawer } from "../components/ProductDetailsDrawer";
import { ProductForm } from "../components/ProductForm";
import { ProductTable } from "../components/ProductTable";
import { SearchBar } from "../components/SearchBar";
import { Spinner } from "../components/Spinner";
import { useProducts } from "../hooks/useProducts";
import { PRODUCT_CATEGORIES } from "../types/product";

const PAGE_SIZE = 10;

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const ordering = searchParams.get("ordering") ?? "";
  const category = searchParams.get("category") ?? "";
  const inStock = searchParams.get("in_stock") === "true";
  const selectedId = searchParams.get("selected");
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useProducts({
    search: search || undefined,
    ordering: ordering || undefined,
    category: category || undefined,
    in_stock: inStock || undefined,
    page,
  });

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight text-slate-900">Products</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New product
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={search}
          onSearch={(v) => updateParams({ search: v || null, page: null })}
          placeholder="Search by name, brand, or description…"
        />
        <select
          value={category}
          onChange={(e) => updateParams({ category: e.target.value || null, page: null })}
          className="rounded-lg border border-blue-200 px-3 py-2 text-sm capitalize"
        >
          <option value="">All categories</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParams({ in_stock: e.target.checked ? "true" : null, page: null })}
          />
          In stock only
        </label>
      </div>

      {isLoading && (
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-500">
          <Spinner />
          <span>Loading products…</span>
        </div>
      )}

      {isError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load products.
          <button type="button" className="ml-2 font-medium underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {data && !isLoading && (
        <>
          {data.results.length === 0 ? (
            <p className="mt-8 text-center text-slate-500">No products found.</p>
          ) : (
            <div className={`mt-6 ${isFetching ? "opacity-60 transition-opacity" : ""}`}>
              <ProductTable
                products={data.results}
                ordering={ordering}
                onSortChange={(o) => updateParams({ ordering: o || null })}
                onRowClick={(id) => updateParams({ selected: String(id) })}
              />
            </div>
          )}
          <Pagination
            page={page}
            count={data.count}
            next={data.next}
            previous={data.previous}
            pageSize={PAGE_SIZE}
            onPageChange={(p) => updateParams({ page: String(p) })}
          />
        </>
      )}

      {selectedId && (
        <ProductDetailsDrawer id={Number(selectedId)} onClose={() => updateParams({ selected: null })} />
      )}

      {creating && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">New product</h2>
            <ProductForm onCancel={() => setCreating(false)} onSaved={() => setCreating(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
