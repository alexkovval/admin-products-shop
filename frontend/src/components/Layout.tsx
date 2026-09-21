import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet } from "react-router-dom";
import { getMe } from "../api/client";
import { useAuth } from "../auth/useAuth";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/customers", label: "Customers", end: false },
  { to: "/products", label: "Products", end: false },
  { to: "/orders", label: "Orders", end: false },
];

export function Layout() {
  const { signOut } = useAuth();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe, staleTime: Infinity });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white p-4 sm:flex">
        <div className="mb-8 px-2 text-lg font-semibold tracking-tight text-slate-900">
          Beauty Products Admin
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-200 px-2 pt-3 text-sm">
          {me && <div className="mb-2 truncate text-slate-500">{me.username}</div>}
          <button type="button" onClick={signOut} className="font-medium text-blue-600 hover:underline">
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 sm:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-600"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button type="button" onClick={signOut} className="ml-auto px-3 py-1.5 text-sm font-medium text-blue-600">
            Sign out
          </button>
        </nav>
        <main className="mx-auto max-w-5xl p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
