import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  User2,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  ReceiptText,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";

import supabase from "../../utils/supabase";
import { useDebouncedValue } from "../../hook/useDebouncedValue";
import { formatMoney } from "../../utils/formatters";
import { formatDateTimeTijuana } from "../../utils/dates";

import PageHeader from "../../components/ui/PageHeader";
import SearchInput from "../../components/ui/SearchInput";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import ActionIconButton from "../../components/ui/ActionIconButton";
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal";

const LOGOS_BUCKET = "logosClientes";

const INITIAL_CLIENT = {
  nombre: "",
  razon_social: "",
  rfc: "",
  regimen_fiscal: "",
  uso_cfdi: "",
  numero: "",
  correo: "",
  direccion: "",
  ciudad: "",
  estado: "",
  codigo_postal: "",
  pais: "México",
  logo: "",
  notas: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);

  const [selectedClient, setSelectedClient] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  useEffect(() => {
    loadClients();
  }, [search]);

  useEffect(() => {
    loadClientQuotations(selectedClient?.id || null);
  }, [selectedClient?.id]);

  async function loadClients() {
    try {
      setLoading(true);

      let query = supabase
        .from("clientes")
        .select("*")
        .order("nombre", { ascending: true });

      if (search.trim()) {
        query = query.or(
          `nombre.ilike.%${search}%,razon_social.ilike.%${search}%,rfc.ilike.%${search}%,correo.ilike.%${search}%,numero.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setClients(data || []);

      if (!selectedClient && data?.length) {
        setSelectedClient(data[0]);
      }

      if (selectedClient) {
        const updated = data?.find((item) => item.id === selectedClient.id);
        if (updated) setSelectedClient(updated);
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }

  async function loadClientQuotations(clientId) {
    if (!clientId) {
      setQuotations([]);
      return;
    }

    try {
      setLoadingQuotations(true);

      const { data, error } = await supabase
        .from("cotizaciones")
        .select(
          `
          id,
          folio,
          cliente_nombre,
          total,
          ganancia,
          estado,
          created_at,
          fecha_vencimiento,
          fecha_completado
        `,
        )
        .eq("cliente_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setQuotations(data || []);
    } catch (error) {
      console.error(error);
      setQuotations([]);
    } finally {
      setLoadingQuotations(false);
    }
  }

  async function uploadClientLogo(file, clientId) {
    if (!file) return null;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const maxSize = 2 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      throw new Error("El logo debe ser PNG, JPG o WEBP.");
    }

    if (file.size > maxSize) {
      throw new Error("El logo no debe superar los 2MB.");
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${clientId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(LOGOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(filePath);

    return data?.publicUrl || null;
  }

  function getStoragePathFromUrl(url, bucket = LOGOS_BUCKET) {
    if (!url) return null;

    try {
      const parsed = new URL(url);
      const marker = `/storage/v1/object/public/${bucket}/`;
      const index = parsed.pathname.indexOf(marker);

      if (index === -1) return null;

      return decodeURIComponent(parsed.pathname.slice(index + marker.length));
    } catch {
      return null;
    }
  }

  async function deleteOldLogoIfNeeded(oldLogoUrl, newLogoUrl) {
    if (!oldLogoUrl || oldLogoUrl === newLogoUrl) return;

    const path = getStoragePathFromUrl(oldLogoUrl);
    if (!path) return;

    const { error } = await supabase.storage.from(LOGOS_BUCKET).remove([path]);

    if (error) {
      console.error("No se pudo eliminar el logo anterior:", error);
    }
  }

  async function saveClient(payload, logoFile) {
    try {
      setSaving(true);

      let savedClient;

      if (payload.id) {
        const { id, ...rest } = payload;

        const { data, error } = await supabase
          .from("clientes")
          .update(rest)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        savedClient = data;
      } else {
        const { data, error } = await supabase
          .from("clientes")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        savedClient = data;
      }

      if (logoFile) {
        const logoUrl = await uploadClientLogo(logoFile, savedClient.id);

        const { data, error } = await supabase
          .from("clientes")
          .update({ logo: logoUrl })
          .eq("id", savedClient.id)
          .select()
          .single();

        if (error) throw error;

        await deleteOldLogoIfNeeded(savedClient.logo, logoUrl);

        savedClient = data;
      }

      setSelectedClient(savedClient);
      setModalOpen(false);
      await loadClients();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar el cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteClientItem(client) {
    if (!client?.id) return;

    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", client.id);

      if (error) throw error;

      const logoPath = getStoragePathFromUrl(client.logo);

      if (logoPath) {
        const { error: storageError } = await supabase.storage
          .from(LOGOS_BUCKET)
          .remove([logoPath]);

        if (storageError) {
          console.error("No se pudo eliminar el logo del bucket:", storageError);
        }
      }

      setClientToDelete(null);

      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
        setQuotations([]);
      }

      await loadClients();
    } catch (error) {
      console.error(error);

      if (String(error.message || "").toLowerCase().includes("foreign key")) {
        alert(
          "No puedes borrar este cliente porque tiene etiquetas o cotizaciones asociadas.",
        );
        return;
      }

      alert(error.message || "No se pudo eliminar el cliente.");
    }
  }

  const totals = useMemo(() => {
    return quotations.reduce(
      (acc, item) => {
        acc.total += Number(item.total || 0);
        acc.ganancia += Number(item.ganancia || 0);
        acc.count += 1;
        return acc;
      },
      { total: 0, ganancia: 0, count: 0 },
    );
  }, [quotations]);

  return (
    <section className="space-y-6">
      <ClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={saveClient}
        saving={saving}
        editingClient={selectedClient}
      />

      <ConfirmDeleteModal
        open={Boolean(clientToDelete)}
        title="Eliminar cliente"
        message="¿Seguro que quieres eliminar este cliente?"
        itemName={clientToDelete?.nombre}
        onClose={() => setClientToDelete(null)}
        onConfirm={() => deleteClientItem(clientToDelete)}
        confirmText="Eliminar cliente"
      />

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Clientes"
          title="Gestión de clientes"
          description="Administra datos fiscales, contacto, dirección, logo y cotizaciones asociadas."
          actions={
            <button
              type="button"
              onClick={() => {
                setSelectedClient(null);
                setModalOpen(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </button>
          }
        />

        <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[380px_1fr]">
          <aside className="space-y-4">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Buscar por nombre, RFC, correo o teléfono..."
            />

            <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
              {loading ? (
                <EmptyState
                  loading
                  title="Cargando clientes..."
                  className="rounded-2xl border border-dashed border-border py-8"
                />
              ) : !clients.length ? (
                <EmptyState
                  title="No hay clientes"
                  description="Crea tu primer cliente para asociar etiquetas y cotizaciones."
                  className="rounded-2xl border border-dashed border-border py-8"
                />
              ) : (
                clients.map((client) => (
                  <ClientListCard
                    key={client.id}
                    client={client}
                    active={selectedClient?.id === client.id}
                    onSelect={() => setSelectedClient(client)}
                    onEdit={() => {
                      setSelectedClient(client);
                      setModalOpen(true);
                    }}
                    onDelete={() => setClientToDelete(client)}
                  />
                ))
              )}
            </div>
          </aside>

          <main>
            {!selectedClient ? (
              <EmptyState
                title="Selecciona un cliente"
                description="Elige un cliente para ver su información completa."
                className="rounded-2xl border border-dashed border-border"
              />
            ) : (
              <ClientDetail
                client={selectedClient}
                quotations={quotations}
                totals={totals}
                loadingQuotations={loadingQuotations}
                onEdit={() => setModalOpen(true)}
                onDelete={() => setClientToDelete(selectedClient)}
              />
            )}
          </main>
        </div>
      </section>
    </section>
  );
}

function ClientModal({ open, onClose, onSubmit, saving, editingClient }) {
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

    onSubmit(
      {
        ...form,
        nombre: form.nombre.trim(),
        razon_social: form.razon_social.trim() || null,
        rfc: form.rfc.trim().toUpperCase() || null,
        regimen_fiscal: form.regimen_fiscal.trim() || null,
        uso_cfdi: form.uso_cfdi.trim() || null,
        numero: form.numero.trim() || null,
        correo: form.correo.trim() || null,
        direccion: form.direccion.trim() || null,
        ciudad: form.ciudad.trim() || null,
        estado: form.estado.trim() || null,
        codigo_postal: form.codigo_postal.trim() || null,
        pais: form.pais.trim() || null,
        logo: form.logo || null,
        notas: form.notas.trim() || null,
      },
      logoFile,
    );
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
            placeholder="Ej. Jaka express"
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

function ClientListCard({ client, active, onSelect, onEdit, onDelete }) {
  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        active
          ? "border-accent-500 bg-accent-50"
          : "border-border bg-background hover:border-primary-200 hover:bg-surface-soft"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <Avatar client={client} />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {client.nombre}
            </p>

            {client.razon_social ? (
              <p className="mt-1 truncate text-xs text-text-muted">
                {client.razon_social}
              </p>
            ) : null}

            {client.rfc ? (
              <p className="mt-1 text-xs font-semibold text-text-secondary">
                RFC: {client.rfc}
              </p>
            ) : null}
          </div>
        </button>

        <div className="flex items-center gap-2">
          <ActionIconButton
            icon={Pencil}
            label="Editar cliente"
            tone="default"
            onClick={onEdit}
            className="h-9 w-9"
          />

          <ActionIconButton
            icon={Trash2}
            label="Eliminar cliente"
            tone="error"
            onClick={onDelete}
            className="h-9 w-9"
          />
        </div>
      </div>
    </article>
  );
}

function ClientDetail({
  client,
  quotations,
  totals,
  loadingQuotations,
  onEdit,
  onDelete,
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-border bg-background p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar client={client} size="lg" />

            <div>
              <p className="text-sm font-semibold text-accent-600">Cliente</p>
              <h2 className="text-2xl font-bold text-text-primary">
                {client.nombre}
              </h2>

              {client.razon_social ? (
                <p className="mt-1 text-sm text-text-secondary">
                  {client.razon_social}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-error-200 bg-error-50 px-4 text-sm font-semibold text-error-700"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <InfoCard icon={FileText} label="RFC" value={client.rfc} />
          <InfoCard
            icon={Building2}
            label="Razón social"
            value={client.razon_social}
          />
          <InfoCard icon={Phone} label="Teléfono" value={client.numero} />
          <InfoCard icon={Mail} label="Correo" value={client.correo} />
          <InfoCard
            icon={MapPin}
            label="Dirección"
            value={[
              client.direccion,
              client.ciudad,
              client.estado,
              client.codigo_postal,
              client.pais,
            ]
              .filter(Boolean)
              .join(", ")}
          />
          <InfoCard
            icon={ReceiptText}
            label="Uso CFDI / Régimen"
            value={[client.uso_cfdi, client.regimen_fiscal]
              .filter(Boolean)
              .join(" · ")}
          />
        </div>

        {client.notas ? (
          <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Notas
            </p>
            <p className="mt-2 text-sm text-text-secondary">{client.notas}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Cotizaciones" value={totals.count} />
        <MiniStat label="Total vendido" value={formatMoney(totals.total)} />
        <MiniStat label="Ganancia" value={formatMoney(totals.ganancia)} />
      </div>

      <section className="rounded-[24px] border border-border bg-background">
        <div className="border-b border-border p-5">
          <p className="text-sm font-semibold text-accent-600">Cotizaciones</p>
          <h3 className="mt-1 text-xl font-bold text-text-primary">
            Asociadas al cliente
          </h3>
        </div>

        {loadingQuotations ? (
          <EmptyState loading title="Cargando cotizaciones..." />
        ) : !quotations.length ? (
          <EmptyState
            title="Sin cotizaciones asociadas"
            description="Cuando guardes cliente_id en cotizaciones, aparecerán aquí."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-surface-soft">
                <tr>
                  {["Folio", "Estado", "Total", "Ganancia", "Fecha"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {quotations.map((quote) => (
                  <tr key={quote.id} className="border-t border-border">
                    <td className="px-5 py-4 text-sm font-semibold text-text-primary">
                      {quote.folio}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {quote.estado}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-text-primary">
                      {formatMoney(quote.total)}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-success-700">
                      {formatMoney(quote.ganancia)}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {formatDateTimeTijuana(quote.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Avatar({ client, size = "md" }) {
  const box =
    size === "lg" ? "h-20 w-20 rounded-[24px]" : "h-12 w-12 rounded-2xl";

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center overflow-hidden border border-border bg-white`}
    >
      {client.logo ? (
        <img
          src={client.logo}
          alt={client.nombre}
          className="h-full w-full object-contain"
        />
      ) : (
        <User2
          className={
            size === "lg"
              ? "h-8 w-8 text-text-muted"
              : "h-5 w-5 text-text-muted"
          }
        />
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-text-primary">
        {value || "Sin información"}
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
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