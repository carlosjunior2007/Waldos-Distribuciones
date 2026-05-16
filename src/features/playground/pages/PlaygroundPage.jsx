import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Database,
  Download,
  Eraser,
  HelpCircle,
  FileSpreadsheet,
  Italic,
  Loader2,
  Maximize2,
  Minimize2,
  PaintBucket,
  Wand2,
  Palette,
  Save,
  Sigma,
  Undo2,
  Redo2,
  Share2,
  SlidersHorizontal,
  Text,
  Trash2,
  Underline,
} from 'lucide-react';
import PlaygroundGrid from '../components/PlaygroundGrid';
import PlaygroundPresence from '../components/PlaygroundPresence';
import PlaygroundShareModal from '../components/PlaygroundShareModal';
import PlaygroundImportDataModal from '../components/PlaygroundImportDataModal';
import PlaygroundBulkProductChangesModal from '../components/PlaygroundBulkProductChangesModal';
import PlaygroundSheetsTabs from '../components/PlaygroundSheetsTabs';
import ExcelHelpModal from '../excelModule/components/ExcelHelpModal';
import { usePlaygroundPresence } from '../hooks/usePlaygroundPresence';
import { usePlaygroundWorkbook } from '../hooks/usePlaygroundWorkbook';
import { makeCellId, makeWorkbookContext, quoteSheetName } from '../excelModule/excel.helpers';
import { exportWorkbookAsExcel } from '../excelModule/excelExport.helpers';

function ToolbarMenu({ label, icon: Icon, open, onToggle, onClose, children, wide = false, align = 'left' }) {
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
        className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
          open
            ? 'bg-slate-100 text-slate-950'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
        }`}
      >
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open ? (
        <div
          onClick={(event) => event.stopPropagation()}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-50 mt-2 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-slate-900/5 ${
            wide ? 'w-[520px]' : 'w-[340px]'
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MenuSection({ title, children }) {
  return (
    <div className="py-1">
      {title ? <p className="px-3 pb-1 pt-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{title}</p> : null}
      <div className="grid gap-1">{children}</div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, hint, danger = false, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition disabled:opacity-50 ${
        danger ? 'text-red-700 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
      }`}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4" />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint ? <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">{hint}</span> : null}
    </button>
  );
}

function ToolButton({ icon: Icon, label, active = false, title, onClick, disabled }) {
  return (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition disabled:opacity-50 ${
        active ? 'bg-slate-200 text-slate-950' : 'text-slate-700 hover:bg-white hover:text-slate-950'
      }`}
    >
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


export default function PlaygroundPage() {
  const navigate = useNavigate();
  const { playgroundId, id } = useParams();
  const workbookId = playgroundId || id;
  const styleTimerRef = useRef(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkChanges, setBulkChanges] = useState([]);
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
  const [helpOpen, setHelpOpen] = useState(false);

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
    updateCellsBulk,
    updateCellStyle,
    fillCells,
    addRows,
    addColumns,
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
    exportWorkbookAsExcel({
      workbook,
      sheets,
      gridsBySheet,
      activeSheetId,
      filename: `${workbook?.name || 'playground'}.xls`,
    });
  }


  async function handleImportData(options) {
    await importDataToSheet(options);
    setImportOpen(false);
  }

  async function handlePrepareProductChanges() {
    await prepareProductChangesSheet();
    setOpenMenu('');
  }

  async function handleOpenBulkChanges() {
    setOpenMenu('');

    try {
      const changes = await getProductBulkChangesFromActiveSheet();
      setBulkChanges(changes);
      setBulkOpen(true);
    } catch (error) {
      console.error('Error detectando cambios de productos:', error);
      setMessage('No se pudieron detectar los cambios. Revisa la conexión o permisos.');
    }
  }

  async function handleApplyBulkChanges() {
    await applyProductBulkChangesFromActiveSheet(bulkChanges);
    setBulkOpen(false);
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
      italic: false,
      underline: false,
      textColor: '',
      bgColor: '',
      fontSize: '',
      textOpacity: '',
      bgOpacity: '',
      textAlign: '',
    });
  }

  function handleSelectionChange(range, cell) {
    setSelectedRange(range);
    if (cell) setActiveCell(cell);
  }

  function commitFormulaDraft() {
    if (!activeCell) return;
    updateCell(activeCell.rowIndex, activeCell.colIndex, formulaDraft);
    if (!String(formulaDraft || '').startsWith('=')) setReferenceMode(null);
  }

  function handleFormulaChange(value) {
    setFormulaDraft(value);
    if (!activeCell) return;

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
      commitFormulaDraft();
      event.currentTarget.blur();
      setReferenceMode(null);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      const cell = activeCell ? activeGrid[activeCell.rowIndex]?.[activeCell.colIndex] || { value: '', formula: '' } : { value: '', formula: '' };
      setFormulaDraft(cell.formula || cell.value || '');
      setReferenceMode(null);
      event.currentTarget.blur();
    }
  }

  function makeReference(target) {
    const targetSheet = sheets.find((sheet) => sheet.id === target.sheetId);
    const targetRef = makeCellId(target.rowIndex, target.colIndex);

    return target.sheetId === referenceMode.sourceSheetId
      ? targetRef
      : `${quoteSheetName(targetSheet?.name || targetSheet?.nombre || target.sheetName)}!${targetRef}`;
  }

  function appendToFormula(currentFormula, piece) {
    const base = String(currentFormula || '=').trim() || '=';

    if (base === '=') return `=${piece}`;

    const lastChar = base.slice(-1);
    const needsOperator = !['=', '+', '-', '*', '/', '(', ','].includes(lastChar);

    return `${base}${needsOperator ? '+' : ''}${piece}`;
  }

  function handlePickReference(target) {
    if (!referenceMode) return;

    const isSourceCell =
      target.sheetId === referenceMode.sourceSheetId &&
      target.rowIndex === referenceMode.rowIndex &&
      target.colIndex === referenceMode.colIndex;

    if (isSourceCell) return;

    const sourceGrid = gridsBySheet[referenceMode.sourceSheetId] || [];
    const sourceCell = sourceGrid[referenceMode.rowIndex]?.[referenceMode.colIndex] || { value: '', formula: '' };
    const isActiveFormulaCell =
      activeCell &&
      referenceMode.sourceSheetId === activeSheetId &&
      referenceMode.rowIndex === activeCell.rowIndex &&
      referenceMode.colIndex === activeCell.colIndex;
    const currentFormula = (isActiveFormulaCell ? formulaDraft : '') || sourceCell.formula || sourceCell.value || '=';
    const reference = makeReference(target);

    if (target.rangeMode && !referenceMode.rangeStart) {
      setReferenceMode({
        ...referenceMode,
        rangeStart: target,
        rangeStartLabel: reference,
      });
      setActiveSheetId(target.sheetId);
      setActiveCell({ rowIndex: target.rowIndex, colIndex: target.colIndex });
      return;
    }

    const rangeStart = referenceMode.rangeStart;
    const shouldBuildSum = Boolean(rangeStart);

    let piece = reference;

    if (shouldBuildSum) {
      const startLabel = referenceMode.rangeStartLabel || makeReference(rangeStart);
      const endLabel = reference;
      piece = `SUM(${startLabel}:${endLabel})`;
    }

    const nextFormula = appendToFormula(currentFormula, piece);

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
        <div className="mb-3 overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
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

              <div className="min-w-0">
                <p className="truncate text-base font-black text-slate-950">{workbook?.name || 'Playground'}</p>
                <p className="text-xs font-semibold text-slate-500">Hoja activa: {activeSheet?.name || activeSheet?.nombre || 'Hoja'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                <ToolbarMenu label="Archivo" icon={FileSpreadsheet} open={openMenu === 'file'} onToggle={() => toggleMenu('file')} onClose={() => setOpenMenu('')} align="right">
                  <MenuSection>
                    <MenuItem icon={Save} label="Guardar hoja" hint="Ctrl+S" disabled={saving} onClick={() => { saveActiveSheet(); setOpenMenu(''); }} />
                    <MenuItem icon={Download} label="Descargar Excel" disabled={saving} onClick={() => { exportExcel(); setOpenMenu(''); }} />
                    <MenuItem icon={Share2} label="Compartir" disabled={saving} onClick={() => { setShareOpen(true); setOpenMenu(''); }} />
                  </MenuSection>
                  <div className="my-1 border-t border-slate-100" />
                  <MenuSection title="Zona peligrosa">
                    <MenuItem icon={Trash2} label="Eliminar playground" danger disabled={saving} onClick={handleDelete} />
                  </MenuSection>
                </ToolbarMenu>

                <ToolbarMenu label="Datos" icon={SlidersHorizontal} open={openMenu === 'data'} onToggle={() => toggleMenu('data')} onClose={() => setOpenMenu('')} align="right">
                  <MenuSection title="Importación">
                    <MenuItem icon={Database} label="Importar datos a la hoja" onClick={() => { setImportOpen(true); setOpenMenu(''); }} disabled={saving} />
                  </MenuSection>
                  <MenuSection title="Productos">
                    <MenuItem icon={Wand2} label="Preparar cambios de productos" onClick={handlePrepareProductChanges} disabled={saving} />
                    <MenuItem icon={Wand2} label="Revisar y aplicar cambios" danger onClick={handleOpenBulkChanges} disabled={saving} />
                  </MenuSection>
                </ToolbarMenu>

                <ToolbarMenu label="Formato" icon={Palette} open={openMenu === 'format'} onToggle={() => toggleMenu('format')} onClose={() => setOpenMenu('')} wide align="right">
                  <div className="grid gap-3 p-1 text-sm font-semibold text-slate-700 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-3">
                      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Texto</p>
                      <div className="grid gap-2">
                        <MenuItem icon={Bold} label="Negrita" hint="Ctrl+B" onClick={() => applyStyle({ bold: true })} />
                        <MenuItem icon={Italic} label="Cursiva" hint="Ctrl+I" onClick={() => applyStyle({ italic: true })} />
                        <MenuItem icon={Underline} label="Subrayado" hint="Ctrl+U" onClick={() => applyStyle({ underline: true })} />
                      </div>
                      <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                        <span>Tamaño</span>
                        <select
                          value={fontSize}
                          onChange={(event) => {
                            setFontSize(event.target.value);
                            applyStyle({ fontSize: Number(event.target.value) });
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
                      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Alineación</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => applyStyle({ textAlign: 'left' })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"><AlignLeft className="mx-auto h-4 w-4" />Izq.</button>
                        <button type="button" onClick={() => applyStyle({ textAlign: 'center' })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"><AlignCenter className="mx-auto h-4 w-4" />Centro</button>
                        <button type="button" onClick={() => applyStyle({ textAlign: 'right' })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"><AlignRight className="mx-auto h-4 w-4" />Der.</button>
                      </div>
                      <div className="mt-3 grid gap-2">
                        <label className="grid gap-1 rounded-xl border border-slate-200 p-3">
                          <span className="flex items-center gap-2"><Text className="h-4 w-4" /> Color de letra</span>
                          <input type="color" value={textColor} onChange={(event) => { setTextColor(event.target.value); applyStyle({ textColor: event.target.value, textOpacity: Number(textOpacity) / 100 }); }} className="h-8 w-full cursor-pointer border-0 bg-transparent p-0" />
                        </label>
                        <label className="grid gap-1 rounded-xl border border-slate-200 p-3">
                          <span className="flex items-center gap-2"><PaintBucket className="h-4 w-4" /> Color de fondo</span>
                          <input type="color" value={bgColor} onChange={(event) => { setBgColor(event.target.value); applyStyle({ bgColor: event.target.value, bgOpacity: Number(bgOpacity) / 100 }); }} className="h-8 w-full cursor-pointer border-0 bg-transparent p-0" />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 p-2">
                    <MenuItem icon={Eraser} label="Limpiar formato de la selección" hint="Ctrl+Shift+F" onClick={clearStyle} />
                  </div>
                </ToolbarMenu>

                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
                >
                  <HelpCircle className="h-4 w-4" />
                  Ayuda
                </button>
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 lg:flex">
                <span className="text-slate-400">Creado por</span>
                <span className="text-slate-900">{workbook.creator_label || 'Sin dato'}</span>
              </div>

              <PlaygroundPresence members={presenceMembers} />

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
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-3 py-2">
            <ToolButton icon={Undo2} title="Deshacer" onClick={undoLastChange} />
            <ToolButton icon={Redo2} title="Rehacer" onClick={redoLastChange} />
            <ToolbarDivider />
            <ToolButton icon={Sigma} label="SUM" title="Insertar =SUM(" onClick={() => setFormulaDraft((value) => value || '=SUM(')} />
            <select
              value={fontSize}
              onChange={(event) => {
                setFontSize(event.target.value);
                applyStyle({ fontSize: Number(event.target.value) });
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 outline-none"
              title="Tamaño de letra"
            >
              {[10, 11, 12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <ToolbarDivider />
            <ToolButton icon={Bold} title="Negrita" onClick={() => applyStyle({ bold: true })} />
            <ToolButton icon={Italic} title="Cursiva" onClick={() => applyStyle({ italic: true })} />
            <ToolButton icon={Underline} title="Subrayado" onClick={() => applyStyle({ underline: true })} />
            <ToolbarDivider />
            <ToolButton icon={AlignLeft} title="Alinear izquierda" onClick={() => applyStyle({ textAlign: 'left' })} />
            <ToolButton icon={AlignCenter} title="Alinear centro" onClick={() => applyStyle({ textAlign: 'center' })} />
            <ToolButton icon={AlignRight} title="Alinear derecha" onClick={() => applyStyle({ textAlign: 'right' })} />
            <ToolbarDivider />
            <ColorControl icon={Text} value={textColor} title="Color de letra" onChange={(event) => { setTextColor(event.target.value); applyStyle({ textColor: event.target.value, textOpacity: Number(textOpacity) / 100 }); }} />
            <ColorControl icon={PaintBucket} value={bgColor} title="Color de fondo" onChange={(event) => { setBgColor(event.target.value); applyStyle({ bgColor: event.target.value, bgOpacity: Number(bgOpacity) / 100 }); }} />
            <ToolbarDivider />
            <ToolButton icon={Eraser} label="Limpiar" title="Limpiar formato" onClick={clearStyle} />
          </div>

          <div className="flex flex-wrap items-center gap-2 px-4 py-2">
            <div className="min-w-[86px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
              {activeCellKey || 'Celda'}
            </div>
            <input
              value={formulaDraft}
              onChange={(event) => handleFormulaChange(event.target.value)}
              onKeyDown={handleFormulaKeyDown}
              onBlur={commitFormulaDraft}
              placeholder="Escribe un valor o fórmula. Ej: =Productos!C2"
              className="min-w-[240px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            />
          </div>
        </div>

        {referenceMode ? (
          <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
            Selecciona una celda para agregarla a la fórmula. Para SUMA rápida: mantén Shift, selecciona la primera celda y luego la última.
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
          <div className="min-h-0 flex-1 overflow-hidden">
            <PlaygroundGrid
              grid={activeGrid}
              sheetId={activeSheetId}
              sheetName={activeSheet?.name || activeSheet?.nombre || 'Hoja'}
              onChange={updateCell}
              onBulkChange={updateCellsBulk}
              onFill={fillCells}
              onNeedMoreRows={addRows}
              onNeedMoreColumns={addColumns}
              onSelectionChange={handleSelectionChange}
              onStartFormulaReference={(source) => setReferenceMode(source ? { ...source, sourceSheetId: source.sheetId } : null)}
              onPickReference={handlePickReference}
              onUndo={undoLastChange}
              onRedo={redoLastChange}
              onSave={saveActiveSheet}
              onApplyStyle={updateCellStyle}
              onFormulaDraftChange={setFormulaDraft}
              referenceMode={referenceMode}
              workbookContext={workbookContext}
              presenceMembers={presenceMembers}
            />
          </div>

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
      </div>

      <PlaygroundImportDataModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImportData}
        loading={saving}
      />

      <PlaygroundBulkProductChangesModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        changes={bulkChanges}
        onApply={handleApplyBulkChanges}
        loading={saving}
      />

      <PlaygroundShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        workbook={workbook}
        saving={saving}
        onTogglePublic={togglePublic}
        onChangeShareMode={changeShareMode}
      />

      <ExcelHelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}
