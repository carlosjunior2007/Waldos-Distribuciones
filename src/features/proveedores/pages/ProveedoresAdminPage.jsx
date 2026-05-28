import { Building2, Plus } from "lucide-react";

import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";

import { useProveedores } from "../hooks/useProveedores";

import ProveedoresStats from "../components/ProveedoresStats";
import ProveedoresToolbar from "../components/ProveedoresToolbar";
import ProveedorModal from "../components/ProveedorModal";
import ProveedoresTable from "../components/ProveedoresTable";
import ProveedoresMobileList from "../components/ProveedoresMobileList";
import ProveedoresPagination from "../components/ProveedoresPagination";
import ProveedorDeleteImpactModal from "../components/ProveedorDeleteImpactModal";
import ProveedorProductImportModal from "../components/ProveedorProductImportModal";
import ProveedoresMessageModal from "../components/ProveedoresMessageModal";

export default function ProveedoresAdminPage() {
  const proveedores = useProveedores();

  return (
    <section className="space-y-6">
      <ProveedoresMessageModal
        open={proveedores.messageModal.open}
        title={proveedores.messageModal.title}
        message={proveedores.messageModal.message}
        tone={proveedores.messageModal.tone}
        onClose={proveedores.closeMessageModal}
      />

      <ProveedorModal
        open={["create", "view", "edit"].includes(proveedores.modalMode)}
        mode={proveedores.modalMode}
        form={proveedores.form}
        saving={proveedores.saving}
        onClose={proveedores.closeModal}
        onChange={proveedores.onInputChange}
        onSubmit={proveedores.saveProvider}
      />

      <ProveedorDeleteImpactModal
        open={proveedores.modalMode === "delete"}
        provider={proveedores.selectedProvider}
        impact={proveedores.deleteImpact}
        loadingImpact={proveedores.deleteImpactLoading}
        deleting={proveedores.deleting}
        hideProductsWithoutSuppliers={proveedores.hideProductsWithoutSuppliers}
        setHideProductsWithoutSuppliers={proveedores.setHideProductsWithoutSuppliers}
        onClose={proveedores.closeModal}
        onConfirm={proveedores.removeProvider}
      />

      <ProveedorProductImportModal
        open={proveedores.modalMode === "import"}
        provider={proveedores.selectedProvider}
        preview={proveedores.importPreview}
        loadingPreview={proveedores.loadingImportPreview}
        applyingImport={proveedores.applyingImport}
        onClose={proveedores.closeModal}
        onRowsLoaded={proveedores.loadImportPreview}
        onApply={proveedores.applyProviderProductImport}
        onError={proveedores.showMessage}
        onClearPreview={proveedores.clearImportPreview}
      />

      <ProveedoresStats stats={proveedores.stats} />

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Gestión comercial"
          title="Proveedores"
          description="Administra proveedores para poder asociarlos después a productos y cotizaciones."
          actions={
            <button
              type="button"
              onClick={proveedores.openCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              <Plus className="h-4 w-4" />
              Crear proveedor
            </button>
          }
        />

        <ProveedoresToolbar
          search={proveedores.search}
          setSearch={proveedores.setSearch}
          statusFilter={proveedores.statusFilter}
          setStatusFilter={proveedores.setStatusFilter}
        />

        {proveedores.loading ? (
          <EmptyState
            loading
            title="Cargando proveedores..."
            className="min-h-[240px]"
          />
        ) : proveedores.filteredProviders.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No hay proveedores para mostrar"
            description="Revisa la búsqueda o crea un proveedor nuevo."
            className="min-h-[240px]"
          />
        ) : (
          <>
            <ProveedoresTable
              providers={proveedores.paginatedProviders}
              onView={proveedores.openViewModal}
              onEdit={proveedores.openEditModal}
              onDelete={proveedores.openDeleteModal}
              onImport={proveedores.openImportModal}
            />

            <ProveedoresMobileList
              providers={proveedores.paginatedProviders}
              onView={proveedores.openViewModal}
              onEdit={proveedores.openEditModal}
              onDelete={proveedores.openDeleteModal}
              onImport={proveedores.openImportModal}
            />

            <ProveedoresPagination
              startItem={proveedores.startItem}
              endItem={proveedores.endItem}
              totalItems={proveedores.filteredProviders.length}
              currentPage={proveedores.currentPage}
              totalPages={proveedores.totalPages}
              onPrevious={proveedores.goToPreviousPage}
              onNext={proveedores.goToNextPage}
            />
          </>
        )}
      </section>
    </section>
  );
}
