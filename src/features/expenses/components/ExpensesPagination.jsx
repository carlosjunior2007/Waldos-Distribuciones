import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ExpensesPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
      <div className="text-sm text-text-secondary">
        Mostrando{" "}
        <span className="font-semibold text-text-primary">
          {totalItems ? (page - 1) * pageSize + 1 : 0}
        </span>{" "}
        a{" "}
        <span className="font-semibold text-text-primary">
          {Math.min(page * pageSize, totalItems)}
        </span>{" "}
        de <span className="font-semibold text-text-primary">{totalItems}</span>{" "}
        resultados
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange((prev) => Math.max(1, prev - 1))}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <div className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary">
          Página {page} de {totalPages}
        </div>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange((prev) => Math.min(totalPages, prev + 1))}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}