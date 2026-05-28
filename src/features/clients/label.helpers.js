import { capitalizeFirstLetter } from "./client.helpers";

export function formatLabelDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function buildLabelFormFromRow(label, selectedClient) {
  return {
    cliente_id: selectedClient?.id || "",
    producto_id: label?.producto_id || "",
    codigo_barras: label?.codigo_barras || "",
    codigo: label?.codigo || "",
    texto_extra: capitalizeFirstLetter(label?.texto_extra || ""),
    ancho_mm: label?.ancho_mm ?? 100,
    alto_mm: label?.alto_mm ?? 75,
  };
}

export function buildLabelPayload(form, selectedClient) {
  return {
    cliente_id: selectedClient.id,
    producto_id: form.producto_id,
    codigo_barras: form.codigo_barras.trim() || null,
    codigo: form.codigo.trim() || null,
    texto_extra: capitalizeFirstLetter(form.texto_extra || "").trim() || null,
    ancho_mm: Number(form.ancho_mm || 100),
    alto_mm: Number(form.alto_mm || 75),
  };
}