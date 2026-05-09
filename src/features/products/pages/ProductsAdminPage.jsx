import { useState } from "react";
import { Package, Plus } from "lucide-react";

import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import ConfirmDeleteModal from "../../../components/ui/ConfirmDeleteModal";

import { useProducts } from "../hooks/useProducts";

import ProductsStats from "../components/ProductsStats";
import ProductsToolbar from "../components/ProductsToolbar";
import ProductModal from "../components/ProductModal";
import ProductsTable from "../components/ProductsTable";
import ProductsMobileList from "../components/ProductsMobileList";
import ProductsPagination from "../components/ProductsPagination";

import {
  exportProductsToExcel,
  exportProductsToPDF,
} from "../services/productsExport.service";

export default function ProductsAdminPage() {
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const products = useProducts();

  function handleExportExcel() {
    exportProductsToExcel(products.filteredProducts);
  }

  async function handleExportPDF() {
    try {
      setIsExportingPDF(true);
      await exportProductsToPDF(products.filteredProducts);
    } finally {
      setIsExportingPDF(false);
    }
  }

  return (
    <section className="space-y-6">
      <ProductModal
        open={["create", "view", "edit"].includes(products.modalMode)}
        mode={products.modalMode}
        form={products.form}
        saving={products.saving}
        onClose={products.closeModal}
        onChange={products.onInputChange}
        onSubmit={products.saveProduct}
        selectedProduct={products.selectedProduct}
        onRemoveImage={products.removeCurrentImage}
        uploadingImage={products.uploadingImage}
        localImagePreview={products.localImagePreview}
        authUser={products.authUser}
        userLabels={products.userLabels}
      />

      <ConfirmDeleteModal
        open={products.modalMode === "delete"}
        title="Eliminar producto"
        message="¿Seguro que quieres eliminar este producto?"
        itemName={products.selectedProduct?.nombre}
        loading={products.deleting}
        onClose={products.closeModal}
        onConfirm={products.removeProduct}
        confirmText="Eliminar producto"
      />

      <ProductsStats stats={products.stats} />

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Gestión comercial"
          title="Productos"
          description="Administra el catálogo, revisa stock, controla visibilidad en web y edita todo desde modales."
          actions={
            <button
              type="button"
              onClick={products.openCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              <Plus className="h-4 w-4" />
              Crear producto
            </button>
          }
        />

        <ProductsToolbar
          search={products.search}
          setSearch={products.setSearch}
          statusFilter={products.statusFilter}
          setStatusFilter={products.setStatusFilter}
          filteredProducts={products.filteredProducts}
          isExportingPDF={isExportingPDF}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />

        {products.loading ? (
          <EmptyState loading title="Cargando productos..." className="min-h-[240px]" />
        ) : products.filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay productos para mostrar"
            description="Revisa la búsqueda o crea un producto nuevo."
            className="min-h-[240px]"
          />
        ) : (
          <>
            <ProductsTable
              products={products.paginatedProducts}
              onView={products.openViewModal}
              onEdit={products.openEditModal}
              onDelete={products.openDeleteModal}
            />

            <ProductsMobileList
              products={products.paginatedProducts}
              onView={products.openViewModal}
              onEdit={products.openEditModal}
              onDelete={products.openDeleteModal}
            />

            <ProductsPagination
              startItem={products.startItem}
              endItem={products.endItem}
              totalItems={products.filteredProducts.length}
              currentPage={products.currentPage}
              totalPages={products.totalPages}
              onPrevious={products.goToPreviousPage}
              onNext={products.goToNextPage}
            />
          </>
        )}
      </section>
    </section>
  );
}