import { Image as ImageIcon, Loader2, Package } from "lucide-react";

import Modal from "../../../components/ui/Modal";

import {
  CATEGORY_OPTIONS,
  UNIT_OPTIONS,
  SAT_PRODUCT_OPTIONS,
  SAT_UNIT_OPTIONS,
} from "../product.constants";
import {
  formatDate,
  getInventoryStatus,
  getProductCreatorLabel,
} from "../product.helpers";

export default function ProductModal({
  open,
  mode,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
  onPriceBlur,
  selectedProduct,
  onRemoveImage,
  uploadingImage,
  localImagePreview,
  authUser,
  userLabels,
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
      width="max-w-4xl"
    >
      <form onSubmit={onSubmit} className="space-y-6 p-5 md:p-6">
        {!isCreate && selectedProduct ? (
          <ProductAuditHeader
            selectedProduct={selectedProduct}
            status={status}
            StatusIcon={StatusIcon}
            creatorLabel={getProductCreatorLabel(
              selectedProduct,
              authUser,
              userLabels,
            )}
          />
        ) : null}

        <ProductFormFields
          form={form}
          isView={isView}
          onChange={onChange}
          onPriceBlur={onPriceBlur}
          onRemoveImage={onRemoveImage}
          uploadingImage={uploadingImage}
          localImagePreview={localImagePreview}
        />

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

function ProductAuditHeader({
  selectedProduct,
  status,
  StatusIcon,
  creatorLabel,
}) {
  return (
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
                <StatusBadge icon={StatusIcon} className={status.className}>
                  {status.label}
                </StatusBadge>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-text-secondary">
              Código: {selectedProduct.codigo || "Sin código"}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MiniInfo
                label="Visible en web"
                value={selectedProduct.habilitado ? "Sí" : "No"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-border bg-surface-soft p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          Auditoría
        </p>

        <div className="mt-4 space-y-3">
          <MiniInfo
            label="Creado el"
            value={formatDate(selectedProduct.created_at)}
          />

          <MiniInfo
            label="Actualizado el"
            value={formatDate(selectedProduct.updated_at)}
          />

          <MiniInfo
            label="Última persona que lo modificó"
            value={creatorLabel || "Usuario no disponible"}
          />
        </div>
      </div>
    </section>
  );
}

function ProductFormFields({
  form,
  isView,
  onChange,
  onRemoveImage,
  uploadingImage,
  localImagePreview,
  onPriceBlur,
}) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Nombre">
        <input
          name="nombre"
          value={form.nombre}
          onChange={onChange}
          disabled={isView}
          placeholder="Ej. Detergente en polvo"
          className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70"
        />
      </Field>

      <Field label="Código">
        <input
          name="codigo"
          value={form.codigo}
          readOnly
          disabled
          placeholder="Se genera automáticamente"
          className="h-12 w-full rounded-2xl border border-border bg-surface-soft px-4 text-sm text-text-secondary outline-none"
        />
      </Field>

      <Field label="Descripción" className="md:col-span-2">
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={onChange}
          disabled={isView}
          rows={4}
          placeholder="Describe el producto de forma breve..."
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none disabled:opacity-70"
        />
      </Field>

      <Field label="Categoría">
        <select
          name="categoria"
          value={form.categoria}
          onChange={onChange}
          disabled={isView}
          className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70"
        >
          <option value="">Selecciona una categoría</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Unidad">
        <select
          name="unidad"
          value={form.unidad}
          onChange={onChange}
          disabled={isView}
          className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70"
        >
          <option value="">Selecciona una unidad</option>
          {UNIT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Clave SAT producto/servicio">
        <SatInput
          name="clave_sat"
          value={form.clave_sat}
          onChange={onChange}
          disabled={isView}
          options={SAT_PRODUCT_OPTIONS}
          placeholder="Ej. 47131800"
          listId="sat-product-options"
        />
      </Field>

      <Field label="Clave unidad SAT">
        <SatInput
          name="clave_unidad_sat"
          value={form.clave_unidad_sat}
          onChange={onChange}
          disabled={isView}
          options={SAT_UNIT_OPTIONS}
          placeholder="Ej. H87"
          listId="sat-unit-options"
        />
      </Field>

      <Field label="IVA %">
        <input
          type="number"
          step="0.01"
          min="0"
          name="iva_porcentaje"
          value={form.iva_porcentaje}
          onChange={onChange}
          disabled={isView}
          placeholder="16"
          className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70"
        />
      </Field>

      {[
        ["Precio compra", "precio_compra", "0.00"],
        ["Utilidad %", "precio_utilidad", "0.00"],
        ["Precio venta", "precio", "0.00"],
      ].map(([label, name, placeholder]) => (
        <Field key={name} label={label}>
          <input
            type="number"
            step="0.01"
            min="0"
            name={name}
            value={form[name]}
            onChange={onChange}
            onBlur={() => onPriceBlur(name)}
            disabled={isView}
            placeholder={placeholder}
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70"
          />
        </Field>
      ))}

      <Field label="Cantidad por caja">
        <input
          type="number"
          step="1"
          min="0"
          inputMode="numeric"
          pattern="[0-9]*"
          name="cantidad_caja"
          value={form.cantidad_caja}
          onChange={onChange}
          disabled={isView}
          placeholder="0"
          className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70"
        />
      </Field>

      <ImageField
        form={form}
        isView={isView}
        onChange={onChange}
        onRemoveImage={onRemoveImage}
        uploadingImage={uploadingImage}
        localImagePreview={localImagePreview}
      />

      <CheckField
        name="habilitado"
        checked={form.habilitado}
        onChange={onChange}
        disabled={isView}
        title="Visible en web"
        description="Si está apagado, no se muestra en tu página pública."
      />
    </section>
  );
}

function ImageField({
  form,
  isView,
  onChange,
  onRemoveImage,
  uploadingImage,
  localImagePreview,
}) {
  return (
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
                {form.imagen ? (
                  <button
                    type="button"
                    onClick={onRemoveImage}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-error-200 bg-error-50 px-4 text-sm font-semibold text-error-700 transition hover:bg-error-100"
                  >
                    Quitar imagen actual
                  </button>
                ) : null}
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
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      {children}
    </label>
  );
}

function CheckField({ name, checked, onChange, disabled, title, description }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-soft p-4">
      <input
        type="checkbox"
        name={name}
        checked={Boolean(checked)}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 rounded border-border"
      />

      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
    </label>
  );
}

function StatusBadge({ icon: Icon, className, children }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function MiniInfo({ label, value, strong = false }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>

      <p
        className={`mt-2 text-sm ${
          strong ? "font-bold" : "font-medium"
        } text-text-primary`}
      >
        {value}
      </p>
    </div>
  );
}

function SatInput({
  name,
  value,
  onChange,
  disabled,
  options,
  placeholder,
  listId,
}) {
  const selected = options.find((item) => item.clave === value);

  return (
    <div className="space-y-2">
      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        list={listId}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70"
      />

      <datalist id={listId}>
        {options.map((item) => (
          <option key={item.clave} value={item.clave}>
            {item.descripcion}
          </option>
        ))}
      </datalist>

      <p className="text-xs text-text-muted">
        {selected
          ? selected.descripcion
          : "Puedes buscar, pegar o escribir una clave manualmente."}
      </p>
    </div>
  );
}
