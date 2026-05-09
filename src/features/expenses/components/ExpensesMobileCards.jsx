import { Eye, Plus, Receipt, Trash2 } from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import { formatMoney } from "../../../utils/formatters";
import { getMovementType, getNatureStyles } from "../expense.helpers";

export default function ExpensesMobileCards({
  rows,
  loading,
  deletingExpenseId,
  onDetail,
  onEditExpense,
  onNewExpense,
  onDeleteExpense,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
      {rows.length ? (
        rows.map((item) => (
          <ExpenseMobileCard
            key={item.id}
            item={item}
            deletingExpenseId={deletingExpenseId}
            onDetail={onDetail}
            onEditExpense={onEditExpense}
            onNewExpense={onNewExpense}
            onDeleteExpense={onDeleteExpense}
          />
        ))
      ) : (
        <EmptyState loading={loading} />
      )}
    </div>
  );
}

function ExpenseMobileCard({
  item,
  deletingExpenseId,
  onDetail,
  onEditExpense,
  onNewExpense,
  onDeleteExpense,
}) {
  const movementType = getMovementType(item.tipo);
  const TypeIcon = movementType.icon;

  const nature = getNatureStyles(item.naturaleza);
  const NatureIcon = nature.icon;

  return (
    <article className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {item.concepto}
          </p>

          <p className="mt-1 text-sm text-text-secondary">{item.referencia}</p>
        </div>

        <StatusBadge icon={NatureIcon} className={nature.className}>
          {nature.label}
        </StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo label="Cliente" value={item.cliente} />
        <MiniInfo label="Fecha" value={item.fecha} />
        <MiniInfo
          label="Gastos"
          value={formatMoney(item.gastos)}
          valueClass="text-error-700"
        />
        <MiniInfo
          label="Ganancia"
          value={formatMoney(item.ganancia)}
          valueClass={item.ganancia >= 0 ? "text-success-700" : "text-error-700"}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge icon={TypeIcon} className={movementType.className}>
          {movementType.label}
        </StatusBadge>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-text-primary">
          {item.rowType === "ganancia"
            ? `${item.expenseCount} gasto(s)`
            : "Gasto independiente"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MobileAction icon={Eye} label="Ver" onClick={() => onDetail(item)} />

        <MobileAction
          icon={Receipt}
          label="Editar"
          disabled={!item.expenses.length}
          onClick={() => onEditExpense(item.expenses[0])}
        />

        <MobileAction
          icon={Plus}
          label="Gasto"
          onClick={() =>
            onNewExpense(item.rowType === "ganancia" ? item.rawId : "")
          }
        />

        <MobileAction
          icon={Trash2}
          label={
            deletingExpenseId && item.expenses[0]?.id === deletingExpenseId
              ? "Eliminando..."
              : "Eliminar"
          }
          disabled={!item.expenses.length}
          onClick={() => onDeleteExpense(item.expenses[0])}
        />
      </div>
    </article>
  );
}

function StatusBadge({ icon: Icon, className, children }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function MiniInfo({ label, value, valueClass = "text-text-primary" }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>

      <p className={`mt-2 text-sm font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function MobileAction({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}