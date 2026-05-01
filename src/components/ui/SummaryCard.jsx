import { getToneClass } from "@/utils/styles";

export default function SummaryCard({
  title,
  value,
  note,
  icon: Icon,
  tone = "primary",
  onClick,
  className = "",
}) {
  return (
    <article
      onClick={onClick}
      className={[
        "rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] transition",
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-strong)]" : "",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-secondary">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
            {value}
          </h3>
        </div>

        {Icon ? (
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${getToneClass(
              tone
            )}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>

      {note ? (
        <p className="mt-3 text-sm text-text-muted">
          {note}
        </p>
      ) : null}
    </article>
  );
}