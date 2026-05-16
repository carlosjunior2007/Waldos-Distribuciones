import { Download, Pencil, Plus, Trash2, Truck } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { formatDate, getAddressLabel, getDeliveryStatusMeta } from "../order.helpers";
import OrderStatusBadge from "./OrderStatusBadge";

export default function DeliveriesModal({
  open,
  order,
  onClose,
  onScheduleDelivery,
  onDownloadCounterReceipt,
  onEditDelivery,
  onDeleteDelivery,
  busy = false,
}) {
  if (!order) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Entregas · ${order.folio}`}
      subtitle="Historial visual de entregas parciales."
      width="max-w-5xl"
    >
      <div className="space-y-4 p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              {order.cliente_nombre}
            </h4>
            <p className="mt-1 text-sm text-text-secondary">
              {order.deliveries.length} entregas registradas
            </p>
          </div>

          <button
            type="button"
            onClick={() => onScheduleDelivery(order)}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Nueva entrega
          </button>
        </div>

        <div className="space-y-4">
          {order.deliveries.map((delivery) => {
            const status = getDeliveryStatusMeta(delivery.estado);
            const address = (order.cliente_direcciones || []).find((item) => item.id === delivery.cliente_direccion_id);

            return (
              <article key={delivery.id} className="rounded-[24px] border border-border bg-background p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-text-primary">{delivery.folio}</p>
                    <p className="mt-1 text-sm text-text-secondary">{formatDate(delivery.fecha_entrega)}</p>
                    <p className="mt-1 text-xs text-text-muted">{getAddressLabel(address)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <OrderStatusBadge meta={status} />

                    <button
                      type="button"
                      onClick={() => onEditDelivery?.(order, delivery)}
                      disabled={busy}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDownloadCounterReceipt(order, delivery)}
                      disabled={busy}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Download className="h-4 w-4" />
                      Contra recibo
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteDelivery?.(order, delivery)}
                      disabled={busy}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-error-100 bg-error-50 px-3 text-xs font-semibold text-error-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        <th className="py-3 pr-4">Producto</th>
                        <th className="py-3 pr-4">Cantidad entregada</th>
                      </tr>
                    </thead>

                    <tbody>
                      {delivery.details.map((item) => (
                        <tr key={`${delivery.id}-${item.pedido_detalle_id}`} className="border-b border-border">
                          <td className="py-3 pr-4">{item.nombre_producto}</td>
                          <td className="py-3 pr-4 font-bold text-text-primary">
                            {item.cantidad_entregada}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {delivery.contraRecibo ? (
                  <div className="mt-4 rounded-2xl border border-success-100 bg-success-50 p-3 text-sm text-success-700">
                    Contra recibo generado: <span className="font-bold">{delivery.contraRecibo.folio}</span>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-border p-3 text-sm text-text-muted">
                    Contra recibo pendiente. Puedes descargarlo desde el botón de esta entrega.
                  </div>
                )}
              </article>
            );
          })}

          {!order.deliveries.length ? (
            <div className="rounded-[24px] border border-dashed border-border p-8 text-center">
              <Truck className="mx-auto h-8 w-8 text-text-muted" />
              <p className="mt-3 font-semibold text-text-primary">Sin entregas todavía</p>
              <p className="mt-1 text-sm text-text-secondary">
                Programa la primera entrega parcial o completa.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <button type="button" onClick={onClose} disabled={busy} className="h-11 rounded-2xl border border-border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
