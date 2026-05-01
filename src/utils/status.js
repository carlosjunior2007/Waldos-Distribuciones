export function normalizeQuotationStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  if (["pendiente", "pendientes", "en espera", "por revisar", "abierta"].includes(value)) {
    return "pendiente";
  }

  if (["completada", "completado", "cerrada", "finalizada", "pagada"].includes(value)) {
    return "completada";
  }

  if (["cancelada", "cancelado", "vencida", "rechazada"].includes(value)) {
    return "cancelada";
  }

  return "otro";
}

export function isCompletedQuotation(status) {
  return normalizeQuotationStatus(status) === "completada";
}