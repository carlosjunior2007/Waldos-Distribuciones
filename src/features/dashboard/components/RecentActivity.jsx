import EmptyState from "../../../components/ui/EmptyState";
import { formatDateTimeTijuana } from "../../../utils/dates";
import { getMovementMeta } from "../dashboard.helpers";

export default function RecentActivity({ items, onSelect }) {
  return (
    <aside className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
      <p className="text-sm font-semibold text-text-secondary">
        Actividad reciente
      </p>

      <h3 className="mt-1 text-xl font-bold text-text-primary">
        Últimos movimientos
      </h3>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <EmptyState
            title="Sin movimientos"
            description="No hay registros recientes en este periodo."
            className="rounded-2xl border border-border bg-surface-soft py-10"
          />
        ) : (
          items.map((item) => (
            <RecentActivityItem
              key={item.id}
              item={item}
              onClick={() => onSelect(item)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function RecentActivityItem({ item, onClick }) {
  const { icon: Icon, className } = getMovementMeta(item.type);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-surface-soft p-4 text-left transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/40"
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${className}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">
            {item.title}
          </p>

          <p className="mt-1 text-sm text-text-secondary">
            {item.description}
          </p>

          <p className="mt-2 text-xs text-text-muted">
            {formatDateTimeTijuana(item.date)}
          </p>
        </div>
      </div>
    </button>
  );
}