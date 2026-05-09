import Modal from "../../../components/ui/Modal";

import { formatMoney } from "../../../utils/formatters";
import { formatExpenseDate } from "../expense.helpers";

export default function ExpenseDetailModal({
  open,
  item,
  onClose,
  onEditExpense,
  onDeleteExpense,
}) {
  if (!item) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        item.rowType === "ganancia" ? "Detalle de ganancia" : "Detalle de gasto"
      }
      subtitle="Detalle del movimiento seleccionado."
      width="max-w-2xl"
      zIndex="z-[80]"
    >
      <div className="space-y-4 p-5 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ["Concepto", item.concepto],
            ["Referencia", item.referencia],
            ["Cliente", item.cliente],
            ["Fecha", item.fecha],
            ["Gastos", formatMoney(item.gastos)],
            ["Neto", formatMoney(item.ganancia)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                {label}
              </p>

              <p className="mt-2 text-sm font-medium text-text-primary">
                {value}
              </p>
            </div>
          ))}
        </div>

        {item.expenses?.length ? (
          <div className="rounded-2xl border border-border bg-surface-soft p-4">
            <p className="text-sm font-semibold text-text-primary">
              Gastos relacionados
            </p>

            <div className="mt-3 space-y-3">
              {item.expenses.map((gasto) => (
                <div
                  key={gasto.id}
                  className="rounded-2xl border border-border bg-surface p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {gasto.concepto}
                      </p>

                      <p className="mt-1 text-sm text-text-secondary">
                        {gasto.descripcion || "Sin descripción"}
                      </p>

                      <p className="mt-2 text-sm font-bold text-error-700">
                        {formatMoney(gasto.monto)}
                      </p>

                      <p className="mt-1 text-xs text-text-muted">
                        {gasto.fecha
                          ? formatExpenseDate(gasto.fecha)
                          : formatExpenseDate(gasto.created_at, {
                              isTimestamp: true,
                            })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditExpense(gasto)}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteExpense(gasto)}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}