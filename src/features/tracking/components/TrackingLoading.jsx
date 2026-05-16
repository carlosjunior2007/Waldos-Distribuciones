export default function TrackingLoading() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-5">
        <div className="h-5 w-40 rounded-full bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 rounded-3xl bg-slate-100" />
          <div className="h-28 rounded-3xl bg-slate-100" />
          <div className="h-28 rounded-3xl bg-slate-100" />
        </div>
        <div className="h-56 rounded-3xl bg-slate-100" />
      </div>
    </section>
  );
}
