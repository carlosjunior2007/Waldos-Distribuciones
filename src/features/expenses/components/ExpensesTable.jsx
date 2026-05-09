import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  Eye,
  FileText,
  Plus,
  Receipt,
  Trash2,
  TrendingDown,
} from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import ActionIconButton from "../../../components/ui/ActionIconButton";
import { formatMoney } from "../../../utils/formatters";
import { getMovementType, getNatureStyles } from "../expense.helpers";

export default function ExpensesTable({
  rows,
  loading,
  onDetail,
  onEditExpense,
  onNewExpense,
  onDeleteExpense,
}) {
  return (
    <div className="hidden xl:block">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <thead className="bg-surface-soft">
            <tr>
              {[
                "Concepto",
                "Referencia",
                "Tipo",
                "Naturaleza",
                "Cliente",
                "Fecha",
                "Gastos",
                "Ganancia",
                "Acciones",
              ].map((header, index) => (
                <th
                  key={header}
                  className={[
                    "px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted",
                    index === 0 ? "w-[20%] px-6" : "",
                    index === 8 ? "text-right" : "",
                  ].join(" ")}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((item) => (
                <ExpenseTableRow
                  key={item.id}
                  item={item}
                  onDetail={onDetail}
                  onEditExpense={onEditExpense}
                  onNewExpense={onNewExpense}
                  onDeleteExpense={onDeleteExpense}
                />
              ))
            ) : (
              <tr>
                <td colSpan={9}>
                  <EmptyState loading={loading} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpenseTableRow({
  item,
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
    <tr className="border-t border-border align-top transition hover:bg-surface-soft/70">
      <td className="px-6 py-5">
        <p className="line-clamp-2 text-sm font-semibold leading-6 text-text-primary">
          {item.concepto}
        </p>

        <p className="mt-1 text-xs text-text-muted">
          {item.rowType === "ganancia"
            ? `${item.expenseCount} gasto(s) asociado(s)`
            : "Gasto independiente"}
        </p>
      </td>

      <td className="px-4 py-5">
        <Badge icon={FileText}>{item.referencia}</Badge>
      </td>

      <td className="px-4 py-5">
        <StatusBadge icon={TypeIcon} className={movementType.className}>
          {movementType.label}
        </StatusBadge>
      </td>

      <td className="px-4 py-5">
        <StatusBadge icon={NatureIcon} className={nature.className}>
          {nature.label}
        </StatusBadge>
      </td>

      <td className="px-4 py-5">
        <div className="flex items-start gap-2 pr-2">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />

          <span className="line-clamp-2 text-sm leading-5 text-text-primary">
            {item.cliente}
          </span>
        </div>
      </td>

      <td className="px-4 py-5">
        <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary-500" />
          <span className="whitespace-nowrap">{item.fecha}</span>
        </div>
      </td>

      <td className="px-4 py-5">
        <AmountBadge
          icon={TrendingDown}
          className="border-error-100 bg-error-50 text-error-700"
        >
          {formatMoney(item.gastos)}
        </AmountBadge>
      </td>

      <td className="px-4 py-5">
        <AmountBadge icon={CircleDollarSign} className={nature.amountClass}>
          {formatMoney(item.ganancia)}
        </AmountBadge>
      </td>

      <td className="px-4 py-5">
        <div className="flex items-center justify-end gap-2">
          <ActionIconButton
            icon={Eye}
            label="Ver gastos"
            tone="default"
            onClick={() => onDetail(item)}
          />

          <ActionIconButton
            icon={Receipt}
            label="Editar gasto"
            tone="default"
            disabled={!item.expenses.length}
            onClick={() => onEditExpense(item.expenses[0])}
          />

          <ActionIconButton
            icon={Plus}
            label="Agregar gasto"
            tone="default"
            onClick={() =>
              onNewExpense(item.rowType === "ganancia" ? item.rawId : "")
            }
          />

          <ActionIconButton
            icon={Trash2}
            label="Eliminar"
            tone="default"
            disabled={!item.expenses.length}
            onClick={() => onDeleteExpense(item.expenses[0])}
          />
        </div>
      </td>
    </tr>
  );
}

function Badge({ icon: Icon, children }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-border bg-surface-soft px-3 py-2 text-sm font-medium text-text-primary">
      <Icon className="h-4 w-4 shrink-0 text-primary-500" />
      <span className="truncate">{children}</span>
    </div>
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

function AmountBadge({ icon: Icon, className, children }) {
  return (
    <div
      className={`inline-flex whitespace-nowrap items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </div>
  );
}