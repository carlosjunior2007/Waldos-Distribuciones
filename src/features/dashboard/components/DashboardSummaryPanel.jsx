import { CalendarDays } from "lucide-react";
import { formatMoney } from "../../../utils/formatters";
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
            Pendientes y operación
          </h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <CalendarDays className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryBox
          label="Pedidos pendientes"
          value={resumen.pedidosPendientes || 0}
          note="Pedidos activos que todavía no están entregados."
        />

        <SummaryBox
          label="Entregas pendientes"
          value={resumen.entregasPendientes || 0}
          note="Entregas programadas, pendientes o en ruta."
        />

        <SummaryBox
          label="Pagos pendientes"
          value={resumen.pagosPendientes || 0}
          note={`${formatMoney(resumen.valorPendienteCobro)} por cobrar.`}
        />

        <SummaryBox
          label="Unidades pendientes"
          value={resumen.unidadesPendientes || 0}
          note="Unidades que faltan por entregar en pedidos activos."
        />

        <SummaryBox
          label="Pedidos entregados"
          value={resumen.pedidosEntregados || 0}
          note="Pedidos cerrados en entrega."
        />

        <SummaryBox
          label="Entregas realizadas"
          value={resumen.entregasEntregadas || 0}
          note="Entregas marcadas como entregadas."
        />

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
