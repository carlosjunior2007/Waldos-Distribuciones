import { BarChart3 } from "lucide-react";
import EmptyState from "../../../components/ui/EmptyState";

export default function SimpleBarChart({
  title,
  subtitle,
  data,
  valueFormatter = (v) => v,
}) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);

  return (
    <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-secondary">
            {subtitle}
          </p>

          <h3 className="mt-1 text-xl font-bold text-text-primary">
            {title}
          </h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <BarChart3 className="h-5 w-5" />
        </div>
      </div>

      {!data.length ? (
        <EmptyState
          title="Sin datos para graficar"
          description="Cuando existan registros en este rango, aparecerán aquí."
          className="rounded-2xl border border-border bg-surface-soft py-10"
        />
      ) : (
        <div className="space-y-4">
          {data.map((item) => {
            const width = `${Math.max(
              (Number(item.value || 0) / max) * 100,
              4,
            )}%`;

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-text-primary">
                    {item.label}
                  </span>

                  <span className="text-text-secondary">
                    {valueFormatter(item.value)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-surface-soft">
                  <div
                    className="h-full rounded-full bg-primary-600"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}