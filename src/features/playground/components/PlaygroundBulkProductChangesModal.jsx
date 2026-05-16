import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { formatMoney } from '../playground.helpers';

function fieldLabel(field) {
  const labels = {
    nombre: 'Nombre',
    precio: 'Precio',
    precio_compra: 'Costo',
    descripcion: 'Descripción',
    categoria: 'Categoría',
    unidad: 'Unidad',
    cantidad_caja: 'Cantidad por caja',
    habilitado: 'Habilitado',
  };

  return labels[field] || field;
}

function formatValue(field, value) {
  if (field === 'precio' || field === 'precio_compra') return formatMoney(value || 0);
  if (field === 'habilitado') return String(value).toLowerCase() === 'true' || value === true ? 'Sí' : 'No';
  return value === null || value === undefined || value === '' ? '-' : String(value);
}

export default function PlaygroundBulkProductChangesModal({ open, onClose, changes = [], onApply, loading = false }) {
  const [seenBottom, setSeenBottom] = useState(false);

  const grouped = useMemo(() => {
    return changes.map((change) => ({
      ...change,
      fields: Object.entries(change.fields || {}),
    }));
  }, [changes]);

  const totalFieldChanges = grouped.reduce((sum, item) => sum + item.fields.length, 0);

  if (!open) return null;

  function handleScroll(event) {
    const element = event.currentTarget;
    const reachedBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 24;
    if (reachedBottom) setSeenBottom(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-600">Cambios masivos</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Aplicar cambios a productos</h2>
            <p className="mt-1 text-sm text-slate-500">Revisa los cambios detectados antes de actualizar la base de datos.</p>
          </div>

          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Productos</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{grouped.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Campos</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{totalFieldChanges}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5" />
              <p className="text-sm font-bold">Estos cambios actualizarán productos reales cuando confirmes.</p>
            </div>
          </div>
        </div>

        <div onScroll={handleScroll} className="flex-1 overflow-y-auto p-6">
          {!grouped.length ? (
            <div className="rounded-3xl border border-slate-200 p-10 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <h3 className="mt-3 text-lg font-black text-slate-900">No hay cambios detectados</h3>
              <p className="mt-1 text-sm text-slate-500">Edita directamente las columnas de productos. También se aceptan fórmulas y referencias a otras hojas; se aplicará el resultado calculado.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {grouped.map((change) => (
                <article key={change.producto_id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-black text-slate-950">{change.nombre || change.codigo || change.producto_id}</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">{change.codigo || change.producto_id}</p>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">{change.fields.length} cambios</span>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {change.fields.map(([field, diff]) => (
                      <div key={field} className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[160px_1fr_1fr]">
                        <p className="text-sm font-black text-slate-800">{fieldLabel(field)}</p>
                        <p className="text-sm text-slate-500"><span className="font-bold text-slate-700">Antes:</span> {formatValue(field, diff.before)}</p>
                        <p className="text-sm text-emerald-700"><span className="font-bold">Después:</span> {formatValue(field, diff.after)}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            {grouped.length ? (seenBottom ? 'Revisión completada.' : 'Desplázate hasta abajo para habilitar la confirmación.') : 'No hay cambios listos.'}
          </p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="button" onClick={onApply} disabled={loading || !grouped.length || !seenBottom} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? 'Aplicando...' : 'Aplicar cambios'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
