import type { Product } from "../types/product";
import { ProductImage } from "./ProductImage";

const COLUMNS = [
  { field: "name", label: "Name" },
  { field: "brand", label: "Brand" },
  { field: "category", label: "Category" },
  { field: "price", label: "Price" },
  { field: "stock", label: "Stock" },
];

interface ProductTableProps {
  products: Product[];
  ordering: string;
  onSortChange: (ordering: string) => void;
  onRowClick: (id: number) => void;
}

export function ProductTable({ products, ordering, onSortChange, onRowClick }: ProductTableProps) {
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
            {COLUMNS.map((column) => (
              <th key={column.field} className="p-0">
                <button
                  type="button"
                  onClick={() => toggleSort(column.field)}
                  className="flex w-full items-center gap-1 px-4 py-3 text-xs font-semibold tracking-wide text-white uppercase hover:bg-blue-700"
                >
                  {column.label}
                  {activeField === column.field && (
                    <span aria-hidden="true">{isDescending ? "▼" : "▲"}</span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-50 bg-white">
          {products.map((product) => (
            <tr
              key={product.id}
              onClick={() => onRowClick(product.id)}
              className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                product.is_active ? "" : "opacity-50"
              }`}
            >
              <td className="px-4 py-3 text-slate-800">
                <div className="flex items-center gap-3">
                  <ProductImage product={product} />
                  {product.name}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{product.brand}</td>
              <td className="px-4 py-3 text-slate-600 capitalize">{product.category}</td>
              <td className="px-4 py-3 text-slate-800">${product.price}</td>
              <td className="px-4 py-3">
                {product.stock === 0 ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    Out of stock
                  </span>
                ) : (
                  <span className="text-slate-600">{product.stock}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
