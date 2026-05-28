import { CheckCircle2, XCircle } from "lucide-react";

export function capitalizeFirstLetter(value) {
  const text = String(value ?? "");
  const firstLetterIndex = text.search(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/);

  if (firstLetterIndex === -1) return text;

  return (
    text.slice(0, firstLetterIndex) +
    text.charAt(firstLetterIndex).toLocaleUpperCase("es-MX") +
    text.slice(firstLetterIndex + 1)
  );
}

export function normalizeProviderTextField(value) {
  return capitalizeFirstLetter(String(value ?? "").trim());
}

export function buildProviderForm(provider) {
  return {
    id: provider.id || "",
    codigo: provider.codigo || "",
    nombre: provider.nombre || "",
    razon_social: provider.razon_social || "",
    rfc: provider.rfc || "",
    telefono: provider.telefono || "",
    correo: provider.correo || "",
    sitio_web: provider.sitio_web || "",
    contacto_nombre: provider.contacto_nombre || "",
    direccion: provider.direccion || "",
    ciudad: provider.ciudad || "",
    estado: provider.estado || "",
    codigo_postal: provider.codigo_postal || "",
    pais: provider.pais || "México",
    notas: provider.notas || "",
    activo: provider.activo !== false,
  };
}

export function getProviderStatus(provider) {
  if (provider?.activo === false) {
    return {
      key: "inactivo",
      label: "Inactivo",
      icon: XCircle,
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  return {
    key: "activo",
    label: "Activo",
    icon: CheckCircle2,
    className: "border-success-100 bg-success-50 text-success-700",
  };
}

export function validateProviderForm(form) {
  if (!String(form.codigo || "").trim()) return "El código del proveedor es obligatorio.";
  if (!/^[A-Z0-9._-]+$/i.test(String(form.codigo || "").trim())) {
    return "El código del proveedor solo puede usar letras, números, punto, guion y guion bajo.";
  }

  if (!String(form.nombre || "").trim()) return "El nombre del proveedor es obligatorio.";

  const email = String(form.correo || "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "El correo del proveedor no tiene un formato válido.";
  }

  const rfc = String(form.rfc || "").trim().toUpperCase();
  if (rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc)) {
    return "El RFC no tiene un formato válido.";
  }

  const postalCode = String(form.codigo_postal || "").trim();
  if (postalCode && !/^\d{5}$/.test(postalCode)) {
    return "El código postal debe tener 5 dígitos.";
  }

  const website = String(form.sitio_web || "").trim();
  if (website && !/^https?:\/\//i.test(website)) {
    return "El sitio web debe iniciar con http:// o https://.";
  }

  return null;
}

export function normalizeProviderCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
}

export function buildNextProviderCode(totalProviders = 0) {
  const next = Number(totalProviders || 0) + 1;
  return `PRV-${String(next).padStart(4, "0")}`;
}

export function formatProviderAddress(provider) {
  return [
    provider.direccion,
    provider.ciudad,
    provider.estado,
    provider.codigo_postal,
    provider.pais,
  ]
    .filter(Boolean)
    .join(", ");
}

export function formatProviderContact(provider) {
  return [
    provider.contacto_nombre,
    provider.telefono,
    provider.correo,
  ]
    .filter(Boolean)
    .join(" · ");
}
