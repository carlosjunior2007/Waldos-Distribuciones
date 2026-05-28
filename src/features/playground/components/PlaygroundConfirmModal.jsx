import { AlertTriangle, Trash2 } from 'lucide-react';

export default function PlaygroundConfirmModal({
  open,
  title = 'Confirmar acción',
  message = '¿Seguro que quieres continuar?',
  itemName = '',
  danger = true,
  loading = false,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex min-h-screen w-screen items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div
          className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
            danger ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {danger ? <Trash2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
        </div>

        <h3 className="text-lg font-black text-slate-950">
          {title}
        </h3>

        {itemName ? (
          <p className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">
            {itemName}
          </p>
        ) : null}

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {message}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-11 rounded-2xl px-4 text-sm font-bold text-white transition disabled:opacity-60 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-950 hover:bg-slate-800'
            }`}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}
