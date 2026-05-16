import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createSheet,
  deletePlayground,
  deleteSheet,
  getPlaygroundById,
  getProductsForPlayground,
  renameSheet,
  saveSheetCells,
  subscribeToPlaygroundChanges,
  removePlaygroundChannel,
  upsertSheetCells,
  toggleWorkbookPublic,
  updateWorkbook,
  updateWorkbookShareMode,
} from '../services/playground.service';
import {
  adjustFormulaReferences,
  cellsToGrid,
  createEmptyGrid,
  displayCell,
  ensureGridSize,
} from '../playground.helpers';
import {
  DEFAULT_COLUMNS,
  DEFAULT_ROWS,
  PRODUCT_IMPORT_EXTRA_ROWS,
  PRODUCTS_SHEET_NAME,
  STARTER_COLUMNS,
} from '../playground.constants';

function getCellNumber(cell, grid, context) {
  const value = cell?.formula ? displayCell(cell, grid, context) : cell?.value;
  const number = Number(String(value ?? '').replace(/[$,]/g, '').trim());
  return Number.isFinite(number) ? number : null;
}

function getRangeCells(grid, range) {
  const cells = [];

  for (let row = range.startRow; row <= range.endRow; row += 1) {
    for (let col = range.startCol; col <= range.endCol; col += 1) {
      cells.push({ row, col, cell: grid[row]?.[col] || { value: '', formula: '' } });
    }
  }

  return cells;
}

function buildFillValue({ sourceRange, targetRow, targetCol, sourceGrid, context }) {
  const rangeHeight = sourceRange.endRow - sourceRange.startRow + 1;
  const rangeWidth = sourceRange.endCol - sourceRange.startCol + 1;
  const rowOffset = targetRow - sourceRange.startRow;
  const colOffset = targetCol - sourceRange.startCol;

  // Serie vertical: seleccionas 1,2,3 y arrastras hacia abajo.
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

  // Serie horizontal: seleccionas 1,2,3 y arrastras hacia la derecha.
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

export function usePlaygroundWorkbook(workbookId) {
  const [workbook, setWorkbook] = useState(null);
  const [activeSheetId, setActiveSheetId] = useState(null);
  const [gridsBySheet, setGridsBySheet] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const undoHistoryRef = useRef([]);
  const maxUndoSteps = 60;
  const pendingCellSavesRef = useRef({});
  const pendingSaveTimerRef = useRef(null);
  const realtimeChannelRef = useRef(null);

  const cloneGrids = useCallback((source = {}) => {
    return Object.fromEntries(
      Object.entries(source).map(([sheetKey, grid]) => [
        sheetKey,
        (grid || []).map((row) =>
          (row || []).map((cell) => ({
            ...cell,
            style: { ...(cell?.style || {}) },
          })),
        ),
      ]),
    );
  }, []);

  const pushUndoSnapshot = useCallback((snapshot) => {
    undoHistoryRef.current = [
      ...undoHistoryRef.current.slice(-(maxUndoSteps - 1)),
      cloneGrids(snapshot),
    ];
  }, [cloneGrids]);

  const undoLastChange = useCallback(() => {
    const lastSnapshot = undoHistoryRef.current.pop();

    if (!lastSnapshot) {
      setMessage('No hay cambios para deshacer.');
      return;
    }

    setGridsBySheet(lastSnapshot);
    setMessage('Cambio deshecho.');
  }, []);

  const scheduleCellsPersist = useCallback((sheetId, cells = []) => {
    if (!sheetId || !cells.length) return;

    const current = pendingCellSavesRef.current[sheetId] || {};
    cells.forEach((item) => {
      const key = `${item.rowIndex}:${item.colIndex}`;
      current[key] = item;
    });
    pendingCellSavesRef.current[sheetId] = current;

    if (pendingSaveTimerRef.current) {
      window.clearTimeout(pendingSaveTimerRef.current);
    }

    pendingSaveTimerRef.current = window.setTimeout(async () => {
      const pending = pendingCellSavesRef.current;
      pendingCellSavesRef.current = {};
      pendingSaveTimerRef.current = null;

      try {
        await Promise.all(
          Object.entries(pending).map(async ([targetSheetId, map]) => {
            const changedCells = Object.values(map);
            await upsertSheetCells(targetSheetId, changedCells);

            realtimeChannelRef.current?.send?.({
              type: 'broadcast',
              event: 'cell-change',
              payload: {
                sheetId: targetSheetId,
                cells: changedCells,
              },
            });
          }),
        );
      } catch (persistError) {
        console.error('Error guardando cambios realtime:', persistError);
        setMessage('No se pudieron sincronizar algunos cambios. Presiona Guardar.');
      }
    }, 650);
  }, []);

  const applyRealtimeCellChange = useCallback((payload) => {
    const rowData = payload.new || payload.old;
    const sheetId = rowData?.sheet_id;
    if (!sheetId) return;

    setGridsBySheet((prev) => {
      const rowIndex = Number(rowData.row_index || 0);
      const colIndex = Number(rowData.col_index || 0);
      const grid = ensureGridSize(prev[sheetId] || createEmptyGrid(), rowIndex + 1, colIndex + 1);
      const copy = grid.map((row) => row.map((cell) => ({ ...cell, style: { ...(cell?.style || {}) } })));

      if (payload.eventType === 'DELETE') {
        copy[rowIndex][colIndex] = { value: '', formula: '', style: {} };
      } else {
        copy[rowIndex][colIndex] = {
          value: rowData.value ?? '',
          formula: rowData.formula ?? '',
          style: rowData.style || {},
        };
      }

      return {
        ...prev,
        [sheetId]: copy,
      };
    });
  }, []);


  async function load() {
    if (!workbookId) {
      setError('No se recibió el ID del playground. Revisa la ruta configurada en React Router.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [workbookData, productsData] = await Promise.all([
        getPlaygroundById(workbookId),
        getProductsForPlayground(),
      ]);

      const nextGrids = {};
      const sheets = workbookData.playground_sheets || [];

      sheets.forEach((sheet) => {
        nextGrids[sheet.id] = cellsToGrid(
          sheet.playground_cells || [],
          DEFAULT_ROWS,
          DEFAULT_COLUMNS,
        );
      });

      setWorkbook(workbookData);
      setProducts(productsData);
      setGridsBySheet(nextGrids);
      setActiveSheetId(sheets[0]?.id || null);
    } catch (err) {
      console.error('Error cargando playground:', err);
      setError(err?.message || 'No se pudo cargar el playground.');
      setWorkbook(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [workbookId]);

  useEffect(() => () => {
    if (pendingSaveTimerRef.current) window.clearTimeout(pendingSaveTimerRef.current);
    if (realtimeChannelRef.current) removePlaygroundChannel(realtimeChannelRef.current);
  }, []);

  const sheets = useMemo(() => workbook?.playground_sheets || [], [workbook]);
  const activeSheet = useMemo(
    () => sheets.find((sheet) => sheet.id === activeSheetId) || sheets[0] || null,
    [activeSheetId, sheets],
  );

  useEffect(() => {
    if (!workbook?.id || !sheets.length) return undefined;

    if (realtimeChannelRef.current) {
      removePlaygroundChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const channel = subscribeToPlaygroundChanges({
      workbookId: workbook.id,
      sheets,
      onCellChange: applyRealtimeCellChange,
      onSheetChange: () => load(),
      onWorkbookChange: () => load(),
    });

    realtimeChannelRef.current = channel;

    return () => {
      removePlaygroundChannel(channel);
      if (realtimeChannelRef.current === channel) realtimeChannelRef.current = null;
    };
  }, [workbook?.id, sheets.map((sheet) => sheet.id).join(','), applyRealtimeCellChange]);


  const activeGrid = activeSheet ? gridsBySheet[activeSheet.id] || createEmptyGrid() : createEmptyGrid();

  const workbookContext = useMemo(() => ({
    sheets,
    gridsBySheet,
    activeSheetId,
    activeGrid,
  }), [sheets, gridsBySheet, activeSheetId, activeGrid]);

  function updateCell(rowIndex, colIndex, value) {
    if (!activeSheet) return;

    setGridsBySheet((prev) => {
      pushUndoSnapshot(prev);
      const grid = ensureGridSize(prev[activeSheet.id] || createEmptyGrid(), rowIndex + 1, colIndex + 1);
      const copy = grid.map((row) => row.map((cell) => ({ ...cell, style: { ...(cell.style || {}) } })));
      const isFormula = String(value || '').startsWith('=');

      const nextCell = {
        ...copy[rowIndex][colIndex],
        value: isFormula ? '' : value,
        formula: isFormula ? value : '',
      };

      copy[rowIndex][colIndex] = nextCell;
      scheduleCellsPersist(activeSheet.id, [{ rowIndex, colIndex, cell: nextCell }]);

      return {
        ...prev,
        [activeSheet.id]: copy,
      };
    });
  }



  function updateCellInSheet(sheetId, rowIndex, colIndex, value) {
    if (!sheetId) return;

    setGridsBySheet((prev) => {
      pushUndoSnapshot(prev);
      const grid = ensureGridSize(prev[sheetId] || createEmptyGrid(), rowIndex + 1, colIndex + 1);
      const copy = grid.map((row) => row.map((cell) => ({ ...cell, style: { ...(cell.style || {}) } })));
      const isFormula = String(value || '').startsWith('=');

      const nextCell = {
        ...copy[rowIndex][colIndex],
        value: isFormula ? '' : value,
        formula: isFormula ? value : '',
      };

      copy[rowIndex][colIndex] = nextCell;
      scheduleCellsPersist(sheetId, [{ rowIndex, colIndex, cell: nextCell }]);

      return {
        ...prev,
        [sheetId]: copy,
      };
    });
  }

  function updateCellStyle(range, nextStyle = {}) {
    if (!activeSheet || !range) return;

    setGridsBySheet((prev) => {
      pushUndoSnapshot(prev);
      const grid = ensureGridSize(
        prev[activeSheet.id] || createEmptyGrid(),
        range.endRow + 1,
        range.endCol + 1,
      );
      const copy = grid.map((row) => row.map((cell) => ({ ...cell, style: { ...(cell.style || {}) } })));

      const changedCells = [];

      for (let row = range.startRow; row <= range.endRow; row += 1) {
        for (let col = range.startCol; col <= range.endCol; col += 1) {
          copy[row][col] = {
            ...copy[row][col],
            style: {
              ...(copy[row][col].style || {}),
              ...nextStyle,
            },
          };
          changedCells.push({ rowIndex: row, colIndex: col, cell: copy[row][col] });
        }
      }

      scheduleCellsPersist(activeSheet.id, changedCells);

      return {
        ...prev,
        [activeSheet.id]: copy,
      };
    });
  }

  function addRows(count = 120) {
    if (!activeSheet) return;

    setGridsBySheet((prev) => {
      const grid = prev[activeSheet.id] || createEmptyGrid();
      return {
        ...prev,
        [activeSheet.id]: ensureGridSize(
          grid,
          grid.length + Number(count || 120),
          Math.max(grid[0]?.length || 0, DEFAULT_COLUMNS),
        ),
      };
    });
  }



  function addColumns(count = 12) {
    if (!activeSheet) return;

    setGridsBySheet((prev) => {
      const grid = prev[activeSheet.id] || createEmptyGrid();
      return {
        ...prev,
        [activeSheet.id]: ensureGridSize(
          grid,
          grid.length,
          Math.max(grid[0]?.length || 0, DEFAULT_COLUMNS) + Number(count || 12),
        ),
      };
    });
  }

  function fillCells(sourceRange, targetRange) {
    if (!activeSheet || !sourceRange || !targetRange) return;

    setGridsBySheet((prev) => {
      pushUndoSnapshot(prev);
      const grid = prev[activeSheet.id] || createEmptyGrid();
      const neededRows = Math.max(grid.length, targetRange.endRow + 1);
      const neededCols = Math.max(grid[0]?.length || DEFAULT_COLUMNS, targetRange.endCol + 1);
      const expanded = ensureGridSize(grid, neededRows, neededCols);
      const copy = expanded.map((row) => row.map((cell) => ({ ...cell, style: { ...(cell.style || {}) } })));

      const sourceGrid = expanded.map((row) => row.map((cell) => ({ ...cell, style: { ...(cell.style || {}) } })));

      const changedCells = [];

      for (let row = targetRange.startRow; row <= targetRange.endRow; row += 1) {
        for (let col = targetRange.startCol; col <= targetRange.endCol; col += 1) {
          const isSource =
            row >= sourceRange.startRow &&
            row <= sourceRange.endRow &&
            col >= sourceRange.startCol &&
            col <= sourceRange.endCol;

          if (isSource) continue;

          copy[row][col] = buildFillValue({
            sourceRange,
            targetRow: row,
            targetCol: col,
            sourceGrid,
            context: workbookContext,
          });
          changedCells.push({ rowIndex: row, colIndex: col, cell: copy[row][col] });
        }
      }

      scheduleCellsPersist(activeSheet.id, changedCells);

      return {
        ...prev,
        [activeSheet.id]: copy,
      };
    });
  }

  async function importProductsToActiveSheet() {
    if (!activeSheet) return;

    const rowsNeeded = Math.max(DEFAULT_ROWS, products.length + PRODUCT_IMPORT_EXTRA_ROWS + 1);
    const grid = createEmptyGrid(rowsNeeded, DEFAULT_COLUMNS);

    STARTER_COLUMNS.forEach((label, index) => {
      grid[0][index] = { value: label, formula: '' };
    });

    products.forEach((product, index) => {
      const row = index + 1;
      grid[row][0] = { value: product.codigo || '', formula: '' };
      grid[row][1] = { value: product.nombre || '', formula: '' };
      grid[row][2] = { value: String(product.precio || 0), formula: '' };
      grid[row][3] = { value: String(product.precio_compra || 0), formula: '' };
      grid[row][4] = { value: '1', formula: '' };
      grid[row][5] = { value: '', formula: `=C${row + 1}*E${row + 1}` };
      grid[row][6] = { value: '', formula: `=(C${row + 1}-D${row + 1})*E${row + 1}` };
      grid[row][7] = { value: '', formula: '' };
    });

    setGridsBySheet((prev) => {
      pushUndoSnapshot(prev);
      return { ...prev, [activeSheet.id]: grid };
    });

    // Guarda la carga de productos para que otros usuarios la vean sin esperar al botón Guardar.
    window.setTimeout(() => {
      saveSheetCells(activeSheet.id, grid)
        .then(() => {
          realtimeChannelRef.current?.send?.({ type: 'broadcast', event: 'workbook-reload', payload: {} });
        })
        .catch((saveError) => {
          console.warn('No se pudo sincronizar la carga de productos:', saveError);
        });
    }, 100);

    if (activeSheet.name !== PRODUCTS_SHEET_NAME) {
      try {
        const updated = await renameSheet(activeSheet.id, PRODUCTS_SHEET_NAME);
        setWorkbook((prev) => ({
          ...prev,
          playground_sheets: prev.playground_sheets.map((sheet) =>
            sheet.id === activeSheet.id ? { ...sheet, name: updated.name } : sheet,
          ),
        }));
      } catch (renameError) {
        console.warn('No se pudo renombrar la hoja de productos:', renameError);
      }
    }

    setMessage(`Se cargaron ${products.length} productos. En una hoja limpia puedes usar =Productos!C2 o =SUM(Productos!F2:F${products.length + 1}).`);
  }

  async function saveActiveSheet() {
    if (!activeSheet) return;

    setSaving(true);

    try {
      await saveSheetCells(activeSheet.id, activeGrid);
      await updateWorkbook(workbook.id, {});
      realtimeChannelRef.current?.send?.({ type: 'broadcast', event: 'workbook-reload', payload: {} });
      setMessage('Cambios guardados.');
    } finally {
      setSaving(false);
    }
  }

  async function addSheet() {
    if (!workbook) return;

    setSaving(true);

    try {
      const sheet = await createSheet(workbook.id, `Hoja ${sheets.length + 1}`, sheets.length);

      setWorkbook((prev) => ({
        ...prev,
        playground_sheets: [...(prev.playground_sheets || []), sheet],
      }));

      setGridsBySheet((prev) => ({ ...prev, [sheet.id]: createEmptyGrid() }));
      setActiveSheetId(sheet.id);
    } finally {
      setSaving(false);
    }
  }


  async function removeSheet(sheetId) {
    if (!workbook || !sheetId) return;

    if ((workbook.playground_sheets || []).length <= 1) {
      setMessage('Debe existir al menos una hoja.');
      return;
    }

    setSaving(true);

    try {
      await deleteSheet(sheetId);

      setWorkbook((prev) => {
        const nextSheets = (prev.playground_sheets || []).filter((sheet) => sheet.id !== sheetId);
        return {
          ...prev,
          playground_sheets: nextSheets,
        };
      });

      setGridsBySheet((prev) => {
        const copy = { ...prev };
        delete copy[sheetId];
        return copy;
      });

      if (activeSheetId === sheetId) {
        const nextSheet = (workbook.playground_sheets || []).find((sheet) => sheet.id !== sheetId);
        setActiveSheetId(nextSheet?.id || null);
      }

      setMessage('Hoja eliminada.');
    } finally {
      setSaving(false);
    }
  }

  async function updateSheetName(sheetId, name) {
    const updated = await renameSheet(sheetId, name);

    setWorkbook((prev) => ({
      ...prev,
      playground_sheets: prev.playground_sheets.map((sheet) =>
        sheet.id === sheetId ? { ...sheet, name: updated.name } : sheet,
      ),
    }));
  }

  async function togglePublic(enabled, mode = workbook?.share_mode || 'view') {
    if (!workbook) return;

    setSaving(true);

    try {
      const updated = await toggleWorkbookPublic(workbook.id, enabled, mode);
      setWorkbook((prev) => ({ ...prev, ...updated, share_mode: updated.share_mode || mode }));
      setMessage(enabled ? 'Link público activado.' : 'Link público desactivado.');
    } finally {
      setSaving(false);
    }
  }

  async function changeShareMode(mode = 'view') {
    if (!workbook) return;

    setSaving(true);

    try {
      const updated = await updateWorkbookShareMode(workbook.id, mode);
      setWorkbook((prev) => ({ ...prev, ...updated, share_mode: updated.share_mode || mode }));
      setMessage(mode === 'edit' ? 'El link permite edición.' : 'El link quedó en solo lectura.');
    } finally {
      setSaving(false);
    }
  }

  async function removeWorkbook() {
    if (!workbook) return;

    setSaving(true);

    try {
      await deletePlayground(workbook.id);
      setMessage('Playground eliminado.');
    } finally {
      setSaving(false);
    }
  }

  return {
    workbook,
    sheets,
    activeSheet,
    activeSheetId,
    activeGrid,
    gridsBySheet,
    products,
    loading,
    saving,
    message,
    error,
    setMessage,
    setActiveSheetId,
    updateCell,
    updateCellInSheet,
    updateCellStyle,
    fillCells,
    addRows,
    addColumns,
    importProductsToActiveSheet,
    saveActiveSheet,
    addSheet,
    updateSheetName,
    removeSheet,
    togglePublic,
    changeShareMode,
    removeWorkbook,
    undoLastChange,
    reload: load,
  };
}
