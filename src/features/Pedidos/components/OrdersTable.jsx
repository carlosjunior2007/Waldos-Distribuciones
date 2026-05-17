import {
  CalendarDays,
  Download,
  Eye,
  FileText,
  PackagePlus,
  Pencil,
  ReceiptText,
  Repeat2,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";

import {
  calculateDerivedOrderStatus,
  calculateOrderProfit,
  isOrderProfitRealized,
  formatDate,
  formatMoney,
  getOrderStatusMeta,
  getPaymentStatusMeta,
  getOrderInvoiceReadiness,
} from "../order.helpers";

import OrderStatusBadge from "./OrderStatusBadge";
import OrderProgressBar from "./OrderProgressBar";
import ActionsMenu from "./ActionsMenu";

export default function OrdersTable({
  orders,
  onView,
  onEdit,
  onScheduleDelivery,
  onScheduleRecurringOrder,
  onDeactivateRecurringOrder,
  onViewDeliveries,
  onDownloadCounterReceipt,
  onDownloadPdf,
  onOpenInvoice,
  onCancel,
  onRestore,
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
                ["Fechas", "w-[230px]"],
                ["Total", "w-[135px]"],
                ["Ganancia", "w-[150px]"],
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
                onScheduleRecurringOrder={onScheduleRecurringOrder}
                onDeactivateRecurringOrder={onDeactivateRecurringOrder}
                onViewDeliveries={onViewDeliveries}
                onDownloadCounterReceipt={onDownloadCounterReceipt}
                onDownloadPdf={onDownloadPdf}
                onOpenInvoice={onOpenInvoice}
                onCancel={onCancel}
                onRestore={onRestore}
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
  onScheduleRecurringOrder,
  onDeactivateRecurringOrder,
  onViewDeliveries,
  onDownloadCounterReceipt,
  onDownloadPdf,
  onOpenInvoice,
  onCancel,
  onRestore,
}) {
  const status = getOrderStatusMeta(calculateDerivedOrderStatus(order));
  const payment = getPaymentStatusMeta(order.estado_pago);
  const profit = calculateOrderProfit(order.details);
  const showProfit = isOrderProfitRealized(order);
  const invoiceReadiness = getOrderInvoiceReadiness(order);
  const hasInvoice = Boolean(order.factura_uuid || order.facturama_id || order.factura_status === "timbrada" || order.factura_status === "cancelada");
  const invoiceDisabled = status.key === "cancelado" && !hasInvoice;

  const actions = [
    { label: "Editar pedido", icon: Pencil, onClick: () => onEdit(order) },
    {
      label: "Programar entrega",
      icon: Truck,
      onClick: () => onScheduleDelivery(order),
    },
    {
      label: order.is_recurrent ? "Editar recurrencia" : "Hacer recurrente",
      icon: Repeat2,
      onClick: () => onScheduleRecurringOrder(order),
    },
    ...(order.is_recurrent
      ? [
          {
            label: "Desprogramar recurrencia",
            icon: XCircle,
            danger: true,
            onClick: () => onDeactivateRecurringOrder?.(order),
          },
        ]
      : []),
    {
      label: "Ver entregas",
      icon: PackagePlus,
      onClick: () => onViewDeliveries(order),
    },
    {
      label: "Contra recibo",
      icon: FileText,
      onClick: () => onDownloadCounterReceipt(order),
    },
    { label: "PDF del pedido", icon: Download, onClick: () => onDownloadPdf(order) },
    {
      label: "Factura",
      icon: ReceiptText,
      disabled: invoiceDisabled,
      disabledReason: invoiceDisabled
        ? "No puedes facturar un pedido cancelado sin factura timbrada."
        : hasInvoice
          ? "Ver factura del pedido."
          : "Facturar pedido. No se bloquea por pago o entrega; se validan datos fiscales antes de enviar.",
      onClick: () => onOpenInvoice?.(order),
    },
    ...(status.key === "cancelado"
      ? [
          {
            label: "Descancelar pedido",
            icon: RotateCcw,
            onClick: () => onRestore?.(order),
          },
        ]
      : [
          {
            label: "Cancelar",
            icon: XCircle,
            danger: true,
            onClick: () => onCancel?.(order),
          },
        ]),
  ];

  return (
    <tr className="border-t border-border transition hover:bg-surface-soft/70">
      <td className="px-4 py-4 align-top">
        <p className="text-sm font-bold text-text-primary">{order.folio}</p>

        <p className="mt-1 max-w-[170px] truncate text-xs text-text-muted">
          {order.tracking_token || "Sin tracking"}
        </p>

        {order.is_recurrent ? (
          <span className="mt-2 inline-flex rounded-full border border-primary-100 bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-700">
            Recurrente
          </span>
        ) : null}
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
          <InvoiceStatusPill order={order} />
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="space-y-2 text-sm text-text-secondary">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-accent-500" />
            <span className="line-clamp-1">{formatDate(order.entrega_inicio)}</span>
          </p>

          <p className="text-xs text-text-muted">al {formatDate(order.entrega_fin)}</p>

          <p className="text-xs text-text-muted">
            {order.deliveries?.length || 0} entrega{(order.deliveries?.length || 0) === 1 ? "" : "s"} registrada{(order.deliveries?.length || 0) === 1 ? "" : "s"}
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
        <p className={`text-sm font-black ${profit.profit >= 0 ? "text-success-700" : "text-error-700"}`}>
          {formatMoney(profit.profit)}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {profit.margin.toFixed(1)}% utilidad
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Costo: {formatMoney(profit.cost)}
        </p>
        {!showProfit ? (
          <p className="mt-1 text-[11px] font-semibold text-warning-700">
            Estimada, no realizada
          </p>
        ) : null}
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


function InvoiceStatusPill({ order }) {
  const status = String(order.factura_status || "").toLowerCase();

  if (status === "cancelada") {
    return (
      <span className="inline-flex rounded-full border border-error-100 bg-error-50 px-2.5 py-1 text-[11px] font-bold text-error-700">
        CFDI cancelado
      </span>
    );
  }

  if (status === "timbrada" && (order.factura_uuid || order.facturama_id)) {
    return (
      <span className="inline-flex rounded-full border border-success-100 bg-success-50 px-2.5 py-1 text-[11px] font-bold text-success-700">
        Timbrado
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex rounded-full border border-warning-100 bg-warning-50 px-2.5 py-1 text-[11px] font-bold text-warning-700">
        Error factura
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
      No timbrado
    </span>
  );
}
