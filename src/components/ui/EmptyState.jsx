import { BarChart3, Loader2 } from "lucide-react";

export default function EmptyState({
  loading = false,
  icon: Icon = BarChart3,
  title,
  description,
  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      ].join(" ")}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-soft">
        {loading ? (
          <Loader2 className="h-7 w-7 animate-spin text-text-muted" />
        ) : (
          <Icon className="h-7 w-7 text-text-muted" />
        )}
      </div>

      <h4 className="mt-4 text-lg font-bold text-text-primary">
        {title || (loading ? "Cargando..." : "No hay resultados")}
      </h4>

      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      ) : null}
    </div>
  );
}
