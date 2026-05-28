import { useEffect, useState } from "react";
import {
  Building2,
  FileText,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
  StickyNote,
  Truck,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import Modal from "../../../components/ui/Modal";
import ClientMessageModal, { createMessageState } from "./ClientMessageModal";
import { EMPTY_CLIENT_ADDRESS, INITIAL_CLIENT } from "../client.constants";
import {
  buildClientPayload,
  buildDeliveryAddress,
  capitalizeFirstLetter,
  sanitizeClientAddresses,
  validateClientData,
} from "../client.helpers";
import {
  searchCfdiUses,
  searchCountries,
  searchFiscalRegimes,
  searchPostalCodes,
} from "../services/facturamaClientCatalogs.service";

const CLIENT_MODAL_CAPITALIZED_FIELDS = new Set([
  "nombre",
  "razon_social",
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
  const [activeTab, setActiveTab] = useState("cliente");
  const [messageModal, setMessageModal] = useState(createMessageState());

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
    setActiveTab("cliente");
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

    const cleanAddresses = sanitizeClientAddresses(addresses);
    const validationError = validateClientData(form, cleanAddresses);

    if (validationError) {
      showMessage("Revisa la información del cliente", validationError, "warning");
      return;
    }

    onSubmit(buildClientPayload(form), logoFile, cleanAddresses);
  }

  const logoToShow = logoPreview || form.logo;

  return (
    <>
      <ClientMessageModal
        open={messageModal.open}
        title={messageModal.title}
        message={messageModal.message}
        tone={messageModal.tone}
        onClose={() => setMessageModal(createMessageState())}
      />

    <Modal
      open={open}
      onClose={onClose}
      title={editingClient?.id ? "Editar cliente" : "Nuevo cliente"}
      subtitle="Guarda datos fiscales, contacto y direcciones de entrega."
      width="max-w-5xl"
      zIndex="z-[90]"
    >
      <form onSubmit={handleSubmit} className="p-5 md:p-6">
        <ClientModalTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="mt-5">
          {activeTab === "cliente" ? (
            <section className="rounded-2xl border border-border bg-background p-4">
              <SectionTitle
                title="Datos del cliente"
                description="Información comercial y de contacto principal."
              />

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
                  onChange={(value) => updateField("rfc", value.toUpperCase())}
                  placeholder="RFC del cliente"
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
                  className="md:col-span-2"
                />
              </div>
            </section>
          ) : null}

          {activeTab === "fiscal" ? (
            <section className="rounded-2xl border border-border bg-background p-4">
              <SectionTitle
                title="Datos fiscales"
                description="Catálogos usados para preparar al cliente antes de facturar."
              />

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <CatalogSearchInput
                  label="Régimen fiscal"
                  value={form.regimen_fiscal || ""}
                  onChange={(value) => updateField("regimen_fiscal", value)}
                  searchFn={searchFiscalRegimes}
                  defaultQuery={form.rfc || ""}
                  placeholder="Primero captura el RFC para sugerir régimen"
                  helper="Consulta los regímenes aplicables usando el RFC del receptor."
                />

                <CatalogSearchInput
                  label="Uso CFDI"
                  value={form.uso_cfdi || ""}
                  onChange={(value) => updateField("uso_cfdi", value)}
                  searchFn={searchCfdiUses}
                  defaultQuery="G03"
                  placeholder="Busca uso CFDI, ej. G03"
                  helper="El uso CFDI normalmente lo define el cliente para cada factura."
                />
              </div>
            </section>
          ) : null}

          {activeTab === "direccion" ? (
            <section className="rounded-2xl border border-border bg-background p-4">
              <SectionTitle
                title="Dirección fiscal"
                description="Selecciona el código postal/colonia si el catálogo lo incluye. Luego completa calle, número y referencias."
              />

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <PostalCodeSearchInput
                  label="Código postal y colonia"
                  value={form.codigo_postal || ""}
                  onChange={(value) => updateField("codigo_postal", value)}
                  onSelect={(item) => {
                    updateField("codigo_postal", item.codigoPostal || item.clave);
                    if (item.municipio || item.localidad) {
                      updateField("ciudad", item.municipio || item.localidad);
                    }
                    if (item.estado) updateField("estado", item.estado);
                    if (item.colonia && !form.direccion) {
                      updateField("direccion", item.colonia);
                    }
                    if (!form.pais) updateField("pais", "México");
                  }}
                  helper="Valida el código postal y, cuando el catálogo lo incluya, sugiere colonia, ciudad/municipio y estado."
                />

                <CatalogSearchInput
                  label="País"
                  value={form.pais || ""}
                  onChange={(value) => updateField("pais", value)}
                  searchFn={searchCountries}
                  defaultQuery={form.pais || "México"}
                  placeholder="Busca país, ej. México"
                />

                <Input
                  label="Ciudad / municipio"
                  value={form.ciudad || ""}
                  onChange={(value) => updateField("ciudad", value)}
                />

                <Input
                  label="Estado"
                  value={form.estado || ""}
                  onChange={(value) => updateField("estado", value)}
                />

                <Input
                  label="Calle, número y colonia"
                  value={form.direccion || ""}
                  onChange={(value) => updateField("direccion", value)}
                  placeholder="Calle, número, colonia"
                  className="md:col-span-2"
                />
              </div>
            </section>
          ) : null}

          {activeTab === "entregas" ? (
            <ClientAddressesEditor
              addresses={addresses}
              setAddresses={setAddresses}
            />
          ) : null}

          {activeTab === "extras" ? (
            <div className="space-y-5">
              <section className="rounded-2xl border border-border bg-background p-4">
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
              </section>

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
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
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
    </>
  );
}


function ClientModalTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { key: "cliente", label: "Cliente", icon: Building2 },
    { key: "fiscal", label: "Fiscal", icon: FileText },
    { key: "direccion", label: "Dirección fiscal", icon: MapPin },
    { key: "entregas", label: "Entregas", icon: Truck },
    { key: "extras", label: "Logo y notas", icon: StickyNote },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border pb-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-t-2xl border border-b-0 px-4 text-sm font-bold transition ${
              active
                ? "border-border bg-background text-primary-700 shadow-sm"
                : "border-transparent bg-surface-soft text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
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
      showMessage(
        "Dirección incompleta",
        "La dirección necesita nombre y dirección.",
        "warning",
      );
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

          <PostalCodeSearchInput
            label="Código postal"
            value={addressForm.codigo_postal || ""}
            onChange={(value) => updateAddressForm("codigo_postal", value)}
            onSelect={(item) => {
              updateAddressForm("codigo_postal", item.codigoPostal || item.clave);
              if (item.municipio || item.localidad) {
                updateAddressForm("ciudad", item.municipio || item.localidad);
              }
              if (item.estado) updateAddressForm("estado", item.estado);
              if (!addressForm.pais) updateAddressForm("pais", "México");
            }}
            helper="Valida el código postal y completa ciudad/estado si el catálogo lo devuelve."
          />

          <CatalogSearchInput
            label="País"
            value={addressForm.pais || ""}
            onChange={(value) => updateAddressForm("pais", value)}
            searchFn={searchCountries}
            defaultQuery={addressForm.pais || "México"}
            placeholder="Busca país, ej. México"
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


function CatalogSearchInput({
  label,
  value,
  onChange,
  searchFn,
  defaultQuery = "",
  placeholder = "Buscar en catálogo...",
  helper = "",
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [selected, setSelected] = useState(Boolean(value));
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setInputValue(value || "");
    setSelected(Boolean(value));
  }, [value]);

  const effectiveQuery = selected
    ? ""
    : String(inputValue || defaultQuery || "").trim();

  useEffect(() => {
    if (selected || effectiveQuery.length < 2) {
      setResults([]);
      setErrorMessage("");
      return undefined;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const rows = await searchFn(effectiveQuery);

        if (!cancelled) setResults(rows || []);
      } catch (error) {
        console.error("Error consultando catálogo:", error);

        if (!cancelled) {
          setResults([]);
          setErrorMessage(
            error.message || "No se pudo consultar el catálogo fiscal.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [effectiveQuery, selected, searchFn]);

  function handleInputChange(nextValue) {
    setInputValue(nextValue);
    setSelected(false);
    onChange(nextValue);
  }

  function selectItem(item) {
    const labelText = [item.clave, item.descripcion].filter(Boolean).join(" - ");
    const nextValue = labelText || item.clave || "";

    setInputValue(nextValue);
    setSelected(true);
    setResults([]);
    onChange(nextValue);
  }

  function clearSelection() {
    setInputValue("");
    setSelected(false);
    setResults([]);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-text-primary">{label}</span>

        <div className="rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-primary-400">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-text-muted" />

            <input
              type="text"
              value={inputValue}
              onChange={(event) => handleInputChange(event.target.value)}
              placeholder={placeholder}
              className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />

            {selected && inputValue ? (
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
      </label>

      {!selected && helper ? (
        <p className="text-xs text-text-muted">{helper}</p>
      ) : null}

      {selected && inputValue ? (
        <p className="rounded-xl border border-success-100 bg-success-50 px-3 py-2 text-xs font-semibold text-success-700">
          Seleccionado
        </p>
      ) : null}

      {loading ? (
        <p className="text-xs font-semibold text-primary-600">
          Buscando en catálogo...
        </p>
      ) : null}

      {!selected && errorMessage ? (
        <p className="rounded-xl border border-warning-100 bg-warning-50 px-3 py-2 text-xs font-medium text-warning-800">
          {errorMessage}
        </p>
      ) : null}

      {!selected && !loading && !errorMessage && results.length ? (
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-border bg-surface p-1">
          {results.map((item, index) => (
            <button
              key={`${item.clave}-${item.descripcion}-${item.codigoPostal}-${index}`}
              type="button"
              onClick={() => selectItem(item)}
              className="w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-soft"
            >
              <p className="text-sm font-bold text-text-primary">
                {[item.clave, item.codigoPostal].filter(Boolean)[0] || "Sin clave"}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {item.descripcion || item.estado || item.municipio || "Sin descripción"}
              </p>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PostalCodeSearchInput({
  label,
  value,
  onChange,
  onSelect,
  helper = "",
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setInputValue(value || "");
    if (!value) setSelectedInfo(null);
  }, [value]);

  const selected = Boolean(selectedInfo);
  const effectiveQuery = selected ? "" : String(inputValue || "").trim();

  useEffect(() => {
    if (selected || effectiveQuery.length < 2) {
      setResults([]);
      setErrorMessage("");
      return undefined;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const rows = await searchPostalCodes(effectiveQuery);

        if (!cancelled) setResults(rows || []);
      } catch (error) {
        console.error("Error consultando código postal:", error);

        if (!cancelled) {
          setResults([]);
          setErrorMessage(
            error.message || "No se pudo validar el código postal.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [effectiveQuery, selected]);

  function handleInputChange(nextValue) {
    const cleanValue = nextValue.replace(/[^\dA-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.-]/g, "");
    setInputValue(cleanValue);
    setSelectedInfo(null);

    if (/^\d{0,5}$/.test(cleanValue)) {
      onChange(cleanValue);
    }
  }

  function selectPostalCode(item) {
    const nextZip = item.codigoPostal || item.clave || "";
    const displayValue = [
      nextZip,
      item.colonia,
      item.municipio || item.localidad,
      item.estado,
    ]
      .filter(Boolean)
      .join(" - ");

    onChange(nextZip);
    onSelect?.(item);
    setSelectedInfo(item);
    setInputValue(displayValue || nextZip);
    setResults([]);
  }

  function clearSelection() {
    setInputValue("");
    setSelectedInfo(null);
    setResults([]);
    onChange("");
  }

  const hasColonies = results.some((item) => item.colonia);

  return (
    <div className="space-y-2">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-text-primary">{label}</span>

        <div className="rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-primary-400">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-text-muted" />

            <input
              type="text"
              value={inputValue}
              onChange={(event) => handleInputChange(event.target.value)}
              placeholder="Escribe código postal o colonia..."
              className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />

            {selectedInfo ? (
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
      </label>

      {!selectedInfo && helper ? (
        <p className="text-xs text-text-muted">{helper}</p>
      ) : null}

      {selectedInfo ? (
        <div className="rounded-xl border border-success-100 bg-success-50 px-3 py-2 text-xs font-semibold text-success-700">
          Seleccionado:{" "}
          {[selectedInfo.colonia, selectedInfo.municipio || selectedInfo.localidad, selectedInfo.estado]
            .filter(Boolean)
            .join(" · ") || selectedInfo.codigoPostal || selectedInfo.clave}
        </div>
      ) : null}

      {loading ? (
        <p className="text-xs font-semibold text-primary-600">
          Buscando código postal...
        </p>
      ) : null}

      {!selectedInfo && errorMessage ? (
        <p className="rounded-xl border border-warning-100 bg-warning-50 px-3 py-2 text-xs font-medium text-warning-800">
          {errorMessage}
        </p>
      ) : null}

      {!selectedInfo && !loading && !errorMessage && results.length ? (
        <div className="rounded-2xl border border-border bg-surface p-2">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">
              {hasColonies ? "Colonias sugeridas" : "Resultados"}
            </p>
            <span className="rounded-full bg-surface-soft px-2 py-1 text-[11px] font-bold text-text-muted">
              {results.length}
            </span>
          </div>

          <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
            {results.map((item, index) => (
              <button
                key={`${item.codigoPostal}-${item.estado}-${item.municipio}-${item.colonia}-${index}`}
                type="button"
                onClick={() => selectPostalCode(item)}
                className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-left transition hover:border-primary-200 hover:bg-primary-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-text-primary">
                      {item.colonia || item.descripcion || "Código postal válido"}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {[item.codigoPostal || item.clave, item.municipio || item.localidad, item.estado]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-surface-soft px-2 py-1 text-[11px] font-bold text-text-muted">
                    {item.codigoPostal || item.clave}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
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
