import { useEffect, useState } from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import { INITIAL_CLIENT } from "../client.constants";
import { buildClientPayload } from "../client.helpers";

export default function ClientModal({
  open,
  onClose,
  onSubmit,
  saving,
  editingClient,
}) {
  const [form, setForm] = useState(INITIAL_CLIENT);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      ...INITIAL_CLIENT,
      ...(editingClient || {}),
    });

    setLogoFile(null);
    setLogoPreview("");
  }, [open, editingClient]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0] || null;

    if (logoPreview) URL.revokeObjectURL(logoPreview);

    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : "");
  }

  function removeLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview);

    setLogoFile(null);
    setLogoPreview("");
    setForm((prev) => ({ ...prev, logo: "" }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert("El nombre comercial es obligatorio.");
      return;
    }

    onSubmit(buildClientPayload(form), logoFile);
  }

  const logoToShow = logoPreview || form.logo;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingClient?.id ? "Editar cliente" : "Nuevo cliente"}
      subtitle="Guarda datos comerciales, fiscales, contacto y logo."
      width="max-w-4xl"
      zIndex="z-[90]"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5 md:p-6">
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-sm font-semibold text-text-primary">
            Logo del cliente
          </p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
              {logoToShow ? (
                <img
                  src={logoToShow}
                  alt="Logo cliente"
                  className="h-full w-full object-contain"
                />
              ) : (
                <ImageIcon className="h-7 w-7 text-text-muted" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:bg-surface-soft">
                <Upload className="h-4 w-4" />
                Subir logo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>

              {logoToShow ? (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="ml-0 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-error-200 bg-error-50 px-4 text-sm font-semibold text-error-700 sm:ml-3"
                >
                  <X className="h-4 w-4" />
                  Quitar logo
                </button>
              ) : null}

              <p className="text-xs text-text-muted">
                PNG, JPG o WEBP. Máximo 2MB.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nombre comercial"
            value={form.nombre}
            onChange={(value) => updateField("nombre", value)}
            placeholder="Ej. Jaka Express"
          />

          <Input
            label="Razón social"
            value={form.razon_social || ""}
            onChange={(value) => updateField("razon_social", value)}
            placeholder="Ej. Jaka Express S.A. de C.V."
          />

          <Input
            label="RFC"
            value={form.rfc || ""}
            onChange={(value) => updateField("rfc", value)}
            placeholder="RFC del cliente"
          />

          <Input
            label="Régimen fiscal"
            value={form.regimen_fiscal || ""}
            onChange={(value) => updateField("regimen_fiscal", value)}
            placeholder="Ej. 601 General de Ley Personas Morales"
          />

          <Input
            label="Uso CFDI"
            value={form.uso_cfdi || ""}
            onChange={(value) => updateField("uso_cfdi", value)}
            placeholder="Ej. G03 Gastos en general"
          />

          <Input
            label="Teléfono"
            value={form.numero || ""}
            onChange={(value) => updateField("numero", value)}
            placeholder="+52..."
          />

          <Input
            label="Correo"
            type="email"
            value={form.correo || ""}
            onChange={(value) => updateField("correo", value)}
            placeholder="correo@empresa.com"
          />

          <Input
            label="Ciudad"
            value={form.ciudad || ""}
            onChange={(value) => updateField("ciudad", value)}
          />

          <Input
            label="Dirección"
            value={form.direccion || ""}
            onChange={(value) => updateField("direccion", value)}
            placeholder="Calle, número, colonia"
            className="md:col-span-2"
          />

          <Input
            label="Estado"
            value={form.estado || ""}
            onChange={(value) => updateField("estado", value)}
          />

          <Input
            label="Código postal"
            value={form.codigo_postal || ""}
            onChange={(value) => updateField("codigo_postal", value)}
          />

          <Input
            label="País"
            value={form.pais || ""}
            onChange={(value) => updateField("pais", value)}
          />

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-text-primary">
              Notas
            </span>

            <textarea
              rows={4}
              value={form.notas || ""}
              onChange={(e) => updateField("notas", e.target.value)}
              placeholder="Notas internas del cliente..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-4 text-sm font-semibold"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cliente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  ...props
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none"
        {...props}
      />
    </label>
  );
}