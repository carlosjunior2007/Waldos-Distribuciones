export default function ProveedoresPagination({
  startItem,
  endItem,
  totalItems,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border p-5 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
      <p>
        Mostrando <span className="font-bold text-text-primary">{startItem}</span>{" "}
        a <span className="font-bold text-text-primary">{endItem}</span> de{" "}
        <span className="font-bold text-text-primary">{totalItems}</span> proveedores.
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage <= 1}
          className="h-10 rounded-xl border border-border px-3 font-semibold text-text-primary transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>

        <span className="rounded-xl bg-surface-soft px-3 py-2 font-bold text-text-primary">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="h-10 rounded-xl border border-border px-3 font-semibold text-text-primary transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
