import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PlaygroundRenameSheetModal from './PlaygroundRenameSheetModal';

export default function PlaygroundSheetsTabs({
  sheets,
  activeSheetId,
  onChangeSheet,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  disabled,
}) {
  const [renameSheet, setRenameSheet] = useState(null);

  async function handleRename(nextName) {
    if (!renameSheet || !onRenameSheet) return;
    await onRenameSheet(renameSheet.id, nextName);
    setRenameSheet(null);
  }

  async function handleDeleteSheet(sheet) {
    if (!sheet || disabled) return;

    if (sheets.length <= 1) {
      return;
    }

    const confirmed = window.confirm(`¿Eliminar la hoja "${sheet.name}"?`);
    if (!confirmed) return;

    await onDeleteSheet?.(sheet.id);
  }

  return (
    <>
      <div className="flex max-w-full flex-wrap items-center gap-2 overflow-x-auto">
        {sheets.map((sheet) => {
          const active = sheet.id === activeSheetId;

          return (
            <div key={sheet.id} className="group inline-flex overflow-hidden rounded-xl">
              <button
                type="button"
                onClick={() => onChangeSheet(sheet.id)}
                className={`px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'border border-r-0 border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {sheet.name}
              </button>

              <button
                type="button"
                onClick={() => onRenameSheet ? setRenameSheet(sheet) : null}
                disabled={disabled || !onRenameSheet}
                title={onRenameSheet ? 'Cambiar nombre' : 'Cambiar nombre no disponible'}
                className={`inline-flex items-center justify-center px-3 transition disabled:opacity-60 ${
                  active
                    ? 'bg-red-700 text-white hover:bg-red-800'
                    : 'border border-r-0 border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSheet(sheet)}
                disabled={disabled || sheets.length <= 1}
                title={sheets.length <= 1 ? 'Debe existir al menos una hoja' : 'Eliminar hoja'}
                className={`inline-flex items-center justify-center px-3 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? 'bg-red-800 text-white hover:bg-red-900'
                    : 'border border-slate-200 bg-white text-slate-400 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddSheet}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Hoja
        </button>
      </div>

      <PlaygroundRenameSheetModal
        open={Boolean(renameSheet)}
        sheet={renameSheet}
        saving={disabled}
        onClose={() => setRenameSheet(null)}
        onSave={handleRename}
      />
    </>
  );
}
