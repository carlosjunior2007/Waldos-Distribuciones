import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductsPagination({
  startItem,
  endItem,
  totalItems,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-text-secondary">
        Mostrando{" "}
        <span className="font-semibold text-text-primary">{startItem}</span>
        {" - "}
        <span className="font-semibold text-text-primary">{endItem}</span>
        {" de "}
        <span className="font-semibold text-text-primary">{totalItems}</span>
        {" productos"}
      </div>

      <div className="flex items-center gap-2 self-end md:self-auto">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <div className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface-soft px-4 text-sm font-semibold text-text-primary">
          Página {currentPage} de {totalPages}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}