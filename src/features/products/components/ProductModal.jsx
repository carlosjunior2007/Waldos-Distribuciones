import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Mail,
  Package,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";

import Modal from "../../../components/ui/Modal";

import {
  CATEGORY_OPTIONS,
  UNIT_OPTIONS,
} from "../product.constants";
import {
  formatDate,
  formatEstimatedProfit,
  getInventoryStatus,
  getProductCreatorLabel,
} from "../product.helpers";
import {
  searchSatProductCodes,
  searchSatUnitCodes,
} from "../services/facturamaCatalogs.service";

export default function ProductModal({
  open,
  mode,
  form,
  suppliers = [],
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
      width="max-w-6xl"
    >
      <form onSubmit={onSubmit} className="space-y-5 p-5 md:p-6">
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
          suppliers={suppliers}
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

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70";

function FormSection({ title, description, children }) {
  return (
    <section className="rounded-[26px] border border-border bg-surface-soft p-4">
      <div className="mb-4">
        <h4 className="text-sm font-black text-text-primary">{title}</h4>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function ProductFormFields({
  form,
  suppliers = [],
  isView,
  onChange,
  onRemoveImage,
  uploadingImage,
  localImagePreview,
  onPriceBlur,
}) {
  const [activeTab, setActiveTab] = useState("general");

  const selectedUnit = UNIT_OPTIONS.find((option) => option.value === form.unidad);
  const unitSearchText = selectedUnit?.label || form.unidad || "";

  const tabs = [
    { key: "general", label: "General" },
    { key: "fiscal", label: "Fiscal SAT" },
    { key: "precio", label: "Precio" },
    { key: "proveedores", label: "Proveedores" },
    { key: "imagen", label: "Imagen y visibilidad" },
  ];

  return (
    <section className="space-y-5">
      <div className="flex gap-2 overflow-x-auto border-b border-border pb-3">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`h-11 shrink-0 rounded-t-2xl border border-b-0 px-4 text-sm font-bold transition ${
                active
                  ? "border-border bg-surface-soft text-primary-700 shadow-sm"
                  : "border-transparent bg-background text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "general" ? (
        <FormSection
          title="Información general"
          description="Datos básicos para identificar y mostrar el producto."
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field label="Nombre">
              <input
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                disabled={isView}
                placeholder="Ej. Detergente en polvo"
                className={inputClass}
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

            <Field label="Descripción" className="lg:col-span-2">
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
                className={inputClass}
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
                className={inputClass}
              >
                <option value="">Selecciona una unidad</option>
                {UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>
      ) : null}

      {activeTab === "fiscal" ? (
        <FormSection
          title="Datos fiscales SAT"
          description="Busca las claves directamente desde el catálogo fiscal. Puedes seleccionar sugerencias o pegar la clave manualmente."
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Field label="Clave SAT producto/servicio">
              <SatCatalogSearch
                name="clave_sat"
                value={form.clave_sat}
                onChange={onChange}
                disabled={isView}
                placeholder="Busca por nombre o clave, ej. limpieza"
                searchFn={searchSatProductCodes}
                defaultQuery={form.nombre}
                recommendationLabel="Sugerencias basadas en el nombre del producto"
                emptyText="Escribe el nombre del producto para ver sugerencias SAT."
              />
            </Field>

            <Field label="Clave unidad SAT">
              <SatCatalogSearch
                name="clave_unidad_sat"
                value={form.clave_unidad_sat}
                onChange={onChange}
                disabled={isView}
                placeholder="Busca unidad, ej. pieza, caja, litro"
                searchFn={searchSatUnitCodes}
                defaultQuery={unitSearchText}
                recommendationLabel="Sugerencias basadas en la unidad seleccionada"
                emptyText="Selecciona una unidad o busca manualmente la clave de unidad SAT."
              />
            </Field>

            <Field label="IVA %" className="xl:max-w-xs">
              <input
                type="number"
                step="0.01"
                min="0"
                name="iva_porcentaje"
                value={form.iva_porcentaje}
                onChange={onChange}
                disabled={isView}
                placeholder="16"
                className={inputClass}
              />
            </Field>
          </div>
        </FormSection>
      ) : null}

      {activeTab === "precio" ? (
        <FormSection
          title="Precio y presentación"
          description="Captura costo, utilidad, precio de venta y cantidad por caja."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  className={inputClass}
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
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">
              Ganancia estimada por producto
            </p>
            <p className="mt-2 text-2xl font-extrabold text-text-primary">
              {formatEstimatedProfit(form)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Se calcula con precio de venta sin IVA menos precio de compra.
            </p>
          </div>
        </FormSection>
      ) : null}

      {activeTab === "proveedores" ? (
        <FormSection
          title="Proveedores"
          description="Asocia uno o varios proveedores a este producto. Primero busca y selecciona el proveedor, luego agrega sus datos específicos."
        >
          <ProductSuppliersEditor
            value={form.proveedores || []}
            suppliers={suppliers}
            disabled={isView}
            onChange={onChange}
          />
        </FormSection>
      ) : null}

      {activeTab === "imagen" ? (
        <FormSection
          title="Imagen y visibilidad"
          description="Controla la imagen del producto y si aparecerá en la página pública."
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_340px]">
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
          </div>
        </FormSection>
      ) : null}
    </section>
  );
}

function ProductSuppliersEditor({ value = [], suppliers = [], disabled, onChange }) {
  const [supplierQuery, setSupplierQuery] = useState("");

  function emit(nextValue) {
    onChange({
      target: {
        name: "proveedores",
        value: nextValue,
        type: "custom",
      },
    });
  }

  function addSupplier(supplier) {
    if (!supplier?.id) return;

    const alreadyExists = value.some((item) => item.proveedor_id === supplier.id);
    if (alreadyExists) return;

    emit([
      ...value,
      {
        proveedor_id: supplier.id,
        sku_proveedor: "",
        precio_compra: "",
        moneda: "MXN",
        tiempo_entrega_dias: "",
        es_principal: value.length === 0,
        notas: "",
        proveedor: supplier,
        nombre: supplier.nombre,
      },
    ]);

    setSupplierQuery("");
  }

  function updateSupplier(index, field, nextValue) {
    const copy = [...value];

    if (field === "es_principal") {
      copy[index] = {
        ...copy[index],
        es_principal: true,
      };

      copy.forEach((item, itemIndex) => {
        if (itemIndex !== index) item.es_principal = false;
      });
    } else {
      copy[index] = {
        ...copy[index],
        [field]: nextValue,
      };
    }

    emit(copy);
  }

  function removeSupplier(index) {
    const next = value.filter((_, itemIndex) => itemIndex !== index);

    if (next.length && !next.some((item) => item.es_principal)) {
      next[0] = { ...next[0], es_principal: true };
    }

    emit(next);
  }

  const selectedSupplierIds = value.map((item) => item.proveedor_id).filter(Boolean);

  const availableSuppliers = suppliers.filter(
    (supplier) => !selectedSupplierIds.includes(supplier.id),
  );

  const filteredSuppliers = availableSuppliers.filter((supplier) => {
    const query = supplierQuery.trim().toLowerCase();

    if (!query) return true;

    return [
      supplier.nombre,
      supplier.razon_social,
      supplier.rfc,
      supplier.correo,
      supplier.telefono,
      supplier.contacto_nombre,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(query));
  });

  const currentSuppliers = value.map((item) => {
    const supplier = suppliers.find((row) => row.id === item.proveedor_id) || item.proveedor;
    return { ...item, proveedor: supplier || item.proveedor || null };
  });

  const mainSupplier = currentSuppliers.find((item) => item.es_principal);
  const hasSuppliers = currentSuppliers.length > 0;

  if (!suppliers.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-border bg-background p-5 text-sm text-text-secondary">
        Todavía no hay proveedores registrados. Primero crea proveedores en la sección de proveedores.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SupplierSummaryCard
          label="Proveedores asociados"
          value={String(currentSuppliers.length)}
          helper={currentSuppliers.length ? "Puedes agregar varios por producto." : "Aún no has asociado ninguno."}
        />

        <SupplierSummaryCard
          label="Proveedor principal"
          value={mainSupplier?.proveedor?.nombre || mainSupplier?.nombre || "Sin definir"}
          helper={mainSupplier ? "Se usa como referencia principal." : "Marca uno como principal."}
          accent={Boolean(mainSupplier)}
        />

        <SupplierSummaryCard
          label="Disponibles para agregar"
          value={String(availableSuppliers.length)}
          helper={availableSuppliers.length ? "Selecciona desde el catálogo." : "Todos los proveedores ya fueron agregados."}
        />
      </div>

      <div className={`grid gap-4 ${disabled ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.25fr)]"}`}>
        {!disabled ? (
          <section className="rounded-[26px] border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <Building2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h5 className="text-sm font-black text-text-primary">
                  Buscar y agregar proveedor
                </h5>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  Busca por nombre, RFC, contacto o correo. Después agrégalo al producto con un clic.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-surface px-3 py-2 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 shrink-0 text-text-muted" />

                <input
                  type="text"
                  value={supplierQuery}
                  onChange={(event) => setSupplierQuery(event.target.value)}
                  placeholder="Buscar proveedor..."
                  className="h-9 min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  Catálogo disponible
                </p>
                <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-bold text-text-secondary">
                  {filteredSuppliers.length}
                </span>
              </div>

              {filteredSuppliers.length ? (
                <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1">
                  {filteredSuppliers.map((supplier) => (
                    <button
                      key={supplier.id}
                      type="button"
                      onClick={() => addSupplier(supplier)}
                      className="group rounded-[22px] border border-border bg-surface p-4 text-left transition hover:border-primary-200 hover:bg-primary-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-text-primary">
                            {supplier.nombre}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-secondary">
                            {supplier.correo ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1">
                                <Mail className="h-3.5 w-3.5" />
                                {supplier.correo}
                              </span>
                            ) : null}

                            {supplier.telefono ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1">
                                <Phone className="h-3.5 w-3.5" />
                                {supplier.telefono}
                              </span>
                            ) : null}

                            {supplier.rfc ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1">
                                RFC: {supplier.rfc}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl bg-primary-600 px-3 text-sm font-bold text-white transition group-hover:bg-primary-700">
                          <Plus className="h-4 w-4" />
                          Agregar
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-border bg-surface-soft p-5 text-sm text-text-secondary">
                  {supplierQuery.trim()
                    ? "No encontramos proveedores con esa búsqueda."
                    : "No hay más proveedores disponibles para agregar."}
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section className="rounded-[26px] border border-border bg-background p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h5 className="text-sm font-black text-text-primary">
                Proveedores asociados
              </h5>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Ajusta el costo, SKU, tiempos de entrega y marca cuál es el principal.
              </p>
            </div>
          </div>

          {!hasSuppliers ? (
            <div className="mt-4 rounded-[22px] border border-dashed border-border bg-surface-soft p-6 text-center">
              <p className="text-sm font-semibold text-text-primary">
                Este producto aún no tiene proveedores asociados.
              </p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                {disabled
                  ? "No se registraron proveedores para este producto."
                  : "Selecciona uno desde el catálogo para comenzar."}
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {currentSuppliers.map((item, index) => {
                const supplier = item.proveedor;

                return (
                  <article
                    key={item.id || item.proveedor_id || index}
                    className="overflow-hidden rounded-[24px] border border-border bg-surface"
                  >
                    <div className="border-b border-border bg-background p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black text-text-primary">
                              {supplier?.nombre || item.nombre || "Proveedor"}
                            </p>

                            {item.es_principal ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-accent-200 bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-700">
                                <Star className="h-3.5 w-3.5" />
                                Principal
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-secondary">
                            {supplier?.correo ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-surface-soft px-2.5 py-1">
                                <Mail className="h-3.5 w-3.5" />
                                {supplier.correo}
                              </span>
                            ) : null}

                            {supplier?.telefono ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-surface-soft px-2.5 py-1">
                                <Phone className="h-3.5 w-3.5" />
                                {supplier.telefono}
                              </span>
                            ) : null}

                            {supplier?.rfc ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-surface-soft px-2.5 py-1">
                                RFC: {supplier.rfc}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {!disabled ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => updateSupplier(index, "es_principal", true)}
                              disabled={item.es_principal}
                              className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-bold transition ${
                                item.es_principal
                                  ? "border-accent-200 bg-accent-50 text-accent-700"
                                  : "border-border bg-background text-text-secondary hover:bg-surface-soft"
                              } disabled:cursor-not-allowed disabled:opacity-70`}
                            >
                              <Star className="h-4 w-4" />
                              {item.es_principal ? "Principal" : "Marcar principal"}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeSupplier(index)}
                              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-error-100 bg-error-50 px-3 text-sm font-bold text-error-700 transition hover:bg-error-100"
                            >
                              <Trash2 className="h-4 w-4" />
                              Quitar
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Field label="SKU proveedor">
                          <input
                            className={inputClass}
                            value={item.sku_proveedor || ""}
                            onChange={(event) =>
                              updateSupplier(index, "sku_proveedor", event.target.value)
                            }
                            disabled={disabled}
                            placeholder="Código interno"
                          />
                        </Field>

                        <Field label="Costo">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={inputClass}
                            value={item.precio_compra}
                            onChange={(event) =>
                              updateSupplier(index, "precio_compra", event.target.value)
                            }
                            disabled={disabled}
                            placeholder="0.00"
                          />
                        </Field>

                        <Field label="Moneda">
                          <select
                            className={inputClass}
                            value={item.moneda || "MXN"}
                            onChange={(event) =>
                              updateSupplier(index, "moneda", event.target.value)
                            }
                            disabled={disabled}
                          >
                            <option value="MXN">MXN</option>
                            <option value="USD">USD</option>
                          </select>
                        </Field>

                        <Field label="Entrega en días">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className={inputClass}
                            value={item.tiempo_entrega_dias}
                            onChange={(event) =>
                              updateSupplier(index, "tiempo_entrega_dias", event.target.value)
                            }
                            disabled={disabled}
                            placeholder="0"
                          />
                        </Field>

                        <Field label="Notas proveedor" className="md:col-span-2 xl:col-span-4">
                          <textarea
                            className="min-h-[92px] w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none disabled:opacity-70"
                            value={item.notas || ""}
                            onChange={(event) => updateSupplier(index, "notas", event.target.value)}
                            disabled={disabled}
                            placeholder="Condiciones, mínimo de compra, observaciones..."
                          />
                        </Field>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SupplierSummaryCard({ label, value, helper, accent = false }) {
  return (
    <article className={`rounded-[22px] border p-4 ${accent ? "border-accent-200 bg-accent-50" : "border-border bg-background"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-base font-black text-text-primary break-words">{value}</p>
      <p className="mt-1 text-xs leading-5 text-text-secondary">{helper}</p>
    </article>
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
    <div className="space-y-2">
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

function SatCatalogSearch({
  name,
  value,
  onChange,
  disabled,
  placeholder,
  searchFn,
  defaultQuery = "",
  recommendationLabel = "Sugerencias",
  emptyText,
}) {
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasUserTyped, setHasUserTyped] = useState(false);

  const selectedLabel = selectedItem
    ? `${selectedItem.clave} - ${selectedItem.descripcion}`
    : "";

  const inputValue = selectedItem ? selectedLabel : query;
  const cleanQuery = query.trim();
  const hasStoredValue = Boolean(value) && !selectedItem && !hasUserTyped;
  const canSearch = !selectedItem && !hasStoredValue && cleanQuery.length >= 2;
  const shouldShowDefaultHint =
    !selectedItem &&
    !hasStoredValue &&
    !hasUserTyped &&
    !value &&
    String(defaultQuery || "").trim().length >= 2;

  useEffect(() => {
    if (!value) {
      setSelectedItem(null);

      if (!hasUserTyped) {
        setQuery("");
      }

      return;
    }

    if (selectedItem?.clave === value) return;

    if (!hasUserTyped && !selectedItem) {
      setQuery(String(value || ""));
    }
  }, [value, selectedItem, hasUserTyped]);

  useEffect(() => {
    if (disabled) return undefined;

    if (!canSearch) {
      setResults([]);
      setErrorMessage("");
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const rows = await searchFn(cleanQuery);

        if (!cancelled) {
          setResults(rows || []);
        }
      } catch (error) {
        console.error("Error consultando catálogo fiscal:", error);

        if (!cancelled) {
          setResults([]);
          setErrorMessage(
            error.message ||
              "No se pudo consultar el catálogo fiscal en este momento.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [canSearch, cleanQuery, disabled, searchFn]);

  useEffect(() => {
    if (disabled || selectedItem || hasStoredValue || hasUserTyped || value) return undefined;

    const cleanDefaultQuery = String(defaultQuery || "").trim();

    if (cleanDefaultQuery.length < 2) return undefined;

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const rows = await searchFn(cleanDefaultQuery);

        if (!cancelled) {
          setResults(rows || []);
        }
      } catch (error) {
        console.error("Error consultando sugerencias SAT:", error);

        if (!cancelled) {
          setResults([]);
          setErrorMessage(
            error.message ||
              "No se pudo consultar el catálogo fiscal en este momento.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    defaultQuery,
    disabled,
    hasStoredValue,
    hasUserTyped,
    searchFn,
    selectedItem,
    value,
  ]);

  function emitValue(nextValue) {
    onChange({
      target: {
        name,
        value: nextValue,
        type: "text",
      },
    });
  }

  function handleInputChange(nextValue) {
    setHasUserTyped(true);
    setSelectedItem(null);
    setQuery(nextValue);
    setResults([]);
    emitValue(nextValue.trim());
  }

  function selectItem(item) {
    setSelectedItem(item);
    setQuery("");
    setResults([]);
    setErrorMessage("");
    setLoading(false);
    emitValue(item.clave);
  }

  function clearSelection() {
    setSelectedItem(null);
    setQuery("");
    setResults([]);
    setErrorMessage("");
    setHasUserTyped(false);
    emitValue("");
  }

  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-border bg-background p-2 focus-within:border-primary-400">
        <div className="flex items-center gap-2 px-2">
          <Search className="h-4 w-4 shrink-0 text-text-muted" />

          <input
            type="text"
            name={name}
            value={inputValue}
            onChange={(event) => handleInputChange(event.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none disabled:opacity-70"
          />

          {selectedItem && !disabled ? (
            <button
              type="button"
              onClick={clearSelection}
              className="shrink-0 rounded-xl bg-surface-soft px-2.5 py-1.5 text-xs font-bold text-text-secondary transition hover:bg-surface"
            >
              Cambiar
            </button>
          ) : null}
        </div>
      </div>

      {shouldShowDefaultHint ? (
        <p className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700">
          {recommendationLabel}: “{defaultQuery}”
        </p>
      ) : null}

      {loading ? (
        <p className="text-xs font-semibold text-primary-600">
          Buscando en catálogo fiscal...
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-xl border border-warning-100 bg-warning-50 px-3 py-2 text-xs font-medium text-warning-800">
          {errorMessage}
        </p>
      ) : null}

      {!loading && !errorMessage && selectedItem ? (
        <p className="rounded-xl border border-success-100 bg-success-50 px-3 py-2 text-xs font-semibold text-success-700">
          Clave seleccionada: {selectedItem.clave}
        </p>
      ) : null}

      {!loading && !errorMessage && !selectedItem && hasStoredValue ? (
        <p className="rounded-xl border border-success-100 bg-success-50 px-3 py-2 text-xs font-semibold text-success-700">
          Clave guardada. Presiona el campo para buscar otra.
        </p>
      ) : null}

      {!loading &&
      !errorMessage &&
      !selectedItem &&
      !hasStoredValue &&
      cleanQuery.length < 2 ? (
        <p className="text-xs text-text-muted">{emptyText}</p>
      ) : null}

      {!loading && !errorMessage && !selectedItem && results.length ? (
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-border bg-surface p-1">
          {results.map((item) => (
            <button
              key={`${item.clave}-${item.descripcion}`}
              type="button"
              onClick={() => selectItem(item)}
              className="w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-soft"
            >
              <p className="text-sm font-bold text-text-primary">
                {item.clave}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {item.descripcion}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      {!loading &&
      !errorMessage &&
      !selectedItem &&
      canSearch &&
      !results.length ? (
        <p className="text-xs text-text-muted">
          Sin resultados. Puedes ajustar la búsqueda o pegar la clave manualmente.
        </p>
      ) : null}
    </div>
  );
}

