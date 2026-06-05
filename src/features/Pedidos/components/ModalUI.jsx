export const modalBodyClass = "bg-[#f8fafc] p-5 md:p-7";
export const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
export const textareaClass = `${inputClass} min-h-24 py-3`;
export const primaryButtonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButtonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
export const dangerButtonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60";

export function ModalSection({ eyebrow, title, description, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || description || action) ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            {Icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <div className="min-w-0">
              {eyebrow ? <p className="mb-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-accent-600">{eyebrow}</p> : null}
              {title ? <h3 className="text-base font-black text-slate-950">{title}</h3> : null}
              {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Field({ label, helper, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>
      {children}
      {helper ? <span className="mt-1.5 block text-xs leading-5 text-slate-500">{helper}</span> : null}
    </label>
  );
}

export function ReadOnlyCard({ label, value, className = "" }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 ${className}`}>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950">{value || "-"}</p>
    </div>
  );
}

export function ModalFooter({ children }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-6 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:-mx-7 md:-mb-7 md:px-7">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{children}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      {Icon ? <Icon className="mx-auto h-8 w-8 text-slate-400" /> : null}
      <p className="mt-3 font-black text-slate-900">{title}</p>
      {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}
