import { CalendarClock, MapPin, Package } from "lucide-react";
import TrackingStatusBadge from "./TrackingStatusBadge";
import { dateTimeMX, getAddressLine, isDeliveredStatus, numberMX, safeText } from "../tracking.helpers";

export default function PublicDeliveriesTimeline({ deliveries = [] }) {
  const orderedDeliveries = [...deliveries].sort((a, b) => {
    return new Date(a.fecha_entrega || 0) - new Date(b.fecha_entrega || 0);
  });

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-950">Entregas</h3>
          <p className="mt-1 text-sm text-slate-500">Historial público de entregas registradas.</p>
        </div>
        <span className="text-sm font-bold text-slate-500">{orderedDeliveries.length} registradas</span>
      </div>

      {orderedDeliveries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Todavía no hay entregas registradas para este pedido.
        </div>
      ) : (
        <div className="space-y-4">
          {orderedDeliveries.map((delivery) => {
            const units = (delivery.entrega_detalles || []).reduce(
              (sum, item) => sum + Number(item.cantidad_entregada || 0),
              0,
            );

            return (
              <article key={delivery.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="font-black text-slate-950">{safeText(delivery.folio, "Entrega")}</h4>
                      <TrackingStatusBadge status={delivery.estado} />
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 lg:grid-cols-3">
                      <Info icon={<CalendarClock className="h-4 w-4" />} text={dateTimeMX(delivery.fecha_entrega)} />
                      <Info icon={<Package className="h-4 w-4" />} text={`${numberMX(units)} unidades`} />
                      <Info icon={<MapPin className="h-4 w-4" />} text={getAddressLine(delivery.cliente_direcciones)} />
                    </div>

                    {delivery.recibido_por && isDeliveredStatus(delivery.estado) && (
                      <p className="mt-3 text-sm text-slate-600">
                        Recibido por: <span className="font-bold text-slate-900">{delivery.recibido_por}</span>
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Info({ icon, text }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-white p-3">
      <span className="mt-0.5 text-red-600">{icon}</span>
      <span className="leading-5">{text}</span>
    </div>
  );
}
