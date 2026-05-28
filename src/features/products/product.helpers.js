import { Eye, EyeOff } from "lucide-react";
import { CATEGORY_OPTIONS } from "./product.constants";

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

export function normalizeProductTextField(value) {
  return capitalizeFirstLetter(String(value ?? "").trim());
}

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


export function calculateUtilityPercent(cost, salePrice) {
  const costo = Number(cost || 0);
  const precio = Number(salePrice || 0);

  if (costo <= 0 || precio <= 0) return 0;

  return ((precio - costo) / precio) * 100;
}

export function formatUtilityPercent(productOrForm) {
  const utility = calculateUtilityPercent(
    productOrForm?.precio_compra,
    productOrForm?.precio,
  );

  return `${utility.toFixed(2)}%`;
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
  const precioCompra = product.precio_compra ?? "";
  const precioVenta = product.precio ?? "";

  return {
    id: product.id || "",
    nombre: product.nombre || "",
    descripcion: product.descripcion || "",
    precio: precioVenta,
    imagen: product.imagen || "",
    imagenFile: null,

    precio_compra: precioCompra,
    precio_utilidad: calculateUtilityPercent(precioCompra, precioVenta).toFixed(2),
    cantidad_caja: product.cantidad_caja ?? "",

    habilitado: Boolean(product.habilitado),
    categoria: product.categoria || "",
    unidad: product.unidad || "",
    codigo: product.codigo || "",

    clave_sat: product.clave_sat || "",
    clave_unidad_sat: product.clave_unidad_sat || "",
    iva_porcentaje: product.iva_porcentaje ?? "8",

    proveedores: normalizeProductSuppliersForForm(product.proveedores_asociados),
  };
}

export function normalizeProductSuppliersForForm(suppliers = []) {
  return (suppliers || []).map((item) => ({
    id: item.id || "",
    proveedor_id: item.proveedor_id || item.proveedor?.id || "",
    sku_proveedor: item.sku_proveedor || "",
    precio_compra: item.precio_compra ?? "",
    moneda: item.moneda || "MXN",
    tiempo_entrega_dias: item.tiempo_entrega_dias ?? "",
    es_principal: Boolean(item.es_principal),
    notas: item.notas || "",
    proveedor: item.proveedor || null,
    nombre: item.nombre || item.proveedor?.nombre || "",
  }));
}

export function validateProductForm(form) {
  if (!form.nombre.trim()) return "El nombre es obligatorio.";
  if (!form.categoria) return "Selecciona una categoría.";
  if (!form.unidad) return "Selecciona una unidad.";
  if (form.precio === "" || Number(form.precio) < 0) return "El precio debe ser válido.";
  if (form.precio_compra === "" || Number(form.precio_compra) < 0) return "El precio de compra debe ser válido.";
  if (form.cantidad_caja === "" || Number(form.cantidad_caja) < 0) return "La cantidad por caja debe ser válida.";
  if (!Number.isInteger(Number(form.cantidad_caja))) return "La cantidad por caja debe ser un número entero, sin decimales.";
  if (!form.clave_sat?.trim()) return "La clave SAT es obligatoria.";
  if (!form.clave_unidad_sat?.trim()) return "La clave de unidad SAT es obligatoria.";
  if (form.iva_porcentaje === "" || Number(form.iva_porcentaje) < 0) return "El IVA debe ser válido.";

  const supplierIds = (form.proveedores || [])
    .map((supplier) => supplier.proveedor_id)
    .filter(Boolean);

  if (new Set(supplierIds).size !== supplierIds.length) {
    return "No puedes agregar el mismo proveedor más de una vez.";
  }

  const mainSuppliers = (form.proveedores || []).filter(
    (supplier) => supplier.es_principal,
  );

  if (mainSuppliers.length > 1) {
    return "Solo puede haber un proveedor principal.";
  }

  return null;
}