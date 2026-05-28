import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoWaldo from "../assets/Logo.png";

function money(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function dateMX(value) {
  if (!value) return "-";

  const d = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function safeText(value) {
  return value ? String(value) : "-";
}

function capitalizeFirstLetter(value) {
  const text = safeText(value).trim();

  if (!text || text === "-") return "-";

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function calculateBase({ subtotal, descuento }) {
  return Math.max(Number(subtotal || 0) - Number(descuento || 0), 0);
}

function calculateIva({ subtotal, descuento, iva_porcentaje }) {
  return calculateBase({ subtotal, descuento }) * (Number(iva_porcentaje || 0) / 100);
}

function calculateIsr({ subtotal, descuento, isr_porcentaje }) {
  return calculateBase({ subtotal, descuento }) * (Number(isr_porcentaje || 0) / 100);
}

export function generateQuotationPDF(quotation) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const BRAND_PRIMARY = [178, 0, 32];
  const BRAND_DARK = [24, 31, 42];
  const BRAND_MUTED = [107, 114, 128];
  const BRAND_LIGHT = [246, 247, 250];
  const BRAND_BORDER = [221, 226, 232];
  const WHITE = [255, 255, 255];

  const {
    folio,
    cliente_nombre,
    cliente_telefono,
    cliente_email,
    created_at,
    fecha_vencimiento,
    subtotal,
    descuento,
    total,
    iva_porcentaje,
    iva_monto,
    isr_porcentaje,
    isr_monto,
    notas,
    detalles = [],
  } = quotation || {};

  const base = calculateBase({ subtotal, descuento });
  const ivaMonto = Number(
    iva_monto ??
      calculateIva({
        subtotal,
        descuento,
        iva_porcentaje,
      }),
  );
  const isrPorcentaje = Number(isr_porcentaje || 0);
  const isrMonto = Number(
    isr_monto ??
      calculateIsr({
        subtotal,
        descuento,
        isr_porcentaje: isrPorcentaje,
      }),
  );

  const displayTotal = Number(total ?? base + ivaMonto - isrMonto);

  const marginX = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const footerLineY = pageHeight - 20;
  const footerReservedSpace = 24;

  const totalsBoxW = 76;
  const hasIsr = Number(isr_monto ?? 0) > 0 || Number(isr_porcentaje || 0) > 0;
  const totalsBoxH = hasIsr ? 49 : 42;
  const totalsBoxX = pageWidth - marginX - totalsBoxW;
  const totalsBoxBottomY = footerLineY - 8;
  const totalsBoxFixedY = totalsBoxBottomY - totalsBoxH;

  const firstPageContentStartY = 104;
  const continuationContentStartY = 52;

  function drawHeader({ showQuotationInfo = false } = {}) {
    const contentWidth = pageWidth - marginX * 2;
    const headerY = 12;
    const headerH = 30;

    doc.setFillColor(...BRAND_LIGHT);
    doc.roundedRect(marginX, headerY, contentWidth, headerH, 4, 4, "F");

    try {
      doc.addImage(logoWaldo, "PNG", 16, 17, 50, 16);
    } catch (error) {
      console.warn("No se pudo cargar el logo en el PDF:", error);
    }

    if (!showQuotationInfo) {
      const compactDividerY = headerY + headerH + 6;
      doc.setDrawColor(...BRAND_PRIMARY);
      doc.setLineWidth(0.7);
      doc.line(marginX, compactDividerY, pageWidth - marginX, compactDividerY);
      return;
    }

    const infoY = 50;
    const boxH = 42;
    const leftBoxX = marginX;
    const leftBoxW = 88;
    const rightBoxW = 96;
    const rightBoxX = pageWidth - marginX - rightBoxW;

    doc.setDrawColor(...BRAND_BORDER);
    doc.setFillColor(...WHITE);
    doc.roundedRect(leftBoxX, infoY, leftBoxW, boxH, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text("Cotización", leftBoxX + 4, infoY + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_DARK);
    doc.text(`Folio: ${safeText(folio)}`, leftBoxX + 4, infoY + 17);
    doc.text(`Fecha de emisión: ${dateMX(created_at)}`, leftBoxX + 4, infoY + 24);
    doc.text(
      `Fecha de vencimiento: ${dateMX(fecha_vencimiento)}`,
      leftBoxX + 4,
      infoY + 31,
    );

    doc.setDrawColor(...BRAND_BORDER);
    doc.setFillColor(...WHITE);
    doc.roundedRect(rightBoxX, infoY, rightBoxW, boxH, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text("Cliente", rightBoxX + 4, infoY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_DARK);

    let y = infoY + 14;

    const clientNameLines = doc.splitTextToSize(
      safeText(cliente_nombre),
      rightBoxW - 8,
    );
    doc.text(clientNameLines, rightBoxX + 4, y);
    y += clientNameLines.length * 4.5;

    doc.text(`Tel: ${safeText(cliente_telefono)}`, rightBoxX + 4, y);
    y += 4.5;

    const clientEmailLines = doc.splitTextToSize(
      `Email: ${safeText(cliente_email)}`,
      rightBoxW - 8,
    );
    doc.text(clientEmailLines, rightBoxX + 4, y);

    const dividerY = 98;
    doc.setDrawColor(...BRAND_PRIMARY);
    doc.setLineWidth(0.9);
    doc.line(marginX, dividerY, pageWidth - marginX, dividerY);
  }

  function drawFooter() {
    const footerTextY = pageHeight - 12;

    doc.setDrawColor(...BRAND_BORDER);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerLineY, pageWidth - marginX, footerLineY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_MUTED);

    doc.text("Gracias por su preferencia.", marginX, footerTextY);

    doc.text(
      `Documento generado el ${dateMX(new Date())}`,
      pageWidth - marginX,
      footerTextY,
      { align: "right" },
    );
  }

  function drawTotalLine(label, value, y, options = {}) {
    const { bold = false, negative = false } = options;

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_DARK);
    doc.text(label, totalsBoxX + 4, y);

    doc.text(
      `${negative ? "-" : ""}${money(value || 0)}`,
      totalsBoxX + totalsBoxW - 4,
      y,
      { align: "right" },
    );
  }

  function drawTotalsBox(y) {
    doc.setFillColor(...BRAND_LIGHT);
    doc.setDrawColor(...BRAND_BORDER);
    doc.roundedRect(totalsBoxX, y, totalsBoxW, totalsBoxH, 3, 3, "FD");

    let lineY = y + 8;

    drawTotalLine("Subtotal:", subtotal, lineY);
    lineY += 7;

    drawTotalLine("Descuento:", descuento, lineY, { negative: true });
    lineY += 7;

    drawTotalLine("Base:", base, lineY);
    lineY += 7;

    drawTotalLine(`IVA ${Number(iva_porcentaje || 0)}%:`, ivaMonto, lineY);
    lineY += 7;

    if (hasIsr) {
      drawTotalLine(`ISR retenido ${isrPorcentaje}%:`, isrMonto, lineY, {
        negative: true,
      });
    }

    doc.setFillColor(...BRAND_PRIMARY);
    doc.roundedRect(
      totalsBoxX + 2,
      y + totalsBoxH - 11,
      totalsBoxW - 4,
      9,
      2,
      2,
      "F",
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text("Total", totalsBoxX + 6, y + totalsBoxH - 5);
    doc.text(money(displayTotal), totalsBoxX + totalsBoxW - 6, y + totalsBoxH - 5, {
      align: "right",
    });
  }

  function drawNotesBox(y) {
    if (!notas) return 0;

    const notesWidth = 106;
    const splitNotes = doc.splitTextToSize(String(notas), notesWidth - 8);
    const notesBoxH = Math.max(24, 10 + splitNotes.length * 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text("Notas", marginX, y - 2);

    doc.setDrawColor(...BRAND_BORDER);
    doc.setFillColor(...WHITE);
    doc.roundedRect(marginX, y, notesWidth, notesBoxH, 3, 3, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_DARK);
    doc.text(splitNotes, marginX + 4, y + 7);

    return notesBoxH;
  }

  autoTable(doc, {
    startY: firstPageContentStartY,
    head: [["Código", "Producto", "Unidad", "Cantidad", "Precio", "Importe"]],
    body: detalles.map((item) => [
      item.codigo || "-",
      item.nombre_producto || "-",
      capitalizeFirstLetter(item.unidad),
      Number(item.cantidad || 0).toString(),
      money(item.precio_unitario || 0),
      money(item.importe || 0),
    ]),
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3.2,
      textColor: BRAND_DARK,
      lineColor: BRAND_BORDER,
      lineWidth: 0.2,
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: WHITE,
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    columnStyles: {
      // Más espacio para el código WALDO.
      0: { cellWidth: 34 },
      1: { cellWidth: 59 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 26, halign: "right" },
      5: { cellWidth: 29, halign: "right" },
    },
    margin: {
      top: continuationContentStartY,
      left: marginX,
      right: marginX,
      bottom: footerReservedSpace,
    },
    rowPageBreak: "avoid",
    didDrawPage: (data) => {
      drawHeader({ showQuotationInfo: data.pageNumber === 1 });
      drawFooter();
    },
  });

  let currentPage = doc.getNumberOfPages();
  doc.setPage(currentPage);

  const finalY = doc.lastAutoTable?.finalY || firstPageContentStartY;
  let afterTableY = finalY + 8;

  const hasNotes = Boolean(notas);
  let notesBoxH = 0;

  if (hasNotes) {
    const splitNotes = doc.splitTextToSize(String(notas), 98);
    notesBoxH = Math.max(24, 10 + splitNotes.length * 4.5);
  }

  const notesWouldFitAboveTotals =
    hasNotes && afterTableY + notesBoxH <= totalsBoxFixedY - 8;

  const totalsWouldOverlapTable = finalY + 8 > totalsBoxFixedY;

  if (totalsWouldOverlapTable || (hasNotes && !notesWouldFitAboveTotals)) {
    doc.addPage();
    currentPage = doc.getNumberOfPages();
    doc.setPage(currentPage);
    drawHeader({ showQuotationInfo: false });
    drawFooter();
    afterTableY = continuationContentStartY;
  }

  if (hasNotes) {
    const notesFit = afterTableY + notesBoxH <= totalsBoxFixedY - 8;

    if (notesFit) {
      drawNotesBox(afterTableY);
    } else {
      doc.addPage();
      currentPage = doc.getNumberOfPages();
      doc.setPage(currentPage);
      drawHeader({ showQuotationInfo: false });
      drawFooter();
      drawNotesBox(continuationContentStartY);
    }
  }

  drawTotalsBox(totalsBoxFixedY);

  doc.save(`${folio || "cotizacion"}.pdf`);
}