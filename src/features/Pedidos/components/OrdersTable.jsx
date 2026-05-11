import {
  CalendarDays,
  Download,
  Eye,
  FileText,
  MapPin,
  PackagePlus,
  Pencil,
  Truck,
  XCircle,
} from "lucide-react";

import {
  calculateDerivedOrderStatus,
  formatDate,
  formatMoney,
  getOrderStatusMeta,
  getPaymentStatusMeta,
} from "../order.helpers";

import OrderStatusBadge from "./OrderStatusBadge";
import OrderProgressBar from "./OrderProgressBar";
import ActionsMenu from "./ActionsMenu";

export default function OrdersTable({
  orders,
  onView,
  onEdit,
  onScheduleDelivery,
  onViewDeliveries,
  onDownloadCounterReceipt,
  onDownloadPdf,
}) {
  return (
    <div className="hidden xl:block">
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-surface-soft">
            <tr>
              {[
                ["Pedido", "w-[190px]"],
                ["Cliente", "min-w-[230px]"],
                ["Estado", "w-[210px]"],
                ["Entrega", "w-[210px]"],
                ["Total", "w-[135px]"],
                ["Progreso", "w-[230px]"],
                ["Acciones", "w-[120px] text-right"],
              ].map(([header, width]) => (
                <th
                  key={header}
                  className={`px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted ${width}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onView={onView}
                onEdit={onEdit}
                onScheduleDelivery={onScheduleDelivery}
                onViewDeliveries={onViewDeliveries}
                onDownloadCounterReceipt={onDownloadCounterReceipt}
                onDownloadPdf={onDownloadPdf}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderRow({
  order,
  onView,
  onEdit,
  onScheduleDelivery,
  onViewDeliveries,
  onDownloadCounterReceipt,
  onDownloadPdf,
}) {
  const status = getOrderStatusMeta(calculateDerivedOrderStatus(order));
  const payment = getPaymentStatusMeta(order.estado_pago);

  const actions = [
    { label: "Editar pedido", icon: Pencil, onClick: () => onEdit(order) },
    {
      label: "Programar entrega",
      icon: Truck,
      onClick: () => onScheduleDelivery(order),
    },
    {
      label: "Ver entregas",
      icon: PackagePlus,
      onClick: () => onViewDeliveries(order),
    },
    {
      label: "Descargar contra recibo",
      icon: FileText,
      onClick: () => onDownloadCounterReceipt(order),
    },
    { label: "Descargar PDF", icon: Download, onClick: () => onDownloadPdf(order) },
    {
      label: "Cancelar pedido",
      icon: XCircle,
      danger: true,
      onClick: () => console.log("cancelar", order.id),
    },
  ];

  return (
    <tr className="border-t border-border transition hover:bg-surface-soft/70">
      <td className="px-4 py-4 align-top">
        <p className="text-sm font-bold text-text-primary">{order.folio}</p>

        <p className="mt-1 max-w-[170px] truncate text-xs text-text-muted">
          {order.tracking_token || "Sin tracking"}
        </p>
      </td>

      <td className="px-4 py-4 align-top">
        <p className="max-w-[240px] truncate text-sm font-semibold text-text-primary">
          {order.cliente_nombre}
        </p>

        <p className="mt-1 max-w-[240px] truncate text-xs text-text-muted">
          {order.cliente_email}
        </p>

        <p className="mt-1 text-xs text-text-muted">{order.cliente_telefono}</p>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="flex flex-col items-start gap-2">
          <OrderStatusBadge meta={status} />
          <OrderStatusBadge meta={payment} />
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="space-y-2 text-sm text-text-secondary">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-accent-500" />

            <span className="line-clamp-1">{formatDate(order.entrega_inicio)}</span>
          </p>

          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-accent-500" />

            <span>{order.addresses?.length || 0} direcciones</span>
          </p>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <p className="text-sm font-bold text-text-primary">
          {formatMoney(order.total)}
        </p>

        <p className="mt-1 text-xs text-text-muted">
          IVA {Number(order.iva_porcentaje || 0)}%
        </p>
      </td>

      <td className="px-4 py-4 align-top">
        <OrderProgressBar details={order.details} />
      </td>

      <td className="px-4 py-4 align-top">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onView(order)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
          >
            <Eye className="h-4 w-4" />
            Ver
          </button>

          <ActionsMenu actions={actions} />
        </div>
      </td>
    </tr>
  );
}
