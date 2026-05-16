import { DEFAULT_COLUMNS, DEFAULT_ROWS } from './playground.constants';

export function columnIndexToLetter(index) {
  let value = Number(index) + 1;
  let letters = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }

  return letters || 'A';
}

export function makeCellId(rowIndex, colIndex) {
  return `${columnIndexToLetter(colIndex)}${Number(rowIndex) + 1}`;
}

export function parseCellId(cellId) {
  const match = String(cellId || '').toUpperCase().match(/^\$?([A-Z]+)\$?(\d+)$/);
  if (!match) return null;

  const letters = match[1];
  const row = Number(match[2]) - 1;
  let col = 0;

  for (let i = 0; i < letters.length; i += 1) {
    col = col * 26 + letters.charCodeAt(i) - 64;
  }

  return { row, col: col - 1 };
}

export function createEmptyGrid(rows = DEFAULT_ROWS, cols = DEFAULT_COLUMNS) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ value: '', formula: '', style: {} })),
  );
}

export function gridToCells(sheetId, grid) {
  const cells = [];

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const hasStyle = cell?.style && Object.keys(cell.style).length > 0;
      if (!cell?.value && !cell?.formula && !hasStyle) return;

      cells.push({
        sheet_id: sheetId,
        row_index: rowIndex,
        col_index: colIndex,
        value: cell.value ?? '',
        formula: cell.formula ?? '',
        style: cell.style || {},
      });
    });
  });

  return cells;
}

export function cellsToGrid(cells = [], rows = DEFAULT_ROWS, cols = DEFAULT_COLUMNS) {
  const maxRow = cells.reduce((max, cell) => Math.max(max, Number(cell.row_index || 0)), 0);
  const maxCol = cells.reduce((max, cell) => Math.max(max, Number(cell.col_index || 0)), 0);
  const grid = createEmptyGrid(Math.max(rows, maxRow + 1), Math.max(cols, maxCol + 1));

  cells.forEach((cell) => {
    const row = Number(cell.row_index);
    const col = Number(cell.col_index);

    if (!grid[row] || !grid[row][col]) return;

    grid[row][col] = {
      value: cell.value ?? '',
      formula: cell.formula ?? '',
      style: cell.style || {},
    };
  });

  return grid;
}

export function ensureGridSize(grid = [], minRows = DEFAULT_ROWS, minCols = DEFAULT_COLUMNS) {
  const currentRows = grid.length;
  const currentCols = Math.max(grid[0]?.length || 0, minCols);
  const rows = Math.max(currentRows, minRows);
  const cols = Math.max(currentCols, minCols);

  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => ({
      value: grid[rowIndex]?.[colIndex]?.value ?? '',
      formula: grid[rowIndex]?.[colIndex]?.formula ?? '',
      style: grid[rowIndex]?.[colIndex]?.style || {},
    })),
  );
}

export function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const clean = String(value).replace(/[$,]/g, '').trim();
  const number = Number(clean);
  return Number.isFinite(number) ? number : 0;
}

function normalizeSheetName(name = '') {
  return String(name)
    .trim()
    .replace(/^'/, '')
    .replace(/'$/, '')
    .toLowerCase();
}

function extractSheetName(sheetPrefix = '') {
  if (!sheetPrefix) return '';
  return sheetPrefix.replace(/!$/, '').replace(/^'/, '').replace(/'$/, '').trim();
}

function getContextGrid(context, sheetPrefix) {
  if (!context || !sheetPrefix) return context?.activeGrid || null;

  const sheetName = normalizeSheetName(extractSheetName(sheetPrefix));
  const foundSheet = (context.sheets || []).find(
    (sheet) => normalizeSheetName(sheet.name || sheet.nombre) === sheetName,
  );

  if (!foundSheet) return null;
  return context.gridsBySheet?.[foundSheet.id] || null;
}

function getCellRawValue(grid, cellId, context, sheetPrefix = '', visited = new Set()) {
  const sourceGrid = sheetPrefix ? getContextGrid(context, sheetPrefix) : grid;
  const parsed = parseCellId(cellId);
  if (!parsed || !sourceGrid) return 0;

  const key = `${sheetPrefix || context?.activeSheetId || 'active'}:${String(cellId).toUpperCase()}`;
  if (visited.has(key)) return '#CYCLE';

  const cell = sourceGrid[parsed.row]?.[parsed.col];
  if (!cell) return 0;

  if (cell.formula) {
    visited.add(key);
    return evaluateFormula(cell.formula, sourceGrid, context, visited);
  }

  return cell.value;
}

function getRangeValues(grid, startId, endId, context, sheetPrefix = '', visited = new Set()) {
  const sourceGrid = sheetPrefix ? getContextGrid(context, sheetPrefix) : grid;
  const start = parseCellId(startId);
  const end = parseCellId(endId);
  if (!start || !end || !sourceGrid) return [];

  const values = [];
  const fromRow = Math.min(start.row, end.row);
  const toRow = Math.max(start.row, end.row);
  const fromCol = Math.min(start.col, end.col);
  const toCol = Math.max(start.col, end.col);

  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      values.push(getCellRawValue(sourceGrid, makeCellId(row, col), context, sheetPrefix, visited));
    }
  }

  return values;
}

function replaceRangeFunctions(expression, grid, context, visited) {
  const rangeFunctionPattern = /\b(SUM|AVG)\(((?:'[^']+'|[A-Z0-9_ÁÉÍÓÚÑ ]+)!?)?(\$?[A-Z]+\$?\d+):(\$?[A-Z]+\$?\d+)\)/gi;

  return expression.replace(rangeFunctionPattern, (_, fn, sheetPrefix = '', startId, endId) => {
    const values = getRangeValues(grid, startId, endId, context, sheetPrefix, visited).map(toNumber);
    if (!values.length) return '0';

    const total = values.reduce((sum, value) => sum + value, 0);
    if (String(fn).toUpperCase() === 'AVG') return String(total / values.length);
    return String(total);
  });
}

export function evaluateFormula(formula, grid, context = {}, visited = new Set()) {
  if (!formula || !String(formula).startsWith('=')) return formula || '';

  let expression = String(formula).slice(1).trim();
  if (!expression) return '';

  const singleReferenceMatch = expression.match(/^((?:'[^']+'|[A-Z0-9_ÁÉÍÓÚÑ ]+)!?)?(\$?[A-Z]+\$?\d+)$/i);
  if (singleReferenceMatch) {
    const [, sheetPrefix = '', cellId] = singleReferenceMatch;
    const value = getCellRawValue(grid, cellId, context, sheetPrefix, visited);
    return value === null || value === undefined ? '' : String(value);
  }

  expression = replaceRangeFunctions(expression, grid, context, visited);

  const cellReferencePattern = /((?:'[^']+'|[A-Z0-9_ÁÉÍÓÚÑ ]+)!?)?(\$?[A-Z]+\$?\d+)/gi;
  const replaced = expression.replace(cellReferencePattern, (fullMatch, sheetPrefix = '', cellId) => {
    // Evita tocar texto que no sea referencia. Las funciones ya se resolvieron arriba.
    if (/^(SUM|AVG)$/i.test(fullMatch)) return fullMatch;

    const value = getCellRawValue(grid, cellId, context, sheetPrefix, visited);
    return toNumber(value).toString();
  });

  if (!/^[0-9+\-*/().\s]+$/.test(replaced)) return '#ERROR';

  try {
    // Evaluador limitado a números y operadores permitidos por la validación anterior.
    // eslint-disable-next-line no-new-func
    const result = Function(`return (${replaced})`)();
    return Number.isFinite(result) ? String(result) : '#ERROR';
  } catch {
    return '#ERROR';
  }
}

export function displayCell(cell, grid, context = {}) {
  if (cell?.formula) return evaluateFormula(cell.formula, grid, context);
  return cell?.value ?? '';
}

export function adjustFormulaReferences(formula, rowDelta = 0, colDelta = 0) {
  if (!formula || !String(formula).startsWith('=')) return formula || '';

  const cellReferencePattern = /((?:'[^']+'|[A-Z0-9_ÁÉÍÓÚÑ ]+)!?)?(\$?)([A-Z]+)(\$?)(\d+)/gi;

  return String(formula).replace(
    cellReferencePattern,
    (match, sheetPrefix = '', colAbsolute = '', letters = '', rowAbsolute = '', rowNumber = '') => {
      const parsed = parseCellId(`${letters}${rowNumber}`);
      if (!parsed) return match;

      const nextCol = colAbsolute ? parsed.col : parsed.col + colDelta;
      const nextRow = rowAbsolute ? parsed.row : parsed.row + rowDelta;

      if (nextCol < 0 || nextRow < 0) return match;

      return `${sheetPrefix || ''}${colAbsolute}${columnIndexToLetter(nextCol)}${rowAbsolute}${nextRow + 1}`;
    },
  );
}

export function makeWorkbookContext({ sheets = [], gridsBySheet = {}, activeSheetId = null, activeGrid = null } = {}) {
  return {
    sheets,
    gridsBySheet,
    activeSheetId,
    activeGrid: activeGrid || (activeSheetId ? gridsBySheet[activeSheetId] : null),
  };
}

export function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}
