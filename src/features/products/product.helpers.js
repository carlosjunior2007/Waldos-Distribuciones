import { Eye, EyeOff} from "lucide-react";
import { CATEGORY_OPTIONS } from "./product.constants";

export function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getCategoryLabel(value) {
  const match = CATEGORY_OPTIONS.find((item) => item.value === value);
  return match?.label || value || "Sin categoría";
}

export function getInventoryStatus(product) {
  if (!product?.habilitado) {
    return {
      key: "oculto",
      label: "Oculto",
      icon: EyeOff,
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  return {
    key: "activo",
    label: "Activo",
    icon: Eye,
    className: "border-success-100 bg-success-50 text-success-700",
  };
}

export function looksLikeUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );
}

export function getAuthUserLabel(user) {
  if (!user) return null;

  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.username ||
    user.email ||
    null
  );
}

export function getProductCreatorLabel(product, authUser, userLabels = {}) {
  if (!product) return "Sin dato";

  const directLabel =
    product.created_by_name ||
    product.created_by_email ||
    product.modified_by_name ||
    product.modified_by_email ||
    product.creator_name ||
    product.creator_email ||
    null;

  if (directLabel) return directLabel;

  const userId = product.created_by || product.modified_by || null;

  if (!userId) return "Sin dato";
  if (userLabels[userId]) return userLabels[userId];

  if (authUser?.id === userId) {
    return getAuthUserLabel(authUser) || "Usuario actual";
  }

  if (!looksLikeUUID(userId)) return userId;

  return "Usuario no disponible";
}

export function getStoragePathFromUrl(imageUrl, bucketName = "productos") {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const marker = `/storage/v1/object/public/${bucketName}/`;
    const index = url.pathname.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export function buildProductForm(product) {
  return {
    id: product.id || "",
    nombre: product.nombre || "",
    descripcion: product.descripcion || "",
    precio: product.precio ?? "",
    imagen: product.imagen || "",
    imagenFile: null,

    precio_compra: product.precio_compra ?? "",
    cantidad_caja: product.cantidad_caja ?? "",

    habilitado: Boolean(product.habilitado),
    categoria: product.categoria || "",
    unidad: product.unidad || "",
    codigo: product.codigo || "",

    clave_sat: product.clave_sat || "",
    clave_unidad_sat: product.clave_unidad_sat || "",
    iva_porcentaje: product.iva_porcentaje ?? "8",
  };
}

export function validateProductForm(form) {
  if (!form.nombre.trim()) return "El nombre es obligatorio.";
  if (!form.categoria) return "Selecciona una categoría.";
  if (!form.unidad) return "Selecciona una unidad.";
  if (form.precio === "" || Number(form.precio) < 0) return "El precio debe ser válido.";
  if (form.precio_compra === "" || Number(form.precio_compra) < 0) return "El precio de compra debe ser válido.";
  if (form.cantidad_caja === "" || Number(form.cantidad_caja) < 0) return "La cantidad por caja debe ser válida.";
  if (!form.clave_sat?.trim()) return "La clave SAT es obligatoria.";
  if (!form.clave_unidad_sat?.trim()) return "La clave de unidad SAT es obligatoria.";
  if (form.iva_porcentaje === "" || Number(form.iva_porcentaje) < 0) return "El IVA debe ser válido.";

  return null;
}