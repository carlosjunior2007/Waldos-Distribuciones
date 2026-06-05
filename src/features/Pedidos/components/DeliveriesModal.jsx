import { Download, MapPin, Pencil, Plus, Trash2, Truck } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { formatDate, getAddressLabel, getDeliveryStatusMeta } from "../order.helpers";
import OrderStatusBadge from "./OrderStatusBadge";
import { EmptyState, ModalFooter, ModalSection, primaryButtonClass, secondaryButtonClass, dangerButtonClass, modalBodyClass } from "./ModalUI";

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
      subtitle="Consulta entregas parciales, descarga contra recibos y programa nuevas salidas."
      width="max-w-5xl"
    >
      <div className={modalBodyClass}>
        <ModalSection
          icon={Truck}
          title={order.cliente_nombre}
          description={`${order.deliveries.length} entrega${order.deliveries.length === 1 ? "" : "s"} registrada${order.deliveries.length === 1 ? "" : "s"}.`}
          action={
            <button
              type="button"
              onClick={() => onScheduleDelivery(order)}
              disabled={busy}
              className={primaryButtonClass}
            >
              <Plus className="h-4 w-4" /> Nueva entrega
            </button>
          }
        >
          {order.deliveries.length ? (
            <div className="space-y-4">
              {order.deliveries.map((delivery, index) => {
                const status = getDeliveryStatusMeta(delivery.estado);
                const address = (order.cliente_direcciones || []).find((item) => item.id === delivery.cliente_direccion_id);
                const isPickup = delivery.is_pickup || !delivery.cliente_direccion_id;

                return (
                  <article key={delivery.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 px-4 py-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">#{index + 1}</span>
                          <p className="font-black text-slate-950">{delivery.folio}</p>
                          <OrderStatusBadge meta={status} />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-700">{formatDate(delivery.fecha_entrega)}</p>
                        <div className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{isPickup ? "Recogido por el cliente" : getAddressLabel(address)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => onEditDelivery?.(order, delivery)} disabled={busy} className={secondaryButtonClass}>
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                        <button type="button" onClick={() => onDownloadCounterReceipt(order, delivery)} disabled={busy} className={secondaryButtonClass}>
                          <Download className="h-4 w-4" /> Contra recibo
                        </button>
                        <button type="button" onClick={() => onDeleteDelivery?.(order, delivery)} disabled={busy} className={dangerButtonClass}>
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="min-w-full text-sm">
                          <thead className="bg-white text-left text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Producto</th>
                              <th className="px-4 py-3">Factura / entrada usada</th>
                              <th className="px-4 py-3 text-right">Cantidad entregada</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {delivery.details.map((item) => (
                              <tr key={`${delivery.id}-${item.pedido_detalle_id}`}>
                                <td className="px-4 py-3 font-semibold text-slate-800">{item.nombre_producto}</td>
                                <td className="px-4 py-3 text-xs text-slate-600">
                                  {item.consumos_inventario?.length ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {item.consumos_inventario.map((consumo) => (
                                        <span key={consumo.id} className="rounded-full bg-slate-50 px-2 py-1 font-bold text-slate-700 ring-1 ring-slate-200">
                                          {consumo.entrada?.numero_factura || consumo.entrada?.folio || "Entrada"} · {Number(consumo.cantidad || 0)} pzas
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="font-semibold text-slate-400">Sin consumo de stock todavía</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right font-black text-slate-950">{item.cantidad_entregada}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {delivery.contraRecibo ? (
                        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          Contra recibo generado: <span className="font-black">{delivery.contraRecibo.folio}</span>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                          Contra recibo pendiente. Puedes descargarlo desde esta entrega.
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Truck} title="Sin entregas todavía" description="Programa la primera entrega parcial, completa o una salida recogida por el cliente." />
          )}
        </ModalSection>

        <ModalFooter>
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>Cerrar</button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
