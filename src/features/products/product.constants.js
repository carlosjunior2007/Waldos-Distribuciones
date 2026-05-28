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
  cantidad_caja: "",

  categoria: "",
  unidad: "",
  codigo: "",

  clave_sat: "",
  clave_unidad_sat: "",
  iva_porcentaje: "8",

  proveedores: [],
};