import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import * as XLSX from "xlsx";

import Modal from "../../../components/ui/Modal";

const TEMPLATE_HEADERS = [
  "codigo_producto",
  "sku_proveedor",
  "costo_proveedor",
  "moneda",
  "tiempo_entrega_dias",
  "proveedor_principal",
  "notas",
];

const TEMPLATE_EXAMPLE = [
  {
    codigo_producto: "WAL-30E045",
    sku_proveedor: "ACIDO-378",
    costo_proveedor: 68.5,
    moneda: "MXN",
    tiempo_entrega_dias: 3,
    proveedor_principal: "SI",
    notas: "Compra por caja",
  },
  {
    codigo_producto: "WAL-BFA0A7",
    sku_proveedor: "ARO-60-METAL",
    costo_proveedor: 55,
    moneda: "MXN",
    tiempo_entrega_dias: 5,
    proveedor_principal: "NO",
    notas: "",
  },
];

export default function ProveedorProductImportModal({
  open,
  provider,
  preview,
  loadingPreview,
  applyingImport,
  onClose,
  onRowsLoaded,
  onApply,
  onError,
  onClearPreview,
}) {
  const summary = preview?.summary || {
    total: 0,
    found: 0,
    not_found: 0,
    create: 0,
    update: 0,
  };

  function downloadTemplate() {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(TEMPLATE_EXAMPLE, {
      header: TEMPLATE_HEADERS,
    });

    sheet["!cols"] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 34 },
    ];

    XLSX.utils.book_append_sheet(workbook, sheet, "Productos proveedor");
    XLSX.writeFile(
      workbook,
      `plantilla-productos-${provider?.codigo || provider?.nombre || "proveedor"}.xlsx`,
    );
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
      });

      onRowsLoaded(rows);
    } catch (error) {
      console.error("Error leyendo Excel:", error);
      onError?.(
        "No se pudo leer el Excel",
        "Revisa que sea un archivo .xlsx válido.",
        "error",
      );
    } finally {
      event.target.value = "";
    }
  }

  const canApply = Boolean(preview?.rows?.some((row) => row.status !== "not_found"));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Importar productos del proveedor"
      subtitle={
        provider
          ? `${provider.codigo || "Sin código"} · ${provider.nombre}`
          : "Carga masiva de asociaciones"
      }
      width="max-w-6xl"
    >
      <div className="space-y-5 p-5 md:p-6">
        <section className="rounded-[24px] border border-border bg-surface-soft p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-black text-text-primary">
                Plantilla de importación
              </h3>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Descarga la plantilla, llena los productos que maneja este proveedor y vuelve a subir el Excel.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-bold text-text-primary transition hover:bg-surface"
              >
                <Download className="h-4 w-4" />
                Descargar plantilla
              </button>

              <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 text-sm font-bold text-white transition hover:bg-primary-700">
                <Upload className="h-4 w-4" />
                Subir Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <SummaryCard label="Filas" value={summary.total} />
          <SummaryCard label="Encontrados" value={summary.found} success />
          <SummaryCard label="Nuevos" value={summary.create} />
          <SummaryCard label="Actualiza" value={summary.update} />
          <SummaryCard label="No encontrados" value={summary.not_found} warning />
        </section>

        <section className="rounded-[24px] border border-border bg-background">
          <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-black text-text-primary">
                Vista previa
              </h4>
              <p className="mt-1 text-xs text-text-secondary">
                Revisa antes de aplicar. Las filas no encontradas no se guardan.
              </p>
            </div>

            {preview?.rows?.length ? (
              <button
                type="button"
                onClick={onClearPreview}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-bold text-text-secondary"
              >
                Limpiar
              </button>
            ) : null}
          </div>

          {loadingPreview ? (
            <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm font-semibold text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Validando productos...
            </div>
          ) : preview?.rows?.length ? (
            <div className="max-h-[440px] overflow-auto">
              <table className="min-w-[980px] w-full text-left">
                <thead className="sticky top-0 bg-surface-soft">
                  <tr>
                    {[
                      "Estado",
                      "Código producto",
                      "Producto",
                      "SKU proveedor",
                      "Costo",
                      "Moneda",
                      "Entrega",
                      "Principal",
                      "Notas",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-text-muted"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={`${row.row_number}-${row.codigo_producto}`} className="border-t border-border">
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-text-primary">
                        {row.codigo_producto}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {row.producto_nombre || row.message}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {row.sku_proveedor || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {row.costo_proveedor || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {row.moneda || "MXN"}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {row.tiempo_entrega_dias || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {row.proveedor_principal || "NO"}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {row.notas || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
              <FileSpreadsheet className="h-9 w-9 text-text-muted" />
              <p className="mt-3 text-sm font-bold text-text-primary">
                Todavía no has subido un Excel
              </p>
              <p className="mt-1 max-w-md text-sm leading-6 text-text-secondary">
                Descarga la plantilla, llena los productos del proveedor y súbela para revisar la vista previa.
              </p>
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={applyingImport}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:bg-surface-soft disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onApply}
            disabled={!canApply || applyingImport}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-bold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {applyingImport ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Aplicar importación
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SummaryCard({ label, value, success = false, warning = false }) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        success
          ? "border-success-100 bg-success-50"
          : warning
            ? "border-warning-100 bg-warning-50"
            : "border-border bg-surface-soft"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-text-primary">{value}</p>
    </article>
  );
}

function StatusBadge({ status }) {
  const config = {
    create: "bg-success-50 text-success-700 border-success-100",
    update: "bg-info-50 text-info-700 border-info-100",
    not_found: "bg-warning-50 text-warning-800 border-warning-100",
  };

  const label = {
    create: "Nuevo",
    update: "Actualiza",
    not_found: "No encontrado",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
        config[status] || "bg-surface-soft text-text-secondary border-border"
      }`}
    >
      {label[status] || status}
    </span>
  );
}
