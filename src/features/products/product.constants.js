export const ITEMS_PER_PAGE = 10;

export const CATEGORY_OPTIONS = [
  { value: "limpieza", label: "Limpieza" },
  { value: "lavanderia", label: "Lavandería" },
  { value: "higiene_personal", label: "Higiene personal" },
  { value: "cocina", label: "Cocina" },
  { value: "desechables", label: "Desechables" },
  { value: "papeleria", label: "Papelería" },
  { value: "mascotas", label: "Mascotas" },
  { value: "alimentos", label: "Alimentos" },
  { value: "bebidas", label: "Bebidas" },
  { value: "otros", label: "Otros" },
];

export const UNIT_OPTIONS = [
  { value: "pieza", label: "Pieza", clave_unidad_sat: "H87" },
  { value: "caja", label: "Caja", clave_unidad_sat: "XBX" },
  { value: "paquete", label: "Paquete", clave_unidad_sat: "XPK" },
  { value: "bolsa", label: "Bolsa", clave_unidad_sat: "XBG" },
  { value: "botella", label: "Botella", clave_unidad_sat: "XBO" },
  { value: "galon", label: "Galón", clave_unidad_sat: "A76" },
  { value: "litro", label: "Litro", clave_unidad_sat: "LTR" },
  { value: "mililitro", label: "Mililitro", clave_unidad_sat: "MLT" },
  { value: "kilogramo", label: "Kilogramo", clave_unidad_sat: "KGM" },
  { value: "gramo", label: "Gramo", clave_unidad_sat: "GRM" },
  { value: "metro", label: "Metro", clave_unidad_sat: "MTR" },
  { value: "rollo", label: "Rollo", clave_unidad_sat: "XRO" },
  { value: "bidon", label: "Bidón", clave_unidad_sat: "XBI" },
];

export const SAT_PRODUCT_SUGGESTIONS = [
  { clave_sat: "47131800", label: "Productos de limpieza" },
  { clave_sat: "53131608", label: "Jabones" },
  { clave_sat: "47121701", label: "Bolsas para basura" },
  { clave_sat: "14111703", label: "Toallas de papel" },
  { clave_sat: "47131618", label: "Escobas / trapeadores / fibras" },
  { clave_sat: "46181504", label: "Guantes de protección" },
  { clave_sat: "42131713", label: "Cubrebocas / mascarillas" },
  { clave_sat: "12141901", label: "Ácido muriático / químicos" },
];

export const SAT_PRODUCT_OPTIONS = [
  { clave: "47131800", descripcion: "Productos de limpieza" },
  { clave: "53131608", descripcion: "Jabones" },
  { clave: "47121701", descripcion: "Bolsas para basura" },
  { clave: "14111703", descripcion: "Toallas de papel" },
  { clave: "47131618", descripcion: "Escobas, trapeadores y fibras" },
  { clave: "46181504", descripcion: "Guantes de protección" },
  { clave: "42131713", descripcion: "Cubrebocas / mascarillas" },
  { clave: "12141901", descripcion: "Ácido muriático / químicos" },
];

export const SAT_UNIT_OPTIONS = [
  { clave: "H87", descripcion: "Pieza" },
  { clave: "XBX", descripcion: "Caja" },
  { clave: "XPK", descripcion: "Paquete" },
  { clave: "XBG", descripcion: "Bolsa" },
  { clave: "XBO", descripcion: "Botella" },
  { clave: "LTR", descripcion: "Litro" },
  { clave: "MLT", descripcion: "Mililitro" },
  { clave: "KGM", descripcion: "Kilogramo" },
  { clave: "GRM", descripcion: "Gramo" },
  { clave: "MTR", descripcion: "Metro" },
  { clave: "XRO", descripcion: "Rollo" },
];

export const INITIAL_PRODUCT_FORM = {
  id: "",
  nombre: "",
  descripcion: "",
  precio: "",
  imagen: "",
  imagenFile: null,

  habilitado: true,

  precio_compra: "",
  precio_utilidad: "",
  precio: "",

  stock: "",
  cantidad_caja: "",

  categoria: "",
  unidad: "",
  codigo: "",

  clave_sat: "",
  clave_unidad_sat: "",
  iva_porcentaje: "16",
};