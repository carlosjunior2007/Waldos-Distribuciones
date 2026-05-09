import Modal from "../../../components/ui/Modal";
import { formatMoney } from "../../../utils/formatters";
import { formatDateTimeTijuana } from "../../../utils/dates";
import { getMovementMeta } from "../dashboard.helpers";

export default function MovementDetailModal({ item, onClose }) {
  if (!item) return null;

  const { icon: Icon, className } = getMovementMeta(item.type);

  const detailsByType = {
    cotizacion: [
      ["Folio", item.folio],
      ["Cliente", item.cliente_nombre],
      ["Estado", item.estado],
      ["Subtotal", formatMoney(item.subtotal)],
      ["Descuento", formatMoney(item.descuento)],
      ["Gastos", formatMoney(item.gastos)],
      ["Ganancia", formatMoney(item.ganancia)],
      ["Total", formatMoney(item.total)],
    ],
    gasto: [
      ["Concepto", item.concepto],
      ["Descripción", item.descripcion],
      ["Monto", formatMoney(item.monto)],
      ["Tipo", item.tipo],
      ["Fecha", formatDateTimeTijuana(item.fecha)],
      ["Cotización relacionada", item.cotizacion_id],
    ],
    producto: [
      ["Nombre", item.nombre],
      ["Código", item.codigo],
      ["Categoría", item.categoria],
      ["Unidad", item.unidad],
      ["Precio venta", formatMoney(item.precio)],
      ["Precio compra", formatMoney(item.precio_compra)],
      ["Utilidad", formatMoney(item.precio_utilidad)],
      ["Cantidad", String(item.cantidad ?? 0)],
      ["Cantidad por caja", String(item.cantidad_caja ?? 0)],
      ["Disponible", item.disponibilidad ? "Sí" : "No"],
      ["Habilitado", item.habilitado ? "Sí" : "No"],
      ["Descripción", item.descripcion],
    ],
  };

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title={item.title}
      subtitle={`${item.type} • ${formatDateTimeTijuana(item.date)}`}
      width="max-w-2xl"
      zIndex="z-50"
    >
      <div className="p-4 sm:p-5">
        <div className="mb-5 flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${className}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <p className="min-w-0 break-words text-sm leading-relaxed text-text-secondary">
            {item.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(detailsByType[item.type] || []).map(([label, value]) => (
            <DetailRow key={label} label={label} value={value} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-text-primary">
        {value || "Sin información"}
      </p>
    </div>
  );
}