import { BarChart3 } from "lucide-react";
import EmptyState from "../../../components/ui/EmptyState";
import { formatMoney } from "../../../utils/formatters";

export default function SimpleBarChart({ title, subtitle, data }) {
  const max = Math.max(...data.map((item) => Number(item.compras || 0)), 1);

  return (
    <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-secondary">{subtitle}</p>
          <h3 className="mt-1 text-xl font-black text-text-primary">{title}</h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <BarChart3 className="h-5 w-5" />
        </div>
      </div>

      {!data.length ? (
        <EmptyState
          title="Sin compras para graficar"
          description="Cuando existan compras en este rango, aparecerán aquí. Fascinante, una gráfica que espera datos reales."
          className="rounded-2xl border border-border bg-surface-soft py-10"
        />
      ) : (
        <div className="space-y-4">
          {data.map((item) => {
            const width = `${Math.max((Number(item.compras || 0) / max) * 100, item.compras ? 4 : 0)}%`;

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-black text-text-primary">{item.label}</span>
                  <span className="font-semibold text-text-secondary">{formatMoney(item.compras)}</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-surface-soft">
                  <div className="h-full rounded-full bg-primary-600" style={{ width }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
