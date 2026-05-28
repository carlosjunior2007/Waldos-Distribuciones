import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PlaygroundRenameSheetModal from './PlaygroundRenameSheetModal';
import PlaygroundConfirmModal from './PlaygroundConfirmModal';

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
  const [sheetToDelete, setSheetToDelete] = useState(null);
  const [deletingSheet, setDeletingSheet] = useState(false);

  async function handleRename(nextName) {
    if (!renameSheet || !onRenameSheet) return;
    await onRenameSheet(renameSheet.id, nextName);
    setRenameSheet(null);
  }

  function handleDeleteSheet(sheet) {
    if (!sheet || disabled) return;

    if (sheets.length <= 1) {
      return;
    }

    setSheetToDelete(sheet);
  }

  async function confirmDeleteSheet() {
    if (!sheetToDelete?.id) return;

    try {
      setDeletingSheet(true);
      await onDeleteSheet?.(sheetToDelete.id);
      setSheetToDelete(null);
    } finally {
      setDeletingSheet(false);
    }
  }

  return (
    <>
      <PlaygroundConfirmModal
        open={Boolean(sheetToDelete)}
        title="Eliminar hoja"
        message="Esta hoja se eliminará del playground. Esta acción no se puede deshacer."
        itemName={sheetToDelete?.name}
        loading={deletingSheet}
        confirmText="Sí, eliminar hoja"
        onClose={() => setSheetToDelete(null)}
        onConfirm={confirmDeleteSheet}
      />

      <div className="flex max-w-full items-end gap-1 overflow-x-auto border-t border-slate-200 bg-slate-50 px-3 pt-2">
        {sheets.map((sheet) => {
          const active = sheet.id === activeSheetId;

          return (
            <div key={sheet.id} className="group inline-flex overflow-hidden rounded-t-xl border border-b-0 border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={() => onChangeSheet(sheet.id)}
                className={`min-w-[96px] px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
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
                    : 'border-l border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
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
                    : 'border-l border-slate-200 bg-white text-slate-400 hover:bg-red-50 hover:text-red-700'
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
          className="mb-px inline-flex items-center gap-2 rounded-t-xl border border-b-0 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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
