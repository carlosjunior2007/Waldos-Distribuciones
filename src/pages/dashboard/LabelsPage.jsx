import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Tag,
  Eye,
  User2,
} from "lucide-react";

import supabase from "../../utils/supabase";
import { generateLabelPDF } from "../../utils/labelPdf";
import { useDebouncedValue } from "../../hook/useDebouncedValue";

import Modal from "../../components/ui/Modal";
import SearchInput from "../../components/ui/SearchInput";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import ActionIconButton from "../../components/ui/ActionIconButton";
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal";

const COMPANY_STORAGE_KEY = "logosClientes";

const COMPANY_DEFAULTS = {
  showCompanyLogo: false,
  showCompanyName: false,
  companyName: "Waldo Distribuciones",
  companyLogo: "/camion.png",
};

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function BarcodeSvg({ value }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, String(value).trim(), {
        format: "CODE128",
        displayValue: true,
        fontSize: 12,
        lineColor: "#111827",
        background: "#ffffff",
        height: 42,
        width: 1.4,
        margin: 0,
        textMargin: 4,
        font: "Arial",
      });
    } catch (error) {
      console.error("Error generando barcode:", error);
      svgRef.current.innerHTML = "";
    }
  }, [value]);

  if (!value) return null;

  return (
    <svg
      ref={svgRef}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        overflow: "visible",
      }}
    />
  );
}

function LabelPreviewContent({
  form,
  client,
  product,
  companyOptions,
  elementId,
}) {
  const widthMm = Number(form.ancho_mm || 100);
  const heightMm = Number(form.alto_mm || 75);

  return (
    <div
      id={elementId}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        background: "#ffffff",
        color: "#0f172a",
        border: "1px solid #d9e0e7",
        borderRadius: "14px",
        padding: "7mm",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "5mm",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "5mm",
              fontWeight: 700,
              lineHeight: 1.05,
              wordBreak: "break-word",
            }}
          >
            {product?.nombre || "Producto"}
          </div>

          {form.codigo ? (
            <div
              style={{
                marginTop: "2.5mm",
                fontSize: "3.5mm",
                fontWeight: 700,
              }}
            >
              Código: {form.codigo}
            </div>
          ) : null}

          {form.texto_extra ? (
            <div
              style={{
                marginTop: "1mm",
                fontSize: "3.5mm",
                lineHeight: 1.2,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontWeight: 700,
              }}
            >
              {form.texto_extra}
            </div>
          ) : null}

          {client?.nombre ? (
            <div
              style={{
                marginTop: "1mm",
                fontSize: "3.5mm",
                fontWeight: 700,
              }}
            >
              Cliente: {client.nombre}
            </div>
          ) : null}

          {client?.numero ? (
            <div
              style={{
                marginTop: "1mm",
                fontSize: "3.5mm",
                fontWeight: 700,
              }}
            >
              Tel: {client.numero}
            </div>
          ) : null}

          {client?.correo ? (
            <div
              style={{
                marginTop: "1mm",
                fontSize: "3.5mm",
                wordBreak: "break-word",
                fontWeight: 700,
              }}
            >
              {client.correo}
            </div>
          ) : null}
        </div>

        {client?.logo ? (
          <div style={{ width: "22mm", textAlign: "right", flexShrink: 0 }}>
            <img
              src={client.logo}
              alt="Logo cliente"
              style={{
                maxWidth: "22mm",
                maxHeight: "16mm",
                objectFit: "contain",
                marginLeft: "auto",
              }}
            />
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "2mm" }}>
        {form.codigo_barras ? (
          <div
            style={{
              margin: "3mm auto",
              width: "80%",
              minHeight: "26mm",
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <BarcodeSvg value={form.codigo_barras} />
          </div>
        ) : null}

        {(companyOptions.showCompanyLogo || companyOptions.showCompanyName) && (
          <div
            style={{
              marginTop: "3mm",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "3mm",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
              {companyOptions.showCompanyLogo && companyOptions.companyLogo ? (
                <img
                  src={companyOptions.companyLogo}
                  alt="Logo empresa"
                  style={{
                    width: "10mm",
                    height: "10mm",
                    objectFit: "contain",
                  }}
                />
              ) : null}

              {companyOptions.showCompanyName ? (
                <span style={{ fontSize: "2.8mm", fontWeight: 700 }}>
                  {companyOptions.companyName}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LabelPreview({ form, client, product, companyOptions }) {
  return (
    <div className="rounded-[24px] border border-border bg-background p-4">
      <p className="mb-3 text-sm font-semibold text-text-primary">
        Vista previa
      </p>

      <div className="overflow-auto rounded-2xl border border-dashed border-border bg-white p-6">
        <div className="flex justify-center">
          <LabelPreviewContent
            form={form}
            client={client}
            product={product}
            companyOptions={companyOptions}
            elementId="label-preview-print"
          />
        </div>
      </div>
    </div>
  );
}

export default function LabelsPage() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [labels, setLabels] = useState([]);

  const [clientSearchInput, setClientSearchInput] = useState("");
  const clientSearch = useDebouncedValue(clientSearchInput);
  const [selectedClient, setSelectedClient] = useState(null);

  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingLabels, setLoadingLabels] = useState(false);

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelToDelete, setLabelToDelete] = useState(null);

  const [printPayload, setPrintPayload] = useState(null);

  const [companyOptions, setCompanyOptions] = useState(() => {
    try {
      const raw = localStorage.getItem(COMPANY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : COMPANY_DEFAULTS;
    } catch {
      return COMPANY_DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(companyOptions));
  }, [companyOptions]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    searchClients();
  }, [clientSearch]);

  useEffect(() => {
    loadLabels(selectedClient?.id || null);
  }, [selectedClient?.id]);

  async function searchClients() {
    try {
      setLoadingClients(true);

      let query = supabase
        .from("clientes")
        .select("*")
        .order("nombre", { ascending: true })
        .limit(12);

      if (clientSearch.trim()) {
        query = query.or(
          `nombre.ilike.%${clientSearch}%,razon_social.ilike.%${clientSearch}%,rfc.ilike.%${clientSearch}%,correo.ilike.%${clientSearch}%`,
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron buscar clientes.");
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("id,nombre,codigo,unidad,precio,precio_compra")
        .order("nombre", { ascending: true });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron cargar los productos.");
    }
  }

  async function loadLabels(clientId) {
    if (!clientId) {
      setLabels([]);
      return;
    }

    try {
      setLoadingLabels(true);

      const { data, error } = await supabase
        .from("etiquetas")
        .select(
          `
          *,
          productos (
            id,
            nombre,
            codigo,
            unidad
          ),
          clientes (
            id,
            nombre,
            numero,
            correo,
            logo,
            razon_social,
            rfc
          )
        `,
        )
        .eq("cliente_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setLabels(data || []);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron cargar las etiquetas.");
    } finally {
      setLoadingLabels(false);
    }
  }

  async function deleteLabelItem(label) {
    if (!label?.id) return;

    try {
      const { error } = await supabase.from("etiquetas").delete().eq("id", label.id);

      if (error) throw error;

      setLabelToDelete(null);
      await loadLabels(selectedClient?.id);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo eliminar la etiqueta.");
    }
  }

  async function handleQuickDownload(label) {
    const product = label.productos || null;
    const client = label.clientes || selectedClient || null;

    const form = {
      cliente_id: label.cliente_id || "",
      producto_id: label.producto_id || "",
      codigo_barras: label.codigo_barras || "",
      codigo: label.codigo || "",
      texto_extra: label.texto_extra || "",
      ancho_mm: Number(label.ancho_mm || 100),
      alto_mm: Number(label.alto_mm || 75),
    };

    try {
      setPrintPayload({
        form,
        client,
        product,
        companyOptions,
      });

      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const previewEl = document.getElementById("quick-label-print");

      await generateLabelPDF({
        element: previewEl,
        filename: `${product?.nombre || "etiqueta"}.pdf`,
        widthMm: Number(label.ancho_mm || 100),
        heightMm: Number(label.alto_mm || 75),
      });
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo generar el PDF.");
    } finally {
      setPrintPayload(null);
    }
  }

  return (
    <>
      {printPayload ? (
        <div
          style={{
            position: "fixed",
            left: "-99999px",
            top: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <LabelPreviewContent
            form={printPayload.form}
            client={printPayload.client}
            product={printPayload.product}
            companyOptions={printPayload.companyOptions}
            elementId="quick-label-print"
          />
        </div>
      ) : null}

      <LabelModal
        open={labelModalOpen}
        onClose={() => {
          setLabelModalOpen(false);
          setEditingLabel(null);
        }}
        onSaved={() => loadLabels(selectedClient?.id)}
        selectedClient={selectedClient}
        editingLabel={editingLabel}
        products={products}
        companyOptions={companyOptions}
        setCompanyOptions={setCompanyOptions}
      />

      <ConfirmDeleteModal
        open={Boolean(labelToDelete)}
        title="Eliminar etiqueta"
        message="¿Seguro que quieres eliminar esta etiqueta?"
        itemName={labelToDelete?.productos?.nombre || "Etiqueta"}
        onClose={() => setLabelToDelete(null)}
        onConfirm={() => deleteLabelItem(labelToDelete)}
        confirmText="Eliminar etiqueta"
      />

      <section className="space-y-6">
        <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
          <PageHeader
            eyebrow="Etiquetas"
            title="Etiquetas por cliente"
            description="Busca un cliente existente y crea etiquetas ligadas a ese cliente. Clientes y etiquetas separados, como debió ser desde el principio."
            actions={
              <button
                type="button"
                disabled={!selectedClient}
                onClick={() => {
                  setEditingLabel(null);
                  setLabelModalOpen(true);
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Nueva etiqueta
              </button>
            }
          />

          <div className="border-b border-border p-5 md:p-6">
            <SearchInput
              value={clientSearchInput}
              onChange={setClientSearchInput}
              placeholder="Buscar cliente por nombre, razón social, RFC o correo..."
              className="max-w-xl"
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {loadingClients ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                  Buscando clientes...
                </div>
              ) : clients.length ? (
                clients.map((client) => (
                  <ClientSearchCard
                    key={client.id}
                    client={client}
                    active={selectedClient?.id === client.id}
                    onClick={() => setSelectedClient(client)}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                  No hay clientes con esa búsqueda.
                </div>
              )}
            </div>
          </div>

          <LabelsPanel
            selectedClient={selectedClient}
            labels={labels}
            loading={loadingLabels}
            onCreateLabel={() => {
              setEditingLabel(null);
              setLabelModalOpen(true);
            }}
            onEditLabel={(label) => {
              setEditingLabel(label);
              setLabelModalOpen(true);
            }}
            onDeleteLabel={setLabelToDelete}
            onQuickDownload={handleQuickDownload}
          />
        </section>
      </section>
    </>
  );
}

function ClientSearchCard({ client, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
        active
          ? "border-accent-500 bg-accent-50"
          : "border-border bg-background hover:border-primary-200 hover:bg-surface-soft"
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
        {client.logo ? (
          <img
            src={client.logo}
            alt={client.nombre}
            className="h-full w-full object-contain"
          />
        ) : (
          <User2 className="h-5 w-5 text-text-muted" />
        )}
      </div>

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

        {client.correo ? (
          <p className="mt-1 truncate text-xs text-text-muted">
            {client.correo}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function LabelsPanel({
  selectedClient,
  labels,
  loading,
  onCreateLabel,
  onEditLabel,
  onDeleteLabel,
  onQuickDownload,
}) {
  return (
    <div className="p-5 md:p-6">
      {!selectedClient ? (
        <EmptyState
          title="Selecciona un cliente"
          description="Busca y selecciona un cliente para ver o crear sus etiquetas."
          className="rounded-2xl border border-dashed border-border"
        />
      ) : loading ? (
        <EmptyState
          loading
          title="Cargando etiquetas..."
          className="rounded-2xl border border-dashed border-border"
        />
      ) : !labels.length ? (
        <EmptyState
          title="Este cliente todavía no tiene etiquetas"
          description="Crea su primera etiqueta usando productos existentes."
          className="rounded-2xl border border-dashed border-border"
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent-600">
                Cliente seleccionado
              </p>
              <h3 className="text-xl font-bold text-text-primary">
                {selectedClient.nombre}
              </h3>
            </div>

            <button
              type="button"
              onClick={onCreateLabel}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Nueva etiqueta
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {labels.map((label) => (
              <LabelCard
                key={label.id}
                label={label}
                onDownload={() => onQuickDownload(label)}
                onEdit={() => onEditLabel(label)}
                onView={() => onEditLabel(label)}
                onDelete={() => onDeleteLabel(label)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LabelCard({ label, onDownload, onEdit, onView, onDelete }) {
  return (
    <article className="rounded-[24px] border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {label.productos?.nombre || "Producto"}
          </p>

          <p className="mt-1 text-xs text-text-muted">
            {formatDate(label.created_at)}
          </p>
        </div>

        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-soft">
          <Tag className="h-4 w-4 text-text-secondary" />
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-text-secondary">
        <p>
          Tamaño: {Number(label.ancho_mm || 0)} x{" "}
          {Number(label.alto_mm || 0)} mm
        </p>

        {label.codigo ? <p>Código: {label.codigo}</p> : null}
        {label.codigo_barras ? <p>Barcode: {label.codigo_barras}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
        >
          <Download className="h-4 w-4" />
          PDF
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </button>

        <ActionIconButton icon={Eye} label="Ver" tone="default" onClick={onView} />
        <ActionIconButton icon={Trash2} label="Eliminar" tone="error" onClick={onDelete} />
      </div>
    </article>
  );
}

function LabelModal({
  open,
  onClose,
  onSaved,
  selectedClient,
  editingLabel,
  products,
  companyOptions,
  setCompanyOptions,
}) {
  const [form, setForm] = useState({
    cliente_id: "",
    producto_id: "",
    codigo_barras: "",
    codigo: "",
    texto_extra: "",
    ancho_mm: 100,
    alto_mm: 75,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm({
      cliente_id: selectedClient?.id || "",
      producto_id: editingLabel?.producto_id || "",
      codigo_barras: editingLabel?.codigo_barras || "",
      codigo: editingLabel?.codigo || "",
      texto_extra: editingLabel?.texto_extra || "",
      ancho_mm: editingLabel?.ancho_mm ?? 100,
      alto_mm: editingLabel?.alto_mm ?? 75,
    });
  }, [open, selectedClient, editingLabel]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.producto_id) || null,
    [products, form.producto_id],
  );

  useEffect(() => {
    if (!selectedProduct) return;

    setForm((prev) => ({
      ...prev,
      codigo: selectedProduct.codigo || "",
      codigo_barras: prev.codigo_barras || selectedProduct.codigo || "",
    }));
  }, [selectedProduct]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedClient?.id) {
      alert("Selecciona un cliente.");
      return;
    }

    if (!form.producto_id) {
      alert("Selecciona un producto.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        cliente_id: selectedClient.id,
        producto_id: form.producto_id,
        codigo_barras: form.codigo_barras.trim() || null,
        codigo: form.codigo.trim() || null,
        texto_extra: form.texto_extra.trim() || null,
        ancho_mm: Number(form.ancho_mm || 100),
        alto_mm: Number(form.alto_mm || 75),
      };

      if (editingLabel?.id) {
        const { error } = await supabase
          .from("etiquetas")
          .update(payload)
          .eq("id", editingLabel.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("etiquetas").insert(payload);
        if (error) throw error;
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar la etiqueta.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    const previewElement = document.getElementById("label-preview-print");

    try {
      await generateLabelPDF({
        element: previewElement,
        filename: `${selectedProduct?.nombre || "etiqueta"}.pdf`,
        widthMm: Number(form.ancho_mm || 100),
        heightMm: Number(form.alto_mm || 75),
      });
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo generar el PDF.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingLabel ? "Editar etiqueta" : "Nueva etiqueta"}
      subtitle={selectedClient?.nombre || "Cliente"}
      width="max-w-7xl"
      zIndex="z-[95]"
    >
      <div className="grid min-h-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-0 border-b border-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-text-primary">
                Cliente seleccionado
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {selectedClient?.nombre || "Sin cliente"}
              </p>
            </div>

            <select
              value={form.producto_id}
              onChange={(e) => {
                const nextProductId = e.target.value;
                const product = products.find((p) => p.id === nextProductId);

                setForm((prev) => ({
                  ...prev,
                  producto_id: nextProductId,
                  codigo: product?.codigo || "",
                  codigo_barras: product?.codigo || "",
                }));
              }}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none"
            >
              <option value="">Seleccionar producto</option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>

            <Input
              placeholder="Código de barra"
              value={form.codigo_barras}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, codigo_barras: value }))
              }
            />

            <Input
              placeholder="Código"
              value={form.codigo}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, codigo: value }))
              }
            />

            <textarea
              rows={4}
              placeholder="Texto extra"
              value={form.texto_extra}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, texto_extra: e.target.value }))
              }
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                min="20"
                step="1"
                placeholder="Ancho mm"
                value={form.ancho_mm}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, ancho_mm: value }))
                }
              />

              <Input
                type="number"
                min="20"
                step="1"
                placeholder="Alto mm"
                value={form.alto_mm}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, alto_mm: value }))
                }
              />
            </div>

            <CompanyOptions
              companyOptions={companyOptions}
              setCompanyOptions={setCompanyOptions}
            />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-semibold sm:w-auto"
              >
                <Download className="h-4 w-4" />
                PDF
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Guardando..." : "Guardar etiqueta"}
              </button>
            </div>
          </form>
        </div>

        <div className="hidden min-h-0 p-4 sm:p-5 lg:block">
          <LabelPreview
            form={form}
            client={selectedClient}
            product={selectedProduct}
            companyOptions={companyOptions}
          />
        </div>
      </div>
    </Modal>
  );
}

function Input({ value, onChange, type = "text", ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none"
      {...props}
    />
  );
}

function CompanyOptions({ companyOptions, setCompanyOptions }) {
  function updateField(key, value) {
    setCompanyOptions((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-sm font-semibold text-text-primary">
        Opciones visuales de empresa
      </p>

      <div className="mt-4 space-y-3">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Mostrar logo de la empresa</span>
          <input
            type="checkbox"
            checked={companyOptions.showCompanyLogo}
            onChange={(e) => updateField("showCompanyLogo", e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Mostrar nombre de la empresa</span>
          <input
            type="checkbox"
            checked={companyOptions.showCompanyName}
            onChange={(e) => updateField("showCompanyName", e.target.checked)}
          />
        </label>

        <Input
          placeholder="Nombre de la empresa"
          value={companyOptions.companyName}
          onChange={(value) => updateField("companyName", value)}
        />

        <Input
          placeholder="Ruta o URL del logo de tu empresa"
          value={companyOptions.companyLogo}
          onChange={(value) => updateField("companyLogo", value)}
        />
      </div>
    </div>
  );
}