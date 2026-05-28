import { Plus } from "lucide-react";

import PageHeader from "../../../components/ui/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import ConfirmDeleteModal from "../../../components/ui/ConfirmDeleteModal";

import { useLabels } from "../hooks/useLabels";

import ClientSearchCard from "../components/ClientSearchCard";
import LabelsPanel from "../components/LabelsPanel";
import LabelModal from "../components/LabelModal";
import { LabelPreviewContent } from "../components/LabelPreview";
import LabelsMessageModal from "../components/LabelsMessageModal";

export default function LabelsPage() {
  const labels = useLabels();

  return (
    <>
      <LabelsMessageModal
        open={labels.messageModal.open}
        title={labels.messageModal.title}
        message={labels.messageModal.message}
        tone={labels.messageModal.tone}
        onClose={labels.closeMessageModal}
      />

      {labels.printPayload ? (
        <div
          style={{
            position: "fixed",
            left: "-99999px",
            top: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <LabelPreviewContent
            form={labels.printPayload.form}
            client={labels.printPayload.client}
            product={labels.printPayload.product}
            companyOptions={labels.printPayload.companyOptions}
            elementId="quick-label-print"
          />
        </div>
      ) : null}

      <LabelModal
        open={labels.labelModalOpen}
        onClose={labels.closeModal}
        onSaved={() => labels.loadLabels(labels.selectedClient?.id)}
        selectedClient={labels.selectedClient}
        editingLabel={labels.editingLabel}
        products={labels.products}
        companyOptions={labels.companyOptions}
        setCompanyOptions={labels.setCompanyOptions}
      />

      <ConfirmDeleteModal
        open={Boolean(labels.labelToDelete)}
        title="Eliminar etiqueta"
        message="¿Seguro que quieres eliminar esta etiqueta?"
        itemName={labels.labelToDelete?.productos?.nombre || "Etiqueta"}
        onClose={() => labels.setLabelToDelete(null)}
        onConfirm={labels.removeLabel}
        confirmText="Eliminar etiqueta"
      />

      <section className="space-y-6">
        <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
          <PageHeader
            eyebrow="Etiquetas"
            title="Etiquetas por cliente"
            description="Busca un cliente existente y crea etiquetas ligadas a ese cliente."
            actions={
              <button
                type="button"
                disabled={!labels.selectedClient}
                onClick={labels.openCreateModal}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Nueva etiqueta
              </button>
            }
          />

          <div className="border-b border-border p-5 md:p-6">
            <SearchInput
              value={labels.clientSearchInput}
              onChange={labels.setClientSearchInput}
              placeholder="Buscar cliente por nombre, razón social, RFC o correo..."
              className="max-w-xl"
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {labels.loadingClients ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                  Buscando clientes...
                </div>
              ) : labels.clients.length ? (
                labels.clients.map((client) => (
                  <ClientSearchCard
                    key={client.id}
                    client={client}
                    active={labels.selectedClient?.id === client.id}
                    onClick={() => labels.setSelectedClient(client)}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                  No hay clientes con esa búsqueda.
                </div>
              )}
            </div>
          </div>

          <LabelsPanel
            selectedClient={labels.selectedClient}
            labels={labels.labels}
            loading={labels.loadingLabels}
            onCreateLabel={labels.openCreateModal}
            onEditLabel={labels.openEditModal}
            onDeleteLabel={labels.setLabelToDelete}
            onQuickDownload={labels.quickDownload}
          />
        </section>
      </section>
    </>
  );
}