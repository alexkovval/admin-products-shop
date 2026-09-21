interface PaginationProps {
  page: number;
  count: number;
  next: string | null;
  previous: string | null;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  count,
  next,
  previous,
  pageSize = 20,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="mt-4 flex items-center justify-between">
      <button
        type="button"
        disabled={!previous}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
      >
        Previous
      </button>
      <span className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={!next}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
      >
        Next
      </button>
    </div>
  );
}
