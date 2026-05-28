import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import LabelsMessageModal, { createMessageState } from "./LabelsMessageModal";
import { generateLabelPDF } from "../../../utils/labelPdf";

import LabelPreview from "./LabelPreview";

import { INITIAL_LABEL_FORM } from "../label.constants";
import {
  buildLabelFormFromRow,
  buildLabelPayload,
  capitalizeFirstLetter,
} from "../label.helpers";
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
  const [messageModal, setMessageModal] = useState(createMessageState());

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

  function showMessage(title, message, tone = "warning") {
    setMessageModal({
      open: true,
      title,
      message,
      tone,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedClient?.id) {
      showMessage(
        "Selecciona un cliente",
        "Necesitas seleccionar un cliente antes de guardar la etiqueta.",
        "warning",
      );
      return;
    }

    if (!form.producto_id) {
      showMessage(
        "Selecciona un producto",
        "Necesitas seleccionar un producto para generar la etiqueta.",
        "warning",
      );
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
      showMessage(
        "No se pudo guardar la etiqueta",
        error.message || "Intenta de nuevo.",
        "error",
      );
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
      showMessage(
        "No se pudo generar el PDF",
        error.message || "Revisa la vista previa de la etiqueta.",
        "error",
      );
    }
  }

  function updateForm(key, value) {
    const formattedValue = key === "texto_extra"
      ? capitalizeFirstLetter(value)
      : value;

    setForm((prev) => ({ ...prev, [key]: formattedValue }));
  }

  return (
    <>
      <LabelsMessageModal
        open={messageModal.open}
        title={messageModal.title}
        message={messageModal.message}
        tone={messageModal.tone}
        onClose={() => setMessageModal(createMessageState())}
      />

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
            companyOptions={companyOptions}
          />
        </div>
      </div>
    </Modal>
    </>
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
    const formattedValue = key === "companyName"
      ? capitalizeFirstLetter(value)
      : value;

    setCompanyOptions((prev) => ({ ...prev, [key]: formattedValue }));
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