import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Tag,
  User2,
  Eye,
} from "lucide-react";

import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  deleteClientLogoByUrl,
  uploadClientLogo,
  fetchProductsBasic,
  fetchLabelsByClient,
  createLabel,
  updateLabel,
  deleteLabel,
} from "../../services/labels";

import { generateLabelPDF } from "../../utils/labelPdf";

const COMPANY_STORAGE_KEY = "logosClientes";
const LABEL_CLIENT_OVERRIDES_KEY = "labels_client_overrides";

const COMPANY_DEFAULTS = {
  showCompanyLogo: false,
  showCompanyName: false,
  companyName: "Waldo Distribuciones",
  companyLogo: "/camion.png", // cambia esta ruta si tu logo está en otro lado
};

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value, delay));
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

function readLabelClientOverrides() {
  try {
    return JSON.parse(localStorage.getItem(LABEL_CLIENT_OVERRIDES_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLabelClientOverrides(data) {
  localStorage.setItem(LABEL_CLIENT_OVERRIDES_KEY, JSON.stringify(data));
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("es-MX", {
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

function ClientModal({ open, onClose, onSaved, editingClient = null }) {
  const [form, setForm] = useState({
    nombre: "",
    numero: "",
    correo: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm({
      nombre: editingClient?.nombre || "",
      numero: editingClient?.numero || "",
      correo: editingClient?.correo || "",
    });
    setLogoFile(null);
  }, [open, editingClient]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert("El nombre del cliente es obligatorio.");
      return;
    }

    try {
      setSaving(true);

      let saved;

      if (editingClient?.id) {
        saved = await updateClient(editingClient.id, {
          nombre: form.nombre.trim(),
          numero: form.numero.trim() || null,
          correo: form.correo.trim() || null,
        });
      } else {
        saved = await createClient({
          nombre: form.nombre.trim(),
          numero: form.numero.trim() || null,
          correo: form.correo.trim() || null,
          logo: null,
        });
      }

      if (logoFile) {
        const publicUrl = await uploadClientLogo(logoFile, saved.id);
        saved = await updateClient(saved.id, { logo: publicUrl });
      }

      onSaved(saved);
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar el cliente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 p-4">
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-xl rounded-[28px] border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <p className="text-sm font-semibold text-accent-600">
                {editingClient ? "Editar cliente" : "Nuevo cliente"}
              </p>
              <h3 className="mt-1 text-xl font-bold text-text-primary">
                {editingClient ? "Modificar cliente" : "Registrar cliente"}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={form.nombre}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nombre: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none"
            />

            <input
              type="text"
              placeholder="Número"
              value={form.numero}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, numero: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none"
            />

            <input
              type="email"
              placeholder="Correo"
              value={form.correo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, correo: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none"
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm text-text-secondary">
              <Upload className="h-4 w-4" />
              <span>{logoFile ? logoFile.name : "Subir logo del cliente"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
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
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white"
              >
                {saving ? "Guardando..." : "Guardar cliente"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
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
              style={{ marginTop: "2.5mm", fontSize: "3.5mm", fontWeight: 700 }}
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
              style={{ marginTop: "1mm", fontSize: "3.5mm", fontWeight: 700 }}
            >
              Cliente: {client.nombre}
            </div>
          ) : null}

          {client?.numero ? (
            <div
              style={{ marginTop: "1mm", fontSize: "3.5mm", fontWeight: 700 }}
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
                <span
                  style={{
                    fontSize: "2.8mm",
                    fontWeight: 700,
                  }}
                >
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

function LabelModal({
  open,
  onClose,
  onSaved,
  selectedClient,
  editingLabel = null,
  products = [],
  companyOptions,
  setCompanyOptions,
}) {
  const previewWrapperRef = useRef(null);

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
  const [clientView, setClientView] = useState({
    nombre: "",
    numero: "",
    correo: "",
    logo: "",
  });

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

    const allOverrides = readLabelClientOverrides();

    const overrideKey = editingLabel?.id
      ? `label_${editingLabel.id}`
      : selectedClient?.id
        ? `draft_${selectedClient.id}`
        : null;

    const savedOverride = overrideKey ? allOverrides[overrideKey] : null;

    setClientView({
      nombre: savedOverride?.nombre ?? selectedClient?.nombre ?? "",
      numero: savedOverride?.numero ?? selectedClient?.numero ?? "",
      correo: savedOverride?.correo ?? selectedClient?.correo ?? "",
      logo: savedOverride?.logo ?? selectedClient?.logo ?? "",
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
    }));
  }, [selectedProduct]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.cliente_id) {
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
        cliente_id: form.cliente_id,
        producto_id: form.producto_id,
        codigo_barras: form.codigo_barras.trim() || null,
        codigo: form.codigo.trim() || null,
        texto_extra: form.texto_extra.trim() || null,
        ancho_mm: Number(form.ancho_mm || 100),
        alto_mm: Number(form.alto_mm || 75),
      };

      let savedLabel;

      if (editingLabel?.id) {
        savedLabel = await updateLabel(editingLabel.id, payload);
      } else {
        savedLabel = await createLabel(payload);
      }

      persistClientOverride(clientView, savedLabel.id);

      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar la etiqueta.");
    } finally {
      setSaving(false);
    }
  }

  function persistClientOverride(nextClientView, labelId = null) {
    const allOverrides = readLabelClientOverrides();

    const overrideKey = labelId
      ? `label_${labelId}`
      : selectedClient?.id
        ? `draft_${selectedClient.id}`
        : null;

    if (!overrideKey) return;

    allOverrides[overrideKey] = nextClientView;
    writeLabelClientOverrides(allOverrides);
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
    <div className="fixed inset-0 z-[95] bg-black/50">
      <div className="flex h-dvh items-start justify-center p-3 sm:p-4 lg:items-center lg:p-6">
        <div className="grid h-full w-full max-w-7xl grid-rows-[minmax(0,1fr)] overflow-hidden rounded-[24px] border border-border bg-surface shadow-2xl lg:h-auto lg:max-h-[92dvh] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-h-0 overflow-y-auto border-b border-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-accent-600">
                  {editingLabel ? "Editar etiqueta" : "Nueva etiqueta"}
                </p>
                <h3 className="mt-1 text-xl font-bold text-text-primary">
                  {selectedClient?.nombre || "Cliente"}
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 lg:hidden">
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-primary">
                    Vista previa
                  </p>
                  <span className="text-xs text-text-muted">
                    Escalada para móvil
                  </span>
                </div>

                <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-dashed border-border bg-white p-3">
                  <div className="flex min-w-max justify-center">
                    <div
                      style={{
                        transform: "scale(0.42)",
                        transformOrigin: "top center",
                        width: `${Number(form.ancho_mm || 100)}mm`,
                        height: `${Number(form.alto_mm || 75)}mm`,
                        marginBottom: `-${Number(form.alto_mm || 75) * 0.58}mm`,
                      }}
                    >
                      <LabelPreviewContent
                        form={form}
                        client={clientView}
                        product={selectedProduct}
                        companyOptions={companyOptions}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 pb-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-text-primary">
                  Datos visibles del cliente
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Se llenan automáticamente, pero puedes cambiarlos para esta
                  etiqueta.
                </p>

                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre del cliente"
                    value={clientView.nombre}
                    onChange={(e) => {
                      const next = { ...clientView, nombre: e.target.value };
                      setClientView(next);
                    }}
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Número / teléfono"
                    value={clientView.numero}
                    onChange={(e) => {
                      const next = { ...clientView, numero: e.target.value };
                      setClientView(next);
                    }}
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none"
                  />

                  <input
                    type="email"
                    placeholder="Correo"
                    value={clientView.correo}
                    onChange={(e) => {
                      const next = { ...clientView, correo: e.target.value };
                      setClientView(next);
                    }}
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Logo URL del cliente"
                    value={clientView.logo}
                    onChange={(e) => {
                      const next = { ...clientView, logo: e.target.value };
                      setClientView(next);
                    }}
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none"
                  />
                </div>
              </div>

              <select
                value={form.producto_id}
                onChange={(e) => {
                  const nextProductId = e.target.value;
                  const selected = products.find((p) => p.id === nextProductId);

                  setForm((prev) => ({
                    ...prev,
                    producto_id: nextProductId,
                    codigo: selected?.codigo || "",
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

              <input
                type="text"
                placeholder="Código de barra"
                value={form.codigo_barras}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    codigo_barras: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none"
              />

              <input
                type="text"
                placeholder="Código"
                value={form.codigo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, codigo: e.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none"
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
                <input
                  type="number"
                  min="20"
                  step="1"
                  placeholder="Ancho mm"
                  value={form.ancho_mm}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, ancho_mm: e.target.value }))
                  }
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none"
                />

                <input
                  type="number"
                  min="20"
                  step="1"
                  placeholder="Alto mm"
                  value={form.alto_mm}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, alto_mm: e.target.value }))
                  }
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none"
                />
              </div>

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
                      onChange={(e) =>
                        setCompanyOptions((prev) => ({
                          ...prev,
                          showCompanyLogo: e.target.checked,
                        }))
                      }
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 text-sm">
                    <span>Mostrar nombre de la empresa</span>
                    <input
                      type="checkbox"
                      checked={companyOptions.showCompanyName}
                      onChange={(e) =>
                        setCompanyOptions((prev) => ({
                          ...prev,
                          showCompanyName: e.target.checked,
                        }))
                      }
                    />
                  </label>

                  <input
                    type="text"
                    placeholder="Nombre de la empresa"
                    value={companyOptions.companyName}
                    onChange={(e) =>
                      setCompanyOptions((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Ruta o URL del logo de tu empresa"
                    value={companyOptions.companyLogo}
                    onChange={(e) =>
                      setCompanyOptions((prev) => ({
                        ...prev,
                        companyLogo: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none"
                  />
                </div>
              </div>

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
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white sm:w-auto"
                >
                  {saving ? "Guardando..." : "Guardar etiqueta"}
                </button>
              </div>
            </form>
          </div>

          <div
            ref={previewWrapperRef}
            className="hidden min-h-0 overflow-y-auto p-4 sm:p-5 lg:block"
          >
            <LabelPreview
              form={form}
              client={clientView}
              product={selectedProduct}
              companyOptions={companyOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LabelsPage() {
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [printPayload, setPrintPayload] = useState(null);

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [labels, setLabels] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedClient, setSelectedClient] = useState(null);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);

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

  async function loadClients() {
    try {
      setLoadingClients(true);
      const res = await fetchClients({ search, page });

      setClients(res.rows);
      setTotalPages(res.totalPages);

      if (!selectedClient && res.rows.length) {
        setSelectedClient(res.rows[0]);
      } else if (selectedClient) {
        const stillExists = res.rows.find((c) => c.id === selectedClient.id);
        if (stillExists) {
          setSelectedClient(stillExists);
        }
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron cargar los clientes.");
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadProducts() {
    try {
      const rows = await fetchProductsBasic();
      setProducts(rows);
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
      const rows = await fetchLabelsByClient(clientId);
      setLabels(rows);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron cargar las etiquetas.");
    } finally {
      setLoadingLabels(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, [search, page]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadLabels(selectedClient?.id || null);
  }, [selectedClient?.id]);

  function handleClientSaved(client) {
    loadClients();
    setSelectedClient(client);
  }

  async function handleDeleteClient(client) {
    const ok = window.confirm(
      `¿Seguro que quieres eliminar al cliente "${client.nombre}"?`,
    );
    if (!ok) return;

    try {
      await deleteClient(client.id);

      try {
        if (client.logo) {
          await deleteClientLogoByUrl(client.logo);
        }
      } catch (logoError) {
        console.error("No se pudo borrar el logo del bucket:", logoError);
      }

      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
        setLabels([]);
      }

      await loadClients();
    } catch (error) {
      console.error(error);

      const message = String(error?.message || "").toLowerCase();

      if (
        message.includes("violates foreign key constraint") ||
        message.includes("etiquetas_cliente_id_fkey") ||
        message.includes("foreign key")
      ) {
        alert(
          `No puedes borrar al cliente "${client.nombre}" porque todavía tiene etiquetas registradas. Borra primero sus etiquetas.`,
        );
        return;
      }

      alert(error.message || "No se pudo eliminar el cliente.");
    }
  }

  async function handleDeleteLabel(id) {
    const ok = window.confirm("¿Seguro que quieres eliminar esta etiqueta?");
    if (!ok) return;

    try {
      await deleteLabel(id);
      await loadLabels(selectedClient?.id);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo eliminar la etiqueta.");
    }
  }

  async function handleQuickDownload(label) {
    const product = label.productos || null;
    const dbClient = label.clientes || selectedClient || null;

    const allOverrides = readLabelClientOverrides();
    const savedOverride = allOverrides[`label_${label.id}`] || null;

    const client = {
      nombre: savedOverride?.nombre ?? dbClient?.nombre ?? "",
      numero: savedOverride?.numero ?? dbClient?.numero ?? "",
      correo: savedOverride?.correo ?? dbClient?.correo ?? "",
      logo: savedOverride?.logo ?? dbClient?.logo ?? "",
    };

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

      <ClientModal
        open={clientModalOpen}
        onClose={() => {
          setClientModalOpen(false);
          setEditingClient(null);
        }}
        onSaved={handleClientSaved}
        editingClient={editingClient}
      />

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

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
          <div className="border-b border-border p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-accent-600">
                  Clientes
                </p>
                <h3 className="mt-1 text-xl font-bold text-text-primary">
                  Gestión de clientes
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingClient(null);
                  setClientModalOpen(true);
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Nuevo
              </button>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar clientes por nombre..."
                className="h-12 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-sm outline-none"
              />
            </div>
          </div>

          <div className="max-h-[62vh] overflow-y-auto p-4">
            {loadingClients ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                Cargando clientes...
              </div>
            ) : !clients.length ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                No hay clientes.
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <article
                    key={client.id}
                    className={`rounded-2xl border p-4 transition ${
                      selectedClient?.id === client.id
                        ? "border-accent-500 bg-accent-50"
                        : "border-border bg-background hover:border-primary-200 hover:bg-surface-soft"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedClient(client)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
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
                          {client.numero ? (
                            <p className="mt-1 text-xs text-text-muted">
                              {client.numero}
                            </p>
                          ) : null}
                          {client.correo ? (
                            <p className="mt-1 truncate text-xs text-text-muted">
                              {client.correo}
                            </p>
                          ) : null}
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClient(client);
                            setClientModalOpen(true);
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface"
                          title="Editar cliente"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteClient(client)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-error-200 bg-error-50 text-error-700"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border p-4">
            <p className="text-sm text-text-secondary">
              Página {page} de {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent-600">Etiquetas</p>
              <h3 className="mt-1 text-xl font-bold text-text-primary">
                {selectedClient?.nombre
                  ? `Cliente: ${selectedClient.nombre}`
                  : "Selecciona un cliente"}
              </h3>
            </div>

            <button
              type="button"
              disabled={!selectedClient}
              onClick={() => {
                setEditingLabel(null);
                setLabelModalOpen(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Nueva etiqueta
            </button>
          </div>

          <div className="p-5">
            {!selectedClient ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-text-muted">
                Selecciona un cliente para ver y crear etiquetas.
              </div>
            ) : loadingLabels ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-text-muted">
                Cargando etiquetas...
              </div>
            ) : !labels.length ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-text-muted">
                Este cliente todavía no tiene etiquetas.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {labels.map((label) => (
                  <article
                    key={label.id}
                    className="rounded-[24px] border border-border bg-background p-4"
                  >
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
                      {label.codigo_barras ? (
                        <p>Barcode: {label.codigo_barras}</p>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickDownload(label)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingLabel(label);
                          setLabelModalOpen(true);
                        }}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingLabel(label);
                          setLabelModalOpen(true);
                        }}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3"
                        title="Ver"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLabel(label.id)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-error-200 bg-error-50 px-3 text-error-700"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </>
  );
}
