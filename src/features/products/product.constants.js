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
  { value: "pieza", label: "Pieza" },
  { value: "caja", label: "Caja" },
  { value: "paquete", label: "Paquete" },
  { value: "bolsa", label: "Bolsa" },
  { value: "botella", label: "Botella" },
  { value: "galon", label: "Galón" },
  { value: "litro", label: "Litro" },
  { value: "mililitro", label: "Mililitro" },
  { value: "kilogramo", label: "Kilogramo" },
  { value: "gramo", label: "Gramo" },
  { value: "metro", label: "Metro" },
  { value: "rollo", label: "Rollo" },
  { value: "bidon", label: "Bidón" },
];

export const INITIAL_PRODUCT_FORM = {
  id: "",
  nombre: "",
  descripcion: "",
  precio: "",
  imagen: "",
  imagenFile: null,
  disponibilidad: true,
  cantidad: "",
  cantidad_caja: "",
  precio_compra: "",
  precio_utilidad: "",
  habilitado: true,
  categoria: "",
  unidad: "",
  codigo: "",
};