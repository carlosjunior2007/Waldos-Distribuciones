import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoWaldo from "../assets/Logo.png";

function formatDate(value) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function safeText(value) {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text || "-";
}

function formatQuantity(value) {
  const number = Number(value || 0);

  if (Number.isInteger(number)) return String(number);

  return number.toLocaleString("es-MX", {
    maximumFractionDigits: 2,
  });
}

function getQuotationLabel(receipt = {}) {
  return (
    receipt.cotizacion_folio ||
    receipt.quotation_folio ||
    receipt.folio_cotizacion ||
    receipt.cotizaciones?.folio ||
    receipt.cotizacion?.folio ||
    receipt.quotation?.folio ||
    ""
  );
}

export function generateReceiptPDF(receipt) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const RED = [204, 0, 32];
  const DARK = [15, 23, 42];
  const MUTED = [75, 85, 99];
  const LIGHT_ROW = [247, 247, 247];
  const BORDER = [20, 20, 20];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 24;
  const contentWidth = pageWidth - marginX * 2;

  const {
    folio,
    cliente_nombre,
    cliente_rfc,
    cliente_direccion,
    cliente_telefono,
    fecha,
    ciudad,
    cotizacion_id,
    detalles = [],
  } = receipt || {};

  const cleanDetails = Array.isArray(detalles) ? detalles : [];
  const quotationLabel = getQuotationLabel(receipt);

  function drawHeader() {
    try {
      doc.addImage(logoWaldo, "PNG", marginX, 18, 52, 16);
    } catch (error) {
      console.warn("No se pudo cargar el logo:", error);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);

    doc.text(safeText(ciudad).toUpperCase(), pageWidth - marginX, 20, {
      align: "right",
    });

    doc.text(`FOLIO: ${safeText(folio)}`, pageWidth - marginX, 27, {
      align: "right",
    });

    doc.text(`FECHA: ${formatDate(fecha)}`, pageWidth - marginX, 34, {
      align: "right",
    });

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(marginX, 42, pageWidth - marginX, 42);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...DARK);
    doc.text("CONTRA RECIBO", pageWidth / 2, 53, {
      align: "center",
    });
  }

  function drawClientInfo(startY) {
    let y = startY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text("Facturar a:", marginX, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);

    doc.text(`Nombre: ${safeText(cliente_nombre)}`, marginX, y);
    y += 5;

    doc.text(`RFC: ${safeText(cliente_rfc)}`, marginX, y);
    y += 5;

    const addressLines = doc.splitTextToSize(
      `Dirección: ${safeText(cliente_direccion)}`,
      contentWidth * 0.62,
    );

    doc.text(addressLines, marginX, y);
    y += addressLines.length * 5;

    doc.text(`Número: ${safeText(cliente_telefono)}`, marginX, y);

    const rightX = pageWidth - marginX - 62;
    let rightY = startY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Cotización asociada:", rightX, rightY);

    rightY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(
      cotizacion_id || quotationLabel
        ? safeText(quotationLabel || cotizacion_id)
        : "Sin asociar",
      rightX,
      rightY,
    );

    return Math.max(y + 10, startY + 34);
  }

  function drawFooter() {
    const footerY = pageHeight - 13;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(marginX, footerY - 7, pageWidth - marginX, footerY - 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);

    doc.text("Waldo Distribuciones", marginX, footerY);

    doc.text(
      `Documento generado: ${formatDate(new Date())}`,
      pageWidth - marginX,
      footerY,
      { align: "right" },
    );
  }

  function drawSignature() {
    const y = pageHeight - 38;

    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 34, y, pageWidth / 2 + 34, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text("NOMBRE Y FIRMA", pageWidth / 2, y + 7, {
      align: "center",
    });
  }

  drawHeader();

  const tableStartY = drawClientInfo(65);

  autoTable(doc, {
    startY: tableStartY,
    head: [["No", "Descripción", "Cantidad", "Unidad"]],
    body: cleanDetails.map((item, index) => [
      String(item.orden || index + 1),
      safeText(item.descripcion),
      formatQuantity(item.cantidad),
      safeText(item.unidad),
    ]),
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: {
        top: 3,
        right: 2,
        bottom: 3,
        left: 2,
      },
      textColor: DARK,
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: RED,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: LIGHT_ROW,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: contentWidth - 15 - 34 - 30 },
      2: { cellWidth: 34, halign: "center" },
      3: { cellWidth: 30, halign: "center" },
    },
    margin: {
      top: 58,
      left: marginX,
      right: marginX,
      bottom: 44,
    },
    showHead: "everyPage",
    rowPageBreak: "avoid",
    didDrawPage: () => {
      drawFooter();
    },
  });

  let lastPage = doc.getNumberOfPages();
  doc.setPage(lastPage);

  const finalY = doc.lastAutoTable?.finalY || tableStartY;

  if (finalY + 24 > pageHeight - 44) {
    doc.addPage();
    lastPage = doc.getNumberOfPages();
    doc.setPage(lastPage);
    drawHeader();
    drawFooter();
  }

  drawSignature();

  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`Página ${page} de ${totalPages}`, pageWidth / 2, pageHeight - 13, {
      align: "center",
    });
  }

  doc.save(`${folio || "contra-recibo"}.pdf`);
}