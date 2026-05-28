import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import Modal from "../../../components/ui/Modal";
import { EMPTY_CLIENT_ADDRESS, INITIAL_CLIENT } from "../client.constants";
import {
  buildClientPayload,
  buildDeliveryAddress,
  capitalizeFirstLetter,
  sanitizeClientAddresses,
} from "../client.helpers";

const CLIENT_MODAL_CAPITALIZED_FIELDS = new Set([
  "nombre",
  "razon_social",
  "regimen_fiscal",
  "uso_cfdi",
  "direccion",
  "ciudad",
  "estado",
  "pais",
  "notas",
]);

const ADDRESS_MODAL_CAPITALIZED_FIELDS = new Set([
  "nombre",
  "contacto_nombre",
  "direccion",
  "ciudad",
  "estado",
  "pais",
  "notas",
]);

function capitalizeModalFields(values = {}, fields = new Set()) {
  return Object.entries(values).reduce((next, [key, value]) => {
    next[key] = fields.has(key) ? capitalizeFirstLetter(value) : value;
    return next;
  }, {});
}

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

    setForm(
      capitalizeModalFields(
        {
          ...INITIAL_CLIENT,
          ...(editingClient || {}),
        },
        CLIENT_MODAL_CAPITALIZED_FIELDS,
      ),
    );

    setAddresses(
      (editingClient?.cliente_direcciones || []).map((address) =>
        capitalizeModalFields(
          {
            ...EMPTY_CLIENT_ADDRESS,
            ...address,
          },
          ADDRESS_MODAL_CAPITALIZED_FIELDS,
        ),
      ),
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
    const nextValue = CLIENT_MODAL_CAPITALIZED_FIELDS.has(key)
      ? capitalizeFirstLetter(value)
      : value;

    setForm((prev) => ({ ...prev, [key]: nextValue }));
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
  const [addressForm, setAddressForm] = useState(EMPTY_CLIENT_ADDRESS);
  const [editingKey, setEditingKey] = useState(null);

  const isEditing = editingKey !== null;
  const hasAddresses = addresses.length > 0;

  function getAddressKey(address, index) {
    return address.id || address.temp_id || `address-${index}`;
  }

  function resetAddressForm() {
    setAddressForm({ ...EMPTY_CLIENT_ADDRESS });
    setEditingKey(null);
  }

  function updateAddressForm(key, value) {
    const nextValue = ADDRESS_MODAL_CAPITALIZED_FIELDS.has(key)
      ? capitalizeFirstLetter(value)
      : value;

    setAddressForm((prev) => ({ ...prev, [key]: nextValue }));
  }

  function handleSaveAddress() {
    const cleanName = (addressForm.nombre || "").trim();
    const cleanAddress = (addressForm.direccion || "").trim();

    if (!cleanName || !cleanAddress) {
      alert("La dirección necesita nombre y dirección.");
      return;
    }

    setAddresses((prev) => {
      const normalizedAddress = {
        ...EMPTY_CLIENT_ADDRESS,
        ...addressForm,
        nombre: cleanName,
        direccion: cleanAddress,
        pais: (addressForm.pais || "").trim() || "México",
        temp_id: addressForm.temp_id || crypto.randomUUID(),
        es_principal:
          Boolean(addressForm.es_principal) || (!prev.length && !isEditing),
        activo: addressForm.activo !== false,
      };

      let next = [];

      if (isEditing) {
        next = prev.map((address, index) => {
          const key = getAddressKey(address, index);
          return key === editingKey ? normalizedAddress : address;
        });
      } else {
        // La dirección recién creada queda arriba; las anteriores se mantienen abajo.
        next = [normalizedAddress, ...prev];
      }

      if (normalizedAddress.es_principal) {
        const normalizedKey = normalizedAddress.id || normalizedAddress.temp_id;

        next = next.map((address) => ({
          ...address,
          es_principal:
            (address.id || address.temp_id) === normalizedKey,
        }));
      }

      if (next.length && !next.some((address) => address.es_principal)) {
        next[0] = { ...next[0], es_principal: true };
      }

      return next;
    });

    resetAddressForm();
  }

  function editAddress(address, index) {
    setEditingKey(getAddressKey(address, index));
    setAddressForm(
      capitalizeModalFields(
        {
          ...EMPTY_CLIENT_ADDRESS,
          ...address,
        },
        ADDRESS_MODAL_CAPITALIZED_FIELDS,
      ),
    );
  }

  function removeAddress(index) {
    setAddresses((prev) => {
      const next = prev.filter((_, addressIndex) => addressIndex !== index);

      if (next.length && !next.some((address) => address.es_principal)) {
        next[0] = { ...next[0], es_principal: true };
      }

      return next;
    });

    const removedKey = getAddressKey(addresses[index] || {}, index);
    if (editingKey === removedKey) resetAddressForm();
  }

  function setMainAddress(index) {
    setAddresses((prev) =>
      prev.map((address, addressIndex) => ({
        ...address,
        es_principal: addressIndex === index,
      })),
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-background p-4">
      <SectionTitle
        title="Direcciones de entrega"
        description="Crea o edita una dirección arriba. Las direcciones guardadas se muestran abajo como tarjetas, no como inputs eternos esperando arruinarte la tarde."
      />

      <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-text-primary">
              {isEditing ? "Editar dirección" : "Nueva dirección"}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {isEditing
                ? "Guarda los cambios para actualizar esta dirección."
                : "Al guardarla, aparecerá arriba de la lista de direcciones."}
            </p>
          </div>

          {isEditing ? (
            <button
              type="button"
              onClick={resetAddressForm}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-3 text-sm font-semibold text-text-primary"
            >
              Cancelar edición
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nombre"
            value={addressForm.nombre || ""}
            onChange={(value) => updateAddressForm("nombre", value)}
            placeholder="Sucursal Centro, Almacén, Oficina..."
          />

          <Input
            label="Contacto"
            value={addressForm.contacto_nombre || ""}
            onChange={(value) => updateAddressForm("contacto_nombre", value)}
            placeholder="Persona que recibe"
          />

          <Input
            label="Dirección"
            value={addressForm.direccion || ""}
            onChange={(value) => updateAddressForm("direccion", value)}
            placeholder="Calle, número, colonia"
            className="md:col-span-2"
          />

          <Input
            label="Ciudad"
            value={addressForm.ciudad || ""}
            onChange={(value) => updateAddressForm("ciudad", value)}
          />

          <Input
            label="Estado"
            value={addressForm.estado || ""}
            onChange={(value) => updateAddressForm("estado", value)}
          />

          <Input
            label="Código postal"
            value={addressForm.codigo_postal || ""}
            onChange={(value) => updateAddressForm("codigo_postal", value)}
          />

          <Input
            label="País"
            value={addressForm.pais || ""}
            onChange={(value) => updateAddressForm("pais", value)}
          />

          <Input
            label="Teléfono de contacto"
            value={addressForm.contacto_telefono || ""}
            onChange={(value) => updateAddressForm("contacto_telefono", value)}
            placeholder="664 000 0000"
          />

          <Input
            label="Notas"
            value={addressForm.notas || ""}
            onChange={(value) => updateAddressForm("notas", value)}
            placeholder="Horario, referencia o indicaciones"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
            <input
              type="checkbox"
              checked={Boolean(addressForm.es_principal)}
              onChange={(e) =>
                updateAddressForm("es_principal", e.target.checked)
              }
              className="h-4 w-4 rounded border-border"
            />
            Usar como dirección principal
          </label>

          <button
            type="button"
            onClick={handleSaveAddress}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            {isEditing ? "Guardar cambios" : "Agregar dirección"}
          </button>
        </div>
      </div>

      {!hasAddresses ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-soft p-5 text-sm text-text-secondary">
          Sin direcciones de entrega. Agrégalas arriba para poder usarlas al programar entregas.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {addresses.map((address, index) => (
            <article
              key={getAddressKey(address, index)}
              className="rounded-2xl border border-border bg-background p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface text-text-secondary">
                    <MapPin className="h-4 w-4" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-text-primary">
                        {address.nombre || `Dirección ${index + 1}`}
                      </p>

                      {address.es_principal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-1 text-xs font-semibold text-accent-700">
                          <Star className="h-3 w-3" />
                          Principal
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm text-text-secondary">
                      {buildDeliveryAddress(address) || "Sin dirección"}
                    </p>

                    {[address.contacto_nombre, address.contacto_telefono]
                      .filter(Boolean)
                      .length ? (
                      <p className="mt-2 text-xs text-text-muted">
                        {[address.contacto_nombre, address.contacto_telefono]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}

                    {address.notas ? (
                      <p className="mt-2 text-xs text-text-muted">
                        {address.notas}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {!address.es_principal ? (
                    <button
                      type="button"
                      onClick={() => setMainAddress(index)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary"
                    >
                      <Star className="h-4 w-4" />
                      Cambiar a principal
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => editAddress(address, index)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => removeAddress(index)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-error-200 bg-error-50 px-3 text-sm font-semibold text-error-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Borrar
                  </button>
                </div>
              </div>
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
