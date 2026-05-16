import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownRight } from 'lucide-react';
import { DEFAULT_COLUMNS } from '../excel.constants';
import { columnIndexToLetter, displayCell, getFormulaSuggestions, getGridDataBounds, makeCellId } from '../excel.helpers';

const DEFAULT_COLUMN_WIDTH = 104;
const DEFAULT_ROW_HEIGHT = 36;
const MIN_COLUMN_WIDTH = 64;
const MAX_COLUMN_WIDTH = 460;
const MIN_ROW_HEIGHT = 32;
const MAX_ROW_HEIGHT = 180;

function sameCell(a, b) {
  return a && b && a.rowIndex === b.rowIndex && a.colIndex === b.colIndex;
}

function normalizeRange(start, end) {
  if (!start || !end) return null;
  return {
    startRow: Math.min(start.rowIndex, end.rowIndex),
    endRow: Math.max(start.rowIndex, end.rowIndex),
    startCol: Math.min(start.colIndex, end.colIndex),
    endCol: Math.max(start.colIndex, end.colIndex),
  };
}

function isCellInRange(rowIndex, colIndex, range) {
  if (!range) return false;
  return rowIndex >= range.startRow && rowIndex <= range.endRow && colIndex >= range.startCol && colIndex <= range.endCol;
}

function isBottomRight(rowIndex, colIndex, range) {
  return Boolean(range && rowIndex === range.endRow && colIndex === range.endCol);
}

function hexToRgba(hex, opacity) {
  const clean = String(hex || '').replace('#', '').trim();
  if (!clean || clean.length !== 6) return hex || undefined;
  const alpha = opacity === '' || opacity === undefined || opacity === null ? 1 : Math.max(0, Math.min(1, Number(opacity)));
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) return hex || undefined;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCellStyle(cell = { style: {} }) {
  const style = cell.style || {};
  return {
    backgroundColor: style.bgColor ? hexToRgba(style.bgColor, style.bgOpacity ?? 1) : undefined,
    color: style.textColor ? hexToRgba(style.textColor, style.textOpacity ?? 1) : undefined,
    fontWeight: style.bold ? 800 : undefined,
    fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
    fontStyle: style.italic ? 'italic' : undefined,
    textDecoration: style.underline ? 'underline' : undefined,
    textAlign: style.textAlign || undefined,
    justifyContent: style.textAlign === 'center' ? 'center' : style.textAlign === 'right' ? 'flex-end' : style.textAlign === 'left' ? 'flex-start' : undefined,
  };
}

function isTypingKey(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (event.key.length !== 1) return false;
  return true;
}

function getSelectionText({ grid, range, workbookContext }) {
  if (!range) return '';
  const lines = [];

  for (let row = range.startRow; row <= range.endRow; row += 1) {
    const values = [];
    for (let col = range.startCol; col <= range.endCol; col += 1) {
      const cell = grid[row]?.[col] || { value: '', formula: '', style: {} };
      values.push(cell.formula || displayCell(cell, grid, workbookContext) || '');
    }
    lines.push(values.join('\t'));
  }

  return lines.join('\n');
}

function parseClipboardText(text = '', startCell) {
  const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = normalized.split('\n');
  if (rows[rows.length - 1] === '') rows.pop();

  const changes = [];
  rows.forEach((line, rowOffset) => {
    line.split('\t').forEach((value, colOffset) => {
      changes.push({
        rowIndex: startCell.rowIndex + rowOffset,
        colIndex: startCell.colIndex + colOffset,
        value,
      });
    });
  });

  return changes;
}

function makeClearChanges(range) {
  if (!range) return [];
  const changes = [];

  for (let row = range.startRow; row <= range.endRow; row += 1) {
    for (let col = range.startCol; col <= range.endCol; col += 1) {
      changes.push({ rowIndex: row, colIndex: col, value: '' });
    }
  }

  return changes;
}

function makeConstantChanges(range, value) {
  if (!range) return [];
  const changes = [];

  for (let row = range.startRow; row <= range.endRow; row += 1) {
    for (let col = range.startCol; col <= range.endCol; col += 1) {
      changes.push({ rowIndex: row, colIndex: col, value });
    }
  }

  return changes;
}

function makeFillDownChanges(grid, range) {
  if (!range || range.startRow === range.endRow) return [];
  const changes = [];

  for (let col = range.startCol; col <= range.endCol; col += 1) {
    const sourceCell = grid[range.startRow]?.[col] || { value: '', formula: '' };
    const value = sourceCell.formula || sourceCell.value || '';

    for (let row = range.startRow + 1; row <= range.endRow; row += 1) {
      changes.push({ rowIndex: row, colIndex: col, value });
    }
  }

  return changes;
}

function makeFillRightChanges(grid, range) {
  if (!range || range.startCol === range.endCol) return [];
  const changes = [];

  for (let row = range.startRow; row <= range.endRow; row += 1) {
    const sourceCell = grid[row]?.[range.startCol] || { value: '', formula: '' };
    const value = sourceCell.formula || sourceCell.value || '';

    for (let col = range.startCol + 1; col <= range.endCol; col += 1) {
      changes.push({ rowIndex: row, colIndex: col, value });
    }
  }

  return changes;
}

function makeFillUpChanges(grid, range) {
  if (!range || range.startRow === range.endRow) return [];
  const changes = [];

  for (let col = range.startCol; col <= range.endCol; col += 1) {
    const sourceCell = grid[range.endRow]?.[col] || { value: '', formula: '' };
    const value = sourceCell.formula || sourceCell.value || '';

    for (let row = range.startRow; row < range.endRow; row += 1) {
      changes.push({ rowIndex: row, colIndex: col, value });
    }
  }

  return changes;
}

function makeFillLeftChanges(grid, range) {
  if (!range || range.startCol === range.endCol) return [];
  const changes = [];

  for (let row = range.startRow; row <= range.endRow; row += 1) {
    const sourceCell = grid[row]?.[range.endCol] || { value: '', formula: '' };
    const value = sourceCell.formula || sourceCell.value || '';

    for (let col = range.startCol; col < range.endCol; col += 1) {
      changes.push({ rowIndex: row, colIndex: col, value });
    }
  }

  return changes;
}

function makeTransformChanges(grid, range, transform) {
  if (!range || typeof transform !== 'function') return [];
  const changes = [];

  for (let row = range.startRow; row <= range.endRow; row += 1) {
    for (let col = range.startCol; col <= range.endCol; col += 1) {
      const cell = grid[row]?.[col] || { value: '', formula: '' };
      const raw = cell.formula || cell.value || '';
      changes.push({ rowIndex: row, colIndex: col, value: transform(raw, cell, row, col) });
    }
  }

  return changes;
}

function makeSelectionFormulaChanges(grid, range, formulaName) {
  if (!range) return [];
  const changes = [];

  for (let row = range.startRow; row <= range.endRow; row += 1) {
    for (let col = range.startCol; col <= range.endCol; col += 1) {
      const targetCell = makeCellId(row, col);
      changes.push({ rowIndex: row, colIndex: col, value: `=${String(formulaName).toUpperCase()}(${targetCell})` });
    }
  }

  return changes;
}

function clearFormatStyle() {
  return {
    bold: false,
    italic: false,
    underline: false,
    bgColor: '',
    bgOpacity: 1,
    textColor: '',
    textOpacity: 1,
    fontSize: '',
  };
}

function makeFormulaSeed(formulaName) {
  const name = String(formulaName || '').toUpperCase();
  return `=${name}(`;
}


function getFormulaTokenInfo(value = '') {
  const text = String(value || '');
  if (!text.trim().startsWith('=')) return null;
  const match = text.match(/(.*(?:^|[=+\-*/^&,(;])\s*)([A-ZÁÉÍÓÚÑ._]*)$/i);
  if (!match) return null;
  return {
    prefix: match[1] || '=',
    token: match[2] || '',
  };
}

function applyFormulaSuggestion(value = '', suggestion) {
  if (!suggestion?.name) return value;
  const info = getFormulaTokenInfo(value);
  if (!info) return `=${suggestion.name}(`;
  return `${info.prefix}${suggestion.name}(`;
}

function shouldInsertOperatorBeforeReference(value = '') {
  const clean = String(value || '').trimEnd();
  if (!clean || clean === '=') return false;
  return !/[=+\-*/^&(:,;]$/.test(clean);
}

function appendFormulaReference(value = '', reference = '') {
  const cleanReference = String(reference || '').trim();
  if (!cleanReference) return value;
  const base = String(value || '=').trimEnd() || '=';
  return `${base}${shouldInsertOperatorBeforeReference(base) ? '+' : ''}${cleanReference}`;
}

function makeRangeLabel(start, end) {
  if (!start || !end) return '';
  const startLabel = makeCellId(start.rowIndex, start.colIndex);
  const endLabel = makeCellId(end.rowIndex, end.colIndex);
  return startLabel === endLabel ? startLabel : `${startLabel}:${endLabel}`;
}


function getAutoSumFormula(grid, rowIndex, colIndex) {
  let startRow = rowIndex - 1;
  while (startRow >= 0) {
    const cell = grid[startRow]?.[colIndex] || { value: '', formula: '' };
    const raw = cell.formula || cell.value || '';
    if (raw === '' || raw === null || raw === undefined) break;
    startRow -= 1;
  }
  const firstNumberRow = startRow + 1;

  if (firstNumberRow <= rowIndex - 1) {
    return `=SUM(${makeCellId(firstNumberRow, colIndex)}:${makeCellId(rowIndex - 1, colIndex)})`;
  }

  let startCol = colIndex - 1;
  while (startCol >= 0) {
    const cell = grid[rowIndex]?.[startCol] || { value: '', formula: '' };
    const raw = cell.formula || cell.value || '';
    if (raw === '' || raw === null || raw === undefined) break;
    startCol -= 1;
  }
  const firstNumberCol = startCol + 1;

  if (firstNumberCol <= colIndex - 1) {
    return `=SUM(${makeCellId(rowIndex, firstNumberCol)}:${makeCellId(rowIndex, colIndex - 1)})`;
  }

  return '=SUM(';
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function ExcelGrid({
  grid,
  sheetId,
  sheetName,
  onChange,
  onBulkChange,
  onFill,
  onNeedMoreRows,
  onNeedMoreColumns,
  onSelectionChange,
  onStartFormulaReference,
  onPickReference,
  onUndo,
  onRedo,
  onSave,
  onApplyStyle,
  onFormulaDraftChange,
  referenceMode = null,
  readOnly = false,
  workbookContext = {},
  presenceMembers = [],
}) {
  const scrollerRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const fillPreviewEndRef = useRef(null);
  const fillRafRef = useRef(null);
  const selectionRafRef = useRef(null);
  const scrollRafRef = useRef(null);
  const pendingSelectionRef = useRef(null);
  const resizingRef = useRef(null);
  const rowResizingRef = useRef(null);
  const editInputRef = useRef(null);
  const canvasRef = useRef(null);
  const editingValueRef = useRef('');
  const formulaSuggestionPickingRef = useRef(false);
  const formulaPickActiveRef = useRef(false);
  const formulaPickStartRef = useRef(null);
  const formulaPickEndRef = useRef(null);

  const [visibleRows, setVisibleRows] = useState(() => Math.min(Math.max(grid.length, 420), 900));
  const [visibleCols, setVisibleCols] = useState(() => Math.min(Math.max(grid[0]?.length || DEFAULT_COLUMNS, 64), 140));
  const [columnWidths, setColumnWidths] = useState(() => Array.from({ length: 80 }, () => DEFAULT_COLUMN_WIDTH));
  const [rowHeights, setRowHeights] = useState(() => Array.from({ length: 240 }, () => DEFAULT_ROW_HEIGHT));
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [fillPreviewEnd, setFillPreviewEnd] = useState(null);
  const [fillDragging, setFillDragging] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [formulaSuggestionIndex, setFormulaSuggestionIndex] = useState(0);
  const [formulaSuggestionsClosed, setFormulaSuggestionsClosed] = useState(false);
  const [formulaPickRange, setFormulaPickRange] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const gridDataBounds = useMemo(() => getGridDataBounds(grid, 420, DEFAULT_COLUMNS), [grid]);
  const gridColumnCount = Math.max(grid[0]?.length || DEFAULT_COLUMNS, gridDataBounds.cols || DEFAULT_COLUMNS);
  const gridRowCount = Math.max(grid.length || 0, gridDataBounds.rows || 420);

  const columns = useMemo(() => {
    const count = Math.max(gridColumnCount, DEFAULT_COLUMNS, visibleCols);
    return Array.from({ length: count }, (_, index) => columnIndexToLetter(index));
  }, [gridColumnCount, visibleCols]);

  const visibleColumns = useMemo(() => columns.slice(0, Math.min(visibleCols, columns.length)), [columns, visibleCols]);
  const rowWindow = useMemo(() => {
    const estimatedHeight = DEFAULT_ROW_HEIGHT;
    const viewportHeight = scrollerRef.current?.clientHeight || 620;
    const overscan = 18;
    const start = Math.max(0, Math.floor(scrollTop / estimatedHeight) - overscan);
    const count = Math.ceil(viewportHeight / estimatedHeight) + overscan * 2;
    const end = Math.min(Math.max(visibleRows, gridRowCount), start + count);
    return { start, end, topSpacer: start * estimatedHeight, bottomSpacer: Math.max(0, (Math.max(visibleRows, gridRowCount) - end) * estimatedHeight) };
  }, [scrollTop, visibleRows, gridRowCount]);

  const visibleGrid = useMemo(() => {
    const rows = [];
    for (let rowIndex = rowWindow.start; rowIndex < rowWindow.end; rowIndex += 1) {
      rows.push({ rowIndex, row: grid[rowIndex] || [] });
    }
    return rows;
  }, [grid, rowWindow.start, rowWindow.end]);
  const selectedRange = useMemo(() => normalizeRange(selectedStart, selectedEnd), [selectedStart, selectedEnd]);
  const formulaSuggestions = useMemo(() => getFormulaSuggestions(editingValue, 8), [editingValue]);
  const showFormulaSuggestions = Boolean(!formulaSuggestionsClosed && editingCell && formulaSuggestions.length && String(editingValue || '').trim().startsWith('='));
  const isEditingFormula = Boolean(editingCell && String(editingValue || '').trim().startsWith('='));

  const fillPreviewRange = useMemo(() => {
    if (!fillDragging || !selectedRange || !fillPreviewEnd) return null;
    return normalizeRange({ rowIndex: selectedRange.startRow, colIndex: selectedRange.startCol }, fillPreviewEnd);
  }, [fillDragging, selectedRange, fillPreviewEnd]);

  const presenceByCell = useMemo(() => {
    const map = new Map();
    const currentSheetName = String(sheetName || '').trim();

    (presenceMembers || []).forEach((member) => {
      if (!member?.activeCell || member?.isSelf) return;
      const memberSheet = String(member.sheet || '').trim();
      const sameSheet = !memberSheet || !currentSheetName || memberSheet === currentSheetName;
      if (!sameSheet) return;

      const key = String(member.activeCell).toUpperCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(member);
    });

    return map;
  }, [presenceMembers, sheetName]);

  const totalTableWidth = useMemo(() => {
    return 42 + visibleColumns.reduce((total, _, index) => total + (columnWidths[index] || DEFAULT_COLUMN_WIDTH), 0);
  }, [visibleColumns, columnWidths]);

  useEffect(() => {
    return () => {
      if (fillRafRef.current) cancelAnimationFrame(fillRafRef.current);
      if (selectionRafRef.current) cancelAnimationFrame(selectionRafRef.current);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  useEffect(() => {
    editingValueRef.current = editingValue;
  }, [editingValue]);

  useEffect(() => {
    setVisibleRows((prev) => Math.max(prev, 420, gridRowCount + 60));
  }, [gridRowCount]);

  useEffect(() => {
    setVisibleCols((prev) => Math.max(prev, 64, gridColumnCount + 8));
  }, [gridColumnCount]);

  useEffect(() => {
    setColumnWidths((prev) => {
      const needed = Math.max(visibleCols, gridColumnCount, prev.length);
      if (prev.length >= needed) return prev;
      return [...prev, ...Array.from({ length: needed - prev.length }, () => DEFAULT_COLUMN_WIDTH)];
    });

    setRowHeights((prev) => {
      const needed = Math.max(visibleRows, gridRowCount, prev.length);
      if (prev.length >= needed) return prev;
      return [...prev, ...Array.from({ length: needed - prev.length }, () => DEFAULT_ROW_HEIGHT)];
    });
  }, [visibleCols, visibleRows, gridRowCount, gridColumnCount]);

  useEffect(() => {
    if (!editingCell) return;
    requestAnimationFrame(() => {
      const input = editInputRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      const length = String(editingValueRef.current || '').length;
      input.setSelectionRange(length, length);
    });
  }, [editingCell]);

  useEffect(() => {
    setFormulaSuggestionIndex(0);
    setFormulaSuggestionsClosed(false);
  }, [editingValue]);

  useEffect(() => {
    function handleFormulaPickMouseUp() {
      if (!formulaPickActiveRef.current) return;
      formulaPickActiveRef.current = false;

      const start = formulaPickStartRef.current;
      const end = formulaPickEndRef.current || start;
      formulaPickStartRef.current = null;
      formulaPickEndRef.current = null;
      setFormulaPickRange(null);

      if (!start || !end || !editingCell || !isEditingFormula) return;

      const isSourceCell = editingCell.rowIndex === end.rowIndex && editingCell.colIndex === end.colIndex;
      if (isSourceCell && start.rowIndex === end.rowIndex && start.colIndex === end.colIndex) {
        requestAnimationFrame(() => editInputRef.current?.focus?.({ preventScroll: true }));
        return;
      }

      const referenceLabel = makeRangeLabel(start, end);
      const nextValue = appendFormulaReference(editingValueRef.current, referenceLabel);
      setEditingValue(nextValue);
      onFormulaDraftChange?.(nextValue);
      onStartFormulaReference?.({ sheetId, sheetName, rowIndex: editingCell.rowIndex, colIndex: editingCell.colIndex });

      requestAnimationFrame(() => {
        const input = editInputRef.current;
        if (!input) return;
        input.focus({ preventScroll: true });
        input.setSelectionRange(nextValue.length, nextValue.length);
      });
    }

    window.addEventListener('mouseup', handleFormulaPickMouseUp);
    return () => window.removeEventListener('mouseup', handleFormulaPickMouseUp);
  }, [editingCell, isEditingFormula, onFormulaDraftChange, onStartFormulaReference, sheetId, sheetName]);

  useEffect(() => {
    if (!selecting && !fillDragging) return undefined;

    function handleMouseUp() {
      setSelecting(false);
      const finalFillEnd = fillPreviewEndRef.current || fillPreviewEnd;

      if (fillDragging && selectedRange && finalFillEnd) {
        const toRange = normalizeRange({ rowIndex: selectedRange.startRow, colIndex: selectedRange.startCol }, finalFillEnd);
        if (toRange) onFill?.(selectedRange, toRange);
      }

      if (fillRafRef.current) {
        cancelAnimationFrame(fillRafRef.current);
        fillRafRef.current = null;
      }
      if (selectionRafRef.current) {
        cancelAnimationFrame(selectionRafRef.current);
        selectionRafRef.current = null;
      }

      setFillDragging(false);
      fillPreviewEndRef.current = null;
      pendingSelectionRef.current = null;
      setFillPreviewEnd(null);
    }

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [selecting, fillDragging, selectedRange, fillPreviewEnd, onFill]);

  useEffect(() => {
    function handleResizeMove(event) {
      if (!resizingRef.current) return;
      const { colIndex, startX, startWidth } = resizingRef.current;
      const nextWidth = clamp(startWidth + event.clientX - startX, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
      setColumnWidths((prev) => {
        if ((prev[colIndex] || DEFAULT_COLUMN_WIDTH) === nextWidth) return prev;
        const copy = [...prev];
        copy[colIndex] = nextWidth;
        return copy;
      });
    }

    function handleRowResizeMove(event) {
      if (!rowResizingRef.current) return;
      const { rowIndex, startY, startHeight } = rowResizingRef.current;
      const nextHeight = clamp(startHeight + event.clientY - startY, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
      setRowHeights((prev) => {
        if ((prev[rowIndex] || DEFAULT_ROW_HEIGHT) === nextHeight) return prev;
        const copy = [...prev];
        copy[rowIndex] = nextHeight;
        return copy;
      });
    }

    function handleResizeEnd() {
      resizingRef.current = null;
      rowResizingRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mousemove', handleRowResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mousemove', handleRowResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  function getCanvasContext() {
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
    return canvasRef.current.getContext('2d');
  }

  function measureTextWidth(text, font = '14px Arial') {
    const ctx = getCanvasContext();
    if (!ctx) return String(text || '').length * 8;
    ctx.font = font;
    return ctx.measureText(String(text || '')).width;
  }

  function autoFitColumn(colIndex) {
    const headerText = columns[colIndex] || columnIndexToLetter(colIndex);
    let maxWidth = measureTextWidth(headerText, '700 12px Arial') + 34;
    const maxRowsToMeasure = Math.min(gridRowCount, 800);

    for (let rowIndex = 0; rowIndex < maxRowsToMeasure; rowIndex += 1) {
      const cell = grid[rowIndex]?.[colIndex] || { value: '', formula: '', style: {} };
      const text = cell.formula || displayCell(cell, grid, workbookContext) || '';
      const fontSize = cell.style?.fontSize || 14;
      const weight = cell.style?.bold || rowIndex === 0 ? 700 : 400;
      maxWidth = Math.max(maxWidth, measureTextWidth(text, `${weight} ${fontSize}px Arial`) + 28);
    }

    setColumnWidths((prev) => {
      const copy = [...prev];
      copy[colIndex] = clamp(Math.ceil(maxWidth), MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
      return copy;
    });
  }

  function autoFitRow(rowIndex) {
    const row = grid[rowIndex] || [];
    let maxHeight = DEFAULT_ROW_HEIGHT;
    const maxColsToMeasure = Math.min(visibleColumns.length, row.length || visibleColumns.length);

    for (let colIndex = 0; colIndex < maxColsToMeasure; colIndex += 1) {
      const width = columnWidths[colIndex] || DEFAULT_COLUMN_WIDTH;
      const cell = row[colIndex] || { value: '', formula: '', style: {} };
      const text = cell.formula || displayCell(cell, grid, workbookContext) || '';
      const fontSize = Number(cell.style?.fontSize || 14);
      const approxCharsPerLine = Math.max(8, Math.floor(width / Math.max(fontSize * 0.58, 7)));
      const lines = String(text || '')
        .split('\n')
        .reduce((count, line) => count + Math.max(1, Math.ceil(String(line).length / approxCharsPerLine)), 0);
      maxHeight = Math.max(maxHeight, lines * (fontSize + 8) + 8);
    }

    setRowHeights((prev) => {
      const copy = [...prev];
      copy[rowIndex] = clamp(Math.ceil(maxHeight), MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
      return copy;
    });
  }

  function autoFitSelectedColumns() {
    const range = selectedRange || normalizeRange(selectedStart, selectedEnd);
    if (!range) return;
    for (let colIndex = range.startCol; colIndex <= range.endCol; colIndex += 1) {
      autoFitColumn(colIndex);
    }
  }

  function autoFitSelectedRows() {
    const range = selectedRange || normalizeRange(selectedStart, selectedEnd);
    if (!range) return;
    for (let rowIndex = range.startRow; rowIndex <= range.endRow; rowIndex += 1) {
      autoFitRow(rowIndex);
    }
  }

  function updateFillPreview(rowIndex, colIndex) {
    const current = fillPreviewEndRef.current;
    if (current && current.rowIndex === rowIndex && current.colIndex === colIndex) return;
    fillPreviewEndRef.current = { rowIndex, colIndex };
    if (fillRafRef.current) return;
    fillRafRef.current = requestAnimationFrame(() => {
      fillRafRef.current = null;
      setFillPreviewEnd(fillPreviewEndRef.current);
    });
  }

  function updateSelectionPreview(rowIndex, colIndex) {
    pendingSelectionRef.current = { rowIndex, colIndex };
    if (selectionRafRef.current) return;
    selectionRafRef.current = requestAnimationFrame(() => {
      selectionRafRef.current = null;
      const cell = pendingSelectionRef.current;
      if (!cell) return;
      setSelectedEnd(cell);
      onSelectionChange?.(normalizeRange(selectedStart || cell, cell), cell);
    });
  }

  function getRawValue(rowIndex, colIndex) {
    const cell = grid[rowIndex]?.[colIndex] || { value: '', formula: '' };
    return cell.formula || cell.value || '';
  }

  function setEditingDraft(nextValue, options = {}) {
    editingValueRef.current = nextValue;
    setEditingValue(nextValue);

    if (String(nextValue || '').startsWith('=')) {
      onFormulaDraftChange?.(nextValue);
      if (editingCell) {
        onStartFormulaReference?.({ sheetId, sheetName, rowIndex: editingCell.rowIndex, colIndex: editingCell.colIndex });
      }
    }
  }

  function commitEditing() {
    if (!editingCell || readOnly) return;
    const value = editingValueRef.current;
    onChange?.(editingCell.rowIndex, editingCell.colIndex, value);
    setEditingCell(null);
    onFormulaDraftChange?.(value);
    if (!String(value || '').startsWith('=')) {
      onStartFormulaReference?.(null);
    }
  }

  function startEditing(rowIndex, colIndex, initialValue) {
    if (readOnly) return;
    const value = initialValue !== undefined ? initialValue : getRawValue(rowIndex, colIndex);
    setEditingCell({ rowIndex, colIndex });
    editingValueRef.current = value;
    setEditingValue(value);
    if (String(value || '').startsWith('=')) {
      onFormulaDraftChange?.(value);
      onStartFormulaReference?.({ sheetId, sheetName, rowIndex, colIndex });
    }
  }

  function ensureVirtualSpace(rowIndex, colIndex) {
    if (rowIndex >= visibleRows - 40) {
      const addCount = Math.max(240, rowIndex - visibleRows + 300);
      setVisibleRows((prev) => prev + addCount);
    }

    if (colIndex >= visibleCols - 12) {
      const addCount = Math.max(24, colIndex - visibleCols + 32);
      setVisibleCols((prev) => prev + addCount);
    }
  }

  function scrollCellIntoView(rowIndex, colIndex) {
    const el = scrollerRef.current;
    if (!el) return;

    const columnOffset = 42 + columnWidths.slice(0, colIndex).reduce((sum, width) => sum + (width || DEFAULT_COLUMN_WIDTH), 0);
    const rowOffset = 30 + rowHeights.slice(0, rowIndex).reduce((sum, height) => sum + (height || DEFAULT_ROW_HEIGHT), 0);
    const cellWidth = columnWidths[colIndex] || DEFAULT_COLUMN_WIDTH;
    const cellHeight = rowHeights[rowIndex] || DEFAULT_ROW_HEIGHT;

    const leftLimit = el.scrollLeft + 42;
    const rightLimit = el.scrollLeft + el.clientWidth - 24;
    const topLimit = el.scrollTop + 30;
    const bottomLimit = el.scrollTop + el.clientHeight - 24;

    if (columnOffset < leftLimit) el.scrollLeft = Math.max(0, columnOffset - 42);
    else if (columnOffset + cellWidth > rightLimit) el.scrollLeft = columnOffset + cellWidth - el.clientWidth + 36;

    if (rowOffset < topLimit) el.scrollTop = Math.max(0, rowOffset - 30);
    else if (rowOffset + cellHeight > bottomLimit) el.scrollTop = rowOffset + cellHeight - el.clientHeight + 36;
  }

  function selectSingleCell(rowIndex, colIndex) {
    const safeRow = Math.max(0, rowIndex);
    const safeCol = Math.max(0, colIndex);
    ensureVirtualSpace(safeRow, safeCol);
    const cell = { rowIndex: safeRow, colIndex: safeCol };
    setSelectedStart(cell);
    setSelectedEnd(cell);
    onSelectionChange?.(normalizeRange(cell, cell), cell);
    requestAnimationFrame(() => scrollCellIntoView(safeRow, safeCol));
    scrollerRef.current?.focus?.({ preventScroll: true });
  }


  function selectWholeColumn(colIndex) {
    const start = { rowIndex: 0, colIndex };
    const end = { rowIndex: Math.max(0, visibleRows - 1), colIndex };
    setSelectedStart(start);
    setSelectedEnd(end);
    onSelectionChange?.(normalizeRange(start, end), end);
  }

  function selectWholeRow(rowIndex) {
    const start = { rowIndex, colIndex: 0 };
    const end = { rowIndex, colIndex: Math.max(0, visibleCols - 1) };
    setSelectedStart(start);
    setSelectedEnd(end);
    onSelectionChange?.(normalizeRange(start, end), end);
  }

  function extendSelectionToCell(rowIndex, colIndex) {
    const safeRow = Math.max(0, rowIndex);
    const safeCol = Math.max(0, colIndex);
    ensureVirtualSpace(safeRow, safeCol);
    const cell = { rowIndex: safeRow, colIndex: safeCol };
    const start = selectedStart || cell;
    if (!selectedStart) setSelectedStart(cell);
    setSelectedEnd(cell);
    onSelectionChange?.(normalizeRange(start, cell), cell);
    requestAnimationFrame(() => scrollCellIntoView(safeRow, safeCol));
  }

  function applyBulkChanges(changes) {
    if (!changes.length || readOnly) return;
    if (onBulkChange) {
      onBulkChange(changes);
      return;
    }
    changes.forEach((item) => onChange?.(item.rowIndex, item.colIndex, item.value));
  }

  function handleCellMouseDown(event, rowIndex, colIndex) {
    if (isEditingFormula && editingCell) {
      const isSourceCell = editingCell.rowIndex === rowIndex && editingCell.colIndex === colIndex;
      if (!isSourceCell) {
        event.preventDefault();
        event.stopPropagation();
        const start = { rowIndex, colIndex };
        formulaPickActiveRef.current = true;
        formulaPickStartRef.current = start;
        formulaPickEndRef.current = start;
        setFormulaPickRange(normalizeRange(start, start));
        return;
      }
    }

    if (referenceMode) {
      const isSourceCell = referenceMode.sourceSheetId === sheetId && referenceMode.rowIndex === rowIndex && referenceMode.colIndex === colIndex;
      if (isSourceCell) {
        selectSingleCell(rowIndex, colIndex);
        return;
      }

      event.preventDefault();
      onPickReference?.({ sheetId, sheetName, rowIndex, colIndex, rangeMode: event.shiftKey });
      return;
    }

    if (event.shiftKey) {
      event.preventDefault();
      setSelecting(false);
      extendSelectionToCell(rowIndex, colIndex);
      return;
    }

    setSelecting(true);
    selectSingleCell(rowIndex, colIndex);
  }

  function handleCellDoubleClick(rowIndex, colIndex) {
    startEditing(rowIndex, colIndex, undefined);
  }

  function moveSelection(rowDelta, colDelta, extend = false) {
    const baseCell = extend ? (selectedEnd || selectedStart) : selectedStart;
    if (!baseCell) return;

    const next = {
      rowIndex: Math.max(0, baseCell.rowIndex + rowDelta),
      colIndex: Math.max(0, baseCell.colIndex + colDelta),
    };

    if (extend) extendSelectionToCell(next.rowIndex, next.colIndex);
    else selectSingleCell(next.rowIndex, next.colIndex);
  }

  function jumpSelection(direction, extend = false) {
    const baseCell = extend ? (selectedEnd || selectedStart) : selectedStart;
    if (!baseCell) return;
    let next = { ...baseCell };

    if (direction === 'down') next.rowIndex = Math.max(0, visibleRows - 1);
    if (direction === 'up') next.rowIndex = 0;
    if (direction === 'right') next.colIndex = Math.max(0, visibleCols - 1);
    if (direction === 'left') next.colIndex = 0;

    if (extend) extendSelectionToCell(next.rowIndex, next.colIndex);
    else selectSingleCell(next.rowIndex, next.colIndex);
  }

  function handleGridKeyDown(event) {
    const key = String(event.key || '');
    const lowerKey = key.toLowerCase();
    const isCtrl = event.ctrlKey || event.metaKey;

    if (isCtrl && lowerKey === 'z' && !readOnly) {
      event.preventDefault();
      setEditingCell(null);
      if (event.shiftKey) onRedo?.();
      else onUndo?.();
      return;
    }

    if (isCtrl && lowerKey === 'y' && !readOnly) {
      event.preventDefault();
      setEditingCell(null);
      onRedo?.();
      return;
    }

    if (isCtrl && !event.shiftKey && lowerKey === 's') {
      event.preventDefault();
      onSave?.();
      return;
    }

    if (isCtrl && !event.shiftKey && lowerKey === 'a') {
      event.preventDefault();
      const end = {
        rowIndex: Math.max(0, visibleRows - 1),
        colIndex: Math.max(0, visibleCols - 1),
      };
      setSelectedStart({ rowIndex: 0, colIndex: 0 });
      setSelectedEnd(end);
      onSelectionChange?.(normalizeRange({ rowIndex: 0, colIndex: 0 }, end), end);
      return;
    }

    if (isCtrl && lowerKey === 'b' && !readOnly && selectedRange) {
      event.preventDefault();
      onApplyStyle?.(selectedRange, { bold: true });
      return;
    }

    if (isCtrl && !event.shiftKey && lowerKey === 'i' && !readOnly && selectedRange) {
      event.preventDefault();
      onApplyStyle?.(selectedRange, { italic: true });
      return;
    }

    if (isCtrl && !event.shiftKey && lowerKey === 'u' && !readOnly && selectedRange) {
      event.preventDefault();
      onApplyStyle?.(selectedRange, { underline: true });
      return;
    }

    if (isCtrl && key === '`') {
      event.preventDefault();
      setShowFormulas((prev) => !prev);
      return;
    }

    if (!selectedStart || editingCell) return;

    if (isCtrl && event.shiftKey && lowerKey === 'f' && !readOnly && selectedRange) {
      event.preventDefault();
      onApplyStyle?.(selectedRange, clearFormatStyle());
      return;
    }

    if (isCtrl && event.shiftKey && key === ' ') {
      event.preventDefault();
      const end = { rowIndex: Math.max(0, visibleRows - 1), colIndex: Math.max(0, visibleCols - 1) };
      setSelectedStart({ rowIndex: 0, colIndex: 0 });
      setSelectedEnd(end);
      onSelectionChange?.(normalizeRange({ rowIndex: 0, colIndex: 0 }, end), end);
      return;
    }

    if (event.altKey && key === '=' && !readOnly) {
      event.preventDefault();
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, getAutoSumFormula(grid, selectedStart.rowIndex, selectedStart.colIndex));
      return;
    }

    if (isCtrl && event.altKey && lowerKey === 'h' && !readOnly) {
      event.preventDefault();
      applyBulkChanges(makeClearChanges(selectedRange));
      return;
    }

    if (isCtrl && event.altKey && lowerKey === 'd' && !readOnly) {
      event.preventDefault();
      applyBulkChanges(makeConstantChanges(selectedRange, new Date().toLocaleDateString('es-MX')));
      return;
    }

    if (isCtrl && event.altKey && lowerKey === 'p' && !readOnly) {
      event.preventDefault();
      applyBulkChanges(makeTransformChanges(grid, selectedRange, (value) => String(value ?? '').toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase())));
      return;
    }

    if (isCtrl && event.altKey && lowerKey === 'e' && !readOnly) {
      event.preventDefault();
      applyBulkChanges(makeTransformChanges(grid, selectedRange, (value) => String(value ?? '').trim().replace(/\s+/g, ' ')));
      return;
    }

    if (isCtrl && event.altKey && lowerKey === '0') {
      event.preventDefault();
      autoFitSelectedColumns();
      autoFitSelectedRows();
      return;
    }

    if (event.altKey && event.shiftKey && !isCtrl && ['i', 'r', 't', 'f', 'c', 'd', 'v', 'p', 'g', 'e', 'b', 'q', 'o', 'a', 'l', 'n', 's', 'u', 'y', 'w'].includes(lowerKey) && !readOnly) {
      event.preventDefault();
      const formulaMap = {
        i: 'IVA16',
        r: 'RETENCION_ISR',
        t: 'RETENCION_IVA',
        f: 'TOTAL_FACTURA',
        c: 'CONCILIADO',
        d: 'DIAS_VENCIDO',
        v: 'VARIACIONPORC',
        p: 'PRESUPUESTO_VARIACION',
        g: 'MARGEN_BRUTO',
        e: 'EBITDA',
        b: 'BASE_DESDE_TOTAL',
        q: 'RAZONCORRIENTE',
        o: 'ROI',
        a: 'ANTIGUEDAD_CARTERA',
        l: 'DEPRECIACION_MENSUAL',
        n: 'NOMINA_NETA',
        s: 'SALDO_FINAL',
        u: 'UTILIDADPORC',
        y: 'PAYBACK',
        w: 'NETWORKDAYS',
      };
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, makeFormulaSeed(formulaMap[lowerKey]));
      return;
    }

    if (event.altKey && !isCtrl && !event.shiftKey && ['s', 'a', 'm', 'n', 'c', 'i', 'v', 'x', 'p', 'k', 't', 'f', 'r', 'u', 'o', 'g', 'd', 'h', 'e', 'q', 'y', 'j', 'l', 'b', 'z', 'w'].includes(lowerKey) && !readOnly) {
      event.preventDefault();
      const formulaMap = {
        s: 'SUM',
        a: 'AVERAGE',
        m: 'MAX',
        n: 'MIN',
        c: 'COUNT',
        i: 'IF',
        v: 'VLOOKUP',
        x: 'XLOOKUP',
        p: 'PMT',
        k: 'IVA',
        t: 'TEXTJOIN',
        f: 'FILTER',
        r: 'ROUND',
        u: 'SUMIF',
        o: 'COUNTIF',
        g: 'AVERAGEIF',
        d: 'TODAY',
        h: 'NOW',
        e: 'IFERROR',
        q: 'SUMIFS',
        y: 'YEARFRAC',
        j: 'INDEX',
        l: 'XLOOKUP',
        b: 'SUBTOTAL',
        z: 'SUMPRODUCT',
        w: 'WORKDAY',
      };
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, makeFormulaSeed(formulaMap[lowerKey]));
      return;
    }


    if (isCtrl && event.altKey && event.shiftKey && ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'i', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'].includes(lowerKey) && !readOnly) {
      event.preventDefault();
      const map = {
        a: 'ACCRINT',
        b: 'BASE_DESDE_TOTAL',
        c: 'CAGR',
        d: 'DEPRECIACION_ACUMULADA',
        e: 'EFFECT',
        f: 'FV',
        g: 'GROSS_PROFIT',
        i: 'IPMT',
        m: 'MIRR',
        n: 'NPV',
        o: 'OPERATING_PROFIT',
        p: 'PPMT',
        q: 'QUOTIENT',
        r: 'RATE',
        s: 'SLN',
        t: 'TEXT',
        u: 'UNIQUE',
        v: 'PV',
        w: 'WORKDAY_INTL',
        x: 'XIRR',
        y: 'XNPV',
        z: 'MATCH',
      };
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, makeFormulaSeed(map[lowerKey]));
      return;
    }

    if (event.altKey && !isCtrl && event.shiftKey && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(key) && !readOnly) {
      event.preventDefault();
      const map = {
        '1': 'FACT',
        '2': 'COMBIN',
        '3': 'PERMUT',
        '4': 'WEIGHTED_AVERAGE',
        '5': 'RUNNING_TOTAL',
        '6': 'SEQUENCE',
        '7': 'TEXTBEFORE',
        '8': 'TEXTAFTER',
        '9': 'TOCOL',
        '0': 'TOROW',
      };
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, makeFormulaSeed(map[key]));
      return;
    }

    if (isCtrl && event.altKey && event.shiftKey && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(key) && !readOnly) {
      event.preventDefault();
      const map = {
        '1': 'IVA_POR_PAGAR',
        '2': 'HONORARIOS_NETO',
        '3': 'ISR_PROVISIONAL',
        '4': 'CONTRIBUCION_UNITARIA',
        '5': 'MARGEN_CONTRIBUCION',
        '6': 'PUNTO_EQUILIBRIO_VENTAS',
        '7': 'SALDO_INSOLUTO',
        '8': 'INTERES_SIMPLE',
        '9': 'INTERES_COMPUESTO',
        '0': 'CUADRA_DEBE_HABER',
      };
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, makeFormulaSeed(map[key]));
      return;
    }

    if (isCtrl && event.altKey && ['7', '8', '9'].includes(key) && selectedRange && !readOnly) {
      event.preventDefault();
      const currentSize = Number(grid[selectedRange.startRow]?.[selectedRange.startCol]?.style?.fontSize || 14);
      const nextSize = key === '7' ? Math.max(8, currentSize - 1) : key === '8' ? Math.min(40, currentSize + 1) : 14;
      onApplyStyle?.(selectedRange, { fontSize: nextSize });
      return;
    }

    if (isCtrl && event.altKey && ['f', 'k', 'r', 't'].includes(lowerKey) && !readOnly) {
      event.preventDefault();
      const map = { f: 'TOTAL_FACTURA', k: 'IVA16', r: 'RETENCION_ISR', t: 'RETENCION_IVA' };
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, makeFormulaSeed(map[lowerKey]));
      return;
    }

    if (isCtrl && event.altKey && ['1', '2', '3'].includes(key) && selectedRange && !readOnly) {
      event.preventDefault();
      const alignMap = { '1': 'left', '2': 'center', '3': 'right' };
      onApplyStyle?.(selectedRange, { textAlign: alignMap[key] });
      return;
    }

    if (isCtrl && event.altKey && ['4', '5', '6'].includes(key) && selectedRange && !readOnly) {
      event.preventDefault();
      const styleMap = { '4': { bold: true }, '5': { italic: true }, '6': { underline: true } };
      onApplyStyle?.(selectedRange, styleMap[key]);
      return;
    }

    if (isCtrl && event.shiftKey && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key) && !readOnly) {
      event.preventDefault();
      const seedMap = { '1': 'SUBTOTAL', '2': 'SUMPRODUCT', '3': 'SUMIF', '4': 'COUNTIF', '5': 'AVERAGEIF', '6': 'SUMIFS', '7': 'COUNTIFS', '8': 'AVERAGEIFS', '9': 'IFERROR' };
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, makeFormulaSeed(seedMap[key]));
      return;
    }

    if (event.ctrlKey && key === ' ') {
      event.preventDefault();
      selectWholeColumn(selectedStart.colIndex);
      return;
    }

    if (event.shiftKey && key === ' ') {
      event.preventDefault();
      selectWholeRow(selectedStart.rowIndex);
      return;
    }

    if (isCtrl && event.shiftKey && ['u', 'l', 'e', 'n'].includes(lowerKey) && !readOnly) {
      event.preventDefault();
      const transforms = {
        u: (value) => String(value ?? '').toUpperCase(),
        l: (value) => String(value ?? '').toLowerCase(),
        e: (value) => String(value ?? '').trim().replace(/\s+/g, ' '),
        n: (value) => String(value ?? '').toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase()),
      };
      applyBulkChanges(makeTransformChanges(grid, selectedRange, transforms[lowerKey]));
      return;
    }

    if (isCtrl && !event.shiftKey && lowerKey === 'd' && !readOnly) {
      event.preventDefault();
      applyBulkChanges(makeFillDownChanges(grid, selectedRange));
      return;
    }

    if (isCtrl && !event.shiftKey && lowerKey === 'r' && !readOnly) {
      event.preventDefault();
      applyBulkChanges(makeFillRightChanges(grid, selectedRange));
      return;
    }


    if (isCtrl && event.shiftKey && lowerKey === 'd' && !readOnly) {
      event.preventDefault();
      applyBulkChanges(makeFillUpChanges(grid, selectedRange));
      return;
    }

    if (isCtrl && event.shiftKey && lowerKey === 'r' && !readOnly) {
      event.preventDefault();
      applyBulkChanges(makeFillLeftChanges(grid, selectedRange));
      return;
    }

    if (isCtrl && lowerKey === ';' && !readOnly) {
      event.preventDefault();
      applyBulkChanges(makeConstantChanges(selectedRange, new Date().toLocaleDateString('es-MX')));
      return;
    }

    if (isCtrl && event.shiftKey && lowerKey === ':' && !readOnly) {
      event.preventDefault();
      applyBulkChanges(makeConstantChanges(selectedRange, new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })));
      return;
    }

    if (isCtrl && event.shiftKey && ['s', 'a', 'm', 'c', 'p', 'i', 'v', 'x', 'k', 'w', 'b', 'y', 'd', 'r', 'n', 'e', 'l', 'h', 'o', 'u', 'j', 'z'].includes(lowerKey) && !readOnly) {
      event.preventDefault();
      const map = { s: 'SUM', a: 'AVERAGE', m: 'MAX', c: 'COUNT', p: 'PRODUCT', i: 'IF', v: 'VLOOKUP', x: 'XLOOKUP', k: 'IVA', w: 'PMT', b: 'BUSCARV', y: 'YEARFRAC', d: 'DAYS360', r: 'ROUND', n: 'NETWORKDAYS', e: 'EOMONTH', l: 'UTILIDAD', h: 'HONORARIOS_NETO', o: 'IVA_POR_PAGAR', u: 'UNIQUE', j: 'FILTER', z: 'SORT' };
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, makeFormulaSeed(map[lowerKey]));
      return;
    }

    if (isCtrl && event.altKey && ['s', 'a', 'm', 'n'].includes(lowerKey) && !readOnly) {
      event.preventDefault();
      const map = { s: 'SUM', a: 'AVERAGE', m: 'MAX', n: 'MIN' };
      applyBulkChanges(makeSelectionFormulaChanges(grid, selectedRange, map[lowerKey]));
      return;
    }

    if (isCtrl && event.shiftKey && ['q', 't', 'o', 'g', 'h', 'j'].includes(lowerKey) && !readOnly) {
      event.preventDefault();
      const map = { q: 'SUMIFS', t: 'TEXTJOIN', o: 'COUNTIFS', g: 'AVERAGEIFS', h: 'HLOOKUP', j: 'INDEX' };
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, makeFormulaSeed(map[lowerKey]));
      return;
    }

    if (isCtrl && event.altKey && ['i', 'o', 'u', 'l'].includes(lowerKey) && !readOnly) {
      event.preventDefault();
      const map = { i: 'IFERROR', o: 'XLOOKUP', u: 'UPPER', l: 'LOWER' };
      applyBulkChanges(makeSelectionFormulaChanges(grid, selectedRange, map[lowerKey]));
      return;
    }

    if ((key === 'Delete' || key === 'Backspace') && !readOnly) {
      event.preventDefault();
      applyBulkChanges(makeClearChanges(selectedRange));
      return;
    }

    if (key === 'Enter' && !readOnly) {
      event.preventDefault();
      if (event.shiftKey) moveSelection(-1, 0);
      else startEditing(selectedStart.rowIndex, selectedStart.colIndex, undefined);
      return;
    }

    if (key === 'Tab') {
      event.preventDefault();
      moveSelection(0, event.shiftKey ? -1 : 1);
      return;
    }

    if (key === 'F2' && !readOnly) {
      event.preventDefault();
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, undefined);
      return;
    }

    if (isTypingKey(event) && !readOnly) {
      event.preventDefault();
      startEditing(selectedStart.rowIndex, selectedStart.colIndex, key);
      return;
    }

    if (isCtrl && ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(key)) {
      event.preventDefault();
      const direction = key.replace('Arrow', '').toLowerCase();
      jumpSelection(direction, event.shiftKey);
      return;
    }

    if (key === 'Home') {
      event.preventDefault();
      if (isCtrl) {
        if (event.shiftKey) extendSelectionToCell(0, 0);
        else selectSingleCell(0, 0);
      } else if (event.shiftKey) extendSelectionToCell(selectedStart.rowIndex, 0);
      else selectSingleCell(selectedStart.rowIndex, 0);
      return;
    }

    if (key === 'End') {
      event.preventDefault();
      const lastCol = Math.max(0, visibleCols - 1);
      if (isCtrl) {
        const lastRow = Math.max(0, visibleRows - 1);
        if (event.shiftKey) extendSelectionToCell(lastRow, lastCol);
        else selectSingleCell(lastRow, lastCol);
      } else if (event.shiftKey) extendSelectionToCell(selectedStart.rowIndex, lastCol);
      else selectSingleCell(selectedStart.rowIndex, lastCol);
      return;
    }

    if (key === 'PageDown') {
      event.preventDefault();
      moveSelection(20, 0, event.shiftKey);
      return;
    }

    if (key === 'PageUp') {
      event.preventDefault();
      moveSelection(-20, 0, event.shiftKey);
      return;
    }

    if (key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(1, 0, event.shiftKey);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(-1, 0, event.shiftKey);
    } else if (key === 'ArrowRight') {
      event.preventDefault();
      moveSelection(0, 1, event.shiftKey);
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      moveSelection(0, -1, event.shiftKey);
    }
  }

  function acceptFormulaSuggestion(suggestion) {
    if (!suggestion) return;
    const nextValue = applyFormulaSuggestion(editingValueRef.current, suggestion);
    formulaSuggestionPickingRef.current = true;
    setEditingDraft(nextValue, { keepReferenceMode: true });
    requestAnimationFrame(() => {
      const input = editInputRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      input.setSelectionRange(nextValue.length, nextValue.length);
      window.setTimeout(() => {
        formulaSuggestionPickingRef.current = false;
      }, 0);
    });
  }

  function handleEditKeyDown(event) {
    const editKey = String(event.key || '').toLowerCase();
    const isEditCtrl = event.ctrlKey || event.metaKey;
    const isUndo = isEditCtrl && editKey === 'z';
    const isRedo = isEditCtrl && (editKey === 'y' || (event.shiftKey && editKey === 'z'));
    if ((isUndo || isRedo) && !readOnly) {
      event.preventDefault();
      setEditingCell(null);
      if (isRedo) onRedo?.();
      else onUndo?.();
      return;
    }

    if (showFormulaSuggestions && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      setFormulaSuggestionIndex((prev) => {
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        return (prev + delta + formulaSuggestions.length) % formulaSuggestions.length;
      });
      return;
    }

    if (showFormulaSuggestions && (event.key === 'Tab' || event.key === 'Enter')) {
      event.preventDefault();
      acceptFormulaSuggestion(formulaSuggestions[formulaSuggestionIndex] || formulaSuggestions[0]);
      return;
    }

    if (event.key === 'F4' && String(editingValue || '').startsWith('=')) {
      event.preventDefault();
      setEditingDraft(editingValueRef.current.replace(/([A-Z]+)(\d+)$/i, '$$$1$$$2'), { keepReferenceMode: true });
      return;
    }

    if (event.altKey && event.key === 'Enter') {
      event.preventDefault();
      setEditingValue((prev) => `${prev || ''}\n`);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      commitEditing();
      moveSelection(event.shiftKey ? -1 : 1, 0);
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      commitEditing();
      moveSelection(0, event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      if (showFormulaSuggestions) {
        setFormulaSuggestionsClosed(true);
        setFormulaSuggestionIndex(0);
        return;
      }
      setEditingCell(null);
      onStartFormulaReference?.(null);
    }
  }

  function handleCopy(event) {
    if (!selectedRange) return;
    const text = getSelectionText({ grid, range: selectedRange, workbookContext });
    event.preventDefault();
    event.clipboardData?.setData('text/plain', text);
  }

  function handleCut(event) {
    if (readOnly || !selectedRange) return;
    handleCopy(event);
    applyBulkChanges(makeClearChanges(selectedRange));
  }

  function handlePaste(event) {
    if (readOnly || !selectedStart) return;
    const text = event.clipboardData?.getData('text/plain') || '';
    if (!text) return;
    event.preventDefault();
    const changes = parseClipboardText(text, selectedStart);
    applyBulkChanges(changes);

    if (changes.length) {
      const last = changes[changes.length - 1];
      const range = normalizeRange(selectedStart, last);
      setSelectedEnd(last);
      onSelectionChange?.(range, last);
    }
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;

    if (!scrollRafRef.current) {
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        const current = scrollerRef.current;
        if (!current) return;
        setScrollTop(current.scrollTop);
        setScrollLeft(current.scrollLeft);
      });
    }

    if (loadingMoreRef.current) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 900;
    const nearRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 900;
    if (!nearBottom && !nearRight) return;

    loadingMoreRef.current = true;
    if (nearBottom) {
      setVisibleRows((prev) => prev + 180);
    }
    if (nearRight) {
      setVisibleCols((prev) => prev + 18);
    }
    window.setTimeout(() => {
      loadingMoreRef.current = false;
    }, 120);
  }

  function getPresenceColor(index = 0) {
    return ['border-blue-500 bg-blue-600', 'border-emerald-500 bg-emerald-600', 'border-purple-500 bg-purple-600', 'border-amber-500 bg-amber-600', 'border-pink-500 bg-pink-600'][index % 5];
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div
        ref={scrollerRef}
        tabIndex={0}
        onKeyDown={handleGridKeyDown}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onScroll={handleScroll}
        onWheel={(event) => {
          const el = scrollerRef.current;
          if (!el) return;
          if (event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            event.preventDefault();
            el.scrollLeft += event.deltaY;
            handleScroll();
          }
        }}
        className="flex-1 overflow-scroll overscroll-contain rounded-b-2xl outline-none"
        style={{
          height: 'min(68vh, calc(100vh - 300px))',
          maxHeight: 'calc(100vh - 300px)',
          minHeight: '360px',
          scrollbarGutter: 'stable both-edges',
        }}
      >
        <table className="border-collapse text-sm" style={{ minWidth: `${totalTableWidth}px`, width: `${totalTableWidth}px` }}>
          <thead className="sticky top-0 z-20 bg-slate-100">
            <tr>
              <th className="sticky left-0 z-30 w-10 border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center text-xs font-bold text-slate-500">#</th>
              {visibleColumns.map((column, colIndex) => (
                <th
                  key={column}
                  style={{ width: `${columnWidths[colIndex] || DEFAULT_COLUMN_WIDTH}px`, minWidth: `${columnWidths[colIndex] || DEFAULT_COLUMN_WIDTH}px` }}
                  className="relative border-b border-r border-slate-200 px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  {column}
                  {!readOnly ? (
                    <span
                      role="separator"
                      aria-label={`Cambiar ancho de columna ${column}`}
                      title="Arrastra para cambiar el ancho. Doble click para ajustar al contenido."
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        resizingRef.current = { colIndex, startX: event.clientX, startWidth: columnWidths[colIndex] || DEFAULT_COLUMN_WIDTH };
                        document.body.style.cursor = 'col-resize';
                        document.body.style.userSelect = 'none';
                      }}
                      onDoubleClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        resizingRef.current = null;
                        autoFitColumn(colIndex);
                      }}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-red-500/30"
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rowWindow.topSpacer > 0 ? (
              <tr aria-hidden="true">
                <td colSpan={visibleColumns.length + 1} style={{ height: `${rowWindow.topSpacer}px`, padding: 0, border: 0 }} />
              </tr>
            ) : null}

            {visibleGrid.map(({ row, rowIndex }) => (
              <tr key={rowIndex} className={rowIndex === 0 ? 'bg-slate-50' : 'bg-white'}>
                <th
                  style={{ height: `${rowHeights[rowIndex] || DEFAULT_ROW_HEIGHT}px` }}
                  className="sticky left-0 z-[8] border-b border-r border-slate-200 bg-slate-100 px-2 py-1 text-center text-[11px] font-bold text-slate-500"
                >
                  <span>{rowIndex + 1}</span>
                  {!readOnly ? (
                    <span
                      role="separator"
                      aria-label={`Cambiar alto de fila ${rowIndex + 1}`}
                      title="Arrastra para cambiar el alto. Doble click para ajustar al contenido."
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        rowResizingRef.current = { rowIndex, startY: event.clientY, startHeight: rowHeights[rowIndex] || DEFAULT_ROW_HEIGHT };
                        document.body.style.cursor = 'row-resize';
                        document.body.style.userSelect = 'none';
                      }}
                      onDoubleClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        rowResizingRef.current = null;
                        autoFitRow(rowIndex);
                      }}
                      className="absolute bottom-0 left-0 h-2 w-full cursor-row-resize hover:bg-red-500/30"
                    />
                  ) : null}
                </th>
                {visibleColumns.map((_, colIndex) => {
                  const cell = row[colIndex] || { value: '', formula: '', style: {} };
                  const cellKey = makeCellId(rowIndex, colIndex);
                  const shownValue = showFormulas && cell.formula ? cell.formula : displayCell(cell, grid, workbookContext);
                  const isHeader = rowIndex === 0;
                  const selected = isCellInRange(rowIndex, colIndex, selectedRange);
                  const activeCell = selectedStart && sameCell(selectedStart, { rowIndex, colIndex });
                  const editing = sameCell(editingCell, { rowIndex, colIndex });
                  const previewFill = isCellInRange(rowIndex, colIndex, fillPreviewRange);
                  const formulaPicked = isCellInRange(rowIndex, colIndex, formulaPickRange);
                  const sourceReferenceCell = referenceMode && referenceMode.sourceSheetId === sheetId && referenceMode.rowIndex === rowIndex && referenceMode.colIndex === colIndex;
                  const cellPresence = presenceByCell.get(cellKey.toUpperCase()) || [];
                  const hasPresence = cellPresence.length > 0;

                  return (
                    <td
                      key={cellKey}
                      style={{
                        width: `${columnWidths[colIndex] || DEFAULT_COLUMN_WIDTH}px`,
                        minWidth: `${columnWidths[colIndex] || DEFAULT_COLUMN_WIDTH}px`,
                        height: `${rowHeights[rowIndex] || DEFAULT_ROW_HEIGHT}px`,
                      }}
                      onMouseDown={(event) => handleCellMouseDown(event, rowIndex, colIndex)}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                      onMouseEnter={() => {
                        if (formulaPickActiveRef.current && isEditingFormula) {
                          const end = { rowIndex, colIndex };
                          formulaPickEndRef.current = end;
                          setFormulaPickRange(normalizeRange(formulaPickStartRef.current || end, end));
                          return;
                        }
                        if (selecting && !fillDragging) updateSelectionPreview(rowIndex, colIndex);
                        if (fillDragging) updateFillPreview(rowIndex, colIndex);
                      }}
                      className={`relative border-b border-r border-slate-200 p-0 align-middle ${
                        selected ? 'z-[6] bg-red-50/60 ring-1 ring-red-400 ring-inset' : ''
                      } ${activeCell ? 'ring-2 ring-red-600 ring-inset' : ''} ${previewFill ? 'bg-red-100/70' : ''} ${formulaPicked ? 'z-[7] bg-blue-50/70 ring-2 ring-blue-500 ring-inset' : ''} ${sourceReferenceCell ? 'ring-2 ring-blue-600 ring-inset' : ''} ${hasPresence ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                    >
                      {editing && !readOnly ? (
                        <>
                          <input
                            ref={editInputRef}
                            value={editingValue}
                            title={cell.formula ? `${cell.formula} = ${shownValue}` : cellKey}
                            style={getCellStyle(cell)}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setEditingDraft(nextValue);
                            }}
                            onBlur={() => {
                              window.setTimeout(() => {
                                if (formulaSuggestionPickingRef.current) {
                                  editInputRef.current?.focus?.({ preventScroll: true });
                                  return;
                                }
                                if (formulaPickActiveRef.current) return;
                                if (document.activeElement?.closest?.('[data-formula-suggestions="true"]')) return;
                                commitEditing();
                              }, 90);
                            }}
                            onKeyDown={handleEditKeyDown}
                            className={`h-full min-h-9 w-full bg-white px-2 text-slate-800 outline-none ring-2 ring-red-500/20 ${isHeader ? 'font-bold text-slate-700' : ''}`}
                          />

                          {showFormulaSuggestions ? (
                            <div
                              data-formula-suggestions="true"
                              className="absolute left-0 top-full z-50 mt-1 w-[360px] max-w-[70vw] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-2xl"
                              onPointerDown={(event) => {
                                event.preventDefault();
                                formulaSuggestionPickingRef.current = true;
                              }}
                              onMouseDown={(event) => event.preventDefault()}
                            >
                              <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                                Funciones sugeridas
                              </div>
                              <div className="max-h-72 overflow-auto py-1">
                                {formulaSuggestions.map((item, index) => (
                                  <button
                                    key={`${item.name}-${item.alias || ''}`}
                                    type="button"
                                    onPointerDown={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      acceptFormulaSuggestion(item);
                                    }}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                    }}
                                    className={`block w-full px-3 py-2 text-left transition ${index === formulaSuggestionIndex ? 'bg-red-50' : 'hover:bg-slate-50'}`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-xs font-black text-slate-900">{item.name}</span>
                                      {item.alias ? <span className="text-[10px] font-bold text-slate-400">{item.alias}</span> : null}
                                    </div>
                                    <div className="mt-0.5 truncate font-mono text-[11px] text-red-700">{item.syntax}</div>
                                    <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{item.description}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div
                          style={getCellStyle(cell)}
                          title={cell.formula ? `${cell.formula} = ${shownValue}` : cellKey}
                          className={`flex h-full min-h-9 items-center truncate px-2 py-1.5 ${isHeader ? 'font-bold text-slate-700' : 'text-slate-700'} ${cell.formula ? 'justify-end font-semibold text-slate-900' : ''}`}
                        >
                          {shownValue}
                        </div>
                      )}

                      {!readOnly && isBottomRight(rowIndex, colIndex, selectedRange) ? (
                        <button
                          type="button"
                          aria-label="Arrastrar relleno"
                          title="Arrastra para continuar series o copiar fórmulas"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setFillDragging(true);
                            fillPreviewEndRef.current = { rowIndex, colIndex };
                            setFillPreviewEnd({ rowIndex, colIndex });
                          }}
                          className="absolute -bottom-1.5 -right-1.5 z-20 flex h-4 w-4 cursor-crosshair items-center justify-center rounded-sm border border-red-700 bg-red-600 text-white shadow-sm"
                        >
                          <CornerDownRight className="h-2.5 w-2.5" />
                        </button>
                      ) : null}

                      {hasPresence ? (
                        <div className="pointer-events-none absolute left-0 top-0 z-30 flex -translate-y-full items-center gap-1">
                          {cellPresence.slice(0, 3).map((member, memberIndex) => (
                            <span
                              key={`${member.key || member.name || memberIndex}-${rowIndex}-${colIndex}`}
                              className={`inline-flex max-w-[140px] items-center gap-1 rounded-t-md border px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm ${getPresenceColor(memberIndex)}`}
                              title={member.name || member.email || 'Usuario'}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                              <span className="truncate">{member.name || member.email || 'Usuario'}</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}

            {rowWindow.bottomSpacer > 0 ? (
              <tr aria-hidden="true">
                <td colSpan={visibleColumns.length + 1} style={{ height: `${rowWindow.bottomSpacer}px`, padding: 0, border: 0 }} />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
