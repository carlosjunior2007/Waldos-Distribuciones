import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function money(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function dateMX(value, withTime = false) {
  if (!value) return "Sin fecha";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function text(value, fallback = "-") {
  const safe = value === null || value === undefined ? "" : String(value).trim();
  return safe || fallback;
}

function qty(value) {
  const number = Number(value || 0);
  if (Number.isInteger(number)) return String(number);
  return number.toLocaleString("es-MX", { maximumFractionDigits: 2 });
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function getOrderFinancialSummary(order, details = []) {
  const detailsSubtotal = details.reduce((sum, item) => {
    const quantity = finiteNumber(item.cantidad_pedida ?? item.cantidad, 0);
    const price = finiteNumber(item.precio_unitario ?? item.precio, 0);
    return sum + quantity * price;
  }, 0);

  const subtotal = finiteNumber(order?.subtotal, detailsSubtotal);
  const descuento = finiteNumber(order?.descuento, 0);
  const base = Math.max(subtotal - descuento, 0);
  const ivaPorcentaje = finiteNumber(order?.iva_porcentaje, 0);
  const iva = hasValue(order?.iva_monto)
    ? finiteNumber(order.iva_monto, 0)
    : base * (ivaPorcentaje / 100);

  const explicitIsr = hasValue(order?.isr_monto);
  let isrPorcentaje = finiteNumber(order?.isr_porcentaje, 0);
  let isr = explicitIsr ? finiteNumber(order.isr_monto, 0) : base * (isrPorcentaje / 100);

  const fallbackTotal = Math.max(base + iva - isr, 0);
  const total = hasValue(order?.total) ? finiteNumber(order.total, fallbackTotal) : fallbackTotal;

  if (!explicitIsr && isr <= 0 && total < base + iva) {
    isr = Math.max(base + iva - total, 0);
    if (base > 0 && isrPorcentaje <= 0) {
      isrPorcentaje = (isr / base) * 100;
    }
  }

  return {
    subtotal,
    descuento,
    base,
    iva,
    ivaPorcentaje,
    isr,
    isrPorcentaje,
    total,
    hasDiscount: descuento > 0,
    hasIsr: isr > 0.004 || isrPorcentaje > 0,
  };
}

function percentText(value) {
  const number = finiteNumber(value, 0);
  return Number.isInteger(number)
    ? String(number)
    : number.toLocaleString("es-MX", { maximumFractionDigits: 4 });
}

function statusText(value) {
  const map = {
    borrador: "Borrador",
    creado: "Creado",
    pendiente: "Pendiente",
    parcial: "Parcial",
    entregado: "Entregado",
    entregada: "Entregada",
    en_ruta: "En ruta",
    cancelado: "Cancelado",
    cancelada: "Cancelada",
    pagado: "Pagado",
  };
  return map[String(value || "").toLowerCase()] || text(value);
}

function getDeliveryAddress(order, delivery) {
  if (!delivery) return null;
  return (order?.cliente_direcciones || []).find((item) => item.id === delivery.cliente_direccion_id) || null;
}

function addressLabel(address) {
  if (!address) return "Sin dirección";
  return [address.nombre, address.direccion, address.ciudad, address.estado, address.codigo_postal]
    .filter(Boolean)
    .join(" · ");
}

function deliveryDetails(order, delivery) {
  if (!delivery) return [];
  const details = order?.details || [];
  return (delivery.details || delivery.entrega_detalles || []).map((item, index) => {
    const base = details.find((detail) => detail.id === item.pedido_detalle_id);
    return {
      orden: index + 1,
      codigo: item.codigo || base?.codigo || "-",
      nombre_producto: item.nombre_producto || base?.nombre_producto || "Producto",
      cantidad_entregada: Number(item.cantidad_entregada || 0),
    };
  });
}

function drawFooter(doc, marginX, pageWidth, pageHeight, muted) {
  const footerY = pageHeight - 12;
  doc.setDrawColor(220, 226, 232);
  doc.line(marginX, footerY - 7, pageWidth - marginX, footerY - 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text("Waldo Distribución", marginX, footerY);
  doc.text(`Generado: ${dateMX(new Date(), true)}`, pageWidth - marginX, footerY, { align: "right" });
}

function addPageNumbers(doc, muted) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text(`Página ${page} de ${total}`, pageWidth / 2, pageHeight - 12, { align: "center" });
  }
}

function drawLabelValue(doc, label, value, x, y, width, colors) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.MUTED);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.6);
  doc.setTextColor(...colors.DARK);
  const lines = doc.splitTextToSize(text(value), width);
  doc.text(lines, x, y + 4.5);
  return y + 4.5 + lines.length * 4.2;
}

export function generateOrderPDF(order) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const colors = {
    RED: [204, 0, 32],
    DARK: [15, 23, 42],
    MUTED: [100, 116, 139],
    BORDER: [226, 232, 240],
    SOFT_BORDER: [238, 242, 247],
    LIGHT: [248, 250, 252],
    WHITE: [255, 255, 255],
    NAVY: [31, 41, 55],
    SUCCESS: [22, 101, 52],
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;

  const details = Array.isArray(order?.details) ? order.details : [];
  const deliveries = Array.isArray(order?.deliveries) ? order.deliveries : [];
  const deliveredUnits = details.reduce((sum, item) => sum + Number(item.cantidad_entregada || 0), 0);
  const orderedUnits = details.reduce((sum, item) => sum + Number(item.cantidad_pedida || 0), 0);
  const pendingUnits = Math.max(orderedUnits - deliveredUnits, 0);
  const progress = orderedUnits > 0 ? Math.min(deliveredUnits / orderedUnits, 1) : 0;
  const totals = getOrderFinancialSummary(order, details);
  const trackingToken = text(order?.tracking_token, "Pendiente");

  function drawPageHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.setTextColor(...colors.DARK);
    doc.text("PEDIDO", marginX, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.MUTED);
    doc.text("Resumen de pedido, productos y entregas", marginX, 24);

    const metaX = pageWidth - marginX;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.DARK);
    doc.text(`Folio: ${text(order?.folio)}`, metaX, 18, { align: "right" });
    doc.text(`Tracking: ${trackingToken}`, metaX, 25, { align: "right" });

    doc.setDrawColor(...colors.BORDER);
    doc.setLineWidth(0.35);
    doc.line(marginX, 36, pageWidth - marginX, 36);
    drawFooter(doc, marginX, pageWidth, pageHeight, colors.MUTED);
  }

  function drawInfoCard(title, x, y, w, h) {
    doc.setDrawColor(...colors.BORDER);
    doc.setFillColor(...colors.WHITE);
    doc.roundedRect(x, y, w, h, 4, 4, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...colors.RED);
    doc.text(title, x + 5, y + 8);
  }

  function drawProgressBar(x, y, w, h) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, w, h, 2, 2, "F");
    doc.setFillColor(...colors.RED);
    doc.roundedRect(x, y, Math.max(w * progress, 0.01), h, 2, 2, "F");
  }

  drawPageHeader();

  const topY = 50;
  const cardGap = 8;
  const cardW = (contentWidth - cardGap) / 2;
  const cardH = 50;

  drawInfoCard("Cliente", marginX, topY, cardW, cardH);
  let y = topY + 17;
  y = drawLabelValue(doc, "Nombre", order?.cliente_nombre, marginX + 5, y, cardW - 10, colors) + 1;
  y = drawLabelValue(doc, "Teléfono", order?.cliente_telefono, marginX + 5, y, cardW - 10, colors) + 1;
  drawLabelValue(doc, "Correo", order?.cliente_email, marginX + 5, y, cardW - 10, colors);

  const orderX = marginX + cardW + cardGap;
  drawInfoCard("Pedido", orderX, topY, cardW, cardH);
  const colW = (cardW - 16) / 2;
  let rightY = topY + 17;
  drawLabelValue(doc, "Inicio", dateMX(order?.fecha_inicio || order?.entrega_inicio), orderX + 5, rightY, colW, colors);
  drawLabelValue(doc, "Fin", dateMX(order?.fecha_fin || order?.entrega_fin), orderX + 5 + colW + 6, rightY, colW, colors);
  rightY += 17;
  drawLabelValue(doc, "Pago", statusText(order?.estado_pago), orderX + 5, rightY, colW, colors);
  drawLabelValue(doc, "Método", text(order?.metodo_pago, "Sin definir"), orderX + 5 + colW + 6, rightY, colW, colors);

  const productsStartY = topY + cardH + 14;

  autoTable(doc, {
    startY: productsStartY,
    head: [["Código", "Producto", "Pedido", "Entregado", "Pendiente", "Precio", "Importe"]],
    body: details.map((item) => [
      text(item.codigo),
      text(item.nombre_producto),
      qty(item.cantidad_pedida),
      qty(item.cantidad_entregada),
      qty(item.cantidad_pendiente),
      money(item.precio_unitario),
      money(item.importe || Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0)),
    ]),
    theme: "grid",
    styles: {
      fontSize: 7.7,
      cellPadding: 2.6,
      textColor: colors.DARK,
      lineColor: colors.BORDER,
      lineWidth: 0.2,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: colors.RED,
      textColor: colors.WHITE,
      fontStyle: "bold",
      halign: "left",
      fontSize: 7.8,
    },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 60 },
      2: { cellWidth: 17, halign: "right" },
      3: { cellWidth: 19, halign: "right" },
      4: { cellWidth: 19, halign: "right" },
      5: { cellWidth: 21, halign: "right" },
      6: { cellWidth: 20, halign: "right" },
    },
    margin: { top: 48, left: marginX, right: marginX, bottom: 30 },
    didDrawPage: drawPageHeader,
  });

  let finalY = doc.lastAutoTable?.finalY || productsStartY;

  if (deliveries.length) {
    if (finalY + 52 > pageHeight - 42) {
      doc.addPage();
      finalY = 50;
    } else {
      finalY += 9;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.RED);
    doc.text("Entregas registradas", marginX, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [["Folio", "Fecha", "Estado", "Dirección", "Unidades"]],
      body: deliveries.map((delivery) => {
        const address = getDeliveryAddress(order, delivery);
        const total = deliveryDetails(order, delivery).reduce((sum, item) => sum + Number(item.cantidad_entregada || 0), 0);
        return [text(delivery.folio), dateMX(delivery.fecha_entrega, true), statusText(delivery.estado), addressLabel(address), qty(total)];
      }),
      theme: "grid",
      styles: {
        fontSize: 7.2,
        cellPadding: 2.5,
        textColor: colors.DARK,
        lineColor: colors.BORDER,
        lineWidth: 0.2,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: { fillColor: colors.NAVY, textColor: colors.WHITE, fontStyle: "bold", fontSize: 7.6 },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      columnStyles: {
        0: { cellWidth: 27 },
        1: { cellWidth: 32 },
        2: { cellWidth: 22 },
        3: { cellWidth: 77 },
        4: { cellWidth: 20, halign: "right" },
      },
      margin: { top: 48, left: marginX, right: marginX, bottom: 30 },
      didDrawPage: drawPageHeader,
    });
    finalY = doc.lastAutoTable?.finalY || finalY;
  }

  const totalLines = [
    { label: "Subtotal", value: money(totals.subtotal) },
    ...(totals.hasDiscount ? [{ label: "Descuento", value: `-${money(totals.descuento)}` }] : []),
    { label: `IVA ${percentText(totals.ivaPorcentaje)}%`, value: money(totals.iva) },
    ...(totals.hasIsr ? [{ label: `ISR retenido ${percentText(totals.isrPorcentaje)}%`, value: `-${money(totals.isr)}` }] : []),
  ];

  const totalsH = 20 + totalLines.length * 8;
  let totalsY = finalY + 10;
  if (totalsY + totalsH > pageHeight - 28) {
    doc.addPage();
    drawPageHeader();
    totalsY = 52;
  }

  const notesW = contentWidth - 72;
  if (order?.notas) {
    doc.setDrawColor(...colors.BORDER);
    doc.setFillColor(...colors.WHITE);
    doc.roundedRect(marginX, totalsY, notesW - 8, totalsH, 3, 3, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.setTextColor(...colors.RED);
    doc.text("Notas", marginX + 5, totalsY + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(...colors.DARK);
    doc.text(doc.splitTextToSize(String(order.notas), notesW - 20), marginX + 5, totalsY + 15);
  }

  const totalsW = 70;
  const totalsX = pageWidth - marginX - totalsW;
  doc.setFillColor(...colors.LIGHT);
  doc.setDrawColor(...colors.BORDER);
  doc.roundedRect(totalsX, totalsY, totalsW, totalsH, 4, 4, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.3);
  doc.setTextColor(...colors.DARK);

  let totalLineY = totalsY + 9;
  totalLines.forEach((line) => {
    doc.text(line.label, totalsX + 6, totalLineY);
    doc.text(line.value, totalsX + totalsW - 6, totalLineY, { align: "right" });
    totalLineY += 8;
  });

  doc.setFillColor(...colors.RED);
  doc.roundedRect(totalsX + 4, totalsY + totalsH - 13, totalsW - 8, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  doc.setTextColor(...colors.WHITE);
  doc.text("Total", totalsX + 8, totalsY + totalsH - 7);
  doc.text(money(totals.total), totalsX + totalsW - 8, totalsY + totalsH - 7, { align: "right" });

  addPageNumbers(doc, colors.MUTED);
  doc.save(`${order?.folio || "pedido"}.pdf`);
}

export function generateDeliveryReceiptPDF(order, delivery = null) {
  const selectedDelivery = delivery || order?.deliveries?.[0] || null;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const RED = [204, 0, 32];
  const DARK = [15, 23, 42];
  const MUTED = [100, 116, 139];
  const BORDER = [221, 226, 232];
  const LIGHT = [248, 250, 252];
  const WHITE = [255, 255, 255];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;
  const address = getDeliveryAddress(order, selectedDelivery);
  const details = selectedDelivery ? deliveryDetails(order, selectedDelivery) : (order?.details || []).map((item, index) => ({
    orden: index + 1,
    codigo: item.codigo,
    nombre_producto: item.nombre_producto,
    cantidad_entregada: Number(item.cantidad_pendiente || item.cantidad_pedida || 0),
  }));

  function header() {
    doc.setFillColor(...LIGHT);
    doc.roundedRect(marginX, 14, contentWidth, 28, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(...RED);
    doc.text("CONTRA RECIBO DE ENTREGA", pageWidth / 2, 26, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(`Pedido: ${text(order?.folio)}`, pageWidth - marginX - 5, 35, { align: "right" });
    doc.text(`Entrega: ${text(selectedDelivery?.folio, "Sin folio")}`, marginX + 5, 35);
    drawFooter(doc, marginX, pageWidth, pageHeight, MUTED);
  }

  header();

  const y = 54;
  doc.setDrawColor(...BORDER);
  doc.setFillColor(...WHITE);
  doc.roundedRect(marginX, y, contentWidth, 48, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...RED);
  doc.text("Cliente", marginX + 5, y + 8);
  doc.text("Entrega", pageWidth / 2 + 2, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text(`Nombre: ${text(order?.cliente_nombre)}`, marginX + 5, y + 16);
  doc.text(`Teléfono: ${text(order?.cliente_telefono)}`, marginX + 5, y + 22);
  doc.text(`Correo: ${text(order?.cliente_email)}`, marginX + 5, y + 28);
  doc.text(`Tracking: ${text(order?.tracking_token, "Pendiente")}`, marginX + 5, y + 34);

  const rx = pageWidth / 2 + 2;
  doc.text(`Fecha: ${dateMX(selectedDelivery?.fecha_entrega, true)}`, rx, y + 16);
  doc.text(`Estado: ${statusText(selectedDelivery?.estado || "Pendiente")}`, rx, y + 22);
  doc.text(`Recibe: ${text(selectedDelivery?.recibido_por || address?.contacto_nombre)}`, rx, y + 28);
  doc.text(doc.splitTextToSize(`Dirección: ${addressLabel(address)}`, contentWidth / 2 - 8), rx, y + 34);

  autoTable(doc, {
    startY: 112,
    head: [["No.", "Código", "Producto", "Cantidad"]],
    body: details.map((item, index) => [String(item.orden || index + 1), text(item.codigo), text(item.nombre_producto), qty(item.cantidad_entregada)]),
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 3, textColor: DARK, lineColor: BORDER, lineWidth: 0.2, overflow: "linebreak" },
    headStyles: { fillColor: RED, textColor: WHITE, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: { 0: { cellWidth: 16, halign: "center" }, 1: { cellWidth: 28 }, 2: { cellWidth: contentWidth - 76 }, 3: { cellWidth: 32, halign: "right" } },
    margin: { top: 54, left: marginX, right: marginX, bottom: 48 },
    didDrawPage: header,
  });

  const lastY = doc.lastAutoTable?.finalY || 112;
  if (lastY + 34 > pageHeight - 48) doc.addPage();
  const signY = Math.min(Math.max(lastY + 28, 230), pageHeight - 38);
  doc.setDrawColor(150, 150, 150);
  doc.line(pageWidth / 2 - 38, signY, pageWidth / 2 + 38, signY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text("NOMBRE Y FIRMA DE RECIBIDO", pageWidth / 2, signY + 7, { align: "center" });

  if (selectedDelivery?.notas) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(`Notas: ${selectedDelivery.notas}`, contentWidth), marginX, signY + 18);
  }

  addPageNumbers(doc, MUTED);
  doc.save(`${selectedDelivery?.folio || order?.folio || "contra-recibo"}.pdf`);
}
