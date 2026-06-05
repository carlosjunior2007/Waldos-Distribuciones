import { Download, FileText, Package, Truck, X } from "lucide-react";
import { createPortal } from "react-dom";
import {
  calculateDerivedOrderStatus,
  calculateOrderRealProfit,
  formatDate,
  formatMoney,
  getAddressLabel,
  getOrderStatusMeta,
  getPaymentStatusMeta,
  isOrderProfitRealized,
} from "../order.helpers";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderProgressBar from "./OrderProgressBar";

export default function OrderDetailsModal({
  open,
  order,
  onClose,
  onEdit,
  onScheduleDelivery,
  onViewDeliveries,
  onDownloadCounterReceipt,
}) {
  if (!open || !order || typeof document === "undefined") return null;

  const status = getOrderStatusMeta(calculateDerivedOrderStatus(order));
  const payment = getPaymentStatusMeta(order.estado_pago);
  const realProfit = calculateOrderRealProfit(order);
  const showProfit = isOrderProfitRealized(order);

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-background">
      <div className="flex h-screen flex-col overflow-hidden">
        <header className="shrink-0 border-b border-border bg-surface px-4 py-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)] md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-600">
                Detalle del pedido
              </p>
              <h2 className="mt-1 truncate text-2xl font-black text-text-primary md:text-3xl">
                {order.folio}
              </h2>
              <p className="mt-1 truncate text-sm font-semibold text-text-secondary">
                {order.cliente_nombre} · {order.quotation ? `Cotización ${order.quotation.folio}` : "Sin cotización asociada"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge meta={status} />
              <OrderStatusBadge meta={payment} />
              <button
                type="button"
                onClick={() => onEdit(order)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-black text-text-primary transition hover:bg-surface-soft"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onScheduleDelivery(order)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-black text-white transition hover:bg-accent-600"
              >
                <Truck className="h-4 w-4" />
                Programar entrega
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface text-text-primary transition hover:bg-surface-soft"
                aria-label="Cerrar detalle"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl space-y-5">
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
              <div className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] lg:items-start">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">
                      Cliente
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-text-primary">
                      {order.cliente_nombre}
                    </h3>
                    <div className="mt-3 grid gap-2 text-sm font-semibold text-text-secondary sm:grid-cols-2">
                      <p className="truncate">{order.cliente_email || "Sin correo"}</p>
                      <p className="truncate">{order.cliente_telefono || "Sin teléfono"}</p>
                      <p className="truncate">Tracking: {order.tracking_token || "Sin tracking"}</p>
                      <p>{order.deliveries?.length || 0} entrega{(order.deliveries?.length || 0) === 1 ? "" : "s"} registrada{(order.deliveries?.length || 0) === 1 ? "" : "s"}</p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-border bg-background p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">
                      Progreso de entrega
                    </p>
                    <div className="mt-3">
                      <OrderProgressBar details={order.details || []} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">
                  Ganancia real
                </p>

                <div className="mt-4 space-y-3 text-sm">
                  <SummaryLine label="Venta del pedido" value={formatMoney(order.subtotal)} />
                  <SummaryLine label="Venta entregada" value={formatMoney(realProfit.deliveredSale)} />
                  <SummaryLine label="Costo real FIFO" value={formatMoney(realProfit.realCost)} />
                  <SummaryLine label="Ganancia real" value={formatMoney(realProfit.realProfit)} highlight={realProfit.realProfit >= 0 ? "success" : "error"} note={showProfit ? "Pedido entregado y pagado" : "Se vuelve final cuando esté entregado y pagado"} />
                  <SummaryLine label="Margen real" value={`${realProfit.realMargin.toFixed(1)}%`} />
                  <SummaryLine label="Total con impuestos" value={formatMoney(order.total)} bold />
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <InfoCard label="Fecha inicio" value={formatDate(order.entrega_inicio)} />
              <InfoCard label="Fecha fin" value={formatDate(order.entrega_fin)} />
              <InfoCard label="Estado factura" value={getInvoiceLabel(order)} />
              <InfoCard label="Referencia de pago" value={order.pago_referencia || "Sin referencia"} />
            </section>

            <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">Pago</p>
                  <h4 className="mt-1 text-lg font-black text-text-primary">Gestión del cobro</h4>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <InfoCard label="Estado" value={payment.label} />
                <InfoCard label="Método" value={order.metodo_pago || "Sin definir"} />
                <InfoCard label="Monto pagado" value={formatMoney(realProfit.paidAmount)} />
                <InfoCard label="Fecha de pago" value={order.pago_fecha ? formatDate(order.pago_fecha) : "Sin fecha"} />
              </div>
              <p className="mt-3 rounded-2xl border border-border bg-background p-4 text-sm font-semibold text-text-secondary">
                {order.pago_notas || "Sin notas de pago."}
              </p>
            </section>

            <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">
                Cotización asociada
              </p>

              {order.quotation ? (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <InfoCard label="Folio" value={order.quotation.folio} />
                  <InfoCard label="Estado" value={order.quotation.estado || "Sin estado"} />
                  <InfoCard label="Total" value={formatMoney(order.quotation.total || 0)} />
                  <InfoCard label="Creada" value={formatDate(order.quotation.created_at)} />
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-border bg-background p-4 text-sm font-semibold text-text-muted">
                  Este pedido no está asociado a una cotización.
                </p>
              )}
            </section>

            <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">Productos</p>
                  <h4 className="mt-1 text-lg font-black text-text-primary">Productos del pedido</h4>
                </div>
                <Package className="h-5 w-5 text-text-muted" />
              </div>

              <div className="grid gap-3">
                {(order.details || []).map((item) => {
                  return (
                    <article key={item.id} className="rounded-2xl border border-border bg-background p-4">
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_repeat(4,minmax(110px,auto))] xl:items-center">
                        <div className="min-w-0">
                          <p className="truncate font-black text-text-primary">{item.nombre_producto}</p>
                          <p className="mt-1 text-xs font-semibold text-text-muted">{item.codigo || "Sin código"}</p>
                        </div>

                        <Metric label="Pedida" value={item.cantidad_pedida} />
                        <Metric label="Entregada" value={item.cantidad_entregada} />
                        <Metric label="Pendiente" value={item.cantidad_pendiente} />
                        <Metric label="Importe" value={formatMoney(item.importe)} strong />
                      </div>

                      <div className="mt-3 grid gap-3 border-t border-border pt-3 text-sm md:grid-cols-4">
                        <SummaryLine label="Precio venta" value={formatMoney(item.precio_unitario)} />
                        <SummaryLine label="Costo estimado" value={formatMoney(item.costo_unitario)} />
                        <SummaryLine label="Costo real FIFO" value={formatMoney(item.costo_real_fifo || 0)} />
                        <SummaryLine label="Ganancia real" value={`${formatMoney(item.ganancia_real || 0)} · ${Number(item.venta_entregada || 0) > 0 ? ((Number(item.ganancia_real || 0) / Number(item.venta_entregada || 0)) * 100).toFixed(1) : "0.0"}%`} highlight={Number(item.ganancia_real || 0) >= 0 ? "success" : "error"} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">Entregas</p>
                  <h4 className="mt-1 text-lg font-black text-text-primary">Entregas registradas</h4>
                </div>
                <Truck className="h-5 w-5 text-text-muted" />
              </div>

              <div className="space-y-3">
                {(order.deliveries || []).length ? (
                  (order.deliveries || []).map((delivery) => {
                    const address = (order.cliente_direcciones || []).find((item) => item.id === delivery.cliente_direccion_id);

                    return (
                      <div key={delivery.id} className="rounded-2xl border border-border bg-background p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-black text-text-primary">{delivery.folio}</p>
                            <p className="mt-1 text-sm font-semibold text-text-secondary">{formatDate(delivery.fecha_entrega)}</p>
                            <p className="mt-1 text-xs font-semibold text-text-muted">Destino: {getAddressLabel(address)}</p>
                            <p className="mt-1 text-xs font-semibold text-text-muted">
                              {delivery.details.length} productos incluidos
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => onDownloadCounterReceipt(order, delivery)}
                            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-xs font-black transition hover:bg-surface-soft"
                          >
                            <Download className="h-4 w-4" />
                            Contra recibo
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-2xl border border-dashed border-border p-4 text-sm font-semibold text-text-muted">
                    Todavía no hay entregas registradas.
                  </p>
                )}
              </div>
            </section>
          </div>
        </main>

        <footer className="shrink-0 border-t border-border bg-surface px-4 py-3 md:px-6">
          <div className="mx-auto flex max-w-7xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-border px-4 text-sm font-black transition hover:bg-surface-soft">
              Cerrar
            </button>
            <button type="button" onClick={() => onViewDeliveries(order)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-black transition hover:bg-surface-soft">
              <FileText className="h-4 w-4" />
              Ver entregas
            </button>
            <button type="button" onClick={() => onScheduleDelivery(order)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-black text-white transition hover:bg-accent-600">
              <Truck className="h-4 w-4" />
              Programar entrega
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function getInvoiceLabel(order) {
  const status = String(order?.factura_status || "").toLowerCase();
  if (status === "timbrada") return "Timbrada";
  if (status === "cancelada") return "CFDI cancelado";
  if (status === "error") return "Error factura";
  return "No timbrado";
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className="mt-2 text-sm font-black text-text-primary">{value}</p>
    </div>
  );
}

function Metric({ label, value, strong = false }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className={`mt-1 text-sm ${strong ? "font-black text-text-primary" : "font-bold text-text-secondary"}`}>
        {value}
      </p>
    </div>
  );
}

function SummaryLine({ label, value, bold = false, highlight = null, note = "" }) {
  const colorClass = highlight === "success" ? "text-success-700" : highlight === "error" ? "text-error-700" : "text-text-primary";

  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
      <span className="font-semibold text-text-secondary">{label}</span>
      <span className={`${bold ? "text-lg font-black" : "font-bold"} ${colorClass}`}>
        {value}
      </span>
      {note ? <span className="col-span-2 text-xs font-semibold text-text-muted">{note}</span> : null}
    </div>
  );
}
