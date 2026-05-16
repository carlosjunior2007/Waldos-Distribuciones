import { Download, Globe2, Loader2, PackagePlus, Save, Trash2 } from 'lucide-react';

export default function PlaygroundHeader({
  workbook,
  saving,
  onSave,
  onImportProducts,
  onOpenShare,
  onExportCsv,
  onDelete,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-600">Playground</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{workbook?.name || 'Excel privado'}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Usa productos y datos del sistema para calcular, probar escenarios y preparar cambios masivos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onImportProducts}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <PackagePlus className="h-4 w-4" />
            Cargar productos
          </button>

          <button
            type="button"
            onClick={onOpenShare}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <Globe2 className="h-4 w-4" />
            Compartir
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-70"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
