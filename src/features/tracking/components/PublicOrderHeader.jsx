import { CalendarDays, CreditCard, FileDown, PackageCheck } from "lucide-react";
import TrackingStatusBadge from "./TrackingStatusBadge";
import { dateMX, money, safeText } from "../tracking.helpers";
import { generatePublicOrderPDF } from "../services/trackingPdf.service";

export default function PublicOrderHeader({ order, progress }) {
  const tracking = order?.tracking?.token || order?.tracking || "-";

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-600">
            Pedido encontrado
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
            {safeText(order.folio, "Pedido")}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Tracking: <span className="font-black text-slate-800">{tracking}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TrackingStatusBadge status={order.estado} />
          <button
            type="button"
            onClick={() => generatePublicOrderPDF(order)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50"
          >
            <FileDown className="h-4 w-4" />
            Descargar pedido
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={<PackageCheck className="h-5 w-5" />}
          label="Progreso"
          value={`${progress.totalDelivered}/${progress.totalOrdered} unidades`}
          helper={`${progress.totalPending} pendientes`}
        />
        <InfoCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Periodo"
          value={`${dateMX(order.fecha_inicio)} - ${dateMX(order.fecha_fin)}`}
          helper="Fechas del pedido"
        />
        <InfoCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Pago"
          value={safeText(order.estado_pago, "Sin definir")}
          helper={safeText(order.metodo_pago, "Método sin definir")}
        />
        <InfoCard
          icon={<PackageCheck className="h-5 w-5" />}
          label="Total"
          value={money(order.total)}
          helper={`IVA ${Number(order.iva_porcentaje || 0)}%`}
        />
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress.progressPercent}%` }}
        />
      </div>
    </section>
  );
}

function InfoCard({ icon, label, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-base font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}
