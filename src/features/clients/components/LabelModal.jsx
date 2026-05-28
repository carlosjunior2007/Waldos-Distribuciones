import { useEffect, useMemo, useState } from "react";
import { Check, Download, Search } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import { generateLabelPDF } from "../../../utils/labelPdf";

import LabelPreview from "./LabelPreview";

import { INITIAL_LABEL_FORM } from "../label.constants";
import { capitalizeFirstLetter } from "../client.helpers";
import {
  buildLabelFormFromRow,
  buildLabelPayload,
} from "../label.helpers";
import { normalizeCompanyOptions } from "../label.constants";
import {
  createLabel,
  updateLabel,
} from "../services/labels.service";

export default function LabelModal({
  open,
  onClose,
  onSaved,
  selectedClient,
  editingLabel,
  products,
  companyOptions,
  setCompanyOptions,
}) {
  const [form, setForm] = useState(INITIAL_LABEL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(buildLabelFormFromRow(editingLabel, selectedClient));
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

      const payload = buildLabelPayload(form, selectedClient);

      if (editingLabel?.id) {
        await updateLabel(editingLabel.id, payload);
      } else {
        await createLabel(payload);
      }

      await onSaved?.();
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

  function updateForm(key, value) {
    const nextValue = key === "texto_extra" ? capitalizeFirstLetter(value) : value;

    setForm((prev) => ({ ...prev, [key]: nextValue }));
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

            <ProductPicker
              products={products}
              selectedProductId={form.producto_id}
              onSelect={(product) => {
                setForm((prev) => ({
                  ...prev,
                  producto_id: product?.id || "",
                  codigo: product?.codigo || "",
                  codigo_barras: product?.codigo || "",
                }));
              }}
            />

            <Input
              placeholder="Código de barra"
              value={form.codigo_barras}
              onChange={(value) => updateForm("codigo_barras", value)}
            />

            <Input
              placeholder="Código"
              value={form.codigo}
              onChange={(value) => updateForm("codigo", value)}
            />

            <textarea
              rows={4}
              placeholder="Texto extra"
              value={form.texto_extra}
              onChange={(e) => updateForm("texto_extra", e.target.value)}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                min="20"
                step="1"
                placeholder="Ancho mm"
                value={form.ancho_mm}
                onChange={(value) => updateForm("ancho_mm", value)}
              />

              <Input
                type="number"
                min="20"
                step="1"
                placeholder="Alto mm"
                value={form.alto_mm}
                onChange={(value) => updateForm("alto_mm", value)}
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
            companyOptions={normalizeCompanyOptions(companyOptions)}
          />
        </div>
      </div>
    </Modal>
  );
}


function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function ProductPicker({ products, selectedProductId, onSelect }) {
  const [search, setSearch] = useState("");

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId],
  );

  const filteredProducts = useMemo(() => {
    const cleanSearch = normalizeText(search);

    if (!cleanSearch) return products.slice(0, 10);

    return products
      .filter((product) => {
        const name = normalizeText(product.nombre);
        const code = normalizeText(product.codigo);

        return name.includes(cleanSearch) || code.includes(cleanSearch);
      })
      .slice(0, 10);
  }, [products, search]);

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-text-primary">
          Producto para la etiqueta
        </label>
        <p className="text-xs text-text-secondary">
          Busca por nombre o código y selecciona el producto sin abrir una lista enorme.
        </p>
      </div>

      {selectedProduct ? (
        <div className="mt-3 rounded-2xl border border-accent-200 bg-accent-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">
                {selectedProduct.nombre}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Código: {selectedProduct.codigo || "Sin código"}
              </p>
            </div>

            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
              <Check className="h-4 w-4" />
            </span>
          </div>
        </div>
      ) : null}

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar producto por nombre o código"
          className="h-12 w-full rounded-2xl border border-border bg-surface px-11 text-sm outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-100"
        />
      </div>

      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
        {!filteredProducts.length ? (
          <div className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-text-secondary">
            No encontré productos con esa búsqueda.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isSelected = product.id === selectedProductId;

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelect(product)}
                className={`w-full rounded-2xl border p-3 text-left transition hover:border-accent-300 hover:bg-accent-50 ${
                  isSelected
                    ? "border-accent-400 bg-accent-50"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {product.nombre}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Código: {product.codigo || "Sin código"}
                    </p>
                  </div>

                  {isSelected ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
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
        Qué mostrar en la etiqueta
      </p>
      <p className="mt-1 text-xs text-text-secondary">
        Desactiva datos personales cuando no quieras que salgan impresos en la etiqueta.
      </p>

      <div className="mt-4 space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Datos del cliente
          </p>

          <div className="space-y-3">
            <ToggleOption
              label="Mostrar nombre del cliente"
              checked={companyOptions.showClientName}
              onChange={(checked) => updateField("showClientName", checked)}
            />

            <ToggleOption
              label="Mostrar teléfono del cliente"
              checked={companyOptions.showClientPhone}
              onChange={(checked) => updateField("showClientPhone", checked)}
            />

            <ToggleOption
              label="Mostrar correo del cliente"
              checked={companyOptions.showClientEmail}
              onChange={(checked) => updateField("showClientEmail", checked)}
            />

            <ToggleOption
              label="Mostrar logo del cliente"
              checked={companyOptions.showClientLogo}
              onChange={(checked) => updateField("showClientLogo", checked)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Logo
          </p>

          <div className="space-y-3">
            <ToggleOption
              label="Mostrar logo"
              checked={companyOptions.showCompanyLogo}
              onChange={(checked) =>
                setCompanyOptions((prev) => ({
                  ...prev,
                  showCompanyLogo: checked,
                  companyLogo: "/Logo.png",
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleOption({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-text-primary">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}