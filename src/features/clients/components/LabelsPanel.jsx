import { Plus } from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import LabelCard from "./LabelCard";

export default function LabelsPanel({
  selectedClient,
  labels,
  loading,
  onCreateLabel,
  onEditLabel,
  onDeleteLabel,
  onQuickDownload,
}) {
  return (
    <div className="p-5 md:p-6">
      {!selectedClient ? (
        <EmptyState
          title="Selecciona un cliente"
          description="Elige un cliente para ver o crear sus etiquetas."
          className="rounded-2xl border border-dashed border-border"
        />
      ) : loading ? (
        <EmptyState
          loading
          title="Cargando etiquetas..."
          className="rounded-2xl border border-dashed border-border"
        />
      ) : !labels.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-soft p-6 text-center">
          <p className="text-sm font-semibold text-text-primary">
            Este cliente todavía no tiene etiquetas.
          </p>

          <p className="mt-1 text-sm text-text-secondary">
            Crea etiquetas usando productos existentes.
          </p>

          <button
            type="button"
            onClick={onCreateLabel}
            className="mx-auto mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Nueva etiqueta
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              {labels.length} etiqueta{labels.length === 1 ? "" : "s"} guardada{labels.length === 1 ? "" : "s"}.
            </p>

            <button
              type="button"
              onClick={onCreateLabel}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Nueva
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {labels.map((label) => (
              <LabelCard
                key={label.id}
                label={label}
                onDownload={() => onQuickDownload(label)}
                onEdit={() => onEditLabel(label)}
                onView={() => onEditLabel(label)}
                onDelete={() => onDeleteLabel(label)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
