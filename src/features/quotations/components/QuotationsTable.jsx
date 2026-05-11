import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Download,
  FileCheck2,
  Pencil,
  Trash2,
} from "lucide-react";

import ActionIconButton from "../../../components/ui/ActionIconButton";
import { formatMoney } from "../../../utils/formatters";
import { formatDateTimeTijuana } from "../../../utils/dates";
import { getStatusStyles } from "../quotation.helpers";

export default function QuotationsTable({
  rows,
  onDownloadPdf,
  onEdit,
  onDelete,
  onConvertToOrder,
}) {
  return (
    <div className="hidden xl:block">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-surface-soft">
            <tr>
              {[
                "Folio",
                "Cliente",
                "Fechas",
                "Estado",
                "Total",
                "Ganancia",
                "Acciones",
              ].map((header) => (
                <th
                  key={header}
                  className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted ${
                    header === "Acciones" ? "text-right" : ""
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((item) => (
              <QuotationRow
                key={item.id}
                item={item}
                onDownloadPdf={onDownloadPdf}
                onEdit={onEdit}
                onDelete={onDelete}
                onConvertToOrder={onConvertToOrder}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuotationRow({
  item,
  onDownloadPdf,
  onEdit,
  onDelete,
  onConvertToOrder,
}) {
  const statusMeta = getStatusStyles(item.estado);
  const StatusIcon = statusMeta.icon;

  const canConvert = ["aceptada", "enviada", "borrador"].includes(item.estado);

  return (
    <tr className="border-t border-border transition hover:bg-surface-soft/70">
      <td className="w-[180px] min-w-[180px] px-6 py-5">
        <p className="text-sm font-semibold text-text-primary">{item.folio}</p>
        <p className="mt-1 text-xs text-text-muted">Cotización registrada</p>
      </td>

      <td className="w-[280px] min-w-[280px] px-6 py-5">
        <p className="text-sm font-medium text-text-primary">
          {item.cliente_nombre}
        </p>
      </td>

      <td className="px-6 py-5">
        <div className="space-y-2">
          <DateBadge
            icon={CalendarDays}
            label={`Creada: ${formatDateTimeTijuana(item.created_at)}`}
          />

          <DateBadge
            icon={Clock3}
            label={`Vence: ${formatDateTimeTijuana(item.fecha_vencimiento)}`}
            accent
          />
        </div>
      </td>

      <td className="px-6 py-5">
        <StatusBadge icon={StatusIcon} className={statusMeta.className}>
          {statusMeta.label}
        </StatusBadge>
      </td>

      <td className="w-[200px] min-w-[200px] px-6 py-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-primary">
            {formatMoney(item.total)}
          </p>

          <p className="mt-1 text-xs text-text-muted">
            Subtotal: {formatMoney(item.subtotal || 0)}
          </p>

          <p className="mt-1 text-xs text-text-muted">
            IVA: {Number(item.iva_porcentaje || 0)}%
          </p>
        </div>
      </td>

      <td className="px-6 py-5">
        <AmountBadge>{formatMoney(item.ganancia_estimada || 0)}</AmountBadge>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center justify-end gap-2">
          <ActionIconButton
            icon={Download}
            label="Descargar PDF"
            tone="default"
            onClick={() => onDownloadPdf(item.id)}
          />

          <ActionIconButton
            icon={Pencil}
            label="Editar"
            tone="default"
            onClick={() => onEdit(item.id)}
          />

          {canConvert ? (
            <ActionIconButton
              icon={FileCheck2}
              label="Convertir a pedido"
              tone="default"
              onClick={() => onConvertToOrder(item.id)}
            />
          ) : null}

          <ActionIconButton
            icon={Trash2}
            label="Eliminar"
            tone="default"
            onClick={() => onDelete(item)}
          />
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ icon: Icon, className, children }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function AmountBadge({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-success-100 bg-success-50 px-3 py-2 text-sm font-semibold text-success-700">
      <CircleDollarSign className="h-4 w-4" />
      {children}
    </div>
  );
}

function DateBadge({ icon: Icon, label, accent = false }) {
  return (
    <div className="inline-flex items-center gap-1 text-sm text-text-secondary">
      <Icon
        className={`h-4 w-4 ${accent ? "text-accent-500" : "text-primary-500"}`}
      />
      <span>{label}</span>
    </div>
  );
}