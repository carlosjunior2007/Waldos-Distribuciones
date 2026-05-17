import {
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

export default function OrdersMobileList({
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
    <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
      {orders.map((order) => (
        <OrderMobileCard
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
    </div>
  );
}

function OrderMobileCard({
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
    { label: "Ver pedido", icon: Eye, onClick: () => onView(order) },
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
    <article className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary">{order.folio}</p>

          <p className="mt-1 truncate text-sm text-text-secondary">
            {order.cliente_nombre}
          </p>

          <p className="mt-1 truncate text-xs text-text-muted">
            {order.tracking_token || "Sin tracking"}
          </p>

          {order.is_recurrent ? (
            <span className="mt-2 inline-flex rounded-full border border-primary-100 bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-700">
              Recurrente
            </span>
          ) : null}
        </div>

        <ActionsMenu actions={actions} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <OrderStatusBadge meta={status} />
        <OrderStatusBadge meta={payment} />
        <InvoiceStatusPill order={order} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo label="Inicio" value={formatDate(order.entrega_inicio)} />
        <MiniInfo label="Fin" value={formatDate(order.entrega_fin)} />
        <MiniInfo label="Entregas" value={`${order.deliveries?.length || 0} registradas`} />
        <MiniInfo label="Total" value={formatMoney(order.total)} strong />
        <MiniInfo
          label="Ganancia"
          value={`${formatMoney(profit.profit)} · ${profit.margin.toFixed(1)}%`}
          note={showProfit ? "Realizada" : "Estimada, no realizada"}
          strong
        />
        <MiniInfo label="Costo" value={formatMoney(profit.cost)} />
      </div>

      <div className="mt-4">
        <OrderProgressBar details={order.details} />
      </div>

      <button
        type="button"
        onClick={() => onView(order)}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
      >
        <Eye className="h-4 w-4" />
        Ver detalle
      </button>
    </article>
  );
}

function MiniInfo({ label, value, note = "", strong = false }) {
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

      {note ? (
        <p className="mt-1 text-xs text-text-muted">{note}</p>
      ) : null}
    </div>
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
