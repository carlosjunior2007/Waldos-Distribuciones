import { TrendingUp } from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import { formatMoney } from "../../../utils/formatters";

export default function ComparisonChart({ title, subtitle, data }) {
  const max = Math.max(
    ...data.flatMap((item) => [
      Number(item.venta || 0),
      Number(item.costoFifo || 0),
      Number(item.gastos || 0),
      Number(item.ganancia || 0),
    ]),
    1,
  );

  return (
    <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6 xl:col-span-2">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-secondary">{subtitle}</p>
          <h3 className="mt-1 text-xl font-black text-text-primary">{title}</h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success-50 text-success-700">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>

      {!data.length ? (
        <EmptyState
          title="Sin datos financieros"
          description="Todavía no hay ventas, costos o gastos para comparar. Qué descanso para el Excel, por ahora."
          className="rounded-2xl border border-border bg-surface-soft py-10"
        />
      ) : (
        <div className="space-y-5">
          {data.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-surface-soft p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-text-primary">{item.label}</p>
                <p className={`text-sm font-black ${item.neto >= 0 ? "text-success-700" : "text-error-700"}`}>
                  Neto: {formatMoney(item.neto)}
                </p>
              </div>

              <div className="space-y-3">
                <ChartBar label="Venta" value={item.venta} max={max} labelClass="text-primary-700" barClass="bg-primary-600" />
                <ChartBar label="Costo FIFO" value={item.costoFifo} max={max} labelClass="text-warning-800" barClass="bg-warning-500" />
                <ChartBar label="Gastos" value={item.gastos} max={max} labelClass="text-error-700" barClass="bg-error-500" />
                <ChartBar label="Ganancia" value={item.ganancia} max={max} labelClass="text-success-700" barClass="bg-success-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ChartBar({ label, value, max, labelClass, barClass }) {
  const width = `${Math.max((Number(value || 0) / max) * 100, value ? 4 : 0)}%`;

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className={`font-bold ${labelClass}`}>{label}</span>
        <span className="font-semibold text-text-secondary">{formatMoney(value)}</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-background">
        <div className={`h-full rounded-full ${barClass}`} style={{ width }} />
      </div>
    </div>
  );
}
