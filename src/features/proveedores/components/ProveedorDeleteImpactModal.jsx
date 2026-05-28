import { AlertTriangle, EyeOff, Loader2, Trash2 } from "lucide-react";
import Modal from "../../../components/ui/Modal";

export default function ProveedorDeleteImpactModal({
  open,
  provider,
  impact,
  loadingImpact,
  deleting,
  hideProductsWithoutSuppliers,
  setHideProductsWithoutSuppliers,
  onClose,
  onConfirm,
}) {
  const relatedProducts = impact?.relatedProducts || [];
  const productsWithoutSuppliers = impact?.productsWithoutSuppliers || [];
  const hasRelatedProducts = relatedProducts.length > 0;
  const hasOrphanProducts = productsWithoutSuppliers.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar proveedor"
      subtitle="Revisa el impacto antes de borrar este proveedor."
      width="max-w-3xl"
    >
      <div className="space-y-5 p-5 md:p-6">
        <section className="rounded-[24px] border border-error-100 bg-error-50 p-4">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-error-700">
              <AlertTriangle className="h-5 w-5" />
            </span>

            <div>
              <h3 className="text-base font-black text-error-800">
                ¿Seguro que quieres eliminar este proveedor?
              </h3>

              <p className="mt-1 text-sm leading-6 text-error-700">
                Se eliminará <strong>{provider?.nombre || "este proveedor"}</strong> y
                se quitará su relación de todos los productos asociados.
              </p>
            </div>
          </div>
        </section>

        {loadingImpact ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-soft p-4 text-sm font-semibold text-text-secondary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Revisando productos asociados...
          </div>
        ) : (
          <>
            <section className="rounded-[24px] border border-border bg-surface-soft p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-black text-text-primary">
                    Productos afectados
                  </h4>
                  <p className="mt-1 text-xs text-text-secondary">
                    Estos productos perderán este proveedor.
                  </p>
                </div>

                <span className="rounded-full bg-background px-3 py-1 text-xs font-bold text-text-muted">
                  {relatedProducts.length}
                </span>
              </div>

              {hasRelatedProducts ? (
                <ProductList products={relatedProducts} />
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-text-secondary">
                  Este proveedor no está asociado a ningún producto.
                </p>
              )}
            </section>

            <section className="rounded-[24px] border border-warning-100 bg-warning-50 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-black text-warning-900">
                    Productos que se quedarán sin proveedor
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-warning-800">
                    Estos productos no tendrán ningún proveedor después de borrar este proveedor.
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-warning-800">
                  {productsWithoutSuppliers.length}
                </span>
              </div>

              {hasOrphanProducts ? (
                <>
                  <ProductList products={productsWithoutSuppliers} warning />

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-warning-200 bg-white p-4">
                    <input
                      type="checkbox"
                      checked={hideProductsWithoutSuppliers}
                      onChange={(event) =>
                        setHideProductsWithoutSuppliers(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-warning-300 text-warning-600 focus:ring-warning-500"
                    />

                    <span>
                      <span className="block text-sm font-black text-warning-900">
                        Poner estos productos como no visibles en la web
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-warning-800">
                        Recomendado para evitar mostrar productos que ya no tienen proveedor disponible.
                      </span>
                    </span>
                  </label>
                </>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-warning-200 bg-white p-4 text-sm text-warning-800">
                  Ningún producto se quedará sin proveedor.
                </p>
              )}
            </section>
          </>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:bg-surface-soft disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting || loadingImpact}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-error-600 px-4 text-sm font-bold text-white transition hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Eliminar proveedor
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ProductList({ products, warning = false }) {
  return (
    <div className="mt-4 grid max-h-56 gap-2 overflow-y-auto pr-1">
      {products.map((product) => (
        <article
          key={product.id}
          className={`rounded-2xl border p-3 ${
            warning
              ? "border-warning-200 bg-white"
              : "border-border bg-background"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text-primary">
                {product.nombre}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {product.codigo || "Sin código"}
              </p>
            </div>

            {product.habilitado !== false ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-1 text-[11px] font-bold text-success-700">
                Visible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                <EyeOff className="h-3 w-3" />
                No visible
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
