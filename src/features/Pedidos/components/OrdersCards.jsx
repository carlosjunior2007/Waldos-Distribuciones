import {
  CalendarDays,
  Download,
  FileText,
  PackagePlus,
  Pencil,
  ReceiptText,
  Repeat2,
  RotateCcw,
  Truck,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

import {
  calculateDerivedOrderStatus,
  calculateOrderProfit,
  calculateOrderProgress,
  formatDate,
  formatMoney,
  getOrderStatusMeta,
  getPaymentStatusMeta,
  getOrderInvoiceReadiness,
  isOrderProfitRealized,
} from "../order.helpers";

import OrderStatusBadge from "./OrderStatusBadge";
import OrderProgressBar from "./OrderProgressBar";
import ActionsMenu from "./ActionsMenu";

export default function OrdersCards({
  orders,
  onView,
  onEdit,
  onScheduleDelivery,
  onScheduleRecurringOrder,
  onDeactivateRecurringOrder,
  onViewDeliveries,
  onDownloadCounterReceipt,
  onDownloadPdf,
  onDownloadSuppliersPdf,
  onOpenInvoice,
  onCancel,
  onRestore,
  onDelete,
}) {
  return (
    <div className="grid gap-4 border-t border-border bg-background px-4 py-5 md:px-6">
      {orders.map((order) => (
        <OrderCard
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
          onDownloadSuppliersPdf={onDownloadSuppliersPdf}
          onOpenInvoice={onOpenInvoice}
          onCancel={onCancel}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function OrderCard({
  order,
  onView,
  onEdit,
  onScheduleDelivery,
  onScheduleRecurringOrder,
  onDeactivateRecurringOrder,
  onViewDeliveries,
  onDownloadCounterReceipt,
  onDownloadPdf,
  onDownloadSuppliersPdf,
  onOpenInvoice,
  onCancel,
  onRestore,
  onDelete,
}) {
  const status = getOrderStatusMeta(calculateDerivedOrderStatus(order));
  const payment = getPaymentStatusMeta(order.estado_pago);
  const profit = calculateOrderProfit(order.details || []);
  const progress = calculateOrderProgress(order.details || []);
  const showProfit = isOrderProfitRealized(order);
  const invoiceReadiness = getOrderInvoiceReadiness(order);
  const hasInvoice = Boolean(
    order.factura_uuid ||
      order.facturama_id ||
      order.factura_status === "timbrada" ||
      order.factura_status === "cancelada",
  );
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
      label: "PDF proveedores",
      icon: Users,
      onClick: () => onDownloadSuppliersPdf?.(order),
    },
    {
      label: "Factura",
      icon: ReceiptText,
      disabled: invoiceDisabled,
      disabledReason: invoiceDisabled
        ? "No puedes facturar un pedido cancelado sin factura timbrada."
        : hasInvoice
          ? "Ver factura del pedido."
          : invoiceReadiness.message || "Facturar pedido.",
      onClick: () => onOpenInvoice?.(order),
    },
    ...(status.key === "cancelado"
      ? [
          {
            label: "Descancelar pedido",
            icon: RotateCcw,
            onClick: () => onRestore?.(order),
          },
          {
            label: "Eliminar pedido",
            icon: Trash2,
            danger: true,
            onClick: () => onDelete?.(order),
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
    <article
      role="button"
      tabIndex={0}
      onClick={() => onView(order)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(order);
        }
      }}
      className="group rounded-[24px] border border-border bg-surface p-5 shadow-sm outline-none transition hover:border-primary-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] focus-visible:border-primary-400 focus-visible:ring-4 focus-visible:ring-primary-100"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(260px,1fr)_minmax(220px,0.8fr)_minmax(260px,0.9fr)_minmax(260px,0.9fr)_auto] xl:items-center">
        <section className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-black tracking-tight text-text-primary md:text-xl">
                {order.folio}
              </p>
              <p className="mt-1 truncate text-sm font-black uppercase tracking-[0.02em] text-text-primary">
                {order.cliente_nombre}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <SoftTag>{order.quotation ? `Cotización ${order.quotation.folio}` : "Sin cotización"}</SoftTag>
            <SoftTag>{order.tracking_token || "Sin tracking"}</SoftTag>
            {order.is_recurrent ? <SoftTag tone="primary">Recurrente</SoftTag> : null}
          </div>
        </section>

        <section className="flex flex-wrap gap-2 xl:flex-col xl:items-start">
          <OrderStatusBadge meta={status} />
          <OrderStatusBadge meta={payment} />
          <InvoiceStatusPill order={order} />
        </section>

        <section className="grid grid-cols-2 gap-4 sm:max-w-md">
          <CleanMetric label="Total" value={formatMoney(order.total)} helper={`IVA ${Number(order.iva_porcentaje || 0)}%`} />
          <CleanMetric
            label="Ganancia"
            value={formatMoney(profit.profit)}
            helper={`${profit.margin.toFixed(1)}% · ${showProfit ? "realizada" : "estimada"}`}
            tone={profit.profit >= 0 ? "success" : "error"}
          />
        </section>

        <section className="min-w-0">
          <OrderProgressBar details={order.details || []} />
          <p className="mt-2 text-xs font-semibold text-text-muted">
            {order.deliveries?.length || 0} entrega{(order.deliveries?.length || 0) === 1 ? "" : "s"} registrada{(order.deliveries?.length || 0) === 1 ? "" : "s"}
          </p>
        </section>

        <section className="flex items-center justify-between gap-3 xl:flex-col xl:items-end">
          <div className="grid gap-1 text-xs font-semibold text-text-secondary xl:text-right">
            <DateLine label="Inicio" value={formatDate(order.entrega_inicio)} />
            <DateLine label="Fin" value={formatDate(order.entrega_fin)} />
          </div>
          <div
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <ActionsMenu actions={actions} />
          </div>
        </section>
      </div>
    </article>
  );
}

function CleanMetric({ label, value, helper, tone }) {
  const toneClass = tone === "success" ? "text-success-700" : tone === "error" ? "text-error-700" : "text-text-primary";

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">{label}</p>
      <p className={`mt-1 truncate text-xl font-black ${toneClass}`}>{value}</p>
      {helper ? <p className="mt-0.5 truncate text-xs font-semibold text-text-muted">{helper}</p> : null}
    </div>
  );
}

function DateLine({ label, value }) {
  return (
    <p className="flex min-w-0 items-center gap-2 xl:justify-end">
      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-accent-500" />
      <span className="shrink-0 font-black uppercase tracking-[0.12em] text-text-muted">{label}</span>
      <span className="min-w-0 truncate text-text-secondary">{value}</span>
    </p>
  );
}

function SoftTag({ children, tone }) {
  const toneClass = tone === "primary"
    ? "bg-primary-50 text-primary-700 border-primary-100"
    : "bg-surface-soft text-text-muted border-transparent";

  return (
    <span className={`inline-flex max-w-full truncate rounded-full border px-3 py-1 text-xs font-bold ${toneClass}`}>
      {children}
    </span>
  );
}

function InvoiceStatusPill({ order }) {
  const status = String(order.factura_status || "").toLowerCase();

  if (status === "cancelada") {
    return (
      <span className="inline-flex rounded-full border border-error-100 bg-error-50 px-3 py-1.5 text-xs font-semibold text-error-700">
        CFDI cancelado
      </span>
    );
  }

  if (status === "timbrada" && (order.factura_uuid || order.facturama_id)) {
    return (
      <span className="inline-flex rounded-full border border-success-100 bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-700">
        Timbrado
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex rounded-full border border-warning-100 bg-warning-50 px-3 py-1.5 text-xs font-semibold text-warning-700">
        Error factura
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
      No timbrado
    </span>
  );
}
