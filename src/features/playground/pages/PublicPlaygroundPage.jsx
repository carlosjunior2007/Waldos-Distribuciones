import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, Database, Eraser, Eye, FileSpreadsheet, HelpCircle, Italic, Loader2, PaintBucket, Palette, Plus, Save, Sigma, Text, Underline, UsersRound } from 'lucide-react';
import PlaygroundGrid from '../components/PlaygroundGrid';
import PlaygroundPresence from '../components/PlaygroundPresence';
import PlaygroundSheetsTabs from '../components/PlaygroundSheetsTabs';
import ExcelHelpModal from '../excelModule/components/ExcelHelpModal';
import { usePlaygroundPresence } from '../hooks/usePlaygroundPresence';
import {
  createPublicSheet,
  deletePublicSheet,
  getPublicPlaygroundByToken,
  removePlaygroundChannel,
  savePublicCell,
  savePublicSheetCells,
  subscribeToPlaygroundChanges,
} from '../services/playground.service';
import { cellsToGrid, createEmptyGrid, ensureGridSize, makeCellId, makeWorkbookContext } from '../playground.helpers';
import { DEFAULT_COLUMNS, DEFAULT_ROWS } from '../playground.constants';


function ToolbarMenu({ label, icon: Icon, open, onToggle, onClose, children, wide = false, align = 'left' }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) onClose?.();
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle?.();
        }}
        className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
          open ? 'bg-slate-100 text-slate-950' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
        }`}
      >
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open ? (
        <div
          onClick={(event) => event.stopPropagation()}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-50 mt-2 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-slate-900/5 ${wide ? 'w-[520px]' : 'w-[340px]'}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ icon: Icon, label, hint, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950">
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint ? <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">{hint}</span> : null}
    </button>
  );
}

function ToolButton({ icon: Icon, label, title, onClick, disabled }) {
  return (
    <button type="button" title={title || label} onClick={onClick} disabled={disabled} className="inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950 disabled:opacity-50">
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {label ? <span>{label}</span> : null}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-slate-200" />;
}

function ColorControl({ icon: Icon, value, onChange, title }) {
  return (
    <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950" title={title}>
      <Icon className="h-4 w-4" />
      <span className="h-3.5 w-5 rounded border border-slate-300" style={{ backgroundColor: value }} />
      <input type="color" value={value} onChange={onChange} className="sr-only" />
    </label>
  );
}


function cleanStyle(style = {}) {
  return Object.fromEntries(Object.entries(style || {}).filter(([, value]) => value !== '' && value !== null && value !== undefined));
}

export default function PublicPlaygroundPage() {
  const params = useParams();
  const token = params.token || params.shareToken;
  const [workbook, setWorkbook] = useState(null);
  const [activeSheetId, setActiveSheetId] = useState(null);
  const [grids, setGrids] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeCell, setActiveCell] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [formulaDraft, setFormulaDraft] = useState('');
  const [fontSize, setFontSize] = useState('14');
  const [textColor, setTextColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textOpacity, setTextOpacity] = useState(100);
  const [bgOpacity, setBgOpacity] = useState(100);
  const [openMenu, setOpenMenu] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const realtimeChannelRef = useRef(null);
  const publicSaveTimersRef = useRef({});

  const sheets = workbook?.playground_sheets || [];
  const activeSheet = sheets.find((sheet) => sheet.id === activeSheetId) || sheets[0];
  const activeGrid = activeSheet ? grids[activeSheet.id] || createEmptyGrid() : createEmptyGrid();
  const canEdit = workbook?.share_mode === 'edit';
  const activeCellKey = activeCell ? makeCellId(activeCell.rowIndex, activeCell.colIndex) : '';

  const presenceMembers = usePlaygroundPresence(
    workbook?.id || token,
    activeSheet?.name || activeSheet?.nombre || 'Hoja',
    canEdit ? 'editando link público' : 'viendo link público',
    activeCellKey,
  );

  const workbookContext = useMemo(() => makeWorkbookContext({
    sheets,
    gridsBySheet: grids,
    activeSheetId,
    activeGrid,
  }), [sheets, grids, activeSheetId, activeGrid]);

  const applyRealtimeCellChange = useCallback((payload) => {
    const rowData = payload.new || payload.old;
    const sheetId = rowData?.sheet_id;
    if (!sheetId) return;

    setGrids((prev) => {
      const rowIndex = Number(rowData.row_index || 0);
      const colIndex = Number(rowData.col_index || 0);
      const grid = ensureGridSize(prev[sheetId] || createEmptyGrid(), rowIndex + 1, colIndex + 1);
      const copy = [...grid];
      const rowCopy = [...(copy[rowIndex] || [])];
      copy[rowIndex] = rowCopy;

      rowCopy[colIndex] = {
        value: rowData.value ?? '',
        formula: rowData.formula ?? '',
        style: rowData.style || {},
      };

      return { ...prev, [sheetId]: copy };
    });
  }, []);

  const reloadWorkbook = useCallback(async () => {
    const data = await getPublicPlaygroundByToken(token);
    const nextGrids = {};
    const nextSheets = data.playground_sheets || [];

    nextSheets.forEach((sheet) => {
      nextGrids[sheet.id] = cellsToGrid(sheet.playground_cells || [], DEFAULT_ROWS, DEFAULT_COLUMNS, { compactRows: false });
    });

    setWorkbook(data);
    setGrids(nextGrids);
    setActiveSheetId((current) => {
      if (current && nextSheets.some((sheet) => sheet.id === current)) return current;
      return nextSheets[0]?.id || null;
    });

    return data;
  }, [token]);

  const schedulePublicCellSave = useCallback((sheetId, rowIndex, colIndex, cell) => {
    if (!token || !sheetId) return;

    const key = `${sheetId}:${rowIndex}:${colIndex}`;
    if (publicSaveTimersRef.current[key]) {
      window.clearTimeout(publicSaveTimersRef.current[key]);
    }

    publicSaveTimersRef.current[key] = window.setTimeout(async () => {
      delete publicSaveTimersRef.current[key];
      try {
        await savePublicCell(token, sheetId, rowIndex, colIndex, cell);
        realtimeChannelRef.current?.send?.({
          type: 'broadcast',
          event: 'cell-change',
          payload: {
            sheetId,
            cells: [{ rowIndex, colIndex, cell }],
          },
        });
      } catch (saveError) {
        console.error('Error sincronizando celda pública:', saveError);
        setMessage('No se pudo sincronizar el cambio. Intenta guardar manualmente.');
      }
    }, 650);
  }, [token]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');

      try {
        await reloadWorkbook();
      } catch (loadError) {
        console.error('Error cargando playground público:', loadError);
        setError('No se encontró este playground o ya no está compartido.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [reloadWorkbook]);

  useEffect(() => () => {
    Object.values(publicSaveTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    if (realtimeChannelRef.current) removePlaygroundChannel(realtimeChannelRef.current);
  }, []);

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
      onSheetChange: async () => {
        try {
          await reloadWorkbook();
        } catch (err) {
          console.warn('No se pudo refrescar hojas públicas:', err);
        }
      },
      onWorkbookChange: async () => {
        try {
          await reloadWorkbook();
        } catch (err) {
          console.warn('No se pudo refrescar playground público:', err);
        }
      },
    });

    realtimeChannelRef.current = channel;

    return () => {
      removePlaygroundChannel(channel);
      if (realtimeChannelRef.current === channel) realtimeChannelRef.current = null;
    };
  }, [workbook?.id, sheets.map((sheet) => sheet.id).join(','), reloadWorkbook, applyRealtimeCellChange]);

  useEffect(() => {
    if (!activeCell) {
      setFormulaDraft('');
      return;
    }

    const cell = activeGrid[activeCell.rowIndex]?.[activeCell.colIndex] || { value: '', formula: '' };
    setFormulaDraft(cell.formula || cell.value || '');
  }, [activeCell, activeGrid]);

  function updateCell(rowIndex, colIndex, value) {
    if (!canEdit || !activeSheet) return;

    setGrids((prev) => {
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
      schedulePublicCellSave(activeSheet.id, rowIndex, colIndex, nextCell);

      return { ...prev, [activeSheet.id]: copy };
    });
  }


  function updateCellsBulk(changes = []) {
    if (!canEdit || !activeSheet || !Array.isArray(changes) || !changes.length) return;

    const touchedCells = changes.map((item) => {
      const rowIndex = Number(item.rowIndex || 0);
      const colIndex = Number(item.colIndex || 0);
      const currentCell = activeGrid[rowIndex]?.[colIndex] || { value: '', formula: '', style: {} };
      const value = item.value ?? '';
      const isFormula = String(value || '').startsWith('=');

      return {
        rowIndex,
        colIndex,
        cell: {
          ...currentCell,
          style: { ...(currentCell.style || {}) },
          value: isFormula ? '' : value,
          formula: isFormula ? value : '',
        },
      };
    });

    setGrids((prev) => {
      const maxRow = touchedCells.reduce((max, item) => Math.max(max, item.rowIndex), 0);
      const maxCol = touchedCells.reduce((max, item) => Math.max(max, item.colIndex), 0);
      const grid = ensureGridSize(prev[activeSheet.id] || createEmptyGrid(), maxRow + 1, maxCol + 1);
      const copy = [...grid];
      const rowCopies = new Map();

      function getRowCopy(rowIndex) {
        if (rowCopies.has(rowIndex)) return rowCopies.get(rowIndex);
        const rowCopy = [...(copy[rowIndex] || [])];
        copy[rowIndex] = rowCopy;
        rowCopies.set(rowIndex, rowCopy);
        return rowCopy;
      }

      touchedCells.forEach(({ rowIndex, colIndex, cell }) => {
        getRowCopy(rowIndex)[colIndex] = cell;
      });

      return { ...prev, [activeSheet.id]: copy };
    });

    touchedCells.forEach(({ rowIndex, colIndex, cell }) => {
      schedulePublicCellSave(activeSheet.id, rowIndex, colIndex, cell);
    });

    realtimeChannelRef.current?.send?.({
      type: 'broadcast',
      event: 'cell-change',
      payload: {
        sheetId: activeSheet.id,
        cells: touchedCells,
      },
    });
  }


  function handleSelectionChange(range, cell) {
    setSelectedRange(range);
    if (cell) setActiveCell(cell);
  }

  function applyPublicStyle(nextStyle) {
    if (!canEdit || !activeSheet) return;

    if (!selectedRange) {
      setMessage('Selecciona una o varias celdas antes de aplicar formato.');
      return;
    }

    const baseGrid = ensureGridSize(
      activeGrid,
      selectedRange.endRow + 1,
      selectedRange.endCol + 1,
    );
    const nextGrid = [...baseGrid];
    const touchedCells = [];

    for (let rowIndex = selectedRange.startRow; rowIndex <= selectedRange.endRow; rowIndex += 1) {
      const rowCopy = [...(nextGrid[rowIndex] || [])];
      nextGrid[rowIndex] = rowCopy;

      for (let colIndex = selectedRange.startCol; colIndex <= selectedRange.endCol; colIndex += 1) {
        const current = rowCopy[colIndex] || { value: '', formula: '', style: {} };
        const nextCell = {
          ...current,
          style: cleanStyle({ ...(current.style || {}), ...nextStyle }),
        };
        rowCopy[colIndex] = nextCell;
        touchedCells.push({ rowIndex, colIndex, cell: nextCell });
      }
    }

    setGrids((prev) => ({ ...prev, [activeSheet.id]: nextGrid }));

    touchedCells.forEach(({ rowIndex, colIndex, cell }) => {
      schedulePublicCellSave(activeSheet.id, rowIndex, colIndex, cell);
    });

    realtimeChannelRef.current?.send?.({
      type: 'broadcast',
      event: 'cell-change',
      payload: {
        sheetId: activeSheet.id,
        cells: touchedCells,
      },
    });
  }

  function clearPublicStyle() {
    applyPublicStyle({
      bold: false,
      textColor: '',
      bgColor: '',
      fontSize: '',
      textOpacity: '',
      bgOpacity: '',
    });
  }

  function handleFormulaChange(value) {
    setFormulaDraft(value);
    if (!activeCell || !canEdit) return;
    updateCell(activeCell.rowIndex, activeCell.colIndex, value);
  }

  function handleFormulaKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  function addRows(count = 120) {
    if (!activeSheet) return;

    setGrids((prev) => {
      const grid = prev[activeSheet.id] || createEmptyGrid();
      return {
        ...prev,
        [activeSheet.id]: ensureGridSize(grid, grid.length + Number(count || 120), Math.max(grid[0]?.length || 0, DEFAULT_COLUMNS)),
      };
    });
  }

  function addColumns(count = 12) {
    if (!activeSheet) return;

    setGrids((prev) => {
      const grid = prev[activeSheet.id] || createEmptyGrid();
      return {
        ...prev,
        [activeSheet.id]: ensureGridSize(grid, grid.length, Math.max(grid[0]?.length || 0, DEFAULT_COLUMNS) + Number(count || 12)),
      };
    });
  }

  async function handleAddSheet() {
    if (!canEdit || !workbook?.id) return;

    setSaving(true);
    setMessage('');

    try {
      await createPublicSheet(token, `Hoja ${sheets.length + 1}`, sheets.length);
      await reloadWorkbook();
      realtimeChannelRef.current?.send?.({ type: 'broadcast', event: 'workbook-reload', payload: {} });
    } catch (sheetError) {
      console.error('Error creando hoja pública:', sheetError);
      setMessage('No se pudo crear la hoja. Revisa que el link permita edición.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSheet(sheetId) {
    if (!canEdit || sheets.length <= 1) return;

    setSaving(true);
    setMessage('');

    try {
      await deletePublicSheet(token, sheetId);
      await reloadWorkbook();
      realtimeChannelRef.current?.send?.({ type: 'broadcast', event: 'workbook-reload', payload: {} });
    } catch (sheetError) {
      console.error('Error eliminando hoja pública:', sheetError);
      setMessage('No se pudo eliminar la hoja. Revisa que el link permita edición.');
    } finally {
      setSaving(false);
    }
  }

  async function savePublicChanges() {
    if (!canEdit || !activeSheet) return;

    setSaving(true);
    setMessage('');

    try {
      await savePublicSheetCells(token, activeSheet.id, activeGrid);
      realtimeChannelRef.current?.send?.({ type: 'broadcast', event: 'workbook-reload', payload: {} });
      setMessage('Cambios guardados.');
    } catch (saveError) {
      console.error('Error guardando playground público:', saveError);
      setMessage('No se pudieron guardar los cambios. Revisa que el link permita edición.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-black text-slate-950">No disponible</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-slate-50">
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="mb-3 overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-black text-slate-950">{workbook.name}</p>
                <p className="text-xs font-semibold text-slate-500">{canEdit ? 'Link con edición' : 'Solo lectura'} · Hoja activa: {activeSheet?.name || activeSheet?.nombre || 'Hoja'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">

              {canEdit ? (
                <ToolbarMenu label="Archivo" icon={FileSpreadsheet} open={openMenu === 'file'} onToggle={() => setOpenMenu((value) => (value === 'file' ? '' : 'file'))} onClose={() => setOpenMenu('')} align="right">
                  <MenuItem icon={Save} label="Guardar cambios" hint="Ctrl+S" onClick={savePublicChanges} />
                  <MenuItem icon={HelpCircle} label="Abrir ayuda del módulo" onClick={() => { setHelpOpen(true); setOpenMenu(''); }} />
                </ToolbarMenu>
              ) : null}

              {canEdit ? (
                <ToolbarMenu label="Datos" icon={Database} open={openMenu === 'data'} onToggle={() => setOpenMenu((value) => (value === 'data' ? '' : 'data'))} onClose={() => setOpenMenu('')} align="right">
                  <MenuItem icon={Plus} label="Agregar 120 filas visibles" onClick={() => { addRows(120); setOpenMenu(''); }} />
                  <MenuItem icon={Plus} label="Agregar 12 columnas visibles" onClick={() => { addColumns(12); setOpenMenu(''); }} />
                  <MenuItem icon={Sigma} label="Insertar autosuma" hint="Alt+=" onClick={() => { setFormulaDraft('=SUM('); setOpenMenu(''); }} />
                </ToolbarMenu>
              ) : null}

              {canEdit ? (
                <ToolbarMenu label="Formato" icon={Palette} open={openMenu === 'formatTop'} onToggle={() => setOpenMenu((value) => (value === 'formatTop' ? '' : 'formatTop'))} onClose={() => setOpenMenu('')} wide align="right">
                  <div className="grid gap-3 p-1 text-sm font-semibold text-slate-700 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-3">
                      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Texto</p>
                      <div className="grid gap-2">
                        <MenuItem icon={Bold} label="Negrita" hint="Ctrl+B" onClick={() => applyPublicStyle({ bold: true })} />
                        <MenuItem icon={Italic} label="Cursiva" hint="Ctrl+I" onClick={() => applyPublicStyle({ italic: true })} />
                        <MenuItem icon={Underline} label="Subrayado" hint="Ctrl+U" onClick={() => applyPublicStyle({ underline: true })} />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-3">
                      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Alineación</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => applyPublicStyle({ textAlign: 'left' })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"><AlignLeft className="mx-auto h-4 w-4" />Izq.</button>
                        <button type="button" onClick={() => applyPublicStyle({ textAlign: 'center' })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"><AlignCenter className="mx-auto h-4 w-4" />Centro</button>
                        <button type="button" onClick={() => applyPublicStyle({ textAlign: 'right' })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"><AlignRight className="mx-auto h-4 w-4" />Der.</button>
                      </div>
                      <MenuItem icon={Eraser} label="Limpiar formato" hint="Ctrl+Shift+F" onClick={clearPublicStyle} />
                    </div>
                  </div>
                </ToolbarMenu>
              ) : null}

              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <HelpCircle className="h-4 w-4" />
                Ayuda
              </button>

              <PlaygroundPresence members={presenceMembers} />

              <span className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold ${
                canEdit ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                {canEdit ? <UsersRound className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {canEdit ? 'Editable' : 'Lectura'}
              </span>

              {canEdit ? (
                <button
                  type="button"
                  onClick={savePublicChanges}
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="hidden">
            {canEdit ? (
              <ToolbarMenu label="Formato" icon={Palette} open={openMenu === 'format'} onToggle={() => setOpenMenu((value) => (value === 'format' ? '' : 'format'))} onClose={() => setOpenMenu('')} wide>
                <div className="grid gap-3 p-1 text-sm font-semibold text-slate-700 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Texto</p>
                    <div className="grid gap-2">
                      <MenuItem icon={Bold} label="Negrita" hint="Ctrl+B" onClick={() => applyPublicStyle({ bold: true })} />
                      <MenuItem icon={Italic} label="Cursiva" hint="Ctrl+I" onClick={() => applyPublicStyle({ italic: true })} />
                      <MenuItem icon={Underline} label="Subrayado" hint="Ctrl+U" onClick={() => applyPublicStyle({ underline: true })} />
                    </div>
                    <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      <span>Tamaño</span>
                      <select
                        value={fontSize}
                        onChange={(event) => {
                          setFontSize(event.target.value);
                          applyPublicStyle({ fontSize: Number(event.target.value) });
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none"
                      >
                        {[10, 11, 12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                          <option key={size} value={size}>{size}px</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Alineación y color</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => applyPublicStyle({ textAlign: 'left' })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"><AlignLeft className="mx-auto h-4 w-4" />Izq.</button>
                      <button type="button" onClick={() => applyPublicStyle({ textAlign: 'center' })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"><AlignCenter className="mx-auto h-4 w-4" />Centro</button>
                      <button type="button" onClick={() => applyPublicStyle({ textAlign: 'right' })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"><AlignRight className="mx-auto h-4 w-4" />Der.</button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <label className="grid gap-1 rounded-xl border border-slate-200 p-3"><span className="flex items-center gap-2"><Text className="h-4 w-4" /> Color de letra</span><input type="color" value={textColor} onChange={(event) => { setTextColor(event.target.value); applyPublicStyle({ textColor: event.target.value, textOpacity: Number(textOpacity) / 100 }); }} className="h-8 w-full cursor-pointer border-0 bg-transparent p-0" /></label>
                      <label className="grid gap-1 rounded-xl border border-slate-200 p-3"><span className="flex items-center gap-2"><PaintBucket className="h-4 w-4" /> Color de fondo</span><input type="color" value={bgColor} onChange={(event) => { setBgColor(event.target.value); applyPublicStyle({ bgColor: event.target.value, bgOpacity: Number(bgOpacity) / 100 }); }} className="h-8 w-full cursor-pointer border-0 bg-transparent p-0" /></label>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 p-2">
                  <MenuItem icon={Eraser} label="Limpiar formato de la selección" hint="Ctrl+Shift+F" onClick={clearPublicStyle} />
                </div>
              </ToolbarMenu>
            ) : null}

            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <HelpCircle className="h-4 w-4" />
              Ayuda
            </button>
          </div>

          {canEdit ? (
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-3 py-2">
              <ToolButton icon={Sigma} label="SUM" title="Insertar suma" onClick={() => setFormulaDraft((value) => value || '=SUM(')} />
              <select
                value={fontSize}
                onChange={(event) => {
                  setFontSize(event.target.value);
                  applyPublicStyle({ fontSize: Number(event.target.value) });
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 outline-none"
                title="Tamaño de letra"
              >
                {[10, 11, 12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <ToolbarDivider />
              <ToolButton icon={Bold} title="Negrita" onClick={() => applyPublicStyle({ bold: true })} />
              <ToolButton icon={Italic} title="Cursiva" onClick={() => applyPublicStyle({ italic: true })} />
              <ToolButton icon={Underline} title="Subrayado" onClick={() => applyPublicStyle({ underline: true })} />
              <ToolbarDivider />
              <ToolButton icon={AlignLeft} title="Alinear izquierda" onClick={() => applyPublicStyle({ textAlign: 'left' })} />
              <ToolButton icon={AlignCenter} title="Alinear centro" onClick={() => applyPublicStyle({ textAlign: 'center' })} />
              <ToolButton icon={AlignRight} title="Alinear derecha" onClick={() => applyPublicStyle({ textAlign: 'right' })} />
              <ToolbarDivider />
              <ColorControl icon={Text} value={textColor} title="Color de letra" onChange={(event) => { setTextColor(event.target.value); applyPublicStyle({ textColor: event.target.value, textOpacity: Number(textOpacity) / 100 }); }} />
              <ColorControl icon={PaintBucket} value={bgColor} title="Color de fondo" onChange={(event) => { setBgColor(event.target.value); applyPublicStyle({ bgColor: event.target.value, bgOpacity: Number(bgOpacity) / 100 }); }} />
              <ToolbarDivider />
              <ToolButton icon={Eraser} label="Limpiar" title="Limpiar formato" onClick={clearPublicStyle} />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 px-4 py-2">
            <div className="min-w-[86px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
              {activeCellKey || 'Celda'}
            </div>
            <input
              value={formulaDraft}
              onChange={(event) => handleFormulaChange(event.target.value)}
              onKeyDown={handleFormulaKeyDown}
              readOnly={!canEdit}
              placeholder={canEdit ? 'Escribe un valor o fórmula' : 'Selecciona una celda'}
              className="min-w-[240px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 read-only:bg-slate-50"
            />
          </div>
        </div>

        {message ? (
          <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {message}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="min-h-0 flex-1 overflow-hidden">
            <PlaygroundGrid
              grid={activeGrid}
              sheetId={activeSheetId}
              sheetName={activeSheet?.name || activeSheet?.nombre || 'Hoja'}
              onChange={updateCell}
              onBulkChange={updateCellsBulk}
              onNeedMoreRows={addRows}
              onNeedMoreColumns={addColumns}
              onSelectionChange={handleSelectionChange}
              onSave={savePublicChanges}
              onApplyStyle={(_, style) => applyPublicStyle(style)}
              readOnly={!canEdit}
              workbookContext={workbookContext}
              presenceMembers={presenceMembers}
            />
          </div>

          <PlaygroundSheetsTabs
            sheets={sheets}
            activeSheetId={activeSheetId}
            onChangeSheet={setActiveSheetId}
            onAddSheet={handleAddSheet}
            onDeleteSheet={handleDeleteSheet}
            disabled={saving || !canEdit}
          />
        </div>
      </div>

      <ExcelHelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}
