import { DEFAULT_COLUMNS, DEFAULT_ROWS } from './excel.constants';
import {
  adjustFormulaReferences,
  createEmptyGrid,
  displayCell,
} from './excel.helpers';

export function getCellNumber(cell, grid, context) {
  const value = cell?.formula ? displayCell(cell, grid, context) : cell?.value;
  const number = Number(String(value ?? '').replace(/[$,]/g, '').trim());
  return Number.isFinite(number) ? number : null;
}

export function getRangeCells(grid, range) {
  const cells = [];

  for (let row = range.startRow; row <= range.endRow; row += 1) {
    for (let col = range.startCol; col <= range.endCol; col += 1) {
      cells.push({ row, col, cell: grid[row]?.[col] || { value: '', formula: '' } });
    }
  }

  return cells;
}

export function makeGridFromObjects(rows = [], fields = []) {
  const safeFields = fields.length ? fields : Array.from(new Set(rows.flatMap((row) => Object.keys(row || {}))));
  const grid = createEmptyGrid(Math.max(DEFAULT_ROWS, rows.length + 25), Math.max(DEFAULT_COLUMNS, safeFields.length));

  safeFields.forEach((field, index) => {
    grid[0][index] = { value: field, formula: '', style: { bold: true, bgColor: '#f1f5f9' } };
  });

  rows.forEach((row, rowIndex) => {
    safeFields.forEach((field, colIndex) => {
      const value = row?.[field];
      grid[rowIndex + 1][colIndex] = {
        value: value === null || value === undefined ? '' : String(value),
        formula: '',
        style: {},
      };
    });
  });

  return grid;
}

export function buildFillValue({ sourceRange, targetRow, targetCol, sourceGrid, context }) {
  const rangeHeight = sourceRange.endRow - sourceRange.startRow + 1;
  const rangeWidth = sourceRange.endCol - sourceRange.startCol + 1;
  const rowOffset = targetRow - sourceRange.startRow;
  const colOffset = targetCol - sourceRange.startCol;

  if (rangeWidth === 1 && rangeHeight >= 2 && targetRow > sourceRange.endRow) {
    const sourceCells = getRangeCells(sourceGrid, sourceRange);
    const numbers = sourceCells.map(({ cell }) => getCellNumber(cell, sourceGrid, context));
    const allNumeric = numbers.every((value) => value !== null);

    if (allNumeric) {
      const step = numbers[numbers.length - 1] - numbers[numbers.length - 2];
      const extraIndex = targetRow - sourceRange.endRow;
      return {
        value: String(numbers[numbers.length - 1] + step * extraIndex),
        formula: '',
      };
    }
  }

  if (rangeHeight === 1 && rangeWidth >= 2 && targetCol > sourceRange.endCol) {
    const sourceCells = getRangeCells(sourceGrid, sourceRange);
    const numbers = sourceCells.map(({ cell }) => getCellNumber(cell, sourceGrid, context));
    const allNumeric = numbers.every((value) => value !== null);

    if (allNumeric) {
      const step = numbers[numbers.length - 1] - numbers[numbers.length - 2];
      const extraIndex = targetCol - sourceRange.endCol;
      return {
        value: String(numbers[numbers.length - 1] + step * extraIndex),
        formula: '',
      };
    }
  }

  const sourceRow = sourceRange.startRow + Math.abs(rowOffset % rangeHeight);
  const sourceCol = sourceRange.startCol + Math.abs(colOffset % rangeWidth);
  const source = sourceGrid[sourceRow]?.[sourceCol] || { value: '', formula: '' };
  const formulaRowDelta = targetRow - sourceRow;
  const formulaColDelta = targetCol - sourceCol;

  return {
    value: source.formula ? '' : source.value || '',
    formula: source.formula ? adjustFormulaReferences(source.formula, formulaRowDelta, formulaColDelta) : '',
    style: source.style || {},
  };
}
