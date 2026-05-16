import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bold,
  ChevronDown,
  Download,
  Eraser,
  FileSpreadsheet,
  Loader2,
  Maximize2,
  Minimize2,
  PaintBucket,
  PackagePlus,
  Palette,
  Save,
  Share2,
  SlidersHorizontal,
  Text,
  Trash2,
} from 'lucide-react';
import PlaygroundGrid from '../components/PlaygroundGrid';
import PlaygroundPresence from '../components/PlaygroundPresence';
import PlaygroundShareModal from '../components/PlaygroundShareModal';
import PlaygroundSheetsTabs from '../components/PlaygroundSheetsTabs';
import { usePlaygroundPresence } from '../hooks/usePlaygroundPresence';
import { usePlaygroundWorkbook } from '../hooks/usePlaygroundWorkbook';
import { displayCell, makeCellId, makeWorkbookContext } from '../playground.helpers';

function quoteSheetName(name = '') {
  const clean = String(name || 'Hoja').trim();
  return /^[A-Za-z0-9_ÁÉÍÓÚÑáéíóúñ]+$/.test(clean) ? clean : `'${clean.replaceAll("'", "''")}'`;
}

function getUsedBounds(grid = []) {
  let maxRow = 0;
  let maxCol = 0;

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const hasStyle = cell?.style && Object.keys(cell.style).length > 0;
      if (cell?.value || cell?.formula || hasStyle || rowIndex === 0) {
        maxRow = Math.max(maxRow, rowIndex);
        maxCol = Math.max(maxCol, colIndex);
      }
    });
  });

  return {
    rows: Math.max(maxRow + 1, 1),
    cols: Math.max(maxCol + 1, 1),
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function ToolbarMenu({ label, icon: Icon, open, onToggle, onClose, children }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        onClose?.();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
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
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
      >
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open ? (
        <div
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 z-40 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default function PlaygroundPage() {
  const navigate = useNavigate();
  const { playgroundId, id } = useParams();
  const workbookId = playgroundId || id;
  const styleTimerRef = useRef(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [activeCell, setActiveCell] = useState(null);
  const [referenceMode, setReferenceMode] = useState(null);
  const [formulaDraft, setFormulaDraft] = useState('');
  const [fontSize, setFontSize] = useState('14');
  const [textColor, setTextColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textOpacity, setTextOpacity] = useState(100);
  const [bgOpacity, setBgOpacity] = useState(100);
  const [openMenu, setOpenMenu] = useState('');

  const {
    workbook,
    sheets,
    activeSheet,
    activeSheetId,
    activeGrid,
    gridsBySheet,
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
  } = usePlaygroundWorkbook(workbookId);

  const activeCellKey = activeCell ? makeCellId(activeCell.rowIndex, activeCell.colIndex) : '';
  const presenceMembers = usePlaygroundPresence(
    workbookId,
    activeSheet?.name || activeSheet?.nombre || 'Hoja',
    'editando',
    activeCellKey,
  );

  const workbookContext = useMemo(
    () =>
      makeWorkbookContext({
        sheets,
        gridsBySheet,
        activeSheetId,
        activeGrid,
      }),
    [sheets, gridsBySheet, activeSheetId, activeGrid],
  );


  useEffect(() => {
    if (!activeCell) {
      setFormulaDraft('');
      return;
    }

    const cell = activeGrid[activeCell.rowIndex]?.[activeCell.colIndex] || { value: '', formula: '' };
    setFormulaDraft(cell.formula || cell.value || '');
  }, [activeCell, activeGrid]);

  useEffect(() => {
    return () => {
      if (styleTimerRef.current) window.clearTimeout(styleTimerRef.current);
    };
  }, []);

  function exportExcel() {
    const sheetHtml = sheets
      .map((sheet) => {
        const grid = gridsBySheet[sheet.id] || [];
        const context = makeWorkbookContext({
          sheets,
          gridsBySheet,
          activeSheetId: sheet.id,
          activeGrid: grid,
        });
        const bounds = getUsedBounds(grid);
        const rows = grid.slice(0, bounds.rows).map((row) => {
          const cells = row.slice(0, bounds.cols).map((cell) => {
            const style = cell?.style || {};
            const inlineStyles = [
              'border:1px solid #d9e2ef',
              'padding:6px 8px',
              style.bold ? 'font-weight:700' : '',
              style.textColor ? `color:${style.textColor}` : '',
              style.bgColor ? `background:${style.bgColor}` : '',
              style.fontSize ? `font-size:${style.fontSize}px` : '',
            ]
              .filter(Boolean)
              .join(';');

            return `<td style="${inlineStyles}">${escapeHtml(displayCell(cell, grid, context))}</td>`;
          });

          return `<tr>${cells.join('')}</tr>`;
        });

        return `
          <h2>${escapeHtml(sheet.name || 'Hoja')}</h2>
          <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">${rows.join('')}</table>
          <br/><br/>
        `;
      })
      .join('');

    const html = `
      <html>
        <head><meta charset="UTF-8" /></head>
        <body>${sheetHtml}</body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workbook?.name || 'playground'}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    const confirmed = window.confirm('¿Eliminar este playground? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    await removeWorkbook();
    navigate('/dashboard/playground');
  }

  function applyStyle(nextStyle) {
    if (!selectedRange) {
      setMessage('Selecciona una o varias celdas antes de aplicar estilo.');
      return;
    }

    updateCellStyle(selectedRange, nextStyle);
  }

  function scheduleStyle(nextStyle) {
    if (styleTimerRef.current) window.clearTimeout(styleTimerRef.current);

    styleTimerRef.current = window.setTimeout(() => {
      applyStyle(nextStyle);
    }, 420);
  }

  function clearStyle() {
    if (!selectedRange) return;
    updateCellStyle(selectedRange, {
      bold: false,
      textColor: '',
      bgColor: '',
      fontSize: '',
      textOpacity: '',
      bgOpacity: '',
    });
  }

  function handleSelectionChange(range, cell) {
    setSelectedRange(range);
    if (cell) setActiveCell(cell);
  }

  function handleFormulaChange(value) {
    setFormulaDraft(value);
    if (!activeCell) return;

    updateCell(activeCell.rowIndex, activeCell.colIndex, value);

    if (String(value || '').startsWith('=')) {
      setReferenceMode({
        sheetId: activeSheetId,
        sourceSheetId: activeSheetId,
        sheetName: activeSheet?.name || activeSheet?.nombre || 'Hoja',
        rowIndex: activeCell.rowIndex,
        colIndex: activeCell.colIndex,
      });
    } else {
      setReferenceMode(null);
    }
  }

  function handleFormulaKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
      setReferenceMode(null);
    }
  }

  function handlePickReference(target) {
    if (!referenceMode) return;

    const isSourceCell =
      target.sheetId === referenceMode.sourceSheetId &&
      target.rowIndex === referenceMode.rowIndex &&
      target.colIndex === referenceMode.colIndex;

    if (isSourceCell) return;

    const sourceSheet = sheets.find((sheet) => sheet.id === referenceMode.sourceSheetId);
    const targetSheet = sheets.find((sheet) => sheet.id === target.sheetId);
    const sourceGrid = gridsBySheet[referenceMode.sourceSheetId] || [];
    const sourceCell = sourceGrid[referenceMode.rowIndex]?.[referenceMode.colIndex] || { value: '', formula: '' };
    const currentFormula = sourceCell.formula || sourceCell.value || '=';
    const targetRef = makeCellId(target.rowIndex, target.colIndex);
    const reference = target.sheetId === referenceMode.sourceSheetId
      ? targetRef
      : `${quoteSheetName(targetSheet?.name || targetSheet?.nombre || target.sheetName)}!${targetRef}`;

    const nextFormula = `${currentFormula}${reference}`;

    updateCellInSheet(
      referenceMode.sourceSheetId,
      referenceMode.rowIndex,
      referenceMode.colIndex,
      nextFormula,
    );

    setActiveSheetId(referenceMode.sourceSheetId);
    setActiveCell({ rowIndex: referenceMode.rowIndex, colIndex: referenceMode.colIndex });
    setFormulaDraft(nextFormula);
    setReferenceMode(null);
  }

  function toggleMenu(name) {
    setOpenMenu((current) => (current === name ? '' : name));
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-600" />
          <p className="mt-4 text-sm font-bold text-slate-700">Cargando playground...</p>
        </div>
      </div>
    );
  }

  if (error || !workbook) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-4">
        <div className="max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">Error</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">No se pudo cargar el playground</h1>
          <p className="mt-3 text-sm text-slate-500">{error || 'Revisa que la ruta y permisos de Supabase estén correctos.'}</p>
          <Link
            to="/dashboard/playground"
            className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Volver a playgrounds
          </Link>
        </div>
      </div>
    );
  }

  const pageClass = fullscreen
    ? 'fixed inset-0 z-[90] flex flex-col overflow-hidden bg-slate-50'
    : 'min-h-screen bg-slate-50';

  return (
    <div className={pageClass}>
      <div className={fullscreen ? 'flex min-h-0 flex-1 flex-col p-3' : 'mx-auto flex min-h-screen max-w-[1800px] flex-col px-4 py-4'}>
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link
                to="/dashboard/playground"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>

              <div className="hidden h-8 w-px bg-slate-200 md:block" />

              <PlaygroundSheetsTabs
                sheets={sheets}
                activeSheetId={activeSheetId}
                onChangeSheet={setActiveSheetId}
                onAddSheet={addSheet}
                onRenameSheet={updateSheetName}
                onDeleteSheet={removeSheet}
                disabled={saving}
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 lg:flex">
                <span className="text-slate-400">Creado por</span>
                <span className="text-slate-900">{workbook.creator_label || 'Sin dato'}</span>
              </div>

              <PlaygroundPresence members={presenceMembers} />

              <ToolbarMenu label="Archivo" icon={FileSpreadsheet} open={openMenu === 'file'} onToggle={() => toggleMenu('file')} onClose={() => setOpenMenu('')}>
                <div className="grid gap-2">
                  <button type="button" onClick={exportExcel} disabled={saving} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                    <Download className="h-4 w-4" /> Descargar Excel
                  </button>
                  <button type="button" onClick={() => setShareOpen(true)} disabled={saving} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                    <Share2 className="h-4 w-4" /> Compartir
                  </button>
                  <button type="button" onClick={handleDelete} disabled={saving} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60">
                    <Trash2 className="h-4 w-4" /> Eliminar playground
                  </button>
                </div>
              </ToolbarMenu>

              <ToolbarMenu label="Datos" icon={SlidersHorizontal} open={openMenu === 'data'} onToggle={() => toggleMenu('data')} onClose={() => setOpenMenu('')}>
                <div className="grid gap-2">
                  <button type="button" onClick={importProductsToActiveSheet} disabled={saving} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                    <PackagePlus className="h-4 w-4" /> Cargar productos
                  </button>
                </div>
              </ToolbarMenu>

              <ToolbarMenu label="Formato" icon={Palette} open={openMenu === 'format'} onToggle={() => toggleMenu('format')} onClose={() => setOpenMenu('')}>
                <div className="grid gap-3 text-sm font-semibold text-slate-700">
                  <button type="button" onClick={() => applyStyle({ bold: true })} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left font-bold hover:bg-slate-50">
                    <Bold className="h-4 w-4" /> Negrita
                  </button>

                  <label className="grid gap-1 rounded-xl border border-slate-200 p-3">
                    <span className="flex items-center gap-2"><Text className="h-4 w-4" /> Color de letra</span>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(event) => setTextColor(event.target.value)}
                      onBlur={(event) => applyStyle({ textColor: event.target.value, textOpacity: Number(textOpacity) / 100 })}
                      className="h-8 w-full cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={textOpacity}
                      onChange={(event) => setTextOpacity(event.target.value)}
                      onMouseUp={(event) => applyStyle({ textColor, textOpacity: Number(event.currentTarget.value) / 100 })}
                      onTouchEnd={(event) => applyStyle({ textColor, textOpacity: Number(event.currentTarget.value) / 100 })}
                    />
                  </label>

                  <label className="grid gap-1 rounded-xl border border-slate-200 p-3">
                    <span className="flex items-center gap-2"><PaintBucket className="h-4 w-4" /> Color de fondo</span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(event) => setBgColor(event.target.value)}
                      onBlur={(event) => applyStyle({ bgColor: event.target.value, bgOpacity: Number(bgOpacity) / 100 })}
                      className="h-8 w-full cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={bgOpacity}
                      onChange={(event) => setBgOpacity(event.target.value)}
                      onMouseUp={(event) => applyStyle({ bgColor, bgOpacity: Number(event.currentTarget.value) / 100 })}
                      onTouchEnd={(event) => applyStyle({ bgColor, bgOpacity: Number(event.currentTarget.value) / 100 })}
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                    Tamaño
                    <select
                      value={fontSize}
                      onChange={(event) => {
                        setFontSize(event.target.value);
                        applyStyle({ fontSize: Number(event.target.value) });
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none"
                    >
                      {[12, 14, 16, 18, 20, 24].map((size) => (
                        <option key={size} value={size}>{size}px</option>
                      ))}
                    </select>
                  </label>

                  <button type="button" onClick={clearStyle} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left font-bold hover:bg-slate-50">
                    <Eraser className="h-4 w-4" /> Limpiar estilo
                  </button>
                </div>
              </ToolbarMenu>

              <button
                type="button"
                onClick={() => setFullscreen((value) => !value)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {fullscreen ? 'Salir' : 'Pantalla completa'}
              </button>

              <button
                type="button"
                onClick={saveActiveSheet}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-4 py-2">
            <div className="min-w-[86px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
              {activeCellKey || 'Celda'}
            </div>
            <input
              value={formulaDraft}
              onChange={(event) => handleFormulaChange(event.target.value)}
              onKeyDown={handleFormulaKeyDown}
              placeholder="Escribe un valor o fórmula. Ej: =Productos!C2"
              className="min-w-[240px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            />
          </div>
        </div>

        {referenceMode ? (
          <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
            Selecciona una celda en cualquier hoja para agregarla a la fórmula.
          </div>
        ) : null}

        {message ? (
          <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <div className="flex items-start justify-between gap-3">
              <span>{message}</span>
              <button type="button" onClick={() => setMessage('')} className="text-emerald-900/60 hover:text-emerald-950">
                Cerrar
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <PlaygroundGrid
            grid={activeGrid}
            sheetId={activeSheetId}
            sheetName={activeSheet?.name || activeSheet?.nombre || 'Hoja'}
            onChange={updateCell}
            onFill={fillCells}
            onNeedMoreRows={addRows}
            onNeedMoreColumns={addColumns}
            onSelectionChange={handleSelectionChange}
            onStartFormulaReference={(source) => setReferenceMode({ ...source, sourceSheetId: source.sheetId })}
            onPickReference={handlePickReference}
            onUndo={undoLastChange}
            referenceMode={referenceMode}
            workbookContext={workbookContext}
            presenceMembers={presenceMembers}
          />
        </div>
      </div>

      <PlaygroundShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        workbook={workbook}
        saving={saving}
        onTogglePublic={togglePublic}
        onChangeShareMode={changeShareMode}
      />
    </div>
  );
}
