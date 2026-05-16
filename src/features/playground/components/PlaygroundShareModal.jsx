import { Copy, Eye, Globe2, Lock, Pencil, X } from 'lucide-react';

export default function PlaygroundShareModal({
  open,
  onClose,
  workbook,
  onTogglePublic,
  onChangeShareMode,
  saving,
}) {
  if (!open || !workbook) return null;

  const shareMode = workbook.share_mode || 'view';
  const publicUrl = workbook.is_public
    ? `${window.location.origin}/playground/public/${workbook.public_token}`
    : '';

  async function copyLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
  }

  async function handleEnable(mode) {
    if (workbook.is_public) {
      await onChangeShareMode?.(mode);
      return;
    }

    await onTogglePublic?.(true, mode);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-600">Compartir</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Link del playground</h2>
            <p className="mt-1 text-sm text-slate-500">
              Puedes compartirlo como solo lectura o permitir que editen el contenido.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleEnable('view')}
              className={`rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
                workbook.is_public && shareMode === 'view'
                  ? 'border-blue-200 bg-blue-50 text-blue-950'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="rounded-xl bg-white p-2 shadow-sm">
                  <Eye className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-black">Solo ver</span>
                  <span className="mt-1 block text-sm opacity-75">
                    Quien tenga el link puede abrir la hoja, pero no guardar cambios.
                  </span>
                </span>
              </span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleEnable('edit')}
              className={`rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
                workbook.is_public && shareMode === 'edit'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="rounded-xl bg-white p-2 shadow-sm">
                  <Pencil className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-black">Puede editar</span>
                  <span className="mt-1 block text-sm opacity-75">
                    Quien tenga el link puede modificar celdas y guardar.
                  </span>
                </span>
              </span>
            </button>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => onTogglePublic?.(!workbook.is_public, shareMode)}
            className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
              workbook.is_public
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 bg-slate-50 text-slate-800'
            }`}
          >
            <span className="flex items-center gap-3">
              {workbook.is_public ? <Globe2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              <span>
                <span className="block font-bold">{workbook.is_public ? 'Link activo' : 'Link desactivado'}</span>
                <span className="text-sm opacity-75">
                  {workbook.is_public
                    ? shareMode === 'edit'
                      ? 'El enlace permite edición.'
                      : 'El enlace es de solo lectura.'
                    : 'Activa el enlace para compartir este playground.'}
                </span>
              </span>
            </span>
          </button>

          {workbook.is_public ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Link</label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={publicUrl}
                  className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white"
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
