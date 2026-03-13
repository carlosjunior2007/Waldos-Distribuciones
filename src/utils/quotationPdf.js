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
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function safeText(value) {
  return value ? String(value) : "-";
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
    notas,
    detalles = [],
  } = quotation;

  const marginX = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const totalsBoxW = 64;
  const totalsBoxH = 30;
  const totalsBoxX = pageWidth - marginX - totalsBoxW;
  const totalsBoxY = pageHeight - 54;

  const footerReservedSpace = 24;
  const lastPageReservedSpace = 60;
  const contentStartY = 98;

  function drawHeader() {
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

    const infoY = 50;
    const boxH = 34;
    const leftBoxX = marginX;
    const leftBoxW = 96;
    const rightBoxW = 84;
    const rightBoxX = pageWidth - marginX - rightBoxW;

    doc.setDrawColor(...BRAND_BORDER);
    doc.setFillColor(...WHITE);
    doc.roundedRect(leftBoxX, infoY, leftBoxW, boxH, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text("Cotización", leftBoxX + 4, infoY + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);
    doc.text(`Folio: ${safeText(folio)}`, leftBoxX + 4, infoY + 17);
    doc.text(`Fecha de emisión: ${dateMX(created_at)}`, leftBoxX + 4, infoY + 23);
    doc.text(
      `Fecha de vencimiento: ${dateMX(fecha_vencimiento)}`,
      leftBoxX + 4,
      infoY + 29
    );

    doc.setDrawColor(...BRAND_BORDER);
    doc.setFillColor(...WHITE);
    doc.roundedRect(rightBoxX, infoY, rightBoxW, boxH, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text("Cliente", rightBoxX + 4, infoY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_DARK);

    const clientNameLines = doc.splitTextToSize(
      safeText(cliente_nombre),
      rightBoxW - 8
    );
    doc.text(clientNameLines, rightBoxX + 4, infoY + 14);

    const clientTelY = infoY + 20 + (clientNameLines.length - 1) * 4;
    doc.text(`Tel: ${safeText(cliente_telefono)}`, rightBoxX + 4, clientTelY);

    const clientEmailY = clientTelY + 6;
    const clientEmailLines = doc.splitTextToSize(
      `Email: ${safeText(cliente_email)}`,
      rightBoxW - 8
    );
    doc.text(clientEmailLines, rightBoxX + 4, clientEmailY);

    const dividerY = 92;
    doc.setDrawColor(...BRAND_PRIMARY);
    doc.setLineWidth(0.9);
    doc.line(marginX, dividerY, pageWidth - marginX, dividerY);
  }

  function drawFooter() {
    const footerLineY = pageHeight - 20;
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
      { align: "right" }
    );
  }

  function drawTotalsBox() {
    doc.setFillColor(...BRAND_LIGHT);
    doc.setDrawColor(...BRAND_BORDER);
    doc.roundedRect(totalsBoxX, totalsBoxY, totalsBoxW, totalsBoxH, 3, 3, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);

    doc.text("Subtotal:", totalsBoxX + 4, totalsBoxY + 8);
    doc.text(money(subtotal || 0), totalsBoxX + totalsBoxW - 4, totalsBoxY + 8, {
      align: "right",
    });

    doc.text("Descuento:", totalsBoxX + 4, totalsBoxY + 16);
    doc.text(
      money(descuento || 0),
      totalsBoxX + totalsBoxW - 4,
      totalsBoxY + 16,
      { align: "right" }
    );

    doc.setFillColor(...BRAND_PRIMARY);
    doc.roundedRect(
      totalsBoxX + 2,
      totalsBoxY + 20,
      totalsBoxW - 4,
      8,
      2,
      2,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text("Total", totalsBoxX + 6, totalsBoxY + 25.5);
    doc.text(money(total || 0), totalsBoxX + totalsBoxW - 6, totalsBoxY + 25.5, {
      align: "right",
    });
  }

  autoTable(doc, {
    startY: contentStartY,
    head: [["Código", "Producto", "Unidad", "Cantidad", "Precio", "Importe"]],
    body: detalles.map((item) => [
      item.codigo || "-",
      item.nombre_producto || "-",
      item.unidad || "-",
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
      0: { cellWidth: 26 },
      1: { cellWidth: 67 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 26, halign: "right" },
      5: { cellWidth: 29, halign: "right" },
    },
    margin: {
      top: contentStartY,
      left: marginX,
      right: marginX,
      bottom: footerReservedSpace,
    },
    rowPageBreak: "avoid",
    didDrawPage: () => {
      drawHeader();
      drawFooter();
    },
  });

  let finalY = doc.lastAutoTable?.finalY || 110;
  let currentPage = doc.getNumberOfPages();

  doc.setPage(currentPage);

  let currentY = finalY + 8;

  let notesBoxH = 0;
  let splitNotes = [];

  if (notas) {
    splitNotes = doc.splitTextToSize(String(notas), 110 - 8);
    notesBoxH = Math.max(24, 10 + splitNotes.length * 4.5);
  }

  const bottomSafeLimitLastPage = pageHeight - lastPageReservedSpace;
  const sectionHeight = Math.max(notas ? notesBoxH : 0, totalsBoxH);

  if (currentY + sectionHeight > bottomSafeLimitLastPage) {
    doc.addPage();
    currentPage = doc.getNumberOfPages();
    doc.setPage(currentPage);
    drawHeader();
    drawFooter();
    currentY = contentStartY;
  }

  if (notas) {
    const notesBoxY = currentY;
    const notesBoxW = 110;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text("Notas", marginX, notesBoxY - 2);

    doc.setDrawColor(...BRAND_BORDER);
    doc.setFillColor(...WHITE);
    doc.roundedRect(marginX, notesBoxY, notesBoxW, notesBoxH, 3, 3, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_DARK);
    doc.text(splitNotes, marginX + 4, notesBoxY + 7);
  }

  drawTotalsBox();

  doc.save(`${folio || "cotizacion"}.pdf`);
}