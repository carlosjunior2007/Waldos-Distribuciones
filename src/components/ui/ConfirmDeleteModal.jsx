import { Loader2, ShieldAlert, Trash2 } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDeleteModal({
  open,
  title = "Eliminar registro",
  subtitle = "Esta acción no se puede deshacer.",
  message = "¿Seguro que quieres eliminar este registro?",
  itemName,
  loading = false,
  onClose,
  onConfirm,
  confirmText = "Eliminar",
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      width="max-w-xl"
    >
      <div className="space-y-5 p-5 md:p-6">
        <div className="rounded-2xl border border-error-100 bg-error-50 p-4 text-error-700">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">{message}</p>

              {itemName ? (
                <p className="mt-1 text-sm">
                  Se eliminará <span className="font-semibold">{itemName}</span>
                  .
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-error-600 px-4 text-sm font-semibold text-white transition hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            {loading ? "Eliminando..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
