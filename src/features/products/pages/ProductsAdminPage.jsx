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
  previewProductsImportFromExcel,
  applyProductsImportChanges,
} from "../services/productsExport.service";

import { updateProduct } from "../services/products.service";

export default function ProductsAdminPage() {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const products = useProducts();

  async function handleImportExcel(file) {
    if (!file) return;

    const result = await previewProductsImportFromExcel(
      file,
      products.products,
    );

    setImportPreview(result);
  }

  async function confirmImportChanges() {
    if (!importPreview?.changes?.length) return;

    try {
      setImporting(true);

      const result = await applyProductsImportChanges(importPreview.changes, {
        updateProduct,
      });

      await products.loadProducts();

      setImportPreview(null);

      alert(
        `Cambios aplicados correctamente.\nProductos actualizados: ${result.updated}${
          result.errors.length ? `\nErrores:\n${result.errors.join("\n")}` : ""
        }`,
      );
    } finally {
      setImporting(false);
    }
  }

  function handleExportExcel() {
    exportProductsToExcel(products.products);
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
        onPriceBlur={products.onPriceBlur}
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

      {importPreview ? (
        <BulkImportPreviewModal
          preview={importPreview}
          loading={importing}
          onClose={() => setImportPreview(null)}
          onConfirm={confirmImportChanges}
        />
      ) : null}

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
          onImportExcel={handleImportExcel}
        />

        {products.loading ? (
          <EmptyState
            loading
            title="Cargando productos..."
            className="min-h-[240px]"
          />
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

function BulkImportPreviewModal({ preview, loading, onClose, onConfirm }) {
  const [canConfirm, setCanConfirm] = useState(false);

  const hasChanges = preview.changes.length > 0;
  const hasErrors = preview.errors.length > 0;

  function handleScroll(e) {
    const element = e.currentTarget;
    const isBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 20;

    if (isBottom) setCanConfirm(true);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 min-h-[100dvh]">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-surface shadow-xl">
        <div className="border-b border-border p-5">
          <h3 className="text-xl font-bold text-text-primary">
            Revisar cambios masivos
          </h3>

          <p className="mt-1 text-sm text-text-secondary">
            Se encontraron {preview.changes.length} productos con cambios y{" "}
            {preview.errors.length} errores.
          </p>
        </div>

        <div
          onScroll={handleScroll}
          className="max-h-[60vh] overflow-y-auto p-5"
        >
          {hasErrors ? (
            <div className="mb-5 rounded-2xl border border-error-100 bg-error-50 p-4">
              <p className="font-bold text-error-700">Errores encontrados</p>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-error-700">
                {preview.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {!hasChanges ? (
            <div className="rounded-2xl border border-border bg-surface-soft p-6 text-center">
              No hay cambios para aplicar.
            </div>
          ) : (
            <div className="space-y-4">
              {preview.changes.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-border bg-surface-soft p-4"
                >
                  <p className="font-bold text-text-primary">
                    {product.nombre}
                  </p>

                  <p className="mt-1 text-xs text-text-muted">
                    Fila {product.rowNumber} · ID: {product.id}
                  </p>

                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-text-muted">
                          <th className="py-2 pr-4">Campo</th>
                          <th className="py-2 pr-4">Antes</th>
                          <th className="py-2 pr-4">Después</th>
                        </tr>
                      </thead>

                      <tbody>
                        {product.changes.map((change) => (
                          <tr key={change.field} className="border-t border-border">
                            <td className="py-2 pr-4 font-semibold">
                              {change.field}
                            </td>
                            <td className="py-2 pr-4 text-text-secondary">
                              {String(change.before ?? "")}
                            </td>
                            <td className="py-2 pr-4 font-semibold text-success-700">
                              {String(change.after ?? "")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-success-100 bg-success-50 p-4 text-sm font-semibold text-success-700">
                Llegaste al final de la revisión. Ya puedes aplicar los cambios.
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-2xl border border-border px-4 text-sm font-semibold"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!hasChanges || !canConfirm || loading}
            className="h-11 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Aplicando..." : "Aplicar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}