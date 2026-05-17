import { Download, FileSearch, PackageCheck, ReceiptText, SearchX, Truck } from 'lucide-react';

export function TrackingInitialState() {
  return (
    <section className="grid gap-5 md:grid-cols-3">
      <StepCard icon={<FileSearch size={22} />} label="Paso 1" title="Ingresa el tracking" text="Usa el código que viene en tu pedido o documento PDF." />
      <StepCard icon={<Truck size={22} />} label="Paso 2" title="Revisa el avance" text="Consulta productos, unidades entregadas y entregas registradas." />
      <StepCard icon={<Download size={22} />} label="Paso 3" title="Descarga documentos" text="Descarga el pedido en PDF y, si ya fue facturado, también la factura en PDF y XML." />
    </section>
  );
}

export function TrackingNotFoundState() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <SearchX size={25} />
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-950">No encontramos ese tracking</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
        Revisa que esté escrito completo. Si el pedido es reciente, puede tardar unos minutos en aparecer.
      </p>
    </section>
  );
}

export function TrackingLoadingState() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-5">
        <div className="h-7 w-56 rounded-xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 rounded-3xl bg-slate-100" />
          <div className="h-28 rounded-3xl bg-slate-100" />
          <div className="h-28 rounded-3xl bg-slate-100" />
        </div>
        <div className="h-64 rounded-3xl bg-slate-100" />
      </div>
    </section>
  );
}

function StepCard({ icon, label, title, text }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/5">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon || <PackageCheck size={22} />}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">{label}</p>
      <h3 className="mt-2 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
