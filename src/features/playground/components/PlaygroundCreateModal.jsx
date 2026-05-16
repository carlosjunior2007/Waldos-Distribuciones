import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Loader2, X } from 'lucide-react';

const PURPOSES = [
  {
    id: 'products',
    label: 'Productos',
    description: 'Para calcular precios, importes y utilidad estimada.',
    defaultName: 'Playground de productos',
    defaultSheet: 'Productos',
  },
  {
    id: 'bulk',
    label: 'Cambios masivos',
    description: 'Para revisar ajustes antes de aplicarlos al sistema.',
    defaultName: 'Cambios masivos',
    defaultSheet: 'Revisión',
  },
  {
    id: 'blank',
    label: 'En blanco',
    description: 'Para cálculos libres o análisis internos.',
    defaultName: 'Nuevo playground',
    defaultSheet: 'Hoja 1',
  },
];

export default function PlaygroundCreateModal({ open, creating, onClose, onCreate }) {
  const [purpose, setPurpose] = useState('products');
  const [name, setName] = useState('Playground de productos');
  const [description, setDescription] = useState('');
  const [sheetName, setSheetName] = useState('Productos');
  const [error, setError] = useState('');

  const selectedPurpose = useMemo(
    () => PURPOSES.find((item) => item.id === purpose) || PURPOSES[0],
    [purpose],
  );

  useEffect(() => {
    if (!open) return;

    const currentPurpose = PURPOSES[0];
    setPurpose(currentPurpose.id);
    setName(currentPurpose.defaultName);
    setDescription('');
    setSheetName(currentPurpose.defaultSheet);
    setError('');
  }, [open]);

  function handlePurposeChange(nextPurposeId) {
    const nextPurpose = PURPOSES.find((item) => item.id === nextPurposeId) || PURPOSES[0];

    setPurpose(nextPurpose.id);
    setName((current) => {
      const wasDefault = PURPOSES.some((item) => item.defaultName === current);
      return wasDefault || !current.trim() ? nextPurpose.defaultName : current;
    });
    setSheetName((current) => {
      const wasDefault = PURPOSES.some((item) => item.defaultSheet === current);
      return wasDefault || !current.trim() ? nextPurpose.defaultSheet : current;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanSheetName = sheetName.trim() || 'Hoja 1';

    if (!cleanName) {
      setError('Escribe un nombre para el playground.');
      return;
    }

    setError('');

    await onCreate({
      name: cleanName,
      description: description.trim() || selectedPurpose.description,
      initialSheetName: cleanSheetName,
      purpose,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
              <FileSpreadsheet className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-600">
                Nuevo playground
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Crear hoja de trabajo
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Define el uso, nombre y hoja inicial antes de crearla.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="text-sm font-bold text-slate-900">Tipo de playground</label>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {PURPOSES.map((item) => {
                const active = item.id === purpose;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handlePurposeChange(item.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-red-200 bg-red-50 text-red-950 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="mt-1 block text-xs leading-5 opacity-75">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-900">Nombre</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Playground de productos"
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-900">Hoja inicial</span>
              <input
                value={sheetName}
                onChange={(event) => setSheetName(event.target.value)}
                placeholder="Ej. Productos"
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-slate-900">Descripción</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={selectedPurpose.description}
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={creating}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-70"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {creating ? 'Creando...' : 'Crear playground'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
