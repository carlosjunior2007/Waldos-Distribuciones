export const DEFAULT_COLUMNS = 26;
export const DEFAULT_ROWS = 120;
export const PRODUCT_IMPORT_EXTRA_ROWS = 25;

export const COLUMN_LETTERS = Array.from({ length: 26 }, (_, index) =>
  String.fromCharCode(65 + index),
);

export const DEFAULT_SHEET_NAME = 'Hoja 1';
export const PRODUCTS_SHEET_NAME = 'Productos';

export const STARTER_COLUMNS = [
  'Código',
  'Producto',
  'Precio',
  'Costo',
  'Cantidad',
  'Importe',
  'Ganancia',
  'Notas',
];

export const PLAYGROUND_STATUS = {
  PRIVATE: 'Privado',
  PUBLIC: 'Compartido',
};

export const PRESENCE_ANIMALS = [
  'Oso',
  'Zorro',
  'Mapache',
  'Lobo',
  'Búho',
  'Tigre',
  'Panda',
  'Halcon',
  'Nutria',
  'Delfín',
];

export const PRESENCE_NAMES = [
  'Juan',
  'Milo',
  'Nico',
  'Luna',
  'Kira',
  'Tobi',
  'Leo',
  'Mora',
  'Sofi',
  'Roco',
];

export const PRODUCT_CHANGE_COLUMNS = [
  'Producto ID',
  'Código',
  'Nombre',
  'Precio',
  'Costo',
  'Descripción',
  'Categoría',
  'Unidad',
  'Cantidad caja',
  'Habilitado',
  'Estado',
];
