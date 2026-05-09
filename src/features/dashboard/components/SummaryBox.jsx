export default function SummaryBox({ label, value, note }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>

      <p className="mt-1 text-sm text-text-secondary">{note}</p>
    </div>
  );
}