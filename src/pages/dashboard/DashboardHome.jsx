import {
  CircleDollarSign,
  ReceiptText,
  Package,
  Wallet,
  TrendingUp,
} from "lucide-react";

const STATS = [
  {
    title: "Ganancias",
    value: "$0.00",
    note: "Utilidad total registrada",
    icon: CircleDollarSign,
    tone: "success",
  },
  {
    title: "Gastos",
    value: "$0.00",
    note: "Compras y costos operativos",
    icon: Wallet,
    tone: "warning",
  },
  {
    title: "Cotizaciones",
    value: "0",
    note: "Pendientes, completadas y canceladas",
    icon: ReceiptText,
    tone: "info",
  },
  {
    title: "Productos",
    value: "0",
    note: "Catálogo disponible",
    icon: Package,
    tone: "primary",
  },
];

function statTone(tone) {
  if (tone === "success") {
    return "bg-success-50 text-success-700 border-success-100";
  }

  if (tone === "warning") {
    return "bg-warning-50 text-warning-700 border-warning-100";
  }

  if (tone === "info") {
    return "bg-info-50 text-info-700 border-info-100";
  }

  return "bg-primary-50 text-primary-700 border-primary-100";
}

export default function DashboardHome() {
  return (
    <section className="space-y-6">
      {/* stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATS.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-strong)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-secondary">
                    {item.title}
                  </p>
                  <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                    {item.value}
                  </h3>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${statTone(item.tone)}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                {item.note}
              </p>
            </article>
          );
        })}
      </div>

      {/* main blocks */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-secondary">
                Resumen general
              </p>
              <h3 className="mt-1 text-xl font-bold text-text-primary">
                Estado del negocio
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
                Pendientes
              </p>
              <p className="mt-2 text-2xl font-bold text-text-primary">0</p>
              <p className="mt-1 text-sm text-text-secondary">
                Cotizaciones en espera de seguimiento.
              </p>
            </div>

            <div className="rounded-2xl bg-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
                Completadas
              </p>
              <p className="mt-2 text-2xl font-bold text-text-primary">0</p>
              <p className="mt-1 text-sm text-text-secondary">
                Cotizaciones cerradas con compra confirmada.
              </p>
            </div>

            <div className="rounded-2xl bg-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
                Canceladas
              </p>
              <p className="mt-2 text-2xl font-bold text-text-primary">0</p>
              <p className="mt-1 text-sm text-text-secondary">
                Vencidas o canceladas manualmente.
              </p>
            </div>

            <div className="rounded-2xl bg-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
                Productos activos
              </p>
              <p className="mt-2 text-2xl font-bold text-text-primary">0</p>
              <p className="mt-1 text-sm text-text-secondary">
                Productos disponibles para cotizar.
              </p>
            </div>
          </div>
        </section>

        <aside className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
          <p className="text-sm font-semibold text-text-secondary">
            Actividad reciente
          </p>
          <h3 className="mt-1 text-xl font-bold text-text-primary">
            Últimos movimientos
          </h3>

          <div className="mt-5 space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border bg-surface-soft p-4"
              >
                <p className="text-sm font-semibold text-text-primary">
                  Movimiento #{item}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Aquí puedes mostrar cambios de estado, nuevas cotizaciones o
                  gastos registrados.
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}