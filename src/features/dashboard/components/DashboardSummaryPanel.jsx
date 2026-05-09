import { CalendarDays } from "lucide-react";
import SummaryBox from "./SummaryBox";

export default function DashboardSummaryPanel({ resumen, range }) {
  return (
    <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6 xl:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-secondary">
            Resumen del periodo
          </p>

          <h3 className="mt-1 text-xl font-bold text-text-primary">
            Operación general
          </h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <CalendarDays className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <SummaryBox
          label="Pendientes"
          value={resumen.pendientes}
          note="Cotizaciones en espera de seguimiento."
        />

        <SummaryBox
          label="Completadas"
          value={resumen.completadas}
          note="Cotizaciones cerradas con compra confirmada."
        />

        <SummaryBox
          label="Canceladas / vencidas"
          value={resumen.canceladas}
          note="Cotizaciones que no avanzaron."
        />

        <SummaryBox
          label="Productos nuevos"
          value={resumen.productosNuevos}
          note={
            range === "all"
              ? "Total de productos registrados."
              : "Productos creados dentro del periodo."
          }
        />
      </div>
    </section>
  );
}