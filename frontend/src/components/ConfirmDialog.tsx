interface ConfirmDialogProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  isConfirming?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  onCancel,
  onConfirm,
  confirmLabel = "Delete",
  isConfirming = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded bg-white p-6 shadow-lg">
        <p className="mb-4">{title}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded border border-gray-300 px-4 py-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {isConfirming ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
