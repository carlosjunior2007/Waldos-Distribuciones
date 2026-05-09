import FilterPill from "../../../components/ui/FilterPill";
import { RANGE_OPTIONS } from "../dashboard.constants";

export default function DashboardHeader({ range, setRange }) {
  return (
    <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent-600">Resumen real</p>

          <h2 className="mt-1 text-2xl font-bold text-text-primary">
            Estado del negocio
          </h2>

          <p className="mt-2 text-sm text-text-secondary">
            Filtra por periodo para ver ventas, ganancias, gastos, cotizaciones
            y productos sin hacer cuentas a mano.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((item) => (
            <FilterPill
              key={item.value}
              label={item.label}
              active={range === item.value}
              onClick={() => setRange(item.value)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}