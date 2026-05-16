import {
  Barcode,
  Download,
  Eye,
  Package,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";

import ActionIconButton from "../../../components/ui/ActionIconButton";
import { formatMoney } from "../../../utils/formatters";
import { formatUtilityPercent, getCategoryLabel, getInventoryStatus } from "../product.helpers";

export default function ProductsTable({
  products,
  onView,
  onEdit,
  onDelete,
  onDownloadLabel,
}) {
  return (
    <div className="hidden xl:block">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-surface-soft">
            <tr>
              {[
                "Producto",
                "Código",
                "Categoría",
                "Compra",
                "Utilidad",
                "Venta",
                "Estado",
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
            {products.map((item) => (
              <ProductTableRow
                key={item.id}
                item={item}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onDownloadLabel={onDownloadLabel}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductTableRow({ item, onView, onEdit, onDelete, onDownloadLabel }) {
  const status = getInventoryStatus(item);
  const StatusIcon = status.icon;

  return (
    <tr className="border-t border-border transition hover:bg-surface-soft/70">
      <td className="px-6 py-5">
        <ProductIdentity item={item} />
      </td>

      <td className="px-6 py-5">
        <Badge icon={Barcode}>{item.codigo}</Badge>
      </td>

      <td className="px-6 py-5">
        <Badge icon={Tag}>{getCategoryLabel(item.categoria)}</Badge>
      </td>

      <td className="px-6 py-5 text-sm font-medium text-text-primary">
        {formatMoney(item.precio_compra)}
      </td>

      <td className="px-6 py-5 text-sm font-semibold text-text-primary">
        {formatUtilityPercent(item)}
      </td>

      <td className="px-6 py-5 text-sm font-bold text-text-primary">
        {formatMoney(item.precio)}
      </td>

      <td className="px-6 py-5">
        <StatusBadge icon={StatusIcon} className={status.className}>
          {status.label}
        </StatusBadge>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center justify-end gap-2">
          <ActionIconButton
            icon={Eye}
            label="Ver producto"
            tone="default"
            onClick={() => onView(item)}
          />

          <ActionIconButton
            icon={Pencil}
            label="Editar producto"
            tone="default"
            onClick={() => onEdit(item)}
          />

          <ActionIconButton
            icon={Download}
            label="Descargar etiqueta"
            tone="default"
            onClick={() => onDownloadLabel(item)}
          />

          <ActionIconButton
            icon={Trash2}
            label="Eliminar producto"
            tone="default"
            onClick={() => onDelete(item)}
          />
        </div>
      </td>
    </tr>
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

        <p className="mt-1 w-48 truncate text-xs text-text-muted">
          {item.descripcion || "Producto registrado en catálogo"}
        </p>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-secondary">
      <Icon className="h-4 w-4 text-accent-500" />
      {children || "Sin dato"}
    </div>
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