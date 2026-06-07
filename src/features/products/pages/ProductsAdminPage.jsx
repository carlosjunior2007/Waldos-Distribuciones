import { useState } from "react";
import { Download, Image as ImageIcon, Loader2, Package, Plus, Tag } from "lucide-react";

import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import ConfirmDeleteModal from "../../../components/ui/ConfirmDeleteModal";

import { useProducts } from "../hooks/useProducts";

import ProductsStats from "../components/ProductsStats";
import ProductsToolbar from "../components/ProductsToolbar";
import ProductModal from "../components/ProductModal";
import ProductsMessageModal from "../components/ProductsMessageModal";
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
import { downloadProductLabel } from "../services/productLabel.service";

export default function ProductsAdminPage() {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
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

      products.showMessage(
        "Importación aplicada",
        `Cambios aplicados correctamente.\nProductos actualizados: ${result.updated}${
          result.errors.length ? `\nErrores:\n${result.errors.join("\n")}` : ""
        }`,
        result.errors.length ? "warning" : "success",
      );
    } finally {
      setImporting(false);
    }
  }

  function handleExportExcel() {
    exportProductsToExcel(products.products);
  }

  function handleOpenCatalogModal() {
    if (products.filteredProducts.length === 0) return;
    setCatalogModalOpen(true);
  }

  async function handleDownloadProductLabel(product) {
    try {
      await downloadProductLabel(product);
    } catch (error) {
      console.error(error);
      products.showMessage(
        "No se pudo descargar la etiqueta",
        error.message || "Intenta de nuevo.",
        "error",
      );
    }
  }

  async function handleExportPDF(options) {
    try {
      setIsExportingPDF(true);
      await exportProductsToPDF(products.filteredProducts, options);
      setCatalogModalOpen(false);
    } catch (error) {
      console.error(error);
      products.showMessage(
        "No se pudo exportar el PDF",
        error.message || "Intenta de nuevo.",
        "error",
      );
    } finally {
      setIsExportingPDF(false);
    }
  }

  return (
    <section className="space-y-6">
      <ProductsMessageModal
        open={Boolean(products.messageModal?.open)}
        title={products.messageModal?.title}
        message={products.messageModal?.message}
        tone={products.messageModal?.tone}
        onClose={products.closeMessageModal}
      />
      <ProductModal
        open={["create", "view", "edit"].includes(products.modalMode)}
        mode={products.modalMode}
        form={products.form}
        suppliers={products.suppliers}
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
        message="Si no tiene historial se eliminará físicamente. Si ya fue usado, se retirará del catálogo y dejará de aparecer en pedidos, cotizaciones e inventario, conservando el historial."
        itemName={products.selectedProduct?.nombre}
        loading={products.deleting}
        onClose={products.closeModal}
        onConfirm={products.removeProduct}
        confirmText="Eliminar del catálogo"
      />

      <CatalogExportModal
        open={catalogModalOpen}
        loading={isExportingPDF}
        totalProducts={products.filteredProducts.length}
        onClose={() => setCatalogModalOpen(false)}
        onConfirm={handleExportPDF}
      />

      {isExportingPDF ? <CatalogLoadingOverlay /> : null}

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
          description="Administra el catálogo, controla visibilidad en web y edita todo desde modales."
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
          onExportPDF={handleOpenCatalogModal}
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
              onDownloadLabel={handleDownloadProductLabel}
            />

            <ProductsMobileList
              products={products.paginatedProducts}
              onView={products.openViewModal}
              onEdit={products.openEditModal}
              onDelete={products.openDeleteModal}
              onDownloadLabel={handleDownloadProductLabel}
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

function CatalogExportModal({ open, loading, totalProducts, onClose, onConfirm }) {
  const [options, setOptions] = useState({
    includePrices: true,
    includeImages: true,
  });

  if (!open) return null;

  function updateOption(field, value) {
    setOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const previewTitle = options.includePrices
    ? "Catálogo con precios"
    : "Catálogo sin precios";

  const previewDescription = options.includeImages
    ? "Incluye imagen, descripción y datos comerciales."
    : "Formato más compacto, sin imágenes.";

  return (
    <div className="fixed inset-0 z-[95] flex min-h-[100dvh] items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-border bg-surface shadow-2xl">
        <div className="border-b border-border p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-accent-600">
            Descargar catálogo
          </p>

          <h3 className="mt-2 text-2xl font-black text-text-primary">
            Elige cómo quieres generarlo
          </h3>

          <p className="mt-2 text-sm text-text-secondary">
            Se exportarán {totalProducts} productos según tu búsqueda y filtros actuales.
          </p>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <OptionCard
              icon={Tag}
              title="Con precios"
              description="Muestra precio de venta."
              active={options.includePrices}
              onClick={() => updateOption("includePrices", true)}
            />

            <OptionCard
              icon={Tag}
              title="Sin precios"
              description="Solo información del producto."
              active={!options.includePrices}
              onClick={() => updateOption("includePrices", false)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <OptionCard
              icon={ImageIcon}
              title="Con imágenes"
              description="Más visual para clientes."
              active={options.includeImages}
              onClick={() => updateOption("includeImages", true)}
            />

            <OptionCard
              icon={ImageIcon}
              title="Sin imágenes"
              description="Más ligero y directo."
              active={!options.includeImages}
              onClick={() => updateOption("includeImages", false)}
            />
          </div>

          <div className="rounded-3xl border border-border bg-surface-soft p-4">
            <p className="text-sm font-black text-text-primary">Vista de descarga</p>
            <p className="mt-1 text-sm text-text-secondary">
              {previewTitle} · {previewDescription}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-2xl border border-border px-4 text-sm font-semibold text-text-primary transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => onConfirm(options)}
            disabled={loading || totalProducts === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar catálogo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionCard({ icon: Icon, title, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[108px] items-start gap-3 rounded-3xl border p-4 text-left transition ${
        active
          ? "border-primary-500 bg-primary-50 shadow-[0_12px_32px_rgba(37,99,235,0.12)]"
          : "border-border bg-surface hover:border-border-strong hover:bg-surface-soft"
      }`}
    >
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          active ? "bg-primary-600 text-white" : "bg-surface-soft text-text-secondary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>

      <span>
        <span className="block text-sm font-black text-text-primary">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-text-secondary">
          {description}
        </span>
      </span>
    </button>
  );
}

function CatalogLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[120] flex min-h-[100dvh] items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center rounded-[28px] border border-border bg-surface p-7 text-center shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>

        <h3 className="mt-4 text-lg font-black text-text-primary">
          Generando catálogo
        </h3>

        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Preparando productos, imágenes y archivo PDF. Esto puede tardar unos segundos.
        </p>
      </div>
    </div>
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