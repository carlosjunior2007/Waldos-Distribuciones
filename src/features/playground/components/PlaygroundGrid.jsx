import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownRight } from 'lucide-react';
import { DEFAULT_COLUMNS } from '../playground.constants';
import { columnIndexToLetter, displayCell, makeCellId } from '../playground.helpers';

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

  return (
    rowIndex >= range.startRow &&
    rowIndex <= range.endRow &&
    colIndex >= range.startCol &&
    colIndex <= range.endCol
  );
}

function isBottomRight(rowIndex, colIndex, range) {
  return Boolean(range && rowIndex === range.endRow && colIndex === range.endCol);
}


function hexToRgba(hex, opacity) {
  const clean = String(hex || '').replace('#', '').trim();
  if (!clean || clean.length !== 6) return hex || undefined;

  const alpha = opacity === '' || opacity === undefined || opacity === null
    ? 1
    : Math.max(0, Math.min(1, Number(opacity)));

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  if ([r, g, b].some((value) => Number.isNaN(value))) return hex || undefined;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCellStyle(cell = {}) {
  const style = cell.style || {};

  return {
    backgroundColor: style.bgColor ? hexToRgba(style.bgColor, style.bgOpacity ?? 1) : undefined,
    color: style.textColor ? hexToRgba(style.textColor, style.textOpacity ?? 1) : undefined,
    fontWeight: style.bold ? 800 : undefined,
    fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
  };
}

export default function PlaygroundGrid({
  grid,
  sheetId,
  sheetName,
  onChange,
  onFill,
  onNeedMoreRows,
  onNeedMoreColumns,
  onSelectionChange,
  onStartFormulaReference,
  onPickReference,
  onUndo,
  referenceMode = null,
  readOnly = false,
  workbookContext = {},
  presenceMembers = [],
}) {
  const scrollerRef = useRef(null);
  const inputRefs = useRef({});
  const loadingMoreRef = useRef(false);

  const [visibleRows, setVisibleRows] = useState(() => Math.min(Math.max(grid.length, 80), 160));
  const [visibleCols, setVisibleCols] = useState(() => Math.min(Math.max(grid[0]?.length || DEFAULT_COLUMNS, 12), 26));
  const [columnWidths, setColumnWidths] = useState(() => Array.from({ length: 60 }, () => 104));
  const resizingRef = useRef(null);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [fillPreviewEnd, setFillPreviewEnd] = useState(null);
  const [fillDragging, setFillDragging] = useState(false);
  const fillPreviewEndRef = useRef(null);
  const fillRafRef = useRef(null);

  const columns = useMemo(() => {
    const count = Math.max(grid[0]?.length || 0, DEFAULT_COLUMNS);
    return Array.from({ length: count }, (_, index) => columnIndexToLetter(index));
  }, [grid]);

  const visibleColumns = useMemo(() => columns.slice(0, Math.min(visibleCols, columns.length)), [columns, visibleCols]);
  const selectedRange = useMemo(() => normalizeRange(selectedStart, selectedEnd), [selectedStart, selectedEnd]);

  const fillPreviewRange = useMemo(() => {
    if (!fillDragging || !selectedRange || !fillPreviewEnd) return null;

    return normalizeRange(
      { rowIndex: selectedRange.startRow, colIndex: selectedRange.startCol },
      fillPreviewEnd,
    );
  }, [fillDragging, selectedRange, fillPreviewEnd]);

  const visibleGrid = useMemo(() => grid.slice(0, Math.min(visibleRows, grid.length)), [grid, visibleRows]);

  useEffect(() => {
    return () => {
      if (fillRafRef.current) cancelAnimationFrame(fillRafRef.current);
    };
  }, []);

  useEffect(() => {
    setVisibleRows((prev) => Math.min(Math.max(prev, 80), Math.max(grid.length, prev)));
  }, [grid.length]);

  useEffect(() => {
    setVisibleCols((prev) => Math.min(Math.max(prev, 12), Math.max(grid[0]?.length || DEFAULT_COLUMNS, prev)));
  }, [grid]);

  useEffect(() => {
    setColumnWidths((prev) => {
      const needed = Math.max(visibleCols, grid[0]?.length || DEFAULT_COLUMNS, prev.length);
      if (prev.length >= needed) return prev;
      return [...prev, ...Array.from({ length: needed - prev.length }, () => 104)];
    });
  }, [visibleCols, grid]);

  function updateFillPreview(rowIndex, colIndex) {
    const next = { rowIndex, colIndex };
    const current = fillPreviewEndRef.current;

    if (current && current.rowIndex === rowIndex && current.colIndex === colIndex) return;

    fillPreviewEndRef.current = next;

    if (fillRafRef.current) return;

    fillRafRef.current = requestAnimationFrame(() => {
      fillRafRef.current = null;
      setFillPreviewEnd(fillPreviewEndRef.current);
    });
  }

  useEffect(() => {
    if (!selecting && !fillDragging) return undefined;

    function handleMouseUp() {
      setSelecting(false);

      const finalFillEnd = fillPreviewEndRef.current || fillPreviewEnd;

      if (fillDragging && selectedRange && finalFillEnd) {
        const toRange = normalizeRange(
          { rowIndex: selectedRange.startRow, colIndex: selectedRange.startCol },
          finalFillEnd,
        );

        if (toRange) {
          onFill?.(selectedRange, toRange);
        }
      }

      if (fillRafRef.current) {
        cancelAnimationFrame(fillRafRef.current);
        fillRafRef.current = null;
      }

      setFillDragging(false);
      fillPreviewEndRef.current = null;
      setFillPreviewEnd(null);
    }

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [selecting, fillDragging, selectedRange, fillPreviewEnd, onFill]);

  useEffect(() => {
    function handleResizeMove(event) {
      if (!resizingRef.current) return;

      const { colIndex, startX, startWidth } = resizingRef.current;
      const nextWidth = Math.min(Math.max(startWidth + event.clientX - startX, 64), 340);

      setColumnWidths((prev) => {
        const copy = [...prev];
        copy[colIndex] = nextWidth;
        return copy;
      });
    }

    function handleResizeEnd() {
      resizingRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  const totalTableWidth = useMemo(() => {
    return 42 + visibleColumns.reduce((total, _, index) => total + (columnWidths[index] || 104), 0);
  }, [visibleColumns, columnWidths]);

  function getPresenceForCell(rowIndex, colIndex) {
    const cellLabel = makeCellId(rowIndex, colIndex);
    const currentSheetName = String(sheetName || '').trim();

    return (presenceMembers || []).filter((member) => {
      if (!member?.activeCell || member?.isSelf) return false;
      const sameActiveCell = String(member.activeCell).toUpperCase() === cellLabel.toUpperCase();
      const memberSheet = String(member.sheet || '').trim();
      const sameSheet = !memberSheet || !currentSheetName || memberSheet === currentSheetName;
      return sameActiveCell && sameSheet;
    });
  }

  function getPresenceColor(index = 0) {
    const colors = [
      'border-blue-500 bg-blue-600',
      'border-emerald-500 bg-emerald-600',
      'border-purple-500 bg-purple-600',
      'border-amber-500 bg-amber-600',
      'border-pink-500 bg-pink-600',
    ];

    return colors[index % colors.length];
  }

  useEffect(() => {
    function handleGlobalKeyDown(event) {
      const isUndo = (event.ctrlKey || event.metaKey) && String(event.key || '').toLowerCase() === 'z';
      if (!isUndo || readOnly) return;

      event.preventDefault();
      event.stopPropagation();
      setEditingCell(null);
      onUndo?.();
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onUndo, readOnly]);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el || loadingMoreRef.current) return;

    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 560;
    const nearRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 640;

    if (!nearBottom && !nearRight) return;

    loadingMoreRef.current = true;

    if (nearBottom) {
      setVisibleRows((prev) => prev + 180);
      onNeedMoreRows?.(180);
    }

    if (nearRight) {
      setVisibleCols((prev) => prev + 12);
      onNeedMoreColumns?.(12);
    }

    window.setTimeout(() => {
      loadingMoreRef.current = false;
    }, 120);
  }

  function selectSingleCell(rowIndex, colIndex) {
    const cell = { rowIndex, colIndex };
    setSelectedStart(cell);
    setSelectedEnd(cell);
    onSelectionChange?.(normalizeRange(cell, cell), cell);
  }

  function extendSelectionToCell(rowIndex, colIndex) {
    const cell = { rowIndex, colIndex };
    const start = selectedStart || cell;

    if (!selectedStart) {
      setSelectedStart(cell);
    }

    setSelectedEnd(cell);
    onSelectionChange?.(normalizeRange(start, cell), cell);
  }

  function focusCell(rowIndex, colIndex) {
    requestAnimationFrame(() => {
      inputRefs.current[`${rowIndex}:${colIndex}`]?.focus();
    });
  }

  function handleCellMouseDown(event, rowIndex, colIndex) {
    if (readOnly) {
      selectSingleCell(rowIndex, colIndex);
      return;
    }

    if (referenceMode) {
      const isSourceCell =
        referenceMode.sourceSheetId === sheetId &&
        referenceMode.rowIndex === rowIndex &&
        referenceMode.colIndex === colIndex;

      if (isSourceCell) {
        // Si el usuario vuelve a hacer clic en la misma celda que está editando,
        // no insertamos una referencia a sí misma. Solo dejamos que siga editando.
        selectSingleCell(rowIndex, colIndex);
        return;
      }

      event.preventDefault();
      onPickReference?.({
        sheetId,
        sheetName,
        rowIndex,
        colIndex,
      });
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

  function handleKeyDown(event, rowIndex, colIndex) {
    const isUndo = (event.ctrlKey || event.metaKey) && String(event.key || '').toLowerCase() === 'z';

    if (isUndo) {
      event.preventDefault();
      setEditingCell(null);
      event.currentTarget.blur();
      onUndo?.();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      setEditingCell(null);
      event.currentTarget.blur();
      selectSingleCell(rowIndex, colIndex);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setEditingCell(null);
      event.currentTarget.blur();
      return;
    }

    if (event.key === 'Tab') {
      setEditingCell(null);
      selectSingleCell(rowIndex, Math.min(colIndex + 1, columns.length - 1));
      return;
    }

    if (event.key === 'ArrowDown' && !editingCell) {
      event.preventDefault();
      const nextRow = Math.min(rowIndex + 1, grid.length - 1);
      selectSingleCell(nextRow, colIndex);
      focusCell(nextRow, colIndex);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="h-[70vh] min-h-[540px] flex-1 overflow-auto"
      >
        <table className="border-collapse text-sm" style={{ minWidth: `${totalTableWidth}px`, width: `${totalTableWidth}px` }}>
          <thead className="sticky top-0 z-20 bg-slate-100">
            <tr>
              <th className="sticky left-0 z-30 w-10 border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center text-xs font-bold text-slate-500">
                #
              </th>

              {visibleColumns.map((column, colIndex) => (
                <th
                  key={column}
                  style={{ width: `${columnWidths[colIndex] || 104}px`, minWidth: `${columnWidths[colIndex] || 104}px` }}
                  className="relative border-b border-r border-slate-200 px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  {column}
                  {!readOnly ? (
                    <span
                      role="separator"
                      aria-label={`Cambiar ancho de columna ${column}`}
                      title="Arrastra para cambiar el ancho"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        resizingRef.current = {
                          colIndex,
                          startX: event.clientX,
                          startWidth: columnWidths[colIndex] || 104,
                        };
                        document.body.style.cursor = 'col-resize';
                        document.body.style.userSelect = 'none';
                      }}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-red-500/30"
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleGrid.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex === 0 ? 'bg-slate-50' : 'bg-white'}>
                <th className="sticky left-0 z-[8] border-b border-r border-slate-200 bg-slate-100 px-2 py-1 text-center text-[11px] font-bold text-slate-500">
                  {rowIndex + 1}
                </th>

                {visibleColumns.map((_, colIndex) => {
                  const cell = row[colIndex] || { value: '', formula: '', style: {} };
                  const cellKey = makeCellId(rowIndex, colIndex);
                  const refKey = `${rowIndex}:${colIndex}`;
                  const shownValue = displayCell(cell, grid, workbookContext);
                  const rawValue = cell.formula || cell.value || '';
                  const isHeader = rowIndex === 0;
                  const selected = isCellInRange(rowIndex, colIndex, selectedRange);
                  const activeCell = selectedStart && sameCell(selectedStart, { rowIndex, colIndex });
                  const editing = sameCell(editingCell, { rowIndex, colIndex });
                  const previewFill = isCellInRange(rowIndex, colIndex, fillPreviewRange);
                  const inputValue = editing ? rawValue : shownValue;
                  const sourceReferenceCell = referenceMode && referenceMode.sourceSheetId === sheetId && referenceMode.rowIndex === rowIndex && referenceMode.colIndex === colIndex;
                  const cellPresence = getPresenceForCell(rowIndex, colIndex);
                  const hasPresence = cellPresence.length > 0;

                  return (
                    <td
                      key={cellKey}
                      style={{ width: `${columnWidths[colIndex] || 104}px`, minWidth: `${columnWidths[colIndex] || 104}px` }}
                      onMouseDown={(event) => handleCellMouseDown(event, rowIndex, colIndex)}
                      onMouseEnter={() => {
                        if (selecting && !fillDragging) {
                          setSelectedEnd({ rowIndex, colIndex });
                          onSelectionChange?.(normalizeRange(selectedStart, { rowIndex, colIndex }), { rowIndex, colIndex });
                        }

                        if (fillDragging) {
                          updateFillPreview(rowIndex, colIndex);
                        }
                      }}
                      className={`relative border-b border-r border-slate-200 p-0 align-middle ${
                        selected ? 'z-[6] bg-red-50/60 ring-1 ring-red-400 ring-inset' : ''
                      } ${activeCell ? 'ring-2 ring-red-600 ring-inset' : ''} ${previewFill ? 'bg-red-100/70' : ''} ${sourceReferenceCell ? 'ring-2 ring-blue-600 ring-inset' : ''} ${hasPresence ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                    >
                      {readOnly ? (
                        <div
                          style={getCellStyle(cell)}
                          className={`min-h-9 px-2 py-1.5 ${isHeader ? 'font-bold text-slate-700' : 'text-slate-700'}`}
                        >
                          {shownValue}
                        </div>
                      ) : (
                        <>
                          <input
                            ref={(node) => {
                              if (node) inputRefs.current[refKey] = node;
                            }}
                            value={inputValue}
                            title={cell.formula ? `${cell.formula} = ${shownValue}` : cellKey}
                            style={getCellStyle(cell)}
                            onFocus={() => {
                              selectSingleCell(rowIndex, colIndex);
                              setEditingCell({ rowIndex, colIndex });
                              if (String(rawValue || '').startsWith('=')) {
                                onStartFormulaReference?.({ sheetId, sheetName, rowIndex, colIndex });
                              }
                            }}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(event) => handleKeyDown(event, rowIndex, colIndex)}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              onChange(rowIndex, colIndex, nextValue);

                              if (String(nextValue || '').startsWith('=')) {
                                onStartFormulaReference?.({ sheetId, sheetName, rowIndex, colIndex });
                              }
                            }}
                            className={`h-9 w-full bg-transparent px-2 text-slate-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-red-500/20 ${
                              isHeader ? 'font-bold text-slate-700' : ''
                            } ${cell.formula && !editing ? 'text-right font-semibold text-slate-900' : ''}`}
                          />

                          {isBottomRight(rowIndex, colIndex, selectedRange) ? (
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
                        </>
                      )}

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
          </tbody>
        </table>
      </div>

    </div>
  );
}
