import { CalendarDays, CheckCircle2, Download, MapPin, Package, Truck } from 'lucide-react';
import { DELIVERY_STATUS_STYLES, PUBLIC_STATUS_STYLES } from '../tracking.constants';
import {
  dateMX,
  getOrderDeliveries,
  getOrderItems,
  getOrderTotals,
  getPublicProgress,
  getTrackingToken,
  getDeliveryAddress,
  getDeliveryItems,
  getDeliveryItemCode,
  getDeliveryItemName,
  getDeliveryItemQuantity,
  getDeliveryReceiver,
  getDeliveryUnits,
  moneyMX,
  publicDeliveryStatusLabel,
  publicOrderStatusLabel,
  safeText,
} from '../tracking.helpers';
import { generatePublicTrackingPDF } from '../services/trackingPdf.service';

export default function TrackingOrderResult({ order }) {
  const items = getOrderItems(order);
  const deliveries = getOrderDeliveries(order);
  const totals = getOrderTotals(order);
  const progress = getPublicProgress(order);
  const trackingToken = getTrackingToken(order);
  const orderStatus = String(order?.estado || '').toLowerCase();
  const orderStatusClass = PUBLIC_STATUS_STYLES[orderStatus] || PUBLIC_STATUS_STYLES.creado;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-600">Resultado</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Pedido {safeText(order?.folio)}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">Tracking: {trackingToken}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-black ${orderStatusClass}`}>
              {publicOrderStatusLabel(order?.estado)}
            </span>

            <button
              type="button"
              onClick={() => generatePublicTrackingPDF(order)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <Download size={17} />
              Descargar pedido
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-4">
          <InfoCard icon={<Package size={20} />} label="Cliente" value={safeText(order?.cliente_nombre || order?.cliente?.nombre)} />
          <InfoCard icon={<CalendarDays size={20} />} label="Inicio" value={dateMX(order?.fecha_inicio)} />
          <InfoCard icon={<Truck size={20} />} label="Fin" value={dateMX(order?.fecha_fin)} />
          <InfoCard icon={<CheckCircle2 size={20} />} label="Total" value={moneyMX(totals.total)} strong />
        </div>

        <div className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-950">Avance del pedido</h3>
              <p className="mt-1 text-sm text-slate-500">
                {progress.delivered}/{progress.total} unidades entregadas
              </p>
            </div>
            <span className="text-xl font-black text-slate-950">{Math.round(progress.percentage)}%</span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress.percentage}%` }} />
          </div>

          <div className="mt-4 grid gap-3 text-sm font-bold text-slate-600 sm:grid-cols-3">
            <span className="rounded-2xl bg-white px-4 py-3">Pedido: {progress.total}</span>
            <span className="rounded-2xl bg-white px-4 py-3">Entregado: {progress.delivered}</span>
            <span className="rounded-2xl bg-white px-4 py-3">Pendiente: {progress.pending}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <h3 className="text-lg font-black text-slate-950">Productos del pedido</h3>
            <p className="mt-1 text-sm text-slate-500">Cantidades solicitadas, entregadas y pendientes.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Producto</th>
                  <th className="px-5 py-4 text-center">Pedido</th>
                  <th className="px-5 py-4 text-center">Entregado</th>
                  <th className="px-5 py-4 text-center">Pendiente</th>
                  <th className="px-5 py-4 text-right">Precio</th>
                  <th className="px-5 py-4 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, index) => {
                  const quantity = Number(item.cantidad_pedida ?? item.cantidad ?? 0);
                  const delivered = Number(item.cantidad_entregada ?? item.entregado ?? 0);
                  const pending = Math.max(quantity - delivered, 0);
                  const price = Number(item.precio_unitario ?? item.precio ?? 0);

                  return (
                    <tr key={item.id || item.producto_id || index} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">{safeText(item.nombre_producto || item.nombre)}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{safeText(item.codigo, 'Sin código')}</p>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-900">{quantity}</td>
                      <td className="px-5 py-4 text-center font-bold text-emerald-700">{delivered}</td>
                      <td className="px-5 py-4 text-center font-bold text-slate-700">{pending}</td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-700">{moneyMX(price)}</td>
                      <td className="px-5 py-4 text-right font-black text-slate-950">{moneyMX(quantity * price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Resumen</h3>
            <div className="mt-5 space-y-3 text-sm">
              <TotalLine label="Subtotal" value={moneyMX(totals.subtotal)} />
              {totals.descuento > 0 ? <TotalLine label="Descuento" value={`-${moneyMX(totals.descuento)}`} /> : null}
              <TotalLine label={`IVA ${totals.ivaPorcentaje}%`} value={moneyMX(totals.iva)} />
              <div className="mt-4 rounded-2xl bg-red-600 px-4 py-4 text-white">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-black">Total</span>
                  <span className="text-xl font-black">{moneyMX(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div id="ayuda" className="scroll-mt-32 rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-400">Soporte</p>
            <h3 className="mt-2 text-lg font-black">¿Necesitas ayuda?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Comparte estos datos para revisar tu pedido más rápido.
            </p>

            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Folio</p>
                <p className="mt-1 font-black text-white">{safeText(order?.folio)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Tracking</p>
                <p className="mt-1 break-all font-black text-white">{trackingToken}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <h3 className="text-lg font-black text-slate-950">Entregas registradas</h3>
          <p className="mt-1 text-sm text-slate-500">Detalle de entregas, productos incluidos y persona que recibe.</p>
        </div>

        {deliveries.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-slate-500">Todavía no hay entregas registradas.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {deliveries.map((delivery, index) => {
              const status = String(delivery.estado || '').toLowerCase();
              const statusClass = DELIVERY_STATUS_STYLES[status] || DELIVERY_STATUS_STYLES.pendiente;
              const address = getDeliveryAddress(delivery);
              const receiver = getDeliveryReceiver(delivery);
              const deliveryItems = getDeliveryItems(delivery);
              const deliveryUnits = getDeliveryUnits(delivery);

              return (
                <details key={delivery.id || index} className="group p-5 sm:p-6" open={index === 0}>
                  <summary className="flex cursor-pointer list-none flex-col gap-4 rounded-3xl sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="font-black text-slate-950">{safeText(delivery.folio, `Entrega ${index + 1}`)}</h4>
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass}`}>
                          {publicDeliveryStatusLabel(delivery.estado)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 lg:grid-cols-2">
                        <p className="inline-flex items-center gap-2">
                          <CalendarDays size={16} className="shrink-0 text-red-600" />
                          {dateMX(delivery.fecha_entrega, true)}
                        </p>
                        <p className="inline-flex items-center gap-2">
                          <MapPin size={16} className="shrink-0 text-red-600" />
                          <span className="line-clamp-1">{address}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                        <p className="text-xs font-bold text-slate-500">Unidades</p>
                        <p className="text-xl font-black text-slate-950">{deliveryUnits}</p>
                      </div>
                      <span className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700">
                        <span className="group-open:hidden">Ver detalle</span>
                        <span className="hidden group-open:inline">Ocultar detalle</span>
                      </span>
                    </div>
                  </summary>

                  <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="grid gap-4 text-sm lg:grid-cols-2">
                      <DetailBlock label="Recibe" value={receiver} />
                      <DetailBlock label="Dirección" value={address} />
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="grid grid-cols-[1fr_110px] bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        <span>Producto entregado</span>
                        <span className="text-right">Cantidad</span>
                      </div>

                      {deliveryItems.length === 0 ? (
                        <div className="px-4 py-5 text-sm font-semibold text-slate-500">
                          Sin productos detallados para esta entrega.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {deliveryItems.map((item, itemIndex) => {
                            const code = getDeliveryItemCode(item, order);

                            return (
                              <div key={item.id || item.producto_id || itemIndex} className="grid grid-cols-[1fr_110px] gap-4 px-4 py-3 text-sm">
                                <div>
                                  <p className="font-black text-slate-950">{getDeliveryItemName(item, order)}</p>
                                  {code ? <p className="mt-1 text-xs font-semibold text-slate-500">{code}</p> : null}
                                </div>
                                <p className="text-right font-black text-slate-950">{getDeliveryItemQuantity(item)}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function InfoCard({ icon, label, value, strong = false }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">{icon}</div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 truncate ${strong ? 'text-xl font-black text-slate-950' : 'text-sm font-black text-slate-900'}`}>{value}</p>
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-bold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function TotalLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-black text-slate-950">{value}</span>
    </div>
  );
}
