import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createSheet,
  deletePlayground,
  deleteSheet,
  getPlaygroundById,
  getProductsForPlayground,
  getPlaygroundImportData,
  applyProductBulkChanges,
  getProductsByIdsForPlayground,
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
  cellsToGrid,
  createEmptyGrid,
  ensureGridSize,
  getGridDataBounds,
} from '../excelModule/excel.helpers';
import {
  buildFillValue,
  makeGridFromObjects,
} from '../excelModule/excelData.helpers';
import {
  buildProductChangesFromGrid,
  getProductIdsFromGrid,
  isProductSheetLike,
  makeProductChangesGrid,
  reconcileProductSheetGrid,
} from '../domain/productExcel.adapter';
import {
  DEFAULT_COLUMNS,
  DEFAULT_ROWS,
  PRODUCT_IMPORT_EXTRA_ROWS,
  PRODUCTS_SHEET_NAME,
  STARTER_COLUMNS,
} from '../playground.constants';

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
  const redoHistoryRef = useRef([]);
  const maxUndoSteps = 60;
  const pendingCellSavesRef = useRef({});
  const pendingSaveTimerRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const lastRealtimeStatusRef = useRef('');

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
    redoHistoryRef.current = [];
  }, [cloneGrids]);

  const undoLastChange = useCallback(() => {
    const lastSnapshot = undoHistoryRef.current.pop();

    if (!lastSnapshot) {
      setMessage('No hay cambios para deshacer.');
      return;
    }

    setGridsBySheet((current) => {
      redoHistoryRef.current = [
        ...redoHistoryRef.current.slice(-(maxUndoSteps - 1)),
        cloneGrids(current),
      ];
      return cloneGrids(lastSnapshot);
    });
    setMessage('Cambio deshecho.');
  }, [cloneGrids]);

  const redoLastChange = useCallback(() => {
    const nextSnapshot = redoHistoryRef.current.pop();

    if (!nextSnapshot) {
      setMessage('No hay cambios para rehacer.');
      return;
    }

    setGridsBySheet((current) => {
      undoHistoryRef.current = [
        ...undoHistoryRef.current.slice(-(maxUndoSteps - 1)),
        cloneGrids(current),
      ];
      return cloneGrids(nextSnapshot);
    });
    setMessage('Cambio rehecho.');
  }, [cloneGrids]);

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
    }, 250);
  }, []);


  const flushPendingCellSaves = useCallback(async () => {
    if (pendingSaveTimerRef.current) {
      window.clearTimeout(pendingSaveTimerRef.current);
      pendingSaveTimerRef.current = null;
    }

    const pending = pendingCellSavesRef.current;
    pendingCellSavesRef.current = {};

    const entries = Object.entries(pending || {});
    if (!entries.length) return;

    await Promise.all(
      entries.map(async ([targetSheetId, map]) => {
        const changedCells = Object.values(map || {});
        if (!changedCells.length) return;

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
  }, []);

  const applyRealtimeCellChange = useCallback((payload) => {
    const rowData = payload.new || payload.old;
    const sheetId = rowData?.sheet_id;
    if (!sheetId) return;

    setGridsBySheet((prev) => {
      const rowIndex = Number(rowData.row_index || 0);
      const colIndex = Number(rowData.col_index || 0);
      const grid = ensureGridSize(prev[sheetId] || createEmptyGrid(), rowIndex + 1, colIndex + 1);
      const copy = [...grid];
      const rowCopy = [...(copy[rowIndex] || [])];
      copy[rowIndex] = rowCopy;

      if (payload.eventType === 'DELETE') {
        rowCopy[colIndex] = { value: '', formula: '', style: {} };
      } else {
        rowCopy[colIndex] = {
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


  async function load({ showFullPageLoading = false } = {}) {
    if (!workbookId) {
      setError('No se recibió el ID del playground. Revisa la ruta configurada en React Router.');
      setLoading(false);
      return;
    }

    const shouldShowFullPageLoading = showFullPageLoading || !workbook;

    if (shouldShowFullPageLoading) {
      setLoading(true);
    }

    setError('');

    try {
      if (workbook) {
        await flushPendingCellSaves();
      }

      const [workbookData, productsData] = await Promise.all([
        getPlaygroundById(workbookId),
        getProductsForPlayground(),
      ]);

      const nextGrids = {};
      const sheets = workbookData.playground_sheets || [];

      sheets.forEach((sheet) => {
        const loadedGrid = cellsToGrid(
          sheet.playground_cells || [],
          DEFAULT_ROWS,
          DEFAULT_COLUMNS,
          { compactRows: false },
        );

        // Si la hoja es de productos, la fuente de verdad es la tabla productos.
        // No compactamos huecos ni inventamos filas: reconstruimos las filas usando
        // los productos reales disponibles. Así deben aparecer los 109 productos si
        // existen en la tabla productos y están habilitados.
        nextGrids[sheet.id] = isProductSheetLike(sheet, loadedGrid)
          ? reconcileProductSheetGrid(loadedGrid, productsData)
          : loadedGrid;
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
    load({ showFullPageLoading: true });
  }, [workbookId]);

  useEffect(() => () => {
    flushPendingCellSaves().catch((saveError) => {
      console.warn('No se pudieron guardar cambios pendientes al salir:', saveError);
    });
    if (realtimeChannelRef.current) removePlaygroundChannel(realtimeChannelRef.current);
  }, [flushPendingCellSaves]);


  useEffect(() => {
    function handleBeforeLeave() {
      flushPendingCellSaves().catch((saveError) => {
        console.warn('No se pudieron guardar cambios pendientes antes de salir:', saveError);
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') handleBeforeLeave();
    }

    window.addEventListener('pagehide', handleBeforeLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', handleBeforeLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushPendingCellSaves]);


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
      onSheetChange: () => load({ showFullPageLoading: false }),
      onWorkbookChange: () => load({ showFullPageLoading: false }),
      onRealtimeStatus: (status) => {
        lastRealtimeStatusRef.current = status;
        if (status === 'CHANNEL_ERROR') {
          setMessage('Realtime no conectó. Revisa REALTIME_SETUP.sql en Supabase.');
        }
      },
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
      const copy = [...grid];
      const rowCopy = [...(copy[rowIndex] || [])];
      copy[rowIndex] = rowCopy;
      const currentCell = rowCopy[colIndex] || { value: '', formula: '', style: {} };
      const isFormula = String(value || '').startsWith('=');

      const nextCell = {
        ...currentCell,
        style: { ...(currentCell.style || {}) },
        value: isFormula ? '' : value,
        formula: isFormula ? value : '',
      };

      rowCopy[colIndex] = nextCell;
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
      const copy = [...grid];
      const rowCopy = [...(copy[rowIndex] || [])];
      copy[rowIndex] = rowCopy;
      const currentCell = rowCopy[colIndex] || { value: '', formula: '', style: {} };
      const isFormula = String(value || '').startsWith('=');

      const nextCell = {
        ...currentCell,
        style: { ...(currentCell.style || {}) },
        value: isFormula ? '' : value,
        formula: isFormula ? value : '',
      };

      rowCopy[colIndex] = nextCell;
      scheduleCellsPersist(sheetId, [{ rowIndex, colIndex, cell: nextCell }]);

      return {
        ...prev,
        [sheetId]: copy,
      };
    });
  }


  function updateCellsBulk(changes = []) {
    if (!activeSheet || !Array.isArray(changes) || !changes.length) return;

    setGridsBySheet((prev) => {
      pushUndoSnapshot(prev);

      const maxRow = changes.reduce((max, item) => Math.max(max, Number(item.rowIndex || 0)), 0);
      const maxCol = changes.reduce((max, item) => Math.max(max, Number(item.colIndex || 0)), 0);
      const grid = ensureGridSize(prev[activeSheet.id] || createEmptyGrid(), maxRow + 1, maxCol + 1);
      const copy = [...grid];
      const changedCells = [];
      const rowCopies = new Map();

      function getRowCopy(rowIndex) {
        if (rowCopies.has(rowIndex)) return rowCopies.get(rowIndex);
        const rowCopy = [...(copy[rowIndex] || [])];
        copy[rowIndex] = rowCopy;
        rowCopies.set(rowIndex, rowCopy);
        return rowCopy;
      }

      changes.forEach((item) => {
        const rowIndex = Number(item.rowIndex || 0);
        const colIndex = Number(item.colIndex || 0);
        const rowCopy = getRowCopy(rowIndex);
        const currentCell = rowCopy[colIndex] || { value: '', formula: '', style: {} };
        const rawValue = item.value ?? '';
        const isFormula = String(rawValue || '').startsWith('=');
        const nextCell = {
          ...currentCell,
          style: { ...(currentCell.style || {}) },
          value: isFormula ? '' : rawValue,
          formula: isFormula ? rawValue : '',
        };

        rowCopy[colIndex] = nextCell;
        changedCells.push({ rowIndex, colIndex, cell: nextCell });
      });

      scheduleCellsPersist(activeSheet.id, changedCells);

      return {
        ...prev,
        [activeSheet.id]: copy,
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
      const copy = [...grid];
      const changedCells = [];

      for (let row = range.startRow; row <= range.endRow; row += 1) {
        const rowCopy = [...(copy[row] || [])];
        copy[row] = rowCopy;

        for (let col = range.startCol; col <= range.endCol; col += 1) {
          const currentCell = rowCopy[col] || { value: '', formula: '', style: {} };
          rowCopy[col] = {
            ...currentCell,
            style: {
              ...(currentCell.style || {}),
              ...nextStyle,
            },
          };
          changedCells.push({ rowIndex: row, colIndex: col, cell: rowCopy[col] });
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
      const copy = [...expanded];
      const sourceGrid = expanded;
      const changedCells = [];

      for (let row = targetRange.startRow; row <= targetRange.endRow; row += 1) {
        const rowCopy = [...(copy[row] || [])];
        copy[row] = rowCopy;

        for (let col = targetRange.startCol; col <= targetRange.endCol; col += 1) {
          const isSource =
            row >= sourceRange.startRow &&
            row <= sourceRange.endRow &&
            col >= sourceRange.startCol &&
            col <= sourceRange.endCol;

          if (isSource) continue;

          rowCopy[col] = buildFillValue({
            sourceRange,
            targetRow: row,
            targetCol: col,
            sourceGrid,
            context: workbookContext,
          });
          changedCells.push({ rowIndex: row, colIndex: col, cell: rowCopy[col] });
        }
      }

      scheduleCellsPersist(activeSheet.id, changedCells);

      return {
        ...prev,
        [activeSheet.id]: copy,
      };
    });
  }


  async function importDataToSheet(options) {
    if (!activeSheet || !workbook) return;

    setSaving(true);

    try {
      await flushPendingCellSaves();
      const rows = await getPlaygroundImportData(options);
      const fields = options?.fields?.length ? options.fields : Array.from(new Set(rows.flatMap((row) => Object.keys(row || {}))));
      const grid = makeGridFromObjects(rows, fields);
      let targetSheet = activeSheet;

      if (options?.destination === 'new') {
        targetSheet = await createSheet(workbook.id, options.sheetName || 'Datos', sheets.length);
        setWorkbook((prev) => ({
          ...prev,
          playground_sheets: [...(prev.playground_sheets || []), targetSheet],
        }));
        setActiveSheetId(targetSheet.id);
      } else if (options?.sheetName && activeSheet.name !== options.sheetName) {
        const updated = await renameSheet(activeSheet.id, options.sheetName);
        targetSheet = { ...activeSheet, name: updated.name };
        setWorkbook((prev) => ({
          ...prev,
          playground_sheets: prev.playground_sheets.map((sheet) =>
            sheet.id === activeSheet.id ? { ...sheet, name: updated.name } : sheet,
          ),
        }));
      }

      setGridsBySheet((prev) => {
        pushUndoSnapshot(prev);
        return { ...prev, [targetSheet.id]: grid };
      });

      const savedCells = await saveSheetCells(targetSheet.id, grid);
      realtimeChannelRef.current?.send?.({ type: 'broadcast', event: 'workbook-reload', payload: {} });
      setMessage(`Se importaron ${rows.length} registros en ${targetSheet.name || options.sheetName || 'la hoja'} y se guardaron ${savedCells.length} celdas con datos.`);
    } finally {
      setSaving(false);
    }
  }

  async function prepareProductChangesSheet() {
    if (!workbook) return;

    setSaving(true);

    try {
      await flushPendingCellSaves();
      const grid = makeProductChangesGrid(products);
      const sheet = await createSheet(workbook.id, 'Cambios productos', sheets.length);

      setWorkbook((prev) => ({
        ...prev,
        playground_sheets: [...(prev.playground_sheets || []), sheet],
      }));
      setGridsBySheet((prev) => ({ ...prev, [sheet.id]: grid }));
      setActiveSheetId(sheet.id);

      const savedCells = await saveSheetCells(sheet.id, grid);
      realtimeChannelRef.current?.send?.({ type: 'broadcast', event: 'workbook-reload', payload: {} });
      setMessage(`Hoja de cambios de productos creada. Se guardaron ${savedCells.length} celdas con datos. El precio se calcula con fórmula desde costo y utilidad %, así puedes modificar utilidad y aplicar precios sin hacerlo a mano.`);
    } finally {
      setSaving(false);
    }
  }

  async function getProductBulkChangesFromActiveSheet() {
    const productIds = getProductIdsFromGrid(activeGrid);
    const freshProducts = productIds.length ? await getProductsByIdsForPlayground(productIds) : [];
    const productsById = Object.fromEntries((freshProducts || []).map((product) => [product.id, product]));

    return buildProductChangesFromGrid(activeGrid, workbookContext, productsById);
  }

  async function applyProductBulkChangesFromActiveSheet(changes) {
    const sourceChanges = Array.isArray(changes) ? changes : await getProductBulkChangesFromActiveSheet();
    const cleanChanges = sourceChanges.filter((change) => change.action !== 'invalid');

    if (!cleanChanges.length) {
      setMessage('No hay cambios válidos para aplicar. Revisa las filas marcadas como incompletas.');
      return null;
    }

    setSaving(true);

    try {
      const result = await applyProductBulkChanges({
        playgroundId: workbook?.id,
        changes: cleanChanges.map(({ fields, display_codigo: _displayCode, display_name: _displayName, ...payload }) => payload),
      });
      setMessage(`Cambios aplicados. Productos actualizados: ${result?.updated_count ?? 0}. Productos creados: ${result?.created_count ?? 0}.`);
      await load({ showFullPageLoading: false });
      return result;
    } finally {
      setSaving(false);
    }
  }

  async function importProductsToActiveSheet() {
    if (!activeSheet) return;

    const rowsNeeded = Math.max(DEFAULT_ROWS, products.length + PRODUCT_IMPORT_EXTRA_ROWS + 1);
    await flushPendingCellSaves();

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
      await flushPendingCellSaves();
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


  async function switchActiveSheet(sheetId) {
    if (!sheetId || sheetId === activeSheetId) return;
    try {
      await flushPendingCellSaves();
    } catch (saveError) {
      console.warn('No se pudieron guardar cambios pendientes antes de cambiar hoja:', saveError);
      setMessage('Algunos cambios pendientes no se sincronizaron. Presiona Guardar.');
    }
    setActiveSheetId(sheetId);
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
    setActiveSheetId: switchActiveSheet,
    updateCell,
    updateCellInSheet,
    updateCellsBulk,
    updateCellStyle,
    fillCells,
    addRows,
    addColumns,
    importProductsToActiveSheet,
    importDataToSheet,
    prepareProductChangesSheet,
    getProductBulkChangesFromActiveSheet,
    applyProductBulkChangesFromActiveSheet,
    saveActiveSheet,
    addSheet,
    updateSheetName,
    removeSheet,
    togglePublic,
    changeShareMode,
    removeWorkbook,
    undoLastChange,
    redoLastChange,
    flushPendingCellSaves,
    reload: () => load({ showFullPageLoading: false }),
  };
}
