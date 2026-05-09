import { Plus } from "lucide-react";

import PageHeader from "../../../components/ui/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import EmptyState from "../../../components/ui/EmptyState";
import ConfirmDeleteModal from "../../../components/ui/ConfirmDeleteModal";

import { useClients } from "../hooks/useClients";

import ClientModal from "../components/ClientModal";
import ClientListCard from "../components/ClientListCard";
import ClientDetail from "../components/ClientDetail";

export default function ClientsPage() {
  const clients = useClients();

  return (
    <section className="space-y-6">
      <ClientModal
        open={clients.modalOpen}
        onClose={() => clients.setModalOpen(false)}
        onSubmit={clients.saveClient}
        saving={clients.saving}
        editingClient={clients.selectedClient}
      />

      <ConfirmDeleteModal
        open={Boolean(clients.clientToDelete)}
        title="Eliminar cliente"
        message="¿Seguro que quieres eliminar este cliente?"
        itemName={clients.clientToDelete?.nombre}
        loading={clients.deleting}
        onClose={() => clients.setClientToDelete(null)}
        onConfirm={() => clients.removeClient(clients.clientToDelete)}
        confirmText="Eliminar cliente"
      />

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Clientes"
          title="Gestión de clientes"
          description="Administra datos fiscales, contacto, dirección, logo y cotizaciones asociadas."
          actions={
            <button
              type="button"
              onClick={() => {
                clients.setSelectedClient(null);
                clients.setModalOpen(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </button>
          }
        />

        <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[380px_1fr]">
          <aside className="space-y-4">
            <SearchInput
              value={clients.searchInput}
              onChange={clients.setSearchInput}
              placeholder="Buscar por nombre, RFC, correo o teléfono..."
            />

            <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
              {clients.loading ? (
                <EmptyState
                  loading
                  title="Cargando clientes..."
                  className="rounded-2xl border border-dashed border-border py-8"
                />
              ) : !clients.clients.length ? (
                <EmptyState
                  title="No hay clientes"
                  description="Crea tu primer cliente para asociar etiquetas y cotizaciones."
                  className="rounded-2xl border border-dashed border-border py-8"
                />
              ) : (
                clients.clients.map((client) => (
                  <ClientListCard
                    key={client.id}
                    client={client}
                    active={clients.selectedClient?.id === client.id}
                    onSelect={() => clients.setSelectedClient(client)}
                    onEdit={() => {
                      clients.setSelectedClient(client);
                      clients.setModalOpen(true);
                    }}
                    onDelete={() => clients.setClientToDelete(client)}
                  />
                ))
              )}
            </div>
          </aside>

          <main>
            {!clients.selectedClient ? (
              <EmptyState
                title="Selecciona un cliente"
                description="Elige un cliente para ver su información completa."
                className="rounded-2xl border border-dashed border-border"
              />
            ) : (
              <ClientDetail
                client={clients.selectedClient}
                quotations={clients.quotations}
                totals={clients.totals}
                loadingQuotations={clients.loadingQuotations}
                onEdit={() => clients.setModalOpen(true)}
                onDelete={() =>
                  clients.setClientToDelete(clients.selectedClient)
                }
              />
            )}
          </main>
        </div>
      </section>
    </section>
  );
}