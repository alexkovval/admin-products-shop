import { Link, useSearchParams } from "react-router-dom";
import { ProductImage } from "../components/ProductImage";
import { RevenueChart } from "../components/RevenueChart";
import { Spinner } from "../components/Spinner";
import { useLowStock, useRevenueByDay, useSummary, useTopProducts } from "../hooks/useStats";
import type { StatsDays } from "../types/stats";

const PERIODS: StatsDays[] = [7, 30, 90];

const money = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 py-6 text-slate-500">
      <Spinner />
      <span>Loading…</span>
    </div>
  );
}

function ErrorNote({ what }: { what: string }) {
  return <p className="py-4 text-sm text-red-600">Failed to load {what}.</p>;
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = Number(searchParams.get("days"));
  const days: StatsDays = PERIODS.includes(requested as StatsDays) ? (requested as StatsDays) : 30;

  const summary = useSummary(days);
  const revenue = useRevenueByDay(days);
  const top = useTopProducts(days);
  const lowStock = useLowStock();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-medium tracking-tight text-slate-900">Dashboard</h1>
        <div className="flex rounded-lg border border-blue-200 bg-white p-0.5">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setSearchParams(period === 30 ? {} : { days: String(period) })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                days === period ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50"
              }`}
            >
              {period} days
            </button>
          ))}
        </div>
      </div>

      {summary.isError ? (
        <ErrorNote what="summary" />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card title="Revenue" value={summary.data ? money(summary.data.revenue) : "…"} />
          <Card title="Orders" value={summary.data ? String(summary.data.orders) : "…"} />
          <Card title="Average order" value={summary.data ? money(summary.data.average_order) : "…"} />
          <Card title="New customers" value={summary.data ? String(summary.data.new_customers) : "…"} />
        </div>
      )}

      <Panel title="Revenue by day (cancelled orders excluded)">
        {revenue.isLoading ? <Loading /> : revenue.isError ? <ErrorNote what="revenue" /> : <RevenueChart data={revenue.data ?? []} />}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top products">
          {top.isLoading ? (
            <Loading />
          ) : top.isError ? (
            <ErrorNote what="top products" />
          ) : top.data?.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">No sales in this period.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {top.data?.map((product) => (
                <li key={product.id} className="flex items-center gap-3 py-2">
                  <ProductImage product={product} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-slate-800">{product.name}</div>
                    <div className="text-xs text-slate-500">{product.brand}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-slate-800">{product.units} sold</div>
                    <div className="text-xs text-slate-500">{money(product.revenue)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Running low on stock">
          {lowStock.isLoading ? (
            <Loading />
          ) : lowStock.isError ? (
            <ErrorNote what="stock" />
          ) : lowStock.data?.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStock.data?.map((product) => (
                <li key={product.id}>
                  <Link
                    to={`/products?selected=${product.id}`}
                    className="flex items-center gap-3 rounded py-2 hover:bg-blue-50"
                  >
                    <ProductImage product={product} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.brand}</div>
                    </div>
                    {product.stock === 0 ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        Out of stock
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {product.stock} left
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
