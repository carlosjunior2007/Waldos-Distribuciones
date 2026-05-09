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
          description="Busca y selecciona un cliente para ver o crear sus etiquetas."
          className="rounded-2xl border border-dashed border-border"
        />
      ) : loading ? (
        <EmptyState
          loading
          title="Cargando etiquetas..."
          className="rounded-2xl border border-dashed border-border"
        />
      ) : !labels.length ? (
        <EmptyState
          title="Este cliente todavía no tiene etiquetas"
          description="Crea su primera etiqueta usando productos existentes."
          className="rounded-2xl border border-dashed border-border"
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent-600">
                Cliente seleccionado
              </p>

              <h3 className="text-xl font-bold text-text-primary">
                {selectedClient.nombre}
              </h3>
            </div>

            <button
              type="button"
              onClick={onCreateLabel}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Nueva etiqueta
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