import { ChevronLeft, ChevronRight } from "lucide-react";

export default function QuotationsPagination({ page, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-between border-t border-border p-5">
      <p className="text-sm text-text-secondary">
        Página {page} de {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange((prev) => Math.max(1, prev - 1))}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-text-primary disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange((prev) => Math.min(totalPages, prev + 1))}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-text-primary disabled:opacity-50"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}