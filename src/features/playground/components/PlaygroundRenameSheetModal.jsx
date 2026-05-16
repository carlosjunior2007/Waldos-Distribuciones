import { useEffect, useState } from 'react';
import { Loader2, Pencil, X } from 'lucide-react';

export default function PlaygroundRenameSheetModal({ open, sheet, saving, onClose, onSave }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(sheet?.name || '');
    setError('');
  }, [open, sheet?.id, sheet?.name]);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setError('Escribe un nombre para la hoja.');
      return;
    }

    await onSave(cleanName);
  }

  if (!open || !sheet) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-600">Hoja</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Cambiar nombre</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <label className="block">
            <span className="text-sm font-bold text-slate-900">Nombre de la hoja</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
              autoFocus
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
