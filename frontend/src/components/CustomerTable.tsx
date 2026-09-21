import type { Customer } from "../types/customer";

interface Column {
  field: string;
  label: string;
}

const COLUMNS: Column[] = [
  { field: "first_name", label: "First name" },
  { field: "last_name", label: "Last name" },
  { field: "phone_number", label: "Phone" },
  { field: "email", label: "Email" },
  { field: "created_at", label: "Created" },
];

interface CustomerTableProps {
  customers: Customer[];
  ordering: string;
  onSortChange: (ordering: string) => void;
  onRowClick: (id: number) => void;
}

export function CustomerTable({ customers, ordering, onSortChange, onRowClick }: CustomerTableProps) {
  const activeField = ordering.replace(/^-/, "");
  const isDescending = ordering.startsWith("-");

  const toggleSort = (field: string) => {
    if (activeField !== field) {
      onSortChange(field);
    } else {
      onSortChange(isDescending ? field : `-${field}`);
    }
  };

  return (
    <div className="overflow-hidden overflow-x-auto rounded-xl border border-blue-100 shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-blue-600">
            {COLUMNS.map((column) => {
              const isActive = activeField === column.field;
              return (
                <th key={column.field} className="p-0">
                  <button
                    type="button"
                    onClick={() => toggleSort(column.field)}
                    className="flex w-full items-center gap-1 px-4 py-3 text-xs font-semibold tracking-wide text-white uppercase hover:bg-blue-700"
                  >
                    {column.label}
                    {isActive && <span aria-hidden="true">{isDescending ? "▼" : "▲"}</span>}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-50 bg-white">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              onClick={() => onRowClick(customer.id)}
              className="cursor-pointer transition-colors hover:bg-blue-50"
            >
              <td className="px-4 py-3 text-slate-800">{customer.first_name}</td>
              <td className="px-4 py-3 text-slate-800">{customer.last_name}</td>
              <td className="px-4 py-3 text-slate-600">{customer.phone_number}</td>
              <td className="px-4 py-3 text-slate-600">{customer.email}</td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(customer.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
