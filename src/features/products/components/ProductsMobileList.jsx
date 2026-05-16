import { Download, Eye, Package, Pencil, Trash2 } from "lucide-react";

import { formatMoney } from "../../../utils/formatters";
import { formatUtilityPercent, getCategoryLabel, getInventoryStatus } from "../product.helpers";

export default function ProductsMobileList({
  products,
  onView,
  onEdit,
  onDelete,
  onDownloadLabel,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
      {products.map((item) => (
        <ProductMobileCard
          key={item.id}
          item={item}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onDownloadLabel={onDownloadLabel}
        />
      ))}
    </div>
  );
}

function ProductMobileCard({ item, onView, onEdit, onDelete, onDownloadLabel }) {
  const status = getInventoryStatus(item);
  const StatusIcon = status.icon;

  return (
    <article className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <ProductIdentity item={item} />

        <StatusBadge icon={StatusIcon} className={status.className}>
          {status.label}
        </StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo label="Categoría" value={getCategoryLabel(item.categoria)} />
        <MiniInfo label="Compra" value={formatMoney(item.precio_compra)} />
        <MiniInfo label="Utilidad" value={formatUtilityPercent(item)} />
        <MiniInfo label="Precio" value={formatMoney(item.precio)} strong />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MobileAction icon={Eye} label="Ver" onClick={() => onView(item)} />
        <MobileAction icon={Pencil} label="Editar" onClick={() => onEdit(item)} />
        <MobileAction
          icon={Download}
          label="Etiqueta"
          onClick={() => onDownloadLabel(item)}
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

function ProductIdentity({ item }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary-100 bg-primary-50 text-primary-700">
        {item.imagen ? (
          <img
            src={item.imagen}
            alt={item.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary">{item.nombre}</p>

        <p className="mt-1 text-xs text-text-muted">
          {item.codigo || "Sin código"}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ icon: Icon, className, children }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function MiniInfo({ label, value, strong = false }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>

      <p
        className={`mt-2 text-sm ${
          strong ? "font-bold" : "font-medium"
        } text-text-primary`}
      >
        {value || "Sin dato"}
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