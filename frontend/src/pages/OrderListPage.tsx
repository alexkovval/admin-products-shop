import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OrderCreateForm } from "../components/OrderCreateForm";
import { OrderDetailsDrawer } from "../components/OrderDetailsDrawer";
import { OrderTable } from "../components/OrderTable";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";
import { Spinner } from "../components/Spinner";
import { useOrders } from "../hooks/useOrders";
import { ORDER_STATUSES } from "../types/order";

const PAGE_SIZE = 10;

export function OrderListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const ordering = searchParams.get("ordering") ?? "";
  const status = searchParams.get("status") ?? "";
  const dateFrom = searchParams.get("date_from") ?? "";
  const dateTo = searchParams.get("date_to") ?? "";
  const selectedId = searchParams.get("selected");
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useOrders({
    search: search || undefined,
    ordering: ordering || undefined,
    status: status || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
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

  const dateInputClass = "rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-700";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight text-slate-900">Orders</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New order
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={search}
          onSearch={(v) => updateParams({ search: v || null, page: null })}
          placeholder="Search by customer or order #…"
        />
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value || null, page: null })}
          className="rounded-lg border border-blue-200 px-3 py-2 text-sm capitalize"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => updateParams({ date_from: e.target.value || null, page: null })}
            className={dateInputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => updateParams({ date_to: e.target.value || null, page: null })}
            className={dateInputClass}
          />
        </label>
      </div>

      {isLoading && (
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-500">
          <Spinner />
          <span>Loading orders…</span>
        </div>
      )}

      {isError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load orders.
          <button type="button" className="ml-2 font-medium underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {data && !isLoading && (
        <>
          {data.results.length === 0 ? (
            <p className="mt-8 text-center text-slate-500">No orders found.</p>
          ) : (
            <div className={`mt-6 ${isFetching ? "opacity-60 transition-opacity" : ""}`}>
              <OrderTable
                orders={data.results}
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

      {selectedId && <OrderDetailsDrawer id={Number(selectedId)} onClose={() => updateParams({ selected: null })} />}

      {creating && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">New order</h2>
            <OrderCreateForm
              onCancel={() => setCreating(false)}
              onCreated={(id) => {
                setCreating(false);
                updateParams({ selected: String(id), page: null });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
