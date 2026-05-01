export function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export function parseNumberish(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeText(value = "") {
  return String(value).toLowerCase().trim();
}