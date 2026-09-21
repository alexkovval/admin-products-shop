import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CustomerDetailsDrawer } from "../components/CustomerDetailsDrawer";
import { CustomerEditForm } from "../components/CustomerEditForm";
import { CustomerTable } from "../components/CustomerTable";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";
import { Spinner } from "../components/Spinner";
import { useCustomers } from "../hooks/useCustomers";

const PAGE_SIZE = 10;

export function CustomerListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const ordering = searchParams.get("ordering") ?? "";
  const selectedId = searchParams.get("selected");
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useCustomers({
    search: search || undefined,
    ordering: ordering || undefined,
    page,
  });

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      return next;
    });
  };

  const handleSearch = (value: string) => updateParams({ search: value || null, page: null });
  const handleSortChange = (nextOrdering: string) => updateParams({ ordering: nextOrdering || null });
  const handlePageChange = (nextPage: number) => updateParams({ page: String(nextPage) });
  const handleRowClick = (id: number) => updateParams({ selected: String(id) });
  const handleCloseDrawer = () => updateParams({ selected: null });

  return (
    <div>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-medium tracking-tight text-slate-900">Customers</h1>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New customer
          </button>
        </div>

        <SearchBar value={search} onSearch={handleSearch} />

        {isLoading && (
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-500">
            <Spinner />
            <span>Loading customers…</span>
          </div>
        )}

        {isError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load customers.
            <button type="button" className="ml-2 font-medium underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {data && !isLoading && (
          <>
            {data.results.length === 0 ? (
              <p className="mt-8 text-center text-slate-500">
                {search ? "No matches for this search." : "No customers found."}
              </p>
            ) : (
              <div className={`mt-6 ${isFetching ? "opacity-60 transition-opacity" : ""}`}>
                <CustomerTable
                  customers={data.results}
                  ordering={ordering}
                  onSortChange={handleSortChange}
                  onRowClick={handleRowClick}
                />
              </div>
            )}

            <Pagination
              page={page}
              count={data.count}
              next={data.next}
              previous={data.previous}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {selectedId && <CustomerDetailsDrawer id={Number(selectedId)} onClose={handleCloseDrawer} />}

        {creating && (
          <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
            <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold">New customer</h2>
              <CustomerEditForm onCancel={() => setCreating(false)} onSaved={() => setCreating(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
