import { useEffect, useMemo, useState } from "react";
import supabase from "../../utils/supabase";
import * as XLSX from "xlsx";
import { generarCodigoProducto } from "../../utils/CodeGenerator";
import jsPDF from "jspdf";
import {
  Package,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Boxes,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Barcode,
  Tag,
  Warehouse,
  X,
  Loader2,
  Image as ImageIcon,
  ShieldAlert,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "limpieza", label: "Limpieza" },
  { value: "lavanderia", label: "Lavandería" },
  { value: "higiene_personal", label: "Higiene personal" },
  { value: "cocina", label: "Cocina" },
  { value: "desechables", label: "Desechables" },
  { value: "papeleria", label: "Papelería" },
  { value: "mascotas", label: "Mascotas" },
  { value: "alimentos", label: "Alimentos" },
  { value: "bebidas", label: "Bebidas" },
  { value: "otros", label: "Otros" },
];

const UNIT_OPTIONS = [
  { value: "pieza", label: "Pieza" },
  { value: "caja", label: "Caja" },
  { value: "paquete", label: "Paquete" },
  { value: "bolsa", label: "Bolsa" },
  { value: "botella", label: "Botella" },
  { value: "galon", label: "Galón" },
  { value: "litro", label: "Litro" },
  { value: "mililitro", label: "Mililitro" },
  { value: "kilogramo", label: "Kilogramo" },
  { value: "gramo", label: "Gramo" },
  { value: "metro", label: "Metro" },
  { value: "rollo", label: "Rollo" },
  { value: "bidon", label: "Bidón" },
];

const INITIAL_FORM = {
  id: "",
  nombre: "",
  descripcion: "",
  precio: "",
  imagen: "",
  imagenFile: null,
  disponibilidad: true,
  cantidad: "",
  cantidad_caja: "",
  precio_compra: "",
  precio_utilidad: "",
  habilitado: true,
  categoria: "",
  unidad: "",
  codigo: "",
};

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatMoney(value) {
  const n = Number(value || 0);
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

async function loadImageAsDataUrl(url) {
  if (!url) return null;

  try {
    const response = await fetch(url);
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("No se pudo cargar la imagen para PDF:", error);
    return null;
  }
}

function getCategoryLabel(value) {
  const match = CATEGORY_OPTIONS.find((item) => item.value === value);
  return match?.label || value || "Sin categoría";
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeText(value = "") {
  return String(value).toLowerCase().trim();
}

function getInventoryStatus(product) {
  const stock = Number(product?.cantidad || 0);

  if (!product?.habilitado || !product?.disponibilidad) {
    return {
      key: "oculto",
      label: "Oculto",
      icon: Archive,
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (stock <= 0) {
    return {
      key: "agotado",
      label: "Agotado",
      icon: Archive,
      className: "border-error-100 bg-error-50 text-error-700",
    };
  }

  if (stock <= 10) {
    return {
      key: "stock_bajo",
      label: "Stock bajo",
      icon: AlertTriangle,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  return {
    key: "activo",
    label: "Activo",
    icon: CheckCircle2,
    className: "border-success-100 bg-success-50 text-success-700",
  };
}

function FilterPill({ label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center rounded-full border px-3 py-2 text-sm font-semibold transition",
        active
          ? "border-accent-500 bg-accent-500 text-white"
          : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-soft hover:text-text-primary",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function SummaryCard({ icon: Icon, title, value, note, tone = "primary" }) {
  const toneStyles =
    tone === "success"
      ? "border-success-100 bg-success-50 text-success-700"
      : tone === "warning"
        ? "border-warning-100 bg-warning-50 text-warning-700"
        : tone === "error"
          ? "border-error-100 bg-error-50 text-error-700"
          : tone === "slate"
            ? "border-slate-200 bg-slate-50 text-slate-700"
            : "border-primary-100 bg-primary-50 text-primary-700";

  return (
    <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneStyles}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-sm text-text-muted">{note}</p>
    </article>
  );
}

function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  width = "max-w-4xl",
}) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50">
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          className={[
            "w-full border border-border bg-surface shadow-2xl",
            "h-[100dvh] rounded-none",
            "sm:h-auto sm:max-h-[90vh] sm:rounded-[28px]",
            width,
            "overflow-hidden",
          ].join(" ")}
        >
          <div className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur p-4 sm:p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-text-primary sm:text-lg md:text-xl">
                  {title}
                </h3>
                {subtitle ? (
                  <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-border-strong hover:bg-surface-soft hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="h-[calc(100dvh-81px)] overflow-y-auto sm:h-auto sm:max-h-[calc(90vh-88px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ open, product, loading, onClose, onConfirm }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar producto"
      subtitle="Esta acción no se puede deshacer."
      width="max-w-xl"
    >
      <div className="space-y-5 p-5 md:p-6">
        <div className="rounded-2xl border border-error-100 bg-error-50 p-4 text-error-700">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                ¿Seguro que quieres eliminar este producto?
              </p>
              <p className="mt-1 text-sm">
                Se eliminará{" "}
                <span className="font-semibold">{product?.nombre}</span> y ya no
                aparecerá en tu panel.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-soft p-4">
          <p className="text-sm font-semibold text-text-primary">
            {product?.nombre}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Código: {product?.codigo}
          </p>
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
            Eliminar producto
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ProductFormModal({
  open,
  mode,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
  selectedProduct,
  onRemoveImage,
  uploadingImage,
  localImagePreview,
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const status = selectedProduct ? getInventoryStatus(selectedProduct) : null;
  const StatusIcon = status?.icon;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isCreate
          ? "Crear producto"
          : isEdit
            ? "Editar producto"
            : "Detalle del producto"
      }
      subtitle={
        isCreate
          ? "Completa la información del producto. El código se genera automáticamente."
          : isEdit
            ? "Actualiza la información del producto."
            : "Consulta toda la información registrada."
      }
    >
      <form onSubmit={onSubmit} className="space-y-6 p-5 md:p-6">
        {!isCreate && selectedProduct ? (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-[24px] border border-border bg-surface-soft p-4 lg:col-span-2">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface">
                  {selectedProduct.imagen ? (
                    <img
                      src={selectedProduct.imagen}
                      alt={selectedProduct.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-7 w-7 text-text-muted" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-bold text-text-primary">
                      {selectedProduct.nombre}
                    </h4>

                    {status ? (
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {StatusIcon ? (
                          <StatusIcon className="h-3.5 w-3.5" />
                        ) : null}
                        {status.label}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-text-secondary">
                    Código: {selectedProduct.codigo || "Sin código"}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-surface p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Visible en web
                      </p>
                      <p className="mt-2 text-sm font-medium text-text-primary">
                        {selectedProduct.habilitado ? "Sí" : "No"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Disponibilidad
                      </p>
                      <p className="mt-2 text-sm font-medium text-text-primary">
                        {selectedProduct.disponibilidad
                          ? "Disponible"
                          : "No disponible"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-border bg-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                Auditoría
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs text-text-muted">Creado el</p>
                  <p className="text-sm font-medium text-text-primary">
                    {formatDate(selectedProduct.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-text-muted">Actualizado el</p>
                  <p className="text-sm font-medium text-text-primary">
                    {formatDate(selectedProduct.updated_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-text-muted">
                    Usuario guardado en tabla
                  </p>
                  <p className="break-all text-sm font-medium text-text-primary">
                    {selectedProduct.modified_by || "Sin dato"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">
              Nombre
            </span>
            <input
              name="nombre"
              value={form.nombre}
              onChange={onChange}
              disabled={isView}
              placeholder="Ej. Detergente en polvo Arcoiris"
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">
              Código
            </span>
            <input
              name="codigo"
              value={form.codigo}
              readOnly
              disabled
              placeholder="Se genera automáticamente"
              className="h-12 w-full rounded-2xl border border-border bg-surface-soft px-4 text-sm text-text-secondary outline-none"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-text-primary">
              Descripción
            </span>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={onChange}
              disabled={isView}
              rows={4}
              placeholder="Describe el producto de forma breve..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">
              Categoría
            </span>
            <select
              name="categoria"
              value={form.categoria}
              onChange={onChange}
              disabled={isView}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">
              Unidad
            </span>
            <select
              name="unidad"
              value={form.unidad}
              onChange={onChange}
              disabled={isView}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="">Selecciona una unidad</option>
              {UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">
              Precio compra
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="precio_compra"
              value={form.precio_compra}
              onChange={onChange}
              disabled={isView}
              placeholder="0.00"
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">
              Utilidad
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="precio_utilidad"
              value={form.precio_utilidad}
              onChange={onChange}
              disabled={isView}
              placeholder="0.00"
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">
              Precio venta
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="precio"
              value={form.precio}
              onChange={onChange}
              disabled={isView}
              placeholder="0.00"
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">
              Cantidad
            </span>
            <input
              type="number"
              min="0"
              name="cantidad"
              value={form.cantidad}
              onChange={onChange}
              disabled={isView}
              placeholder="0"
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">
              Cantidad por caja
            </span>
            <input
              type="number"
              min="0"
              name="cantidad_caja"
              value={form.cantidad_caja}
              onChange={onChange}
              disabled={isView}
              placeholder="0"
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <div className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-text-primary">
              Imagen del producto
            </span>

            <div className="rounded-[24px] border border-border bg-surface-soft p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface">
                  {localImagePreview || form.imagen ? (
                    <img
                      src={localImagePreview || form.imagen}
                      alt={form.nombre || "Vista previa"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-text-muted">
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs">Sin imagen</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  {!isView ? (
                    <>
                      <input
                        type="file"
                        name="imagenFile"
                        accept="image/*"
                        onChange={onChange}
                        className="block w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary file:mr-3 file:rounded-xl file:border-0 file:bg-accent-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />

                      <p className="text-xs text-text-secondary">
                        Sube una imagen del producto.
                      </p>

                      {form.imagen && (
                        <button
                          type="button"
                          onClick={onRemoveImage}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-error-200 bg-error-50 px-4 text-sm font-semibold text-error-700 transition hover:bg-error-100"
                        >
                          Quitar imagen actual
                        </button>
                      )}
                      {uploadingImage ? (
                        <p className="text-xs font-medium text-primary-600">
                          Subiendo imagen...
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-text-secondary">
                      Imagen registrada del producto.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-soft p-4">
            <input
              type="checkbox"
              name="habilitado"
              checked={Boolean(form.habilitado)}
              onChange={onChange}
              disabled={isView}
              className="h-4 w-4 rounded border-border"
            />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Visible en web
              </p>
              <p className="text-xs text-text-secondary">
                Si está apagado, no se muestra en tu página pública.
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-soft p-4">
            <input
              type="checkbox"
              name="disponibilidad"
              checked={Boolean(form.disponibilidad)}
              onChange={onChange}
              disabled={isView}
              className="h-4 w-4 rounded border-border"
            />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Disponible para venta
              </p>
              <p className="text-xs text-text-secondary">
                Marca si el producto está disponible comercialmente.
              </p>
            </div>
          </label>
        </section>

        {!isView ? (
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Package className="h-4 w-4" />
              )}
              {isCreate ? "Guardar producto" : "Actualizar producto"}
            </button>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localImagePreview, setLocalImagePreview] = useState("");
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [modalMode, setModalMode] = useState(null); // create | view | edit | delete
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  function removeCurrentImage() {
    setForm((prev) => ({
      ...prev,
      imagen: "",
      imagenFile: null,
    }));
    setLocalImagePreview("");
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  async function uploadProductImage(file, productId) {
    if (!file) return null;

    try {
      setUploadingImage(true);

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${productId}-${Date.now()}.${fileExt}`;
      const filePath = `productos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("productos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("productos")
        .getPublicUrl(filePath);

      return data?.publicUrl || null;
    } catch (error) {
      console.error("Error al subir imagen:", error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  }

  async function getCurrentUserId() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user?.id || null;
  }

  function resetForm() {
    setForm(INITIAL_FORM);
  }

  function openCreateModal() {
    const newId = generateUUID();

    setSelectedProduct(null);
    setLocalImagePreview("");
    setForm({
      ...INITIAL_FORM,
      id: newId,
      codigo: generarCodigoProducto(newId),
    });
    setModalMode("create");
  }

  function openViewModal(product) {
    setSelectedProduct(product);
    setForm({
      id: product.id || "",
      nombre: product.nombre || "",
      descripcion: product.descripcion || "",
      precio: product.precio ?? "",
      imagen: product.imagen || "",
      imagenFile: null,
      disponibilidad: Boolean(product.disponibilidad),
      cantidad: product.cantidad ?? "",
      cantidad_caja: product.cantidad_caja ?? "",
      precio_compra: product.precio_compra ?? "",
      precio_utilidad: product.precio_utilidad ?? "",
      habilitado: Boolean(product.habilitado),
      categoria: product.categoria || "",
      unidad: product.unidad || "",
      codigo: product.codigo || "",
    });
    setLocalImagePreview("");
    setModalMode("view");
  }

  function openEditModal(product) {
    setSelectedProduct(product);
    setForm({
      id: product.id || "",
      nombre: product.nombre || "",
      descripcion: product.descripcion || "",
      precio: product.precio ?? "",
      imagen: product.imagen || "",
      imagenFile: null,
      disponibilidad: Boolean(product.disponibilidad),
      cantidad: product.cantidad ?? "",
      cantidad_caja: product.cantidad_caja ?? "",
      precio_compra: product.precio_compra ?? "",
      precio_utilidad: product.precio_utilidad ?? "",
      habilitado: Boolean(product.habilitado),
      categoria: product.categoria || "",
      unidad: product.unidad || "",
      codigo: product.codigo || "",
    });
    setLocalImagePreview("");
    setModalMode("edit");
  }

  useEffect(() => {
    return () => {
      if (localImagePreview) {
        URL.revokeObjectURL(localImagePreview);
      }
    };
  }, [localImagePreview]);

  function openDeleteModal(product) {
    setSelectedProduct(product);
    setModalMode("delete");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedProduct(null);
    setLocalImagePreview("");
    resetForm();
  }

  function onInputChange(e) {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files?.[0] || null;

      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setLocalImagePreview(previewUrl);
      } else {
        setLocalImagePreview("");
      }

      setForm((prev) => ({
        ...prev,
        [name]: file,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function validateForm() {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (!form.categoria) return "Selecciona una categoría.";
    if (!form.unidad) return "Selecciona una unidad.";
    if (form.precio === "" || Number(form.precio) < 0)
      return "El precio debe ser válido.";
    if (form.precio_compra === "" || Number(form.precio_compra) < 0) {
      return "El precio de compra debe ser válido.";
    }
    if (form.precio_utilidad === "" || Number(form.precio_utilidad) < 0) {
      return "La utilidad debe ser válida.";
    }
    if (form.cantidad === "" || Number(form.cantidad) < 0)
      return "La cantidad debe ser válida.";
    if (form.cantidad_caja === "" || Number(form.cantidad_caja) < 0) {
      return "La cantidad por caja debe ser válida.";
    }
    return null;
  }

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al cargar productos:", error);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  function getStoragePathFromUrl(imageUrl, bucketName = "productos") {
    if (!imageUrl) return null;

    try {
      const url = new URL(imageUrl);
      const marker = `/storage/v1/object/public/${bucketName}/`;
      const index = url.pathname.indexOf(marker);

      if (index === -1) return null;

      return decodeURIComponent(url.pathname.slice(index + marker.length));
    } catch (error) {
      console.error("No se pudo obtener el path de la imagen:", error);
      return null;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setSaving(true);

      const userId = await getCurrentUserId();
      const isEdit = modalMode === "edit";

      const productId = form.id || generateUUID();
      const codigo = form.codigo || generarCodigoProducto(productId);

      let imageUrl = form.imagen || null;

      if (form.imagenFile) {
        const validTypes = [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/webp",
        ];
        const maxSize = 2 * 1024 * 1024;

        if (!validTypes.includes(form.imagenFile.type)) {
          alert("La imagen debe ser PNG, JPG o WEBP.");
          setSaving(false);
          return;
        }

        if (form.imagenFile.size > maxSize) {
          alert("La imagen no debe superar los 2MB.");
          setSaving(false);
          return;
        }

        imageUrl = await uploadProductImage(form.imagenFile, productId);
      }

      const payload = {
        id: productId,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio: Number(form.precio),
        imagen: imageUrl,
        disponibilidad: Boolean(form.disponibilidad),
        cantidad: Number(form.cantidad),
        cantidad_caja: Number(form.cantidad_caja),
        precio_compra: Number(form.precio_compra),
        precio_utilidad: Number(form.precio_utilidad),
        habilitado: Boolean(form.habilitado),
        categoria: form.categoria,
        unidad: form.unidad,
        codigo,
        modified_by: userId,
        updated_at: new Date().toISOString(),
      };

      if (!isEdit) {
        const { error } = await supabase.from("productos").insert([
          {
            ...payload,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("productos")
          .update({
            nombre: payload.nombre,
            descripcion: payload.descripcion,
            precio: payload.precio,
            imagen: payload.imagen,
            disponibilidad: payload.disponibilidad,
            cantidad: payload.cantidad,
            cantidad_caja: payload.cantidad_caja,
            precio_compra: payload.precio_compra,
            precio_utilidad: payload.precio_utilidad,
            habilitado: payload.habilitado,
            categoria: payload.categoria,
            unidad: payload.unidad,
            modified_by: payload.modified_by,
            updated_at: payload.updated_at,
          })
          .eq("id", productId);

        if (error) throw error;
      }

      await fetchProducts();
      closeModal();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert(error.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedProduct?.id) return;

    try {
      setDeleting(true);

      if (selectedProduct.imagen) {
        const imagePath = getStoragePathFromUrl(
          selectedProduct.imagen,
          "productos",
        );

        if (imagePath) {
          const { error: storageError } = await supabase.storage
            .from("productos")
            .remove([imagePath]);

          if (storageError) {
            console.error(
              "Error al eliminar imagen del storage:",
              storageError,
            );
          }
        }
      }

      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", selectedProduct.id);

      if (error) throw error;

      await fetchProducts();
      closeModal();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert(error.message || "No se pudo eliminar el producto.");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const rawSearch = normalizeText(search);

    const searchTerms = rawSearch
      .split(",")
      .map((term) => normalizeText(term))
      .filter(Boolean);

    return products.filter((item) => {
      const status = getInventoryStatus(item);

      const searchableFields = [
        normalizeText(item.nombre),
        normalizeText(item.codigo),
        normalizeText(item.categoria),
      ];

      const matchesSearch =
        searchTerms.length === 0 ||
        searchTerms.some((term) =>
          searchableFields.some((field) => field.includes(term)),
        );

      const matchesStatus =
        statusFilter === "todos" ? true : status.key === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE),
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage]);

  const startItem =
    filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredProducts.length,
  );

  const stats = useMemo(() => {
    const total = products.length;
    const activos = products.filter(
      (item) => getInventoryStatus(item).key === "activo",
    ).length;
    const bajo = products.filter(
      (item) => getInventoryStatus(item).key === "stock_bajo",
    ).length;
    const agotados = products.filter(
      (item) => getInventoryStatus(item).key === "agotado",
    ).length;
    const ocultos = products.filter(
      (item) => getInventoryStatus(item).key === "oculto",
    ).length;

    return { total, activos, bajo, agotados, ocultos };
  }, [products]);

  function goToPreviousPage() {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }

  function goToNextPage() {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }

  function handleExportExcel() {
    const dataToExport = filteredProducts
      .filter(
        (item) => Boolean(item.disponibilidad) && Boolean(item.habilitado),
      )
      .map((item) => {
        return {
          Nombre: item.nombre || "",
          Código: item.codigo || "",
          Descripción: item.descripcion || "",
          Categoría: item.categoria || "",
          Unidad: item.unidad || "",
          Precio: Number(item.precio || 0),
          Cantidad: Number(item.cantidad || 0),
          "Cantidad por caja": Number(item.cantidad_caja || 0),
        };
      });

    if (dataToExport.length === 0) {
      alert("No hay productos visibles en web y disponibles para exportar.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

    XLSX.writeFile(
      workbook,
      `productos_web_disponibles_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  async function loadImageAsDataUrl(url) {
    if (!url) return null;

    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) throw new Error("No se pudo cargar la imagen");

      const blob = await response.blob();

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("No se pudo cargar la imagen para PDF:", error);
      return null;
    }
  }

  function getCategoryLabel(value) {
    const match = CATEGORY_OPTIONS.find((item) => item.value === value);
    return match?.label || value || "Sin categoría";
  }

  function splitIntoChunks(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  function safeText(value, fallback = "") {
    return String(value ?? fallback).trim();
  }

  function fitImageContain(imgW, imgH, boxW, boxH) {
    if (!imgW || !imgH) {
      return {
        width: boxW,
        height: boxH,
        x: 0,
        y: 0,
      };
    }

    const ratio = Math.min(boxW / imgW, boxH / imgH);
    const width = imgW * ratio;
    const height = imgH * ratio;

    return {
      width,
      height,
      x: (boxW - width) / 2,
      y: (boxH - height) / 2,
    };
  }

  async function getImageDimensions(dataUrl) {
    if (!dataUrl) return null;

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  async function handleExportPDF() {
    const dataToExport = filteredProducts.filter(
      (item) => Boolean(item.disponibilidad) && Boolean(item.habilitado),
    );

    if (dataToExport.length === 0) {
      alert(
        "No hay productos visibles en web y disponibles para exportar en PDF.",
      );
      return;
    }

    try {
      setIsExportingPDF(true);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 14;
      const marginBottom = 12;

      // Colores de marca
      const BRAND_PRIMARY = [16, 59, 117]; // #103b75
      const BRAND_ACCENT = [226, 17, 42]; // #e2112a
      const BG = [248, 250, 252]; // #f8fafc
      const SURFACE = [255, 255, 255];
      const BORDER = [226, 232, 240]; // #e2e8f0
      const TEXT_PRIMARY = [15, 23, 42]; // #0f172a
      const TEXT_SECONDARY = [51, 65, 85]; // #334155
      const TEXT_MUTED = [100, 116, 139]; // #64748b
      const PRICE = [16, 59, 117];

      const logoData = await loadImageAsDataUrl("/Logo.png");

      // =========================
      // PRODUCTOS DESDE LA PÁGINA 1
      // =========================
      const groupedProducts = splitIntoChunks(dataToExport, 3);
      const totalPages = groupedProducts.length;

      for (let pageIndex = 0; pageIndex < groupedProducts.length; pageIndex++) {
        const group = groupedProducts[pageIndex];

        // Solo agregar nueva página después de la primera
        if (pageIndex > 0) {
          pdf.addPage();
        }

        // fondo
        pdf.setFillColor(...SURFACE);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");

        // =========================
        // HEADER MINIMALISTA CON MARCA
        // =========================
        const headerH = 18;

        // fondo blanco
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, headerH, "F");

        // logo izquierda (más grande)
        if (logoData) {
          try {
            const logoW = 30;
            const logoH = 9;
            const logoX = marginX;
            const logoY = 4;

            pdf.addImage(logoData, "PNG", logoX, logoY, logoW, logoH);
          } catch (error) {
            console.error("No se pudo insertar el logo:", error);
          }
        }

        // título centrado
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(35, 35, 35);
        pdf.text("Catálogo de productos", pageWidth / 2, 11, {
          align: "center",
        });

        // número de página derecha
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(
          `Página ${pageIndex + 1} de ${totalPages}`,
          pageWidth - marginX,
          11,
          { align: "right" },
        );

        // línea inferior gris suave
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.4);
        pdf.line(marginX, headerH - 1.5, pageWidth - marginX, headerH - 1.5);

        // =========================
        // LAYOUT DE PRODUCTOS
        // =========================
        const contentTop = 28;
        const contentBottom = pageHeight - marginBottom;
        const availableHeight = contentBottom - contentTop;
        const gap = 8;
        const cardHeight = (availableHeight - gap * 2) / 3;
        const cardWidth = pageWidth - marginX * 2;

        for (let i = 0; i < group.length; i++) {
          const item = group[i];

          const cardX = marginX;
          const cardY = contentTop + i * (cardHeight + gap);

          // card
          pdf.setFillColor(...SURFACE);
          pdf.setDrawColor(...BORDER);
          pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 5, 5, "FD");

          // medidas internas
          const innerPad = 6;
          const imageBoxX = cardX + innerPad;
          const imageBoxY = cardY + 18;
          const imageBoxW = 42;
          const imageBoxH = cardHeight - 24;

          const textX = imageBoxX + imageBoxW + 8;
          const textW = cardWidth - (textX - cardX) - innerPad;
          const titleY = cardY + 24;

          // contenedor imagen
          pdf.setFillColor(...BG);
          pdf.setDrawColor(...BORDER);
          pdf.roundedRect(
            imageBoxX,
            imageBoxY,
            imageBoxW,
            imageBoxH,
            4,
            4,
            "FD",
          );

          const imageData = await loadImageAsDataUrl(item.imagen);

          if (imageData) {
            try {
              const dimensions = await getImageDimensions(imageData);
              const fit = fitImageContain(
                dimensions?.width || imageBoxW,
                dimensions?.height || imageBoxH,
                imageBoxW - 4,
                imageBoxH - 4,
              );

              let format = "JPEG";
              if (String(imageData).startsWith("data:image/png")) {
                format = "PNG";
              } else if (String(imageData).startsWith("data:image/webp")) {
                format = "WEBP";
              }

              pdf.addImage(
                imageData,
                format,
                imageBoxX + 2 + fit.x,
                imageBoxY + 2 + fit.y,
                fit.width,
                fit.height,
              );
            } catch (error) {
              console.error("No se pudo insertar la imagen en el card:", error);
              pdf.setTextColor(...TEXT_MUTED);
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(9);
              pdf.text("Imagen no disponible", imageBoxX + 5, imageBoxY + 12);
            }
          } else {
            pdf.setTextColor(...TEXT_MUTED);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.text("Sin imagen", imageBoxX + 11, imageBoxY + imageBoxH / 2);
          }

          // categoría badge
          const categoryLabel = getCategoryLabel(item.categoria);
          pdf.setFillColor(...BRAND_ACCENT);
          pdf.roundedRect(textX, cardY + 6, 34, 6.5, 2, 2, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8.5);
          pdf.text(categoryLabel, textX + 2.5, cardY + 10.5);

          // nombre
          pdf.setTextColor(...TEXT_PRIMARY);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(13);

          const titleLines = pdf.splitTextToSize(
            safeText(item.nombre, "Sin nombre"),
            textW,
          );
          pdf.text(titleLines.slice(0, 2), textX, titleY);

          const titleLineCount = Math.min(titleLines.length, 2);
          const afterTitleY = titleY + titleLineCount * 5.5 + 2;

          // código
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9.5);
          pdf.setTextColor(...TEXT_MUTED);
          pdf.text(
            `Código: ${safeText(item.codigo, "Sin código")}`,
            textX,
            afterTitleY,
          );

          // descripción
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9.5);
          pdf.setTextColor(...TEXT_SECONDARY);

          const desc = safeText(
            item.descripcion,
            "Sin descripción disponible.",
          );

          const descLines = pdf.splitTextToSize(desc, textW);
          const maxDescLines = 6;

          let finalDescLines = descLines.slice(0, maxDescLines);
          if (descLines.length > maxDescLines) {
            const last = finalDescLines[maxDescLines - 1];
            finalDescLines[maxDescLines - 1] =
              `${last.slice(0, Math.max(0, last.length - 3))}...`;
          }

          pdf.text(finalDescLines, textX, afterTitleY + 8);

          // línea decorativa inferior
          pdf.setDrawColor(...BORDER);
          pdf.line(
            textX,
            cardY + cardHeight - 12,
            cardX + cardWidth - innerPad,
            cardY + cardHeight - 12,
          );

          // footer interno de card
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(...TEXT_MUTED);
          pdf.text("Disponible en catálogo", textX, cardY + cardHeight - 6);
        }

        // footer general
        pdf.setDrawColor(...BORDER);
        pdf.line(marginX, pageHeight - 8, pageWidth - marginX, pageHeight - 8);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(...TEXT_MUTED);
        pdf.text(
          "Catálogo generado automáticamente",
          marginX,
          pageHeight - 3.5,
        );
        pdf.text(
          new Date().toLocaleDateString("es-MX"),
          pageWidth - marginX,
          pageHeight - 3.5,
          { align: "right" },
        );
      }

      pdf.save(
        `catalogo_productos_${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("No se pudo generar el PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={Boxes}
          title="Productos totales"
          value={stats.total}
          note="Artículos registrados dentro del catálogo."
          tone="primary"
        />

        <SummaryCard
          icon={CheckCircle2}
          title="Activos"
          value={stats.activos}
          note="Productos visibles y con stock suficiente."
          tone="success"
        />

        <SummaryCard
          icon={AlertTriangle}
          title="Stock bajo"
          value={stats.bajo}
          note="Productos con existencia reducida."
          tone="warning"
        />

        <SummaryCard
          icon={Archive}
          title="Agotados"
          value={stats.agotados}
          note="Productos sin existencia actual."
          tone="error"
        />

        <SummaryCard
          icon={Eye}
          title="Ocultos"
          value={stats.ocultos}
          note="No visibles en la página pública."
          tone="slate"
        />
      </div>

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent-600">
              Gestión comercial
            </p>
            <h3 className="mt-1 text-xl font-bold text-text-primary md:text-2xl">
              Productos
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
              Administra el catálogo, revisa stock, controla visibilidad en web
              y edita todo desde modales como la gente civilizada, por una vez.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            <Plus className="h-4 w-4" />
            Crear producto
          </button>
        </div>

        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, código o categoría. Usa comas para varios: WAL-8554E9, WAL-1234ABC"
                className="h-12 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={filteredProducts.length === 0}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Descargar Excel
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={filteredProducts.length === 0 || isExportingPDF}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isExportingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Descargar PDF
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="Todos"
              active={statusFilter === "todos"}
              onClick={() => setStatusFilter("todos")}
            />
            <FilterPill
              label="Activos"
              active={statusFilter === "activo"}
              onClick={() => setStatusFilter("activo")}
            />
            <FilterPill
              label="Stock bajo"
              active={statusFilter === "stock_bajo"}
              onClick={() => setStatusFilter("stock_bajo")}
            />
            <FilterPill
              label="Agotados"
              active={statusFilter === "agotado"}
              onClick={() => setStatusFilter("agotado")}
            />
            <FilterPill
              label="Ocultos"
              active={statusFilter === "oculto"}
              onClick={() => setStatusFilter("oculto")}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center p-8">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm font-medium text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando productos...
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-primary-100 bg-primary-50 text-primary-700">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-semibold text-text-primary">
                No hay productos para mostrar
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Revisa la búsqueda o crea un producto nuevo.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden xl:block">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-surface-soft">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Producto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Código
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Categoría
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Compra
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Venta
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedProducts.map((item) => {
                      const status = getInventoryStatus(item);
                      const StatusIcon = status.icon;

                      return (
                        <tr
                          key={item.id}
                          className="border-t border-border transition hover:bg-surface-soft/70"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary-100 bg-primary-50 text-primary-700">
                                {item.imagen ? (
                                  <img
                                    src={item.imagen}
                                    alt={item.nombre}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-5 w-5" />
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-text-primary">
                                  {item.nombre}
                                </p>
                                <p className="mt-1 text-xs text-text-muted truncate w-48">
                                  {item.descripcion ||
                                    "Producto registrado en catálogo"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-soft px-3 py-2 text-sm font-medium text-text-primary">
                              <Barcode className="h-4 w-4 text-primary-500" />
                              {item.codigo}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-secondary">
                              <Tag className="h-4 w-4 text-accent-500" />
                              {item.categoria}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary">
                              <Warehouse className="h-4 w-4 text-primary-500" />
                              {item.cantidad} pzas
                            </div>
                          </td>

                          <td className="px-6 py-5 text-sm font-medium text-text-primary">
                            {formatMoney(item.precio_compra)}
                          </td>

                          <td className="px-6 py-5 text-sm font-bold text-text-primary">
                            {formatMoney(item.precio)}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              {status.label}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openViewModal(item)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => openDeleteModal(item)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
              {paginatedProducts.map((item) => {
                const status = getInventoryStatus(item);
                const StatusIcon = status.icon;

                return (
                  <article
                    key={item.id}
                    className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary-100 bg-primary-50 text-primary-700">
                          {item.imagen ? (
                            <img
                              src={item.imagen}
                              alt={item.nombre}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {item.nombre}
                          </p>
                          <p className="mt-1 text-sm text-text-secondary">
                            {item.codigo}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${status.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-surface-soft p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          Categoría
                        </p>
                        <p className="mt-2 text-sm font-medium text-text-primary">
                          {item.categoria}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-surface-soft p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          Stock
                        </p>
                        <p className="mt-2 text-sm font-medium text-text-primary">
                          {item.cantidad} piezas
                        </p>
                      </div>

                      <div className="rounded-2xl bg-surface-soft p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          Compra
                        </p>
                        <p className="mt-2 text-sm font-medium text-text-primary">
                          {formatMoney(item.precio_compra)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-surface-soft p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          Precio
                        </p>
                        <p className="mt-2 text-sm font-bold text-text-primary">
                          {formatMoney(item.precio)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openViewModal(item)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => openDeleteModal(item)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-text-secondary">
                Mostrando{" "}
                <span className="font-semibold text-text-primary">
                  {startItem}
                </span>
                {" - "}
                <span className="font-semibold text-text-primary">
                  {endItem}
                </span>
                {" de "}
                <span className="font-semibold text-text-primary">
                  {filteredProducts.length}
                </span>
                {" productos"}
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>

                <div className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface-soft px-4 text-sm font-semibold text-text-primary">
                  Página {currentPage} de {totalPages}
                </div>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <ProductFormModal
        open={["create", "view", "edit"].includes(modalMode)}
        mode={modalMode}
        form={form}
        saving={saving}
        onClose={closeModal}
        onChange={onInputChange}
        onSubmit={handleSubmit}
        selectedProduct={selectedProduct}
        onRemoveImage={removeCurrentImage}
        uploadingImage={uploadingImage}
        localImagePreview={localImagePreview}
      />

      <ConfirmDeleteModal
        open={modalMode === "delete"}
        product={selectedProduct}
        loading={deleting}
        onClose={closeModal}
        onConfirm={handleDelete}
      />
    </section>
  );
}
