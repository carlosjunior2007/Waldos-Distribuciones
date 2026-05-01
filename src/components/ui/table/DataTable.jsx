export default function DataTable({
  columns,
  data,
  renderRow,
  emptyMessage = "Sin resultados",
}) {
  return (
    <div className="rounded-[24px] border border-border overflow-hidden">
      {/* HEADER */}
      <div className="grid bg-surface-soft border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {columns.map((col) => (
          <div key={col.key}>{col.label}</div>
        ))}
      </div>

      {/* BODY */}
      {!data.length ? (
        <div className="py-12 text-center text-text-muted">{emptyMessage}</div>
      ) : (
        data.map((row, i) => (
          <div
            key={row.id || i}
            className="grid px-4 py-3 border-b border-border items-center"
          >
            {renderRow(row)}
          </div>
        ))
      )}
    </div>
  );
}
