import { DEFAULT_COLUMNS, DEFAULT_ROWS } from '../excelModule/excel.constants';
import { createEmptyGrid, displayCell } from '../excelModule/excel.helpers';
import { PRODUCT_CHANGE_COLUMNS } from '../playground.constants';

export function makeProductChangesGrid(products = []) {
  const grid = createEmptyGrid(Math.max(DEFAULT_ROWS, products.length + 25), Math.max(DEFAULT_COLUMNS, PRODUCT_CHANGE_COLUMNS.length));

  PRODUCT_CHANGE_COLUMNS.forEach((label, index) => {
    grid[0][index] = { value: label, formula: '', style: { bold: true, bgColor: '#f1f5f9' } };
  });

  products.forEach((product, index) => {
    const row = index + 1;
    const values = [
      product.id || '',
      product.codigo || '',
      product.nombre || '',
      product.precio ?? '',
      product.precio_compra ?? '',
      '',
      product.descripcion || '',
      product.categoria || '',
      product.unidad || '',
      product.cantidad_caja ?? '',
      product.habilitado === false ? 'No' : 'Sí',
      '',
    ];

    values.forEach((value, colIndex) => {
      grid[row][colIndex] = { value: String(value), formula: '', style: {} };
    });

    const price = Number(product.precio || 0);
    const cost = Number(product.precio_compra || 0);
    const utilidad = price > 0 ? (((price - cost) / price) * 100).toFixed(2) : '';
    grid[row][5] = { value: utilidad, formula: '', style: { bgColor: '#f8fafc' } };
  });

  return grid;
}

export function normalizeHeader(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

export function cellValue(cell = {}, grid = [], context = {}) {
  if (cell?.formula) return displayCell(cell, grid, context);
  return cell?.value ?? '';
}

export function isApplyTruthy(value) {
  const clean = String(value ?? '').trim().toLowerCase();
  return ['si', 'sí', 'yes', 'true', '1', 'x', 'aplicar'].includes(clean);
}

export function toNullableNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(String(value).replace(/[$,]/g, '').trim());
  return Number.isFinite(number) ? number : null;
}

export function toNullableBoolean(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const clean = String(value).trim().toLowerCase();
  if (['si', 'sí', 'yes', 'true', '1', 'activo', 'habilitado'].includes(clean)) return true;
  if (['no', 'false', '0', 'inactivo', 'deshabilitado'].includes(clean)) return false;
  return null;
}

export function getProductIdsFromGrid(grid = []) {
  if (!grid.length) return [];

  const headers = (grid[0] || []).map((cell) => normalizeHeader(cell?.value || cell?.formula));
  const indexOf = (...names) => names.map(normalizeHeader).map((name) => headers.indexOf(name)).find((index) => index >= 0);
  const idIndex = indexOf('Producto ID', 'producto_id', 'id');

  if (idIndex === undefined || idIndex < 0) return [];

  return Array.from(
    new Set(
      grid
        .slice(1)
        .map((row) => String(cellValue(row?.[idIndex], grid, {}) ?? '').trim())
        .filter(Boolean),
    ),
  );
}



export function isProductSheetLike(sheet = {}, grid = []) {
  const sheetName = String(sheet?.name || sheet?.nombre || '').trim().toLowerCase();
  const headers = (grid?.[0] || []).map((cell) => normalizeHeader(cell?.value || cell?.formula));

  const hasProductHeaders =
    headers.includes('codigo') ||
    headers.includes('producto_id') ||
    (headers.includes('nombre') && (headers.includes('precio') || headers.includes('precio_compra') || headers.includes('costo')));

  return sheetName.includes('producto') || hasProductHeaders;
}

function getHeaderIndexes(grid = []) {
  const headers = (grid?.[0] || []).map((cell) => normalizeHeader(cell?.value || cell?.formula));
  const indexOf = (...names) =>
    names
      .map(normalizeHeader)
      .map((name) => headers.indexOf(name))
      .find((index) => index >= 0);

  return {
    id: indexOf('Producto ID', 'producto_id', 'id'),
    codigo: indexOf('Código', 'codigo'),
    nombre: indexOf('Nombre', 'nombre', 'Producto', 'producto'),
    precio: indexOf('Precio', 'precio'),
    costo: indexOf('Costo', 'precio_compra', 'precio compra', 'costo'),
    utilidad: indexOf('Utilidad %', 'utilidad', 'utilidad_%', 'margen', 'margen_%'),
    descripcion: indexOf('Descripción', 'descripcion'),
    categoria: indexOf('Categoría', 'categoria'),
    unidad: indexOf('Unidad', 'unidad'),
    caja: indexOf('Cantidad caja', 'cantidad_caja', 'cantidad por caja', 'cantidad'),
    habilitado: indexOf('Habilitado', 'habilitado'),
  };
}

function hasIndex(index) {
  return index !== undefined && index !== null && index >= 0;
}

function productFieldValue(product = {}, key) {
  if (key === 'id') return product.id || '';
  if (key === 'codigo') return product.codigo || '';
  if (key === 'nombre') return product.nombre || '';
  if (key === 'precio') return product.precio ?? '';
  if (key === 'costo') return product.precio_compra ?? '';
  if (key === 'descripcion') return product.descripcion || '';
  if (key === 'categoria') return product.categoria || '';
  if (key === 'unidad') return product.unidad || '';
  if (key === 'caja') return product.cantidad_caja ?? '';
  if (key === 'habilitado') return product.habilitado === false ? 'No' : 'Sí';
  if (key === 'utilidad') {
    const price = Number(product.precio || 0);
    const cost = Number(product.precio_compra || 0);
    return price > 0 ? (((price - cost) / price) * 100).toFixed(2) : '';
  }
  return '';
}

function cloneCell(cell = {}) {
  return {
    value: cell?.value ?? '',
    formula: cell?.formula ?? '',
    style: { ...(cell?.style || {}) },
  };
}

function makeEmptyCell() {
  return { value: '', formula: '', style: {} };
}

export function reconcileProductSheetGrid(grid = [], products = []) {
  if (!Array.isArray(products) || !products.length || !Array.isArray(grid) || !grid.length) return grid;

  const idx = getHeaderIndexes(grid);
  const hasIdentifier = hasIndex(idx.id) || hasIndex(idx.codigo);
  const hasProductName = hasIndex(idx.nombre);

  if (!hasIdentifier && !hasProductName) return grid;

  const sourceIndexes = new Set(
    Object.values(idx).filter((index) => hasIndex(index)),
  );

  const maxCols = Math.max(
    DEFAULT_COLUMNS,
    grid[0]?.length || 0,
    ...grid.map((row) => row?.length || 0),
  );

  const existingRowsById = new Map();
  const existingRowsByCode = new Map();
  const existingRowsByName = new Map();

  grid.slice(1).forEach((row) => {
    const id = hasIndex(idx.id) ? String(cellValue(row?.[idx.id], grid, {}) || '').trim() : '';
    const code = hasIndex(idx.codigo) ? String(cellValue(row?.[idx.codigo], grid, {}) || '').trim() : '';
    const name = hasIndex(idx.nombre) ? String(cellValue(row?.[idx.nombre], grid, {}) || '').trim().toLowerCase() : '';

    if (id && !existingRowsById.has(id)) existingRowsById.set(id, row);
    if (code && !existingRowsByCode.has(code)) existingRowsByCode.set(code, row);
    if (name && !existingRowsByName.has(name)) existingRowsByName.set(name, row);
  });

  const minRows = Math.max(DEFAULT_ROWS, products.length + 25);
  const nextGrid = createEmptyGrid(minRows, maxCols);

  for (let col = 0; col < maxCols; col += 1) {
    nextGrid[0][col] = cloneCell(grid[0]?.[col] || makeEmptyCell());
  }

  products.forEach((product, index) => {
    const targetRow = index + 1;
    const existingRow =
      existingRowsById.get(String(product.id || '').trim()) ||
      existingRowsByCode.get(String(product.codigo || '').trim()) ||
      existingRowsByName.get(String(product.nombre || '').trim().toLowerCase()) ||
      [];

    for (let col = 0; col < maxCols; col += 1) {
      nextGrid[targetRow][col] = sourceIndexes.has(col)
        ? makeEmptyCell()
        : cloneCell(existingRow[col] || makeEmptyCell());
    }

    const sourceMap = {
      id: idx.id,
      codigo: idx.codigo,
      nombre: idx.nombre,
      precio: idx.precio,
      costo: idx.costo,
      utilidad: idx.utilidad,
      descripcion: idx.descripcion,
      categoria: idx.categoria,
      unidad: idx.unidad,
      caja: idx.caja,
      habilitado: idx.habilitado,
    };

    Object.entries(sourceMap).forEach(([key, colIndex]) => {
      if (!hasIndex(colIndex)) return;
      const value = productFieldValue(product, key);
      nextGrid[targetRow][colIndex] = {
        value: value === null || value === undefined ? '' : String(value),
        formula: '',
        style: key === 'utilidad' ? { bgColor: '#f8fafc' } : {},
      };
    });
  });

  return nextGrid;
}

function normalizeComparableText(value) {
  return String(value ?? '').trim();
}

function normalizeComparableNumber(value) {
  const number = toNullableNumber(value);
  return number === null ? null : Number(number.toFixed(6));
}

function normalizeComparableBoolean(value) {
  return toNullableBoolean(value);
}

function productValue(product = {}, field) {
  if (!product) return '';
  return product[field];
}

export function buildProductChangesFromGrid(grid = [], context = {}, productsById = {}) {
  if (!grid.length) return [];

  const headers = (grid[0] || []).map((cell) => normalizeHeader(cell?.value || cell?.formula));
  const indexOf = (...names) => names.map(normalizeHeader).map((name) => headers.indexOf(name)).find((index) => index >= 0);

  const idx = {
    id: indexOf('Producto ID', 'producto_id', 'id'),
    codigo: indexOf('Código', 'codigo'),
    nombre: indexOf('Nombre', 'nombre', 'Producto', 'producto', 'Nombre actual', 'nombre_actual'),
    precio: indexOf('Precio', 'precio', 'Precio actual', 'precio_actual'),
    costo: indexOf('Costo', 'precio_compra', 'precio compra', 'Costo actual', 'precio_compra_actual', 'costo_actual'),
    utilidad: indexOf('Utilidad %', 'utilidad', 'utilidad_%', 'margen', 'margen_%'),
    descripcion: indexOf('Descripción', 'descripcion', 'Descripción actual', 'descripcion_actual'),
    categoria: indexOf('Categoría', 'categoria', 'Categoría actual', 'categoria_actual'),
    unidad: indexOf('Unidad', 'unidad', 'Unidad actual', 'unidad_actual'),
    caja: indexOf('Cantidad caja', 'cantidad_caja', 'cantidad por caja', 'cantidad', 'Cantidad caja actual', 'cantidad_caja_actual'),
    habilitado: indexOf('Habilitado', 'habilitado', 'Habilitado actual', 'habilitado_actual'),
    nombreNuevo: indexOf('Nuevo nombre', 'nuevo_nombre'),
    precioNuevo: indexOf('Nuevo precio', 'nuevo_precio'),
    costoNuevo: indexOf('Nuevo costo', 'nuevo_costo', 'nuevo_precio_compra'),
    descripcionNueva: indexOf('Nueva descripción', 'nueva_descripcion'),
    categoriaNueva: indexOf('Nueva categoría', 'nueva_categoria'),
    unidadNueva: indexOf('Nueva unidad', 'nueva_unidad'),
    cajaNueva: indexOf('Nueva cantidad caja', 'nueva_cantidad_caja'),
    habilitadoNuevo: indexOf('Nuevo habilitado', 'nuevo_habilitado'),
    aplicar: indexOf('Aplicar', 'apply'),
    estado: indexOf('Estado', 'status'),
  };

  const hasIdColumn = idx.id !== undefined && idx.id >= 0;
  const get = (row, colIndex) => (colIndex === undefined || colIndex < 0 ? '' : cellValue(row[colIndex], grid, context));
  const changes = [];

  function preferredIndex(primary, fallback) {
    return primary !== undefined && primary >= 0 ? primary : fallback;
  }

  grid.slice(1).forEach((row) => {
    const productoId = idx.id === undefined || idx.id < 0 ? '' : String(get(row, idx.id)).trim();
    const dbProduct = productoId ? productsById[productoId] || null : null;

    const applyValue = idx.aplicar === undefined || idx.aplicar < 0 ? '' : String(get(row, idx.aplicar)).trim().toLowerCase();
    const statusValue = idx.estado === undefined || idx.estado < 0 ? '' : String(get(row, idx.estado)).trim().toLowerCase();
    const isExplicitlySkipped = ['no', 'false', '0', 'omitido', 'omitir', 'skip'].includes(applyValue) || ['no', 'false', '0', 'omitido', 'omitir', 'skip'].includes(statusValue);
    if (isExplicitlySkipped) return;

    const codigo = normalizeComparableText(get(row, idx.codigo));
    const nombreFromRow = normalizeComparableText(get(row, preferredIndex(idx.nombre, idx.nombreNuevo)));
    const displayName = dbProduct?.nombre || nombreFromRow || codigo || 'Producto nuevo';
    const fields = {};

    function addText(payload, field, colIndex) {
      if (colIndex === undefined || colIndex < 0) return;
      const before = normalizeComparableText(productValue(dbProduct, field));
      const after = normalizeComparableText(get(row, colIndex));
      if (dbProduct && after === before) return;
      if (!dbProduct && !after) return;
      payload[field] = after;
      fields[field] = { before: dbProduct ? before : '-', after };
    }

    function addNumber(payload, field, colIndex) {
      if (colIndex === undefined || colIndex < 0) return;
      const before = normalizeComparableNumber(productValue(dbProduct, field));
      const after = normalizeComparableNumber(get(row, colIndex));
      if (dbProduct && after === before) return;
      if (after === null && before === null) return;
      if (!dbProduct && after === null) return;
      payload[field] = after;
      fields[field] = { before: dbProduct ? before : '-', after };
    }

    function addBoolean(payload, field, colIndex) {
      if (colIndex === undefined || colIndex < 0) return;
      const before = normalizeComparableBoolean(productValue(dbProduct, field));
      const after = normalizeComparableBoolean(get(row, colIndex));
      if (dbProduct && (after === null || after === before)) return;
      if (!dbProduct && after === null) return;
      payload[field] = after;
      fields[field] = { before: dbProduct ? before : '-', after };
    }

    if (dbProduct) {
      const payload = { producto_id: productoId };
      addText(payload, 'nombre', preferredIndex(idx.nombre, idx.nombreNuevo));
      addNumber(payload, 'precio', preferredIndex(idx.precio, idx.precioNuevo));
      addNumber(payload, 'precio_compra', preferredIndex(idx.costo, idx.costoNuevo));
      addText(payload, 'descripcion', preferredIndex(idx.descripcion, idx.descripcionNueva));
      addText(payload, 'categoria', preferredIndex(idx.categoria, idx.categoriaNueva));
      addText(payload, 'unidad', preferredIndex(idx.unidad, idx.unidadNueva));
      addNumber(payload, 'cantidad_caja', preferredIndex(idx.caja, idx.cajaNueva));
      addBoolean(payload, 'habilitado', preferredIndex(idx.habilitado, idx.habilitadoNuevo));

      if (Object.keys(fields).length) {
        changes.push({
          ...payload,
          action: 'update',
          display_codigo: dbProduct.codigo || codigo,
          display_name: displayName,
          fields,
        });
      }
      return;
    }

    const wantsCreate = hasIdColumn || ['crear', 'nuevo', 'create'].includes(statusValue) || isApplyTruthy(applyValue);
    const hasNewProductData = [codigo, nombreFromRow, get(row, idx.descripcion), get(row, idx.precio), get(row, idx.costo), get(row, idx.caja)]
      .some((value) => String(value ?? '').trim() !== '');

    if (!wantsCreate || !hasNewProductData) return;

    if (!nombreFromRow) {
      changes.push({
        action: 'invalid',
        display_codigo: codigo,
        display_name: codigo || 'Producto sin nombre',
        fields: { nombre: { before: '-', after: 'Falta nombre para crear producto' } },
      });
      return;
    }

    const payload = { action: 'create', nombre: nombreFromRow };
    if (codigo) payload.codigo = codigo;
    fields.nombre = { before: '-', after: nombreFromRow };
    if (codigo) fields.codigo = { before: '-', after: codigo };

    addNumber(payload, 'precio', preferredIndex(idx.precio, idx.precioNuevo));
    addNumber(payload, 'precio_compra', preferredIndex(idx.costo, idx.costoNuevo));
    addText(payload, 'descripcion', preferredIndex(idx.descripcion, idx.descripcionNueva));
    addText(payload, 'categoria', preferredIndex(idx.categoria, idx.categoriaNueva));
    addText(payload, 'unidad', preferredIndex(idx.unidad, idx.unidadNueva));
    addNumber(payload, 'cantidad_caja', preferredIndex(idx.caja, idx.cajaNueva));
    addBoolean(payload, 'habilitado', preferredIndex(idx.habilitado, idx.habilitadoNuevo));

    if (payload.habilitado === undefined) {
      payload.habilitado = true;
      fields.habilitado = { before: '-', after: true };
    }

    changes.push({
      ...payload,
      display_codigo: codigo,
      display_name: nombreFromRow,
      fields,
    });
  });

  return changes;
}
