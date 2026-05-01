export function TableLayout({
  title,
  subtitle,
  action,
  search,
  filters,
  children,
}) {
  return (
    <section className="rounded-[28px] border border-border bg-surface">
      {/* HEADER */}
      <div className="flex justify-between items-center p-6 border-b border-border">
        <div>
          <p className="text-sm text-accent-600">{subtitle}</p>
          <h2 className="text-xl font-bold">{title}</h2>
        </div>

        {action}
      </div>

      {/* CONTROLES */}
      <div className="p-4 space-y-3">
        {search}
        {filters}
      </div>

      {/* TABLA */}
      <div>{children}</div>
    </section>
  );
}
