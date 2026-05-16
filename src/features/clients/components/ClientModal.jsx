import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  MapPin,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import Modal from "../../../components/ui/Modal";
import { EMPTY_CLIENT_ADDRESS, INITIAL_CLIENT } from "../client.constants";
import { buildClientPayload, sanitizeClientAddresses } from "../client.helpers";

export default function ClientModal({
  open,
  onClose,
  onSubmit,
  saving,
  editingClient,
}) {
  const [form, setForm] = useState(INITIAL_CLIENT);
  const [addresses, setAddresses] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      ...INITIAL_CLIENT,
      ...(editingClient || {}),
    });

    setAddresses(
      (editingClient?.cliente_direcciones || []).map((address) => ({
        ...EMPTY_CLIENT_ADDRESS,
        ...address,
      })),
    );

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

    const cleanAddresses = sanitizeClientAddresses(addresses);
    const incompleteAddress = cleanAddresses.find(
      (address) => !address.nombre || !address.direccion,
    );

    if (incompleteAddress) {
      alert("Cada dirección de entrega necesita nombre y dirección.");
      return;
    }

    onSubmit(buildClientPayload(form), logoFile, cleanAddresses);
  }

  const logoToShow = logoPreview || form.logo;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingClient?.id ? "Editar cliente" : "Nuevo cliente"}
      subtitle="Guarda datos fiscales, contacto y direcciones de entrega."
      width="max-w-5xl"
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

        <section className="rounded-2xl border border-border bg-background p-4">
          <SectionTitle title="Datos del cliente" />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
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
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background p-4">
          <SectionTitle
            title="Dirección fiscal"
            description="Solo datos fiscales o generales del cliente. Las entregas usan las direcciones de abajo."
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input
              label="Ciudad"
              value={form.ciudad || ""}
              onChange={(value) => updateField("ciudad", value)}
            />

            <Input
              label="Estado"
              value={form.estado || ""}
              onChange={(value) => updateField("estado", value)}
            />

            <Input
              label="Dirección"
              value={form.direccion || ""}
              onChange={(value) => updateField("direccion", value)}
              placeholder="Calle, número, colonia"
              className="md:col-span-2"
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
          </div>
        </section>

        <ClientAddressesEditor addresses={addresses} setAddresses={setAddresses} />

        <section className="rounded-2xl border border-border bg-background p-4">
          <label className="space-y-2">
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
        </section>

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

function ClientAddressesEditor({ addresses, setAddresses }) {
  function addAddress() {
    setAddresses((prev) => [
      ...prev,
      {
        ...EMPTY_CLIENT_ADDRESS,
        temp_id: crypto.randomUUID(),
        es_principal: prev.length === 0,
      },
    ]);
  }

  function updateAddress(index, key, value) {
    setAddresses((prev) => {
      const next = [...prev];

      next[index] = {
        ...next[index],
        [key]: value,
      };

      if (key === "es_principal" && value) {
        return next.map((address, addressIndex) => ({
          ...address,
          es_principal: addressIndex === index,
        }));
      }

      return next;
    });
  }

  function removeAddress(index) {
    setAddresses((prev) => {
      const next = prev.filter((_, addressIndex) => addressIndex !== index);

      if (next.length && !next.some((address) => address.es_principal)) {
        next[0] = { ...next[0], es_principal: true };
      }

      return next;
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle
          title="Direcciones de entrega"
          description="Estas son las direcciones que aparecerán al programar entregas."
        />

        <button
          type="button"
          onClick={addAddress}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:bg-surface-soft"
        >
          <Plus className="h-4 w-4" />
          Agregar dirección
        </button>
      </div>

      {!addresses.length ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-soft p-5 text-sm text-text-secondary">
          Sin direcciones de entrega. Agrégalas aquí para poder usarlas al programar entregas.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {addresses.map((address, index) => (
            <article
              key={address.id || address.temp_id || index}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background text-text-secondary">
                    <MapPin className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-text-primary">
                      Dirección {index + 1}
                    </p>

                    {address.es_principal ? (
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-1 text-xs font-semibold text-accent-700">
                        <Star className="h-3 w-3" />
                        Principal
                      </p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeAddress(index)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-error-200 bg-error-50 px-3 text-sm font-semibold text-error-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Quitar
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Nombre"
                  value={address.nombre || ""}
                  onChange={(value) => updateAddress(index, "nombre", value)}
                  placeholder="Sucursal Centro, Almacén, Oficina..."
                />

                <Input
                  label="Contacto"
                  value={address.contacto_nombre || ""}
                  onChange={(value) =>
                    updateAddress(index, "contacto_nombre", value)
                  }
                  placeholder="Persona que recibe"
                />

                <Input
                  label="Dirección"
                  value={address.direccion || ""}
                  onChange={(value) => updateAddress(index, "direccion", value)}
                  placeholder="Calle, número, colonia"
                  className="md:col-span-2"
                />

                <Input
                  label="Ciudad"
                  value={address.ciudad || ""}
                  onChange={(value) => updateAddress(index, "ciudad", value)}
                />

                <Input
                  label="Estado"
                  value={address.estado || ""}
                  onChange={(value) => updateAddress(index, "estado", value)}
                />

                <Input
                  label="Código postal"
                  value={address.codigo_postal || ""}
                  onChange={(value) =>
                    updateAddress(index, "codigo_postal", value)
                  }
                />

                <Input
                  label="País"
                  value={address.pais || ""}
                  onChange={(value) => updateAddress(index, "pais", value)}
                />

                <Input
                  label="Teléfono de contacto"
                  value={address.contacto_telefono || ""}
                  onChange={(value) =>
                    updateAddress(index, "contacto_telefono", value)
                  }
                  placeholder="664 000 0000"
                />

                <Input
                  label="Notas"
                  value={address.notas || ""}
                  onChange={(value) => updateAddress(index, "notas", value)}
                  placeholder="Horario, referencia o indicaciones"
                />
              </div>

              <label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
                <input
                  type="checkbox"
                  checked={Boolean(address.es_principal)}
                  onChange={(e) =>
                    updateAddress(index, "es_principal", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-border"
                />
                Usar como dirección principal
              </label>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div>
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-text-muted">{description}</p>
      ) : null}
    </div>
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
