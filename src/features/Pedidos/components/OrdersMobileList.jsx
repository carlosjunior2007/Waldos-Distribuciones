import {
  Download,
  Eye,
  FileText,
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

export default function OrdersMobileList({
  orders,
  onView,
  onEdit,
  onScheduleDelivery,
  onViewDeliveries,
  onDownloadCounterReceipt,
  onDownloadPdf,
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
          onViewDeliveries={onViewDeliveries}
          onDownloadCounterReceipt={onDownloadCounterReceipt}
          onDownloadPdf={onDownloadPdf}
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
  onViewDeliveries,
  onDownloadCounterReceipt,
  onDownloadPdf,
}) {
  const status = getOrderStatusMeta(calculateDerivedOrderStatus(order));
  const payment = getPaymentStatusMeta(order.estado_pago);

  const actions = [
    { label: "Ver pedido", icon: Eye, onClick: () => onView(order) },
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
    <article className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary">{order.folio}</p>

          <p className="mt-1 truncate text-sm text-text-secondary">
            {order.cliente_nombre}
          </p>

          <p className="mt-1 truncate text-xs text-text-muted">
            {order.tracking_token}
          </p>
        </div>

        <ActionsMenu actions={actions} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <OrderStatusBadge meta={status} />
        <OrderStatusBadge meta={payment} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo label="Entrega inicio" value={formatDate(order.entrega_inicio)} />
        <MiniInfo label="Direcciones" value={`${order.addresses?.length || 0} registradas`} />
        <MiniInfo label="Total" value={formatMoney(order.total)} strong />
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
