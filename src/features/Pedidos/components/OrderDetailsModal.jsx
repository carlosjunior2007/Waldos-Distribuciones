import { Download, FileText, Package, Truck } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { calculateDerivedOrderStatus, calculateLineProfit, calculateOrderProfit, formatDate, formatMoney, getAddressLabel, getOrderStatusMeta, getPaymentStatusMeta, isOrderProfitRealized } from "../order.helpers";
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
  if (!order) return null;

  const status = getOrderStatusMeta(calculateDerivedOrderStatus(order));
  const payment = getPaymentStatusMeta(order.estado_pago);
  const profit = calculateOrderProfit(order.details);
  const showProfit = isOrderProfitRealized(order);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pedido ${order.folio}`}
      subtitle="Vista general del pedido, productos, entregas parciales y seguimiento."
      width="max-w-6xl"
    >
      <div className="space-y-5 p-5 md:p-6">
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-[24px] border border-border bg-surface-soft p-4 xl:col-span-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  Cliente
                </p>
                <h3 className="mt-2 text-xl font-bold text-text-primary">
                  {order.cliente_nombre}
                </h3>
                <p className="mt-1 text-sm text-text-secondary">{order.cliente_email}</p>
                <p className="mt-1 text-sm text-text-secondary">{order.cliente_telefono}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <OrderStatusBadge meta={status} />
                <OrderStatusBadge meta={payment} />
              </div>
            </div>

            <div className="mt-5">
              <OrderProgressBar details={order.details} />
            </div>
          </div>

          <div className="rounded-[24px] border border-border bg-surface-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Totales
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <SummaryLine label="Subtotal" value={formatMoney(order.subtotal)} />
              <SummaryLine label="Costo" value={formatMoney(profit.cost)} />
              <SummaryLine label="Ganancia" value={formatMoney(profit.profit)} highlight={profit.profit >= 0 ? "success" : "error"} note={showProfit ? "Realizada" : "Estimada, no realizada"} />
              <SummaryLine label="Margen" value={`${profit.margin.toFixed(1)}%`} />
              <SummaryLine label={`IVA ${order.iva_porcentaje}%`} value={formatMoney(order.total - order.subtotal + Number(order.descuento || 0))} />
              <SummaryLine label="Total" value={formatMoney(order.total)} bold />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <InfoCard label="Fecha inicio" value={formatDate(order.entrega_inicio)} />
          <InfoCard label="Fecha fin" value={formatDate(order.entrega_fin)} />
          <InfoCard label="Tracking" value={order.tracking_token || "Sin tracking"} />
        </section>

        <section className="rounded-[24px] border border-border bg-background p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-bold text-text-primary">Productos del pedido</h4>
            <Package className="h-5 w-5 text-text-muted" />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  <th className="py-3 pr-4">Producto</th>
                  <th className="py-3 pr-4">Pedida</th>
                  <th className="py-3 pr-4">Entregada</th>
                  <th className="py-3 pr-4">Pendiente</th>
                  <th className="py-3 pr-4">Precio</th>
                  <th className="py-3 pr-4">Costo</th>
                  <th className="py-3 pr-4">Ganancia</th>
                  <th className="py-3 pr-4">Importe</th>
                </tr>
              </thead>

              <tbody>
                {order.details.map((item) => {
                  const lineProfit = calculateLineProfit(item);

                  return (
                    <tr key={item.id} className="border-b border-border">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-text-primary">{item.nombre_producto}</p>
                        <p className="text-xs text-text-muted">{item.codigo}</p>
                      </td>
                      <td className="py-3 pr-4">{item.cantidad_pedida}</td>
                      <td className="py-3 pr-4">{item.cantidad_entregada}</td>
                      <td className="py-3 pr-4">{item.cantidad_pendiente}</td>
                      <td className="py-3 pr-4">{formatMoney(item.precio_unitario)}</td>
                      <td className="py-3 pr-4">{formatMoney(item.costo_unitario)}</td>
                      <td className={`py-3 pr-4 font-bold ${lineProfit.profit >= 0 ? "text-success-700" : "text-error-700"}`}>
                        {formatMoney(lineProfit.profit)}
                        <span className="mt-1 block text-xs font-medium text-text-muted">{lineProfit.margin.toFixed(1)}%</span>
                      </td>
                      <td className="py-3 pr-4 font-bold text-text-primary">{formatMoney(item.importe)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[24px] border border-border bg-background p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-bold text-text-primary">Entregas</h4>
            <Truck className="h-5 w-5 text-text-muted" />
          </div>

          <div className="space-y-3">
            {order.deliveries.length ? (
              order.deliveries.map((delivery) => {
                const address = (order.cliente_direcciones || []).find((item) => item.id === delivery.cliente_direccion_id);

                return (
                  <div key={delivery.id} className="rounded-2xl border border-border bg-surface-soft p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-primary">{delivery.folio}</p>
                        <p className="mt-1 text-sm text-text-secondary">{formatDate(delivery.fecha_entrega)}</p>
                        <p className="mt-1 text-xs text-text-muted">Destino: {getAddressLabel(address)}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          {delivery.details.length} productos incluidos
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDownloadCounterReceipt(order, delivery)}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold"
                      >
                        <Download className="h-4 w-4" />
                        Contra recibo
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                Todavía no hay entregas registradas.
              </p>
            )}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-border px-4 text-sm font-semibold">
            Cerrar
          </button>
          <button type="button" onClick={() => onEdit(order)} className="h-11 rounded-2xl border border-border px-4 text-sm font-semibold">
            Editar
          </button>
          <button type="button" onClick={() => onScheduleDelivery(order)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white">
            <Truck className="h-4 w-4" />
            Programar entrega
          </button>
          <button type="button" onClick={() => onViewDeliveries(order)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-semibold">
            <FileText className="h-4 w-4" />
            Ver entregas
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-border bg-surface-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className="mt-2 text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}

function SummaryLine({ label, value, bold = false, highlight = null, note = "" }) {
  const colorClass = highlight === "success" ? "text-success-700" : highlight === "error" ? "text-error-700" : "text-text-primary";

  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
      <span className="text-text-secondary">{label}</span>
      <span className={`${bold ? "text-lg font-bold" : "font-semibold"} ${colorClass}`}>
        {value}
      </span>
      {note ? <span className="col-span-2 text-xs text-text-muted">{note}</span> : null}
    </div>
  );
}
