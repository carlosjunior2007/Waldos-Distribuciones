import { LOGOS_BUCKET } from "./client.constants";

export function getStoragePathFromUrl(url, bucket = LOGOS_BUCKET) {
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

export function buildClientPayload(form) {
  return {
    ...form,
    nombre: (form.nombre || "").trim(),
    razon_social: (form.razon_social || "").trim() || null,
    rfc: (form.rfc || "").trim().toUpperCase() || null,
    regimen_fiscal: (form.regimen_fiscal || "").trim() || null,
    uso_cfdi: (form.uso_cfdi || "").trim() || null,
    numero: (form.numero || "").trim() || null,
    correo: (form.correo || "").trim() || null,
    direccion: (form.direccion || "").trim() || null,
    ciudad: (form.ciudad || "").trim() || null,
    estado: (form.estado || "").trim() || null,
    codigo_postal: (form.codigo_postal || "").trim() || null,
    pais: (form.pais || "").trim() || null,
    logo: form.logo || null,
    notas: (form.notas || "").trim() || null,
  };
}

export function buildClientAddress(client = {}) {
  return [
    client.direccion,
    client.ciudad,
    client.estado,
    client.codigo_postal,
    client.pais,
  ]
    .filter(Boolean)
    .join(", ");
}

export function getClientTotals(quotations = []) {
  return quotations.reduce(
    (acc, item) => {
      acc.total += Number(item.total || 0);
      acc.ganancia += Number(item.ganancia || 0);
      acc.count += 1;
      return acc;
    },
    { total: 0, ganancia: 0, count: 0 },
  );
}
