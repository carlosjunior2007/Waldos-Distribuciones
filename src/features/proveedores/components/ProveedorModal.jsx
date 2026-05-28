import { Building2, Loader2 } from "lucide-react";
import Modal from "../../../components/ui/Modal";

export default function ProveedorModal({
  open,
  mode,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isCreate
          ? "Crear proveedor"
          : isEdit
            ? "Editar proveedor"
            : "Detalle del proveedor"
      }
      subtitle={
        isCreate
          ? "Registra los datos del proveedor para poder asociarlo a productos."
          : isEdit
            ? "Actualiza la información del proveedor."
            : "Consulta la información registrada del proveedor."
      }
      width="max-w-5xl"
    >
      <form onSubmit={onSubmit} className="space-y-5 p-5 md:p-6">
        <FormSection
          title="Información general"
          description="Datos principales para identificar al proveedor."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Código proveedor">
              <input
                name="codigo"
                value={form.codigo}
                onChange={onChange}
                disabled={isView}
                placeholder="PRV-0001"
                className={inputClass}
              />
            </Field>

            <Field label="Nombre del proveedor">
              <input
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                disabled={isView}
                placeholder="Ej. Proveedor ABC"
                className={inputClass}
              />
            </Field>

            <Field label="Razón social">
              <input
                name="razon_social"
                value={form.razon_social}
                onChange={onChange}
                disabled={isView}
                placeholder="Razón social"
                className={inputClass}
              />
            </Field>

            <Field label="RFC">
              <input
                name="rfc"
                value={form.rfc}
                onChange={onChange}
                disabled={isView}
                placeholder="RFC"
                className={inputClass}
              />
            </Field>

            <Field label="Sitio web">
              <input
                name="sitio_web"
                value={form.sitio_web}
                onChange={onChange}
                disabled={isView}
                placeholder="https://..."
                className={inputClass}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Contacto"
          description="Datos de contacto comercial o administrativo."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Contacto">
              <input
                name="contacto_nombre"
                value={form.contacto_nombre}
                onChange={onChange}
                disabled={isView}
                placeholder="Nombre de contacto"
                className={inputClass}
              />
            </Field>

            <Field label="Teléfono">
              <input
                name="telefono"
                value={form.telefono}
                onChange={onChange}
                disabled={isView}
                placeholder="+52..."
                className={inputClass}
              />
            </Field>

            <Field label="Correo">
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={onChange}
                disabled={isView}
                placeholder="correo@proveedor.com"
                className={inputClass}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Dirección"
          description="Ubicación general del proveedor."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Dirección" className="md:col-span-2">
              <input
                name="direccion"
                value={form.direccion}
                onChange={onChange}
                disabled={isView}
                placeholder="Calle, número, colonia"
                className={inputClass}
              />
            </Field>

            <Field label="Ciudad">
              <input
                name="ciudad"
                value={form.ciudad}
                onChange={onChange}
                disabled={isView}
                placeholder="Ciudad"
                className={inputClass}
              />
            </Field>

            <Field label="Estado">
              <input
                name="estado"
                value={form.estado}
                onChange={onChange}
                disabled={isView}
                placeholder="Estado"
                className={inputClass}
              />
            </Field>

            <Field label="Código postal">
              <input
                name="codigo_postal"
                value={form.codigo_postal}
                onChange={onChange}
                disabled={isView}
                placeholder="00000"
                maxLength={5}
                className={inputClass}
              />
            </Field>

            <Field label="País">
              <input
                name="pais"
                value={form.pais}
                onChange={onChange}
                disabled={isView}
                placeholder="México"
                className={inputClass}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Configuración"
          description="Notas internas y disponibilidad del proveedor."
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
            <Field label="Notas">
              <textarea
                name="notas"
                value={form.notas}
                onChange={onChange}
                disabled={isView}
                rows={4}
                placeholder="Condiciones, observaciones, tiempos generales, mínimos de compra..."
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none disabled:opacity-70"
              />
            </Field>

            <CheckField
              name="activo"
              checked={form.activo}
              onChange={onChange}
              disabled={isView}
              title="Proveedor activo"
              description="Si está apagado, no aparecerá como opción para nuevos productos."
            />
          </div>
        </FormSection>

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
                <Building2 className="h-4 w-4" />
              )}

              {isCreate ? "Guardar proveedor" : "Actualizar proveedor"}
            </button>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

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

function Field({ label, className = "", children }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      {children}
    </label>
  );
}

function CheckField({ name, checked, onChange, disabled, title, description }) {
  return (
    <label className="flex h-full cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background p-4">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 h-4 w-4 rounded border-border text-accent-500 focus:ring-accent-500"
      />

      <span>
        <span className="block text-sm font-bold text-text-primary">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-text-secondary">
          {description}
        </span>
      </span>
    </label>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70";
