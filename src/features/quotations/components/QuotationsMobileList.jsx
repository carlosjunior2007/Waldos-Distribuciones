import { Eye, Pencil, Trash2 } from "lucide-react";

import { formatMoney } from "../../../utils/formatters";
import { formatDateTimeTijuana } from "../../../utils/dates";
import { getStatusStyles } from "../quotation.helpers";

export default function QuotationsMobileList({
  rows,
  onDownloadPdf,
  onEdit,
  onDelete,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
      {rows.map((item) => (
        <QuotationMobileCard
          key={item.id}
          item={item}
          onDownloadPdf={onDownloadPdf}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function QuotationMobileCard({ item, onDownloadPdf, onEdit, onDelete }) {
  const statusMeta = getStatusStyles(item.estado);
  const StatusIcon = statusMeta.icon;

  return (
    <article className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {item.folio}
          </p>

          <p className="mt-1 text-sm text-text-secondary">
            {item.cliente_nombre}
          </p>
        </div>

        <StatusBadge icon={StatusIcon} className={statusMeta.className}>
          {statusMeta.label}
        </StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo
          label="Fecha"
          value={formatDateTimeTijuana(item.created_at)}
        />
        <MiniInfo
          label="Vence"
          value={formatDateTimeTijuana(item.fecha_vencimiento)}
        />
        <MiniInfo label="Subtotal" value={formatMoney(item.subtotal || 0)} />
        <MiniInfo
          label={`IVA ${Number(item.iva_porcentaje || 0)}%`}
          value={formatMoney(
            Math.max(
              Number(item.subtotal || 0) - Number(item.descuento || 0),
              0,
            ) *
              (Number(item.iva_porcentaje || 0) / 100),
          )}
        />
        <MiniInfo label="Total" value={formatMoney(item.total)} strong />
        <MiniInfo
          label="Ganancia"
          value={formatMoney(item.ganancia_estimada || 0)}
          valueClass="text-success-700"
          strong
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MobileAction
          icon={Eye}
          label="PDF"
          onClick={() => onDownloadPdf(item.id)}
        />

        <MobileAction
          icon={Pencil}
          label="Editar"
          onClick={() => onEdit(item.id)}
        />

        <MobileAction
          icon={Trash2}
          label="Eliminar"
          onClick={() => onDelete(item)}
        />
      </div>
    </article>
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

function MiniInfo({
  label,
  value,
  strong = false,
  valueClass = "text-text-primary",
}) {
  return (
    <div className="rounded-2xl bg-surface-soft p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>

      <p
        className={`mt-2 text-sm ${
          strong ? "font-bold" : "font-medium"
        } ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function MobileAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
