import { Building2, CheckCircle2, XCircle } from "lucide-react";

export default function ProveedoresStats({ stats }) {
  const cards = [
    {
      label: "Proveedores",
      value: stats.total,
      description: "Registros totales",
      icon: Building2,
    },
    {
      label: "Activos",
      value: stats.activos,
      description: "Disponibles para productos",
      icon: CheckCircle2,
    },
    {
      label: "Inactivos",
      value: stats.inactivos,
      description: "Ocultos para nuevas asociaciones",
      icon: XCircle,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
                  {card.label}
                </p>

                <p className="mt-3 text-3xl font-black text-text-primary">
                  {card.value}
                </p>

                <p className="mt-1 text-sm text-text-secondary">
                  {card.description}
                </p>
              </div>

              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
