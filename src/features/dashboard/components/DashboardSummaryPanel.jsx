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
          label="Cotizaciones enviadas"
          value={resumen.cotizacionesEnviadas || 0}
          note="Cotizaciones esperando respuesta."
        />

        <SummaryBox
          label="Cotizaciones aceptadas"
          value={resumen.cotizacionesAceptadas || 0}
          note="Listas para convertirse en pedido."
        />

        <SummaryBox
          label="Pedidos activos"
          value={
            (resumen.pedidosCreados || 0) +
            (resumen.pedidosEnPreparacion || 0) +
            (resumen.pedidosParciales || 0)
          }
          note="Pedidos creados, en preparación o parcialmente entregados."
        />

        <SummaryBox
          label="Productos nuevos"
          value={resumen.productosNuevos || 0}
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