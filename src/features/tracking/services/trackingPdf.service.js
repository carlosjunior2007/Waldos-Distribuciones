import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  dateMX,
  getOrderDeliveries,
  getOrderItems,
  getOrderTotals,
  getTrackingToken,
  getDeliveryAddress,
  getDeliveryItems,
  getDeliveryItemCode,
  getDeliveryItemName,
  getDeliveryItemQuantity,
  getDeliveryReceiver,
  getDeliveryUnits,
  moneyMX,
  percentMX,
  publicDeliveryStatusLabel,
  publicOrderStatusLabel,
  safeText,
} from '../tracking.helpers';

function quantityText(value) {
  const number = Number(value || 0);
  if (Number.isInteger(number)) return String(number);

  return number.toLocaleString('es-MX', {
    maximumFractionDigits: 2,
  });
}

function split(doc, text, width) {
  return doc.splitTextToSize(safeText(text), width);
}

export function generatePublicTrackingPDF(order) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const BRAND = [220, 0, 36];
  const DARK = [15, 23, 42];
  const MUTED = [91, 104, 124];
  const SOFT = [248, 250, 252];
  const BORDER = [226, 232, 240];
  const WHITE = [255, 255, 255];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  const items = getOrderItems(order);
  const deliveries = getOrderDeliveries(order);
  const totals = getOrderTotals(order);
  const trackingToken = getTrackingToken(order);

  function drawFooter() {
    const y = pageHeight - 13;

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.25);
    doc.line(marginX, y - 7, pageWidth - marginX, y - 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text('Waldo Distribuciones', marginX, y);
    doc.text(`Generado: ${dateMX(new Date(), true)}`, pageWidth - marginX, y, {
      align: 'right',
    });
  }

  function drawHeader() {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    doc.setTextColor(...DARK);
    doc.text('Seguimiento de pedido', marginX, 23);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('Resumen público del pedido y entregas registradas', marginX, 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(`Folio: ${safeText(order?.folio)}`, pageWidth - marginX, 22, {
      align: 'right',
    });
    doc.text(`Tracking: ${trackingToken}`, pageWidth - marginX, 29, {
      align: 'right',
    });

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.35);
    doc.line(marginX, 39, pageWidth - marginX, 39);
  }

  function drawInfoCards(startY) {
    const gap = 7;
    const cardW = (contentWidth - gap) / 2;
    const cardH = 34;
    const leftX = marginX;
    const rightX = marginX + cardW + gap;

    doc.setDrawColor(...BORDER);
    doc.setFillColor(...SOFT);
    doc.roundedRect(leftX, startY, cardW, cardH, 4, 4, 'FD');
    doc.roundedRect(rightX, startY, cardW, cardH, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND);
    doc.text('Cliente', leftX + 5, startY + 8);
    doc.text('Pedido', rightX + 5, startY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.1);
    doc.setTextColor(...DARK);

    let y = startY + 15;
    doc.text(`Nombre: ${safeText(order?.cliente_nombre || order?.cliente?.nombre)}`, leftX + 5, y);
    y += 5.2;
    doc.text(`Teléfono: ${safeText(order?.cliente_telefono || order?.cliente?.telefono)}`, leftX + 5, y);
    y += 5.2;

    const emailLines = split(doc, `Correo: ${safeText(order?.cliente_email || order?.cliente?.correo)}`, cardW - 10);
    doc.text(emailLines.slice(0, 2), leftX + 5, y);

    y = startY + 15;
    doc.text(`Estado: ${publicOrderStatusLabel(order?.estado)}`, rightX + 5, y);
    y += 5.2;
    doc.text(`Inicio: ${dateMX(order?.fecha_inicio)}`, rightX + 5, y);
    y += 5.2;
    doc.text(`Fin: ${dateMX(order?.fecha_fin)}`, rightX + 5, y);
    y += 5.2;
    doc.text(`Entregas: ${deliveries.length}`, rightX + 5, y);

    return startY + cardH + 10;
  }

  function drawSectionTitle(title, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK);
    doc.text(title, marginX, y);

    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.55);
    doc.line(marginX, y + 3, marginX + 16, y + 3);
  }

  function ensureSpace(currentY, needed = 42) {
    if (currentY + needed <= pageHeight - 18) return currentY;

    doc.addPage();
    drawHeader();
    drawFooter();
    return 48;
  }

  function drawTotalsBox(startY) {
    const boxW = 66;
    const hasDiscount = totals.hasDiscount || Number(totals.descuento || 0) > 0;
    const hasIsr = totals.hasIsr || Number(totals.isr || 0) > 0 || Number(totals.isrPorcentaje || 0) > 0;
    const boxH = 32 + (hasDiscount ? 7 : 0) + (hasIsr ? 7 : 0);
    const boxX = pageWidth - marginX - boxW;

    let y = ensureSpace(startY, boxH + 4);

    doc.setFillColor(...SOFT);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(boxX, y, boxW, boxH, 4, 4, 'FD');

    let lineY = y + 8;

    function line(label, value, bold = false) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(...DARK);
      doc.text(label, boxX + 5, lineY);
      doc.text(value, boxX + boxW - 5, lineY, { align: 'right' });
      lineY += 6.8;
    }

    line('Subtotal', moneyMX(totals.subtotal));
    if (hasDiscount) line('Descuento', `-${moneyMX(totals.descuento)}`);
    line(`IVA ${percentMX(totals.ivaPorcentaje)}%`, moneyMX(totals.iva));
    if (hasIsr) line(`ISR retenido ${percentMX(totals.isrPorcentaje)}%`, `-${moneyMX(totals.isr)}`);

    doc.setFillColor(...BRAND);
    doc.roundedRect(boxX + 4, y + boxH - 9, boxW - 8, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(...WHITE);
    doc.text('Total', boxX + 8, y + boxH - 4.5);
    doc.text(moneyMX(totals.total), boxX + boxW - 8, y + boxH - 4.5, { align: 'right' });

    return y + boxH + 8;
  }

  drawHeader();
  drawFooter();

  let y = drawInfoCards(48);

  drawSectionTitle('Productos del pedido', y);

  autoTable(doc, {
    startY: y + 8,
    head: [['Código', 'Producto', 'Pedido', 'Entregado', 'Pendiente', 'Precio', 'Importe']],
    body: items.map((item) => {
      const qty = Number(item.cantidad_pedida ?? item.cantidad ?? 0);
      const delivered = Number(item.cantidad_entregada ?? item.entregado ?? 0);
      const pending = Math.max(qty - delivered, 0);
      const price = Number(item.precio_unitario ?? item.precio ?? 0);

      return [
        safeText(item.codigo),
        safeText(item.nombre_producto || item.nombre),
        quantityText(qty),
        quantityText(delivered),
        quantityText(pending),
        moneyMX(price),
        moneyMX(qty * price),
      ];
    }),
    theme: 'plain',
    styles: {
      fontSize: 7.2,
      cellPadding: { top: 2.3, right: 1.6, bottom: 2.3, left: 1.6 },
      textColor: DARK,
      lineColor: BORDER,
      lineWidth: 0.15,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [71, 85, 105],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [252, 253, 255],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 56 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: marginX, right: marginX, bottom: 20 },
    didDrawPage: drawFooter,
  });

  y = (doc.lastAutoTable?.finalY || y) + 11;

  if (deliveries.length > 0) {
    y = ensureSpace(y, 30);
    drawSectionTitle('Entregas registradas', y);
    y += 8;

    deliveries.forEach((delivery, index) => {
      const deliveryItems = getDeliveryItems(delivery);
      const deliveryUnits = getDeliveryUnits(delivery);
      const receiver = getDeliveryReceiver(delivery);
      const address = getDeliveryAddress(delivery);

      y = ensureSpace(y, 34 + Math.min(deliveryItems.length, 4) * 7);

      doc.setDrawColor(...BORDER);
      doc.setFillColor(...SOFT);
      doc.roundedRect(marginX, y, contentWidth, 18, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      doc.text(safeText(delivery.folio, `Entrega ${index + 1}`), marginX + 4, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.1);
      doc.setTextColor(...MUTED);
      doc.text(`${dateMX(delivery.fecha_entrega, true)}  ·  ${publicDeliveryStatusLabel(delivery.estado)}`, marginX + 4, y + 12);
      doc.text(`Recibe: ${receiver}`, marginX + 4, y + 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(...DARK);
      doc.text(`${quantityText(deliveryUnits)} unidades`, pageWidth - marginX - 4, y + 6, {
        align: 'right',
      });

      const addressLines = split(doc, address, 66);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(...MUTED);
      doc.text(addressLines.slice(0, 2), pageWidth - marginX - 4, y + 12, {
        align: 'right',
      });

      y += 21;

      autoTable(doc, {
        startY: y,
        head: [['Producto entregado', 'Cantidad']],
        body:
          deliveryItems.length > 0
            ? deliveryItems.map((item) => {
                const code = getDeliveryItemCode(item, order);
                const name = getDeliveryItemName(item, order);
                const label = code ? `${name} · ${code}` : name;

                return [label, quantityText(getDeliveryItemQuantity(item))];
              })
            : [['Sin productos detallados para esta entrega', '-']],
        theme: 'plain',
        styles: {
          fontSize: 7,
          cellPadding: { top: 2.1, right: 1.6, bottom: 2.1, left: 1.6 },
          textColor: DARK,
          lineColor: BORDER,
          lineWidth: 0.15,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [71, 85, 105],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: contentWidth - 28 },
          1: { cellWidth: 28, halign: 'right' },
        },
        margin: { left: marginX, right: marginX, bottom: 20 },
        didDrawPage: drawFooter,
      });

      y = (doc.lastAutoTable?.finalY || y) + 6;
    });
  }

  drawTotalsBox(y + 2);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`Página ${page} de ${totalPages}`, pageWidth / 2, pageHeight - 13, {
      align: 'center',
    });
  }

  doc.save(`${order?.folio || trackingToken || 'pedido'}.pdf`);
}

export const generatePublicOrderPDF = generatePublicTrackingPDF;
