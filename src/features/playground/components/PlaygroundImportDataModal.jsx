import { useMemo, useState } from 'react';
import { Database, Loader2, X } from 'lucide-react';
import { PLAYGROUND_IMPORT_FIELD_SETS } from '../services/playground.service';

const SOURCE_OPTIONS = [
  { value: 'productos', label: 'Productos', description: 'Catálogo, precios, costos y datos comerciales.' },
  { value: 'pedidos', label: 'Pedidos', description: 'Pedidos por periodo para análisis operativo.' },
  { value: 'cotizaciones', label: 'Cotizaciones', description: 'Cotizaciones por periodo.' },
  { value: 'clientes', label: 'Clientes', description: 'Datos generales de clientes.' },
  { value: 'gastos', label: 'Gastos', description: 'Gastos registrados por periodo.' },
  { value: 'entregas', label: 'Entregas', description: 'Historial de entregas por periodo.' },
];

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Todo' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' },
  { value: 'custom', label: 'Personalizado' },
];

function titleFromSource(source) {
  return SOURCE_OPTIONS.find((item) => item.value === source)?.label || 'Datos';
}

export default function PlaygroundImportDataModal({ open, onClose, onImport, loading = false }) {
  const [source, setSource] = useState('productos');
  const [period, setPeriod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [destination, setDestination] = useState('new');
  const [sheetName, setSheetName] = useState('Productos');
  const [selectedFields, setSelectedFields] = useState(() => PLAYGROUND_IMPORT_FIELD_SETS.productos || []);

  const fields = useMemo(() => PLAYGROUND_IMPORT_FIELD_SETS[source] || [], [source]);
  const showPeriod = source !== 'productos' && source !== 'clientes';

  if (!open) return null;

  function handleSourceChange(nextSource) {
    setSource(nextSource);
    setSelectedFields(PLAYGROUND_IMPORT_FIELD_SETS[nextSource] || []);
    setSheetName(titleFromSource(nextSource));
    if (nextSource === 'productos' || nextSource === 'clientes') setPeriod('all');
  }

  function toggleField(field) {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((item) => item !== field) : [...prev, field],
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    onImport?.({
      source,
      period,
      dateFrom,
      dateTo,
      destination,
      sheetName: sheetName.trim() || titleFromSource(source),
      fields: selectedFields,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-600">Importar datos</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Llevar información a una hoja</h2>
            <p className="mt-1 text-sm text-slate-500">Selecciona fuente, periodo y campos para trabajar con ellos en el playground.</p>
          </div>

          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid flex-1 gap-5 overflow-y-auto p-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 p-4">
            <h3 className="text-sm font-black text-slate-900">1. Fuente</h3>
            <div className="mt-3 grid gap-2">
              {SOURCE_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleSourceChange(item.value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    source === item.value
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">{item.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-5">
            {showPeriod ? (
              <div className="rounded-3xl border border-slate-200 p-4">
                <h3 className="text-sm font-black text-slate-900">2. Periodo</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PERIOD_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPeriod(item.value)}
                      className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                        period === item.value
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {period === 'custom' ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Inicio
                      <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10" />
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Fin
                      <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10" />
                    </label>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-3xl border border-slate-200 p-4">
              <h3 className="text-sm font-black text-slate-900">{showPeriod ? '3' : '2'}. Campos</h3>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => setSelectedFields(fields)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Todos</button>
                <button type="button" onClick={() => setSelectedFields([])} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Limpiar</button>
              </div>
              <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {fields.map((field) => (
                  <label key={field} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
                    <input type="checkbox" checked={selectedFields.includes(field)} onChange={() => toggleField(field)} className="h-4 w-4 accent-red-600" />
                    {field}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-4">
              <h3 className="text-sm font-black text-slate-900">{showPeriod ? '4' : '3'}. Destino</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Nombre de hoja
                  <input value={sheetName} onChange={(event) => setSheetName(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10" />
                </label>
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Colocar en
                  <select value={destination} onChange={(event) => setDestination(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10">
                    <option value="new">Crear nueva hoja</option>
                    <option value="current">Usar hoja actual</option>
                  </select>
                </label>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={loading || !selectedFields.length} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            {loading ? 'Importando...' : 'Importar datos'}
          </button>
        </footer>
      </form>
    </div>
  );
}
