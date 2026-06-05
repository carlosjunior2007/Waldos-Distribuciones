import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoWaldo from "../../../assets/Logo.png";

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

function drawLogo(doc, x, y, w, h) {
  try {
    doc.addImage(logoWaldo, "PNG", x, y, w, h);
  } catch (error) {
    console.warn("No se pudo cargar el logo en el PDF:", error);
  }
}

function drawDocumentHeader(doc, options = {}) {
  const {
    title,
    subtitle,
    meta = [],
    marginX,
    pageWidth,
    colors,
    topY = 12,
    height = 28,
  } = options;

  const contentWidth = pageWidth - marginX * 2;

  doc.setFillColor(...colors.LIGHT);
  doc.setDrawColor(...colors.BORDER);
  doc.roundedRect(marginX, topY, contentWidth, height, 4, 4, "FD");

  drawLogo(doc, marginX + 5, topY + 6, 42, 13);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...colors.DARK);
  doc.text(title, marginX + 53, topY + 11);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(...colors.MUTED);
    doc.text(subtitle, marginX + 53, topY + 17);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...colors.DARK);

  meta.slice(0, 3).forEach((item, index) => {
    doc.text(String(item), pageWidth - marginX - 5, topY + 9 + index * 6, {
      align: "right",
    });
  });
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

function addressLabel(address, delivery = null) {
  if (!address && !delivery?.cliente_direccion_id) return "Recogido por el cliente";
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
    drawDocumentHeader(doc, {
      title: "Pedido",
      subtitle: "Resumen de pedido, productos y entregas",
      meta: [
        `Folio: ${text(order?.folio)}`,
        `Tracking: ${trackingToken}`,
        `Estado: ${statusText(order?.estado)}`,
      ],
      marginX,
      pageWidth,
      colors,
      topY: 10,
      height: 28,
    });

    doc.setDrawColor(...colors.RED);
    doc.setLineWidth(0.55);
    doc.line(marginX, 43, pageWidth - marginX, 43);

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

  const topY = 55;
  const cardGap = 8;
  const cardW = (contentWidth - cardGap) / 2;
  const cardH = 58;

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
  rightY += 17;
  drawLabelValue(doc, "Referencia", text(order?.pago_referencia, "Sin referencia"), orderX + 5, rightY, cardW - 10, colors);

  const productsStartY = topY + cardH + 12;

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
    margin: { top: 52, left: marginX, right: marginX, bottom: 30 },
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
        return [text(delivery.folio), dateMX(delivery.fecha_entrega, true), statusText(delivery.estado), addressLabel(address, delivery), qty(total)];
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
      margin: { top: 52, left: marginX, right: marginX, bottom: 30 },
      didDrawPage: drawPageHeader,
    });
    finalY = doc.lastAutoTable?.finalY || finalY;
  }

  const totalLines = [
    { label: "Subtotal", value: money(totals.subtotal) },
    ...(totals.hasDiscount
      ? [{ label: "Descuento", value: `-${money(totals.descuento)}` }]
      : []),
    { label: "Base", value: money(totals.base) },
    { label: `IVA ${percentText(totals.ivaPorcentaje)}%`, value: money(totals.iva) },
    ...(totals.hasIsr
      ? [{ label: `ISR retenido ${percentText(totals.isrPorcentaje)}%`, value: `-${money(totals.isr)}` }]
      : []),
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
    const colors = {
      RED,
      DARK,
      MUTED,
      BORDER,
      LIGHT,
      WHITE,
    };

    drawDocumentHeader(doc, {
      title: "Contra recibo",
      subtitle: "Comprobante de entrega de mercancía",
      meta: [
        `Pedido: ${text(order?.folio)}`,
        `Entrega: ${text(selectedDelivery?.folio, "Sin folio")}`,
        `Estado: ${statusText(selectedDelivery?.estado || "Pendiente")}`,
      ],
      marginX,
      pageWidth,
      colors,
      topY: 12,
      height: 30,
    });

    doc.setDrawColor(...RED);
    doc.setLineWidth(0.55);
    doc.line(marginX, 47, pageWidth - marginX, 47);

    drawFooter(doc, marginX, pageWidth, pageHeight, MUTED);
  }

  header();

  const y = 60;
  doc.setDrawColor(...BORDER);
  doc.setFillColor(...WHITE);
  doc.roundedRect(marginX, y, contentWidth, 48, 4, 4, "FD");
  doc.setDrawColor(...BORDER);
  doc.line(pageWidth / 2 - 3, y + 10, pageWidth / 2 - 3, y + 42);

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
  doc.text(doc.splitTextToSize(`Dirección: ${addressLabel(address, delivery)}`, contentWidth / 2 - 8), rx, y + 34);

  autoTable(doc, {
    startY: 120,
    head: [["No.", "Código", "Producto", "Cantidad"]],
    body: details.map((item, index) => [String(item.orden || index + 1), text(item.codigo), text(item.nombre_producto), qty(item.cantidad_entregada)]),
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 3, textColor: DARK, lineColor: BORDER, lineWidth: 0.2, overflow: "linebreak" },
    headStyles: { fillColor: RED, textColor: WHITE, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: { 0: { cellWidth: 16, halign: "center" }, 1: { cellWidth: 28 }, 2: { cellWidth: contentWidth - 76 }, 3: { cellWidth: 32, halign: "right" } },
    margin: { top: 58, left: marginX, right: marginX, bottom: 48 },
    didDrawPage: header,
  });

  const lastY = doc.lastAutoTable?.finalY || 120;
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

function supplierContact(supplier = {}) {
  return [
    supplier.contacto_nombre,
    supplier.telefono,
    supplier.correo,
  ]
    .filter(Boolean)
    .join(" · ");
}

function normalizeDetailSuppliers(detail = {}) {
  return (detail.proveedores_asociados || []).map((item) => ({
    ...item,
    proveedor: item.proveedor || {
      nombre: item.nombre,
      correo: item.correo,
      telefono: item.telefono,
      contacto_nombre: item.contacto_nombre,
      rfc: item.rfc,
    },
  }));
}

function getOrderProductName(detail = {}) {
  return detail.nombre_producto || detail.producto?.nombre || "Producto sin nombre";
}

function getOrderProductCode(detail = {}) {
  return detail.codigo || detail.producto?.codigo || "-";
}

function buildOrderSupplierRows(order = {}) {
  const details = order.details || [];

  return details.flatMap((detail) => {
    const suppliers = normalizeDetailSuppliers(detail);

    if (!suppliers.length) {
      return [
        {
          product: detail,
          supplier: null,
        },
      ];
    }

    return suppliers.map((supplier) => ({
      product: detail,
      supplier,
    }));
  });
}

export function generateOrderSuppliersPDF(order = {}) {
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
  const BRAND_WARNING = [146, 64, 14];
  const WHITE = [255, 255, 255];

  const marginX = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const details = order.details || [];
  const rows = buildOrderSupplierRows(order);
  const productsWithoutSuppliers = rows.filter((row) => !row.supplier).length;
  const supplierCount = rows.filter((row) => row.supplier).length;

  function drawHeader() {
    const contentWidth = pageWidth - marginX * 2;
    const headerY = 12;
    const headerH = 31;

    doc.setFillColor(...BRAND_LIGHT);
    doc.setDrawColor(...BRAND_BORDER);
    doc.roundedRect(marginX, headerY, contentWidth, headerH, 4, 4, "FD");

    try {
      doc.addImage(logoWaldo, "PNG", 16, 18, 48, 15);
    } catch (error) {
      console.warn("No se pudo cargar el logo en el PDF:", error);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text("Proveedores del pedido", pageWidth - marginX - 4, 24, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_MUTED);
    doc.text(`Pedido: ${text(order.folio)}`, pageWidth - marginX - 4, 31, {
      align: "right",
    });
    doc.text(`Generado: ${dateMX(new Date())}`, pageWidth - marginX - 4, 37, {
      align: "right",
    });

    doc.setDrawColor(...BRAND_PRIMARY);
    doc.setLineWidth(0.7);
    doc.line(marginX, 49, pageWidth - marginX, 49);
  }

  function drawInfoBoxes() {
    const boxY = 56;
    const gap = 6;
    const boxW = (pageWidth - marginX * 2 - gap) / 2;
    const boxH = 37;

    doc.setDrawColor(...BRAND_BORDER);
    doc.setFillColor(...WHITE);
    doc.roundedRect(marginX, boxY, boxW, boxH, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text("Pedido", marginX + 4, boxY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_DARK);
    doc.text(`Folio: ${text(order.folio)}`, marginX + 4, boxY + 15);
    doc.text(`Tracking: ${text(order.tracking_token, "Pendiente")}`, marginX + 4, boxY + 22);
    doc.text(`Total: ${money(order.total)}`, marginX + 4, boxY + 29);

    const rightX = marginX + boxW + gap;
    doc.setDrawColor(...BRAND_BORDER);
    doc.setFillColor(...WHITE);
    doc.roundedRect(rightX, boxY, boxW, boxH, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text("Cliente", rightX + 4, boxY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_DARK);

    const clientLines = doc.splitTextToSize(
      text(order.cliente_nombre),
      boxW - 8,
    );
    doc.text(clientLines, rightX + 4, boxY + 15);

    let y = boxY + 15 + clientLines.length * 4.5;
    doc.text(`Tel: ${text(order.cliente_telefono)}`, rightX + 4, y);
    y += 6;
    doc.text(`Email: ${text(order.cliente_email)}`, rightX + 4, y);
  }

  function drawSummary() {
    const y = 101;
    const cardW = (pageWidth - marginX * 2 - 8) / 3;
    const values = [
      ["Productos", String(details.length)],
      ["Proveedores encontrados", String(supplierCount)],
      ["Sin proveedor", String(productsWithoutSuppliers)],
    ];

    values.forEach(([label, value], index) => {
      const x = marginX + index * (cardW + 4);
      const warning = index === 2 && Number(value) > 0;

      doc.setFillColor(...(warning ? [255, 247, 237] : BRAND_LIGHT));
      doc.setDrawColor(...(warning ? [253, 186, 116] : BRAND_BORDER));
      doc.roundedRect(x, y, cardW, 22, 3, 3, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.8);
      doc.setTextColor(...BRAND_MUTED);
      doc.text(label, x + 4, y + 7);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...(warning ? BRAND_WARNING : BRAND_DARK));
      doc.text(value, x + 4, y + 16);
    });
  }

  function drawFooter() {
    const footerY = pageHeight - 13;
    doc.setDrawColor(...BRAND_BORDER);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 20, pageWidth - marginX, pageHeight - 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_MUTED);
    doc.text("Documento interno de proveedores por pedido.", marginX, footerY);
    doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - marginX, footerY, {
      align: "right",
    });
  }

  drawHeader();
  drawInfoBoxes();
  drawSummary();

  autoTable(doc, {
    startY: 132,
    margin: { top: 58, left: marginX, right: marginX, bottom: 24 },
    head: [[
      "Producto",
      "Proveedor",
      "Contacto",
      "SKU / Costo",
      "Entrega / Notas",
    ]],
    body: rows.map(({ product, supplier }) => {
      const productText = [
        getOrderProductName(product),
        `Código: ${getOrderProductCode(product)}`,
        `Cantidad: ${qty(product.cantidad_pedida)}`,
      ].join("\n");

      if (!supplier) {
        return [
          productText,
          "Sin proveedor asociado",
          "-",
          `Costo pedido: ${money(product.costo_unitario)}`,
          "Revisar antes de comprar o surtir.",
        ];
      }

      const provider = supplier.proveedor || {};

      const supplierText = [
        provider.nombre || supplier.nombre || "Proveedor sin nombre",
        supplier.es_principal ? "Principal" : "Alternativo",
        provider.rfc ? `RFC: ${provider.rfc}` : "",
      ].filter(Boolean).join("\n");

      const contactText = [
        provider.contacto_nombre ? `Contacto: ${provider.contacto_nombre}` : "",
        provider.telefono ? `Tel: ${provider.telefono}` : "",
        provider.correo ? `Email: ${provider.correo}` : "",
      ].filter(Boolean).join("\n") || supplierContact(provider) || "-";

      const costText = [
        supplier.sku_proveedor ? `SKU: ${supplier.sku_proveedor}` : "SKU: -",
        `Costo prov.: ${
          supplier.precio_compra !== "" && supplier.precio_compra !== null
            ? money(supplier.precio_compra)
            : "-"
        }`,
        `Moneda: ${supplier.moneda || "MXN"}`,
        `Costo pedido: ${money(product.costo_unitario)}`,
      ].join("\n");

      const deliveryText = [
        supplier.tiempo_entrega_dias !== "" && supplier.tiempo_entrega_dias !== null
          ? `Entrega: ${supplier.tiempo_entrega_dias} días`
          : "Entrega: -",
        supplier.notas ? `Notas: ${supplier.notas}` : "",
      ].filter(Boolean).join("\n") || "-";

      return [productText, supplierText, contactText, costText, deliveryText];
    }),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 6.8,
      cellPadding: 2.1,
      textColor: BRAND_DARK,
      lineColor: BRAND_BORDER,
      lineWidth: 0.2,
      valign: "top",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [250, 251, 253],
    },
    tableWidth: pageWidth - marginX * 2,
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 31 },
      2: { cellWidth: 38 },
      3: { cellWidth: 38 },
      4: { cellWidth: 35 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        const raw = Array.isArray(data.cell.raw)
          ? data.cell.raw.join(" ")
          : String(data.cell.raw || "");

        if (raw.includes("Sin proveedor")) {
          data.cell.styles.textColor = BRAND_WARNING;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [255, 247, 237];
        }
      }
    },
    didDrawPage: () => {
      drawFooter();
    },
  });

  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    if (page > 1) {
      drawHeader();
    }
  }

  doc.save(`proveedores-${text(order.folio, "pedido")}.pdf`);
}

