import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileText,
  PackageCheck,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import ActionIconButton from "../../../components/ui/ActionIconButton";
import { formatMoney } from "../../../utils/formatters";
import { getNatureStyles } from "../expense.helpers";

export default function ExpensesTable({
  rows,
  loading,
  onDetail,
  onEditExpense,
  onNewExpense,
  onDeleteExpense,
}) {
  return (
    <div className="hidden w-full xl:block">
      <div className="w-full overflow-hidden rounded-b-2xl">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[13%]" />
            <col className="w-[9%]" />
            <col className="w-[4%]" />
          </colgroup>
          <thead className="bg-surface-soft">
            <tr>
              {[
                "Pedido / cliente",
                "Pago",
                "Venta real",
                "Costo mercancía",
                "Gastos extra",
                "Ganancia neta",
                "Estado",
                "Gasto",
              ].map((header, index) => (
                <th
                  key={header}
                  className={[
                    "px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted",
                    index === 0 ? "px-5" : "",
                    index >= 2 && index <= 5 ? "text-right" : "",
                    index === 7 ? "text-right" : "",
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
                <td colSpan={8}>
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
  const nature = getNatureStyles(item.naturaleza);
  const NatureIcon = nature.icon;

  return (
    <tr onClick={() => onDetail(item)} className="cursor-pointer border-t border-border align-middle transition hover:bg-surface-soft/70">
      <td className="px-5 py-4">
        <div className="block w-full rounded-xl text-left transition hover:text-primary-700">
          <p className="line-clamp-1 text-sm font-semibold leading-5 text-text-primary">
            {item.folio || item.concepto}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
            <Building2 className="h-3.5 w-3.5 text-accent-500" />
            <span className="line-clamp-1">{item.cliente}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
            <CalendarDays className="h-3.5 w-3.5 text-primary-500" />
            <span>{item.fecha}</span>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <Badge icon={FileText}>{item.pagoReferencia || item.referencia}</Badge>
        <p className="mt-1 text-xs text-text-muted">
          Pagado: {formatMoney(item.montoPagado || 0)}
        </p>
      </td>

      <MoneyCell value={item.ventaRealSinIva} note="s/IVA" />
      <MoneyCell value={item.costoMercanciaReal} note={item.hasRealConsumption ? "FIFO" : "estimado"} icon={PackageCheck} />
      <MoneyCell value={item.gastos} note={`${item.expenseCount || 0} gasto(s)`} negative />
      <MoneyCell value={item.ganancia} note="después de gastos" success={item.ganancia >= 0} />

      <td className="px-3 py-4">
        <StatusBadge icon={NatureIcon} className={nature.className}>
          {nature.label}
        </StatusBadge>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          {item.expenses.length ? (
            <>
              <ActionIconButton
                icon={Receipt}
                label="Editar gasto"
                tone="default"
                onClick={(event) => {
                  event.stopPropagation();
                  onEditExpense(item.expenses[0]);
                }}
              />
              <ActionIconButton
                icon={Trash2}
                label="Eliminar gasto"
                tone="default"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteExpense(item.expenses[0]);
                }}
              />
            </>
          ) : (
            <ActionIconButton
              icon={Plus}
              label="Agregar gasto"
              tone="default"
              onClick={(event) => {
                event.stopPropagation();
                onNewExpense(item.rowType === "ganancia" ? item.rawId : "");
              }}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

function Badge({ icon: Icon, children }) {
  return (
    <div className="inline-flex w-full max-w-[230px] items-center gap-2 rounded-xl border border-border bg-surface-soft px-3 py-2 text-sm font-medium text-text-primary">
      <Icon className="h-4 w-4 shrink-0 text-primary-500" />
      <span className="truncate">{children}</span>
    </div>
  );
}

function StatusBadge({ icon: Icon, className, children }) {
  return (
    <span className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function MoneyCell({ value, note, negative = false, success = false, icon: Icon = CircleDollarSign }) {
  const tone = negative
    ? "text-error-700"
    : success
      ? "text-success-700"
      : "text-text-primary";

  return (
    <td className="px-4 py-4 text-right">
      <div className="inline-flex items-center justify-end gap-2">
        <Icon className="h-4 w-4 text-text-muted" />
        <span className={`whitespace-nowrap text-sm font-bold ${tone}`}>{formatMoney(value || 0)}</span>
      </div>
      <p className="mt-1 text-xs text-text-muted">{note}</p>
    </td>
  );
}
