import { Download, PackageCheck, Search, ShieldCheck, Truck, X } from 'lucide-react';
import { TRACKING_SAMPLE } from '../tracking.constants';

export default function TrackingSearchCard({ tracking, setTracking, status, error, onSearch, onReset }) {
  const isLoading = status === 'loading';

  function handleSubmit(event) {
    event.preventDefault();
    onSearch(tracking);
  }

  return (
    <section id="buscar" className="scroll-mt-32 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
      <div className="grid min-h-[500px] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-red-600">Seguimiento de pedido</p>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Consulta el avance de tu pedido en línea.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Ingresa tu número de tracking para revisar productos, entregas registradas, cantidades pendientes y descargar tu pedido. Si ya tiene factura, también podrás descargar el PDF y el XML.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-2xl rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <label className="text-sm font-black text-slate-950" htmlFor="tracking-number">
              Número de tracking
            </label>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                <input
                  id="tracking-number"
                  value={tracking}
                  onChange={(event) => setTracking(event.target.value.toUpperCase())}
                  placeholder={TRACKING_SAMPLE}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-11 text-sm font-black uppercase tracking-wide text-slate-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                />
                {tracking ? (
                  <button
                    type="button"
                    onClick={onReset}
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-red-600 px-7 text-sm font-black text-white shadow-lg shadow-red-600/25 transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Consultando...' : 'Buscar'}
              </button>
            </div>

            {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <FeaturePill icon={<PackageCheck size={17} />} text="Datos del pedido" />
            <FeaturePill icon={<Truck size={17} />} text="Entregas" />
            <FeaturePill icon={<Download size={17} />} text="Pedido y factura" />
          </div>
        </div>

        <div className="relative hidden min-h-[500px] overflow-hidden bg-slate-950 lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/70 to-red-950/50" />

          <div className="relative z-10 flex h-full flex-col justify-end p-10 text-white">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-950/30">
                <ShieldCheck size={24} />
              </div>
              <h2 className="mt-5 text-2xl font-black">Seguimiento de pedidos y entregas</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Revisa el avance, consulta entregas registradas y descarga el pedido. Si la factura ya está disponible, también podrás bajar su PDF y XML.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturePill({ icon, text }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">
      <span className="text-red-600">{icon}</span>
      {text}
    </div>
  );
}
