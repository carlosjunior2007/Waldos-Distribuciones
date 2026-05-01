export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between",
        className,
      ].join(" ")}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-sm font-semibold text-accent-600">{eyebrow}</p>
        ) : null}

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}