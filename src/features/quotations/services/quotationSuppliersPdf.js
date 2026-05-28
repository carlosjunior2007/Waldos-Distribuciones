import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoWaldo from "../../../assets/Logo.png";

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
  const text = String(value ?? "").trim();
  return text || "-";
}

function getProductName(detail = {}) {
  return (
    detail.nombre_producto ||
    detail.producto?.nombre ||
    "Producto sin nombre"
  );
}

function getProductCode(detail = {}) {
  return detail.codigo || detail.producto?.codigo || "-";
}

function normalizeSupplierRelation(row = {}) {
  const supplier = row.proveedores || row.proveedor || null;

  return {
    id: row.id,
    proveedor_id: row.proveedor_id,
    nombre: supplier?.nombre || "Proveedor sin nombre",
    razon_social: supplier?.razon_social || "",
    rfc: supplier?.rfc || "",
    telefono: supplier?.telefono || "",
    correo: supplier?.correo || "",
    contacto_nombre: supplier?.contacto_nombre || "",
    sku_proveedor: row.sku_proveedor || "",
    precio_compra: row.precio_compra ?? "",
    moneda: row.moneda || "MXN",
    tiempo_entrega_dias: row.tiempo_entrega_dias ?? "",
    es_principal: Boolean(row.es_principal),
    notas: row.notas || "",
  };
}

function getDetailSuppliers(detail = {}) {
  const rows = detail.producto?.producto_proveedores || [];

  return rows
    .filter((row) => row.activo !== false)
    .filter((row) => row.proveedores?.activo !== false)
    .map(normalizeSupplierRelation)
    .sort((a, b) => Number(b.es_principal) - Number(a.es_principal));
}

function buildSupplierRows(quotation = {}) {
  const detalles = quotation.detalles || [];

  return detalles.flatMap((detail) => {
    const suppliers = getDetailSuppliers(detail);

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

export function generateQuotationSuppliersPDF(quotation = {}) {
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
  const rows = buildSupplierRows(quotation);
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
    doc.text("Proveedores de cotización", pageWidth - marginX - 4, 24, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_MUTED);
    doc.text(`Folio: ${safeText(quotation.folio)}`, pageWidth - marginX - 4, 31, {
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
    doc.text("Cotización", marginX + 4, boxY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_DARK);
    doc.text(`Folio: ${safeText(quotation.folio)}`, marginX + 4, boxY + 15);
    doc.text(`Fecha: ${dateMX(quotation.created_at)}`, marginX + 4, boxY + 22);
    doc.text(`Total: ${money(quotation.total)}`, marginX + 4, boxY + 29);

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
      safeText(quotation.cliente_nombre),
      boxW - 8,
    );
    doc.text(clientLines, rightX + 4, boxY + 15);

    let y = boxY + 15 + clientLines.length * 4.5;
    doc.text(`Tel: ${safeText(quotation.cliente_telefono)}`, rightX + 4, y);
    y += 6;
    doc.text(`Email: ${safeText(quotation.cliente_email)}`, rightX + 4, y);
  }

  function drawSummary() {
    const y = 101;
    const cardW = (pageWidth - marginX * 2 - 8) / 3;
    const values = [
      ["Productos", String(quotation.detalles?.length || 0)],
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
    doc.text("Documento interno de proveedores por cotización.", marginX, footerY);
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
        getProductName(product),
        `Código: ${getProductCode(product)}`,
        `Cantidad: ${Number(product.cantidad || 0)}`,
      ].join("\n");

      if (!supplier) {
        return [
          productText,
          "Sin proveedor asociado",
          "-",
          `Costo cotizado: ${money(product.costo_unitario)}`,
          "Revisar antes de comprar o cotizar.",
        ];
      }

      const supplierText = [
        supplier.nombre,
        supplier.es_principal ? "Principal" : "Alternativo",
        supplier.rfc ? `RFC: ${supplier.rfc}` : "",
      ].filter(Boolean).join("\n");

      const contactText = [
        supplier.contacto_nombre ? `Contacto: ${supplier.contacto_nombre}` : "",
        supplier.telefono ? `Tel: ${supplier.telefono}` : "",
        supplier.correo ? `Email: ${supplier.correo}` : "",
      ].filter(Boolean).join("\n") || "-";

      const costText = [
        supplier.sku_proveedor ? `SKU: ${supplier.sku_proveedor}` : "SKU: -",
        `Costo prov.: ${supplier.precio_compra !== "" ? money(supplier.precio_compra) : "-"}`,
        `Moneda: ${supplier.moneda || "MXN"}`,
        `Costo cotizado: ${money(product.costo_unitario)}`,
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
      fontSize: 7.2,
      cellPadding: 2.4,
      textColor: BRAND_DARK,
      lineColor: BRAND_BORDER,
      lineWidth: 0.2,
      valign: "top",
    },
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 7.4,
    },
    alternateRowStyles: {
      fillColor: [250, 251, 253],
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 36 },
      2: { cellWidth: 42 },
      3: { cellWidth: 35 },
      4: { cellWidth: 43 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        const text = Array.isArray(data.cell.raw)
          ? data.cell.raw.join(" ")
          : String(data.cell.raw || "");

        if (text.includes("Sin proveedor")) {
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

  doc.save(`proveedores-${safeText(quotation.folio)}.pdf`);
}
