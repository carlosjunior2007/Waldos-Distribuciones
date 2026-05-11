import { calculateOrderProgress } from "../order.helpers";

export default function OrderProgressBar({ details = [] }) {
  const progress = calculateOrderProgress(details);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-text-muted">Progreso de entrega</span>
        <span className="font-bold text-text-primary">
          {progress.delivered}/{progress.total} unidades
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
        <div
          className="h-full rounded-full bg-success-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <p className="text-xs text-text-muted">
        Pendiente: {progress.pending} unidades
      </p>
    </div>
  );
}
