import { Download, FileSpreadsheet, RefreshCcw } from "lucide-react";

import FilterPill from "../../../components/ui/FilterPill";
import { RANGE_OPTIONS } from "../dashboard.constants";

export default function DashboardHeader({
  range,
  setRange,
  filters,
  setFilters,
  periodLabel,
  onExportExcel,
  onRefresh,
}) {
  return (
    <section className="rounded-[30px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.32em] text-accent-600">
            Dashboard real
          </p>

          <h2 className="mt-2 text-3xl font-black text-text-primary">
            Resumen financiero y operativo
          </h2>

          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Venta real, costo FIFO, compras, entregas, pagos, gastos y utilidad neta del periodo. Ahora sí un dashboard, no una decoración con numeritos, qué avance para la especie.
          </p>

          <p className="mt-3 inline-flex rounded-2xl bg-surface-soft px-3 py-2 text-sm font-bold text-text-primary">
            Periodo: {periodLabel}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-text-primary transition hover:bg-surface-soft"
          >
            <RefreshCcw className="h-4 w-4" />
            Actualizar
          </button>


          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary-900 px-4 text-sm font-bold text-white transition hover:bg-primary-800"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel contable
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-text-muted">
              Filtros rápidos
            </p>

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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-text-muted">
                Mes exacto
              </span>
              <input
                type="month"
                value={filters.month}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, month: event.target.value }));
                  setRange("selectedMonth");
                }}
                className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-text-muted">
                Desde
              </span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, startDate: event.target.value }));
                  setRange("custom");
                }}
                className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-text-muted">
                Hasta
              </span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, endDate: event.target.value }));
                  setRange("custom");
                }}
                className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
