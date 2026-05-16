import { displayCell, makeWorkbookContext } from './excel.helpers';

export function getUsedBounds(grid = []) {
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

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function exportWorkbookAsExcel({ workbook, sheets, gridsBySheet, activeSheetId, filename }) {
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
  a.download = filename || `${workbook?.name || 'playground'}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}
