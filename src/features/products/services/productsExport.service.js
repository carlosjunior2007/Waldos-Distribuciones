import * as XLSX from "xlsx";
import jsPDF from "jspdf";

import { formatUtilityPercent, getCategoryLabel } from "../product.helpers";

export function exportProductsToExcel(products = []) {
  const dataToExport = products.map((item) => ({
    id: item.id || "",
    codigo: item.codigo || "",
    nombre: item.nombre || "",
    descripcion: item.descripcion || "",
    categoria: item.categoria || "",
    unidad: item.unidad || "",
    precio_compra: Number(item.precio_compra || 0),
    utilidad: formatUtilityPercent(item),
    precio: Number(item.precio || 0),
    cantidad_caja: Number(item.cantidad_caja || 0),
    habilitado: Boolean(item.habilitado),
    clave_sat: item.clave_sat || "",
    clave_unidad_sat: item.clave_unidad_sat || "",
    iva_porcentaje: Number(item.iva_porcentaje || 16),
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

  XLSX.writeFile(
    workbook,
    `productos_edicion_masiva_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export async function exportProductsToPDF(filteredProducts = [], options = {}) {
  const { includePrices = true, includeImages = true } = options || {};

  const dataToExport = filteredProducts.filter((item) =>
    Boolean(item.habilitado),
  );

  if (!dataToExport.length) {
    throw new Error("No hay productos visibles en web y disponibles para exportar en PDF.");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
    precision: 2,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const marginX = 12;
  const marginBottom = 12;

  const BRAND_ACCENT = [226, 17, 42];
  const BRAND_DARK = [15, 23, 42];
  const BG = [248, 250, 252];
  const SURFACE = [255, 255, 255];
  const BORDER = [226, 232, 240];
  const TEXT_PRIMARY = [15, 23, 42];
  const TEXT_SECONDARY = [51, 65, 85];
  const TEXT_MUTED = [100, 116, 139];
  const SUCCESS = [5, 150, 105];

  const [logoData, imageMap] = await Promise.all([
    loadImageAsDataUrl("/Logo.png"),
    includeImages
      ? preloadProductImages(dataToExport)
      : Promise.resolve(new Map()),
  ]);

  // Antes eran 3 productos por página con imagen. Ahora caben 4 con mejor uso de espacio,
  // menos páginas y menos sensación de catálogo inflado por aire.
  const productsPerPage = includeImages ? 4 : 7;
  const groupedProducts = splitIntoChunks(dataToExport, productsPerPage);
  const totalPages = groupedProducts.length;

  const catalogType = includePrices
    ? "Catálogo con precios"
    : "Catálogo de productos";
  const dateLabel = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  for (let pageIndex = 0; pageIndex < groupedProducts.length; pageIndex++) {
    const group = groupedProducts[pageIndex];

    if (pageIndex > 0) pdf.addPage();

    pdf.setFillColor(...SURFACE);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    drawCatalogHeader({
      pdf,
      logoData,
      pageWidth,
      marginX,
      catalogType,
      pageIndex,
      totalPages,
      BRAND_DARK,
      TEXT_MUTED,
      BORDER,
    });

    const contentTop = 27;
    const contentBottom = pageHeight - marginBottom;
    const availableHeight = contentBottom - contentTop;
    const gap = includeImages ? 5 : 4;
    const cardHeight =
      (availableHeight - gap * (productsPerPage - 1)) / productsPerPage;
    const cardWidth = pageWidth - marginX * 2;

    for (let i = 0; i < group.length; i++) {
      const item = group[i];
      const cardX = marginX;
      const cardY = contentTop + i * (cardHeight + gap);

      pdf.setFillColor(...SURFACE);
      pdf.setDrawColor(...BORDER);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, "FD");

      const innerPad = 5;
      const categoryLabel = getCategoryLabel(item.categoria);

      let textX = cardX + innerPad;
      let textW = cardWidth - innerPad * 2;
      let titleY = cardY + 13;

      if (includeImages) {
        const imageBoxX = cardX + innerPad;
        const imageBoxY = cardY + 12;
        const imageBoxW = 35;
        const imageBoxH = cardHeight - 18;

        textX = imageBoxX + imageBoxW + 7;
        textW = cardWidth - (textX - cardX) - innerPad;
        titleY = cardY + 14;

        pdf.setFillColor(...BG);
        pdf.setDrawColor(...BORDER);
        pdf.roundedRect(imageBoxX, imageBoxY, imageBoxW, imageBoxH, 3, 3, "FD");

        const imageData = imageMap.get(item.imagen);

        if (imageData?.dataUrl) {
          try {
            const fit = fitImageContain(
              imageData.width || imageBoxW,
              imageData.height || imageBoxH,
              imageBoxW - 4,
              imageBoxH - 4,
            );

            pdf.addImage(
              imageData.dataUrl,
              imageData.format,
              imageBoxX + 2 + fit.x,
              imageBoxY + 2 + fit.y,
              fit.width,
              fit.height,
              undefined,
              "FAST",
            );
          } catch (error) {
            console.error("No se pudo insertar la imagen:", error);
            drawImageFallback(
              pdf,
              imageBoxX,
              imageBoxY,
              imageBoxW,
              imageBoxH,
              TEXT_MUTED,
            );
          }
        } else {
          drawImageFallback(
            pdf,
            imageBoxX,
            imageBoxY,
            imageBoxW,
            imageBoxH,
            TEXT_MUTED,
          );
        }
      }

      const categoryPillY = cardY + 5.5;
      const categoryPillW = Math.min(48, Math.max(34, pdf.getTextWidth(categoryLabel) + 7));

      pdf.setFillColor(...BRAND_ACCENT);
      pdf.roundedRect(textX, categoryPillY, categoryPillW, 6.2, 2, 2, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.4);
      pdf.text(
        limitText(pdf, categoryLabel, categoryPillW - 5),
        textX + 2.5,
        categoryPillY + 4.2,
      );

      const safeTitleY = includeImages ? categoryPillY + 13.2 : titleY;

      pdf.setTextColor(...TEXT_PRIMARY);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(includeImages ? 11.4 : 11.3);

      const titleLines = pdf.splitTextToSize(
        safeText(item.nombre, "Sin nombre"),
        textW,
      );
      const maxTitleLines = includeImages ? 2 : 1;
      pdf.text(titleLines.slice(0, maxTitleLines), textX, safeTitleY);

      const titleLineCount = Math.min(titleLines.length, maxTitleLines);
      const afterTitleY =
        (includeImages ? safeTitleY : titleY) + titleLineCount * 4.7 + 1.8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.2);
      pdf.setTextColor(...TEXT_MUTED);

      const meta = [
        `Código: ${safeText(item.codigo, "Sin código")}`,
        item.unidad ? `Unidad: ${capitalizeFirstLetter(item.unidad)}` : "",
        item.cantidad_caja ? `Caja: ${item.cantidad_caja}` : "",
      ]
        .filter(Boolean)
        .join("   ·   ");

      pdf.text(limitText(pdf, meta, textW), textX, afterTitleY);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(includeImages ? 8.4 : 8.8);
      pdf.setTextColor(...TEXT_SECONDARY);

      const desc = safeText(item.descripcion, "Sin descripción disponible.");
      const descLines = pdf.splitTextToSize(desc, textW);
      const maxDescLines = includeImages ? 3 : 2;
      const finalDescLines = descLines.slice(0, maxDescLines);

      if (descLines.length > maxDescLines) {
        const lastIndex = maxDescLines - 1;
        const last = finalDescLines[lastIndex] || "";
        finalDescLines[lastIndex] =
          `${last.slice(0, Math.max(0, last.length - 3))}...`;
      }

      pdf.text(finalDescLines, textX, afterTitleY + 6);

      pdf.setDrawColor(...BORDER);
      pdf.line(
        textX,
        cardY + cardHeight - 11,
        cardX + cardWidth - innerPad,
        cardY + cardHeight - 11,
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.6);

      if (includePrices) {
        pdf.setTextColor(...TEXT_MUTED);
        pdf.text("Precio", textX, cardY + cardHeight - 5.2);

        pdf.setTextColor(...SUCCESS);
        pdf.setFontSize(10.2);
        pdf.text(
          money(item.precio || 0),
          cardX + cardWidth - innerPad,
          cardY + cardHeight - 5.2,
          { align: "right" },
        );
      } else {
        pdf.setTextColor(...TEXT_MUTED);
        pdf.text("Disponible en catálogo", textX, cardY + cardHeight - 5.2);
      }
    }

    drawCatalogFooter({
      pdf,
      pageWidth,
      pageHeight,
      marginX,
      pageIndex,
      totalPages,
      dateLabel,
      includePrices,
      BORDER,
      TEXT_MUTED,
    });
  }

  const fileMode = [
    includePrices ? "con_precios" : "sin_precios",
    includeImages ? "con_imagenes" : "sin_imagenes",
  ].join("_");

  pdf.save(
    `catalogo_productos_${fileMode}_${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}

function drawCatalogHeader({
  pdf,
  logoData,
  pageWidth,
  marginX,
  catalogType,
  pageIndex,
  totalPages,
  BRAND_DARK,
  TEXT_MUTED,
  BORDER,
}) {
  const headerH = 21;

  if (logoData) {
    try {
      pdf.addImage(logoData, "PNG", marginX, 5, 31, 9);
    } catch (error) {
      console.error("No se pudo insertar el logo:", error);
    }
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(...BRAND_DARK);
  pdf.text(catalogType, pageWidth / 2, 10.5, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...TEXT_MUTED);
  pdf.text("Waldo Distribución", pageWidth / 2, 16, { align: "center" });

  pdf.setFontSize(8.5);
  pdf.text(
    `Página ${pageIndex + 1} de ${totalPages}`,
    pageWidth - marginX,
    11,
    {
      align: "right",
    },
  );

  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.35);
  pdf.line(marginX, headerH, pageWidth - marginX, headerH);
}

function drawCatalogFooter({
  pdf,
  pageWidth,
  pageHeight,
  marginX,
  pageIndex,
  totalPages,
  dateLabel,
  includePrices,
  BORDER,
  TEXT_MUTED,
}) {
  pdf.setDrawColor(...BORDER);
  pdf.line(marginX, pageHeight - 8, pageWidth - marginX, pageHeight - 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...TEXT_MUTED);

  const note = includePrices
    ? "Precios sujetos a cambio sin previo aviso."
    : "Catálogo informativo sin precios.";

  pdf.text(note, marginX, pageHeight - 3.5);
  pdf.text(
    `${dateLabel} · Página ${pageIndex + 1} de ${totalPages}`,
    pageWidth - marginX,
    pageHeight - 3.5,
    { align: "right" },
  );
}

function drawImageFallback(pdf, x, y, w, h, TEXT_MUTED) {
  pdf.setTextColor(...TEXT_MUTED);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text("Sin imagen", x + w / 2, y + h / 2, { align: "center" });
}

function money(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function limitText(pdf, text, maxWidth) {
  const value = safeText(text, "");

  if (pdf.getTextWidth(value) <= maxWidth) return value;

  let output = value;

  while (output.length > 0 && pdf.getTextWidth(`${output}...`) > maxWidth) {
    output = output.slice(0, -1);
  }

  return `${output}...`;
}

export async function importProductsFromExcel(file, { updateProduct }) {
  if (!file) return { updated: 0, errors: [] };

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  const errors = [];
  let updated = 0;

  for (const [index, row] of rows.entries()) {
    try {
      if (!row.id) {
        errors.push(`Fila ${index + 2}: falta id`);
        continue;
      }

      const payload = {
        codigo: String(row.codigo || "").trim(),
        nombre: String(row.nombre || "").trim(),
        descripcion: String(row.descripcion || "").trim(),
        categoria: String(row.categoria || "").trim(),
        unidad: String(row.unidad || "").trim(),
        precio_compra: Number(row.precio_compra || 0),
        precio: Number(row.precio || 0),
        cantidad_caja: Number(row.cantidad_caja || 0),
        habilitado:
          row.habilitado === true ||
          String(row.habilitado).toLowerCase() === "true" ||
          String(row.habilitado).toLowerCase() === "sí" ||
          String(row.habilitado).toLowerCase() === "si",
        clave_sat: String(row.clave_sat || "").trim(),
        clave_unidad_sat: String(row.clave_unidad_sat || "").trim(),
        iva_porcentaje: Number(row.iva_porcentaje || 16),
        updated_at: new Date().toISOString(),
      };

      if (!payload.nombre) {
        errors.push(`Fila ${index + 2}: falta nombre`);
        continue;
      }

      await updateProduct(row.id, payload);
      updated += 1;
    } catch (error) {
      errors.push(`Fila ${index + 2}: ${error.message}`);
    }
  }

  return { updated, errors };
}

const pdfImageCache = new Map();

async function preloadProductImages(products = []) {
  const urls = [
    ...new Set(
      products
        .map((item) => item.imagen)
        .filter((url) => typeof url === "string" && url.trim()),
    ),
  ];

  const entries = await runWithConcurrency(urls, 8, async (url) => {
    const imageData = await loadImageForPdf(url);
    return [url, imageData];
  });

  return new Map(entries.filter(([_, imageData]) => Boolean(imageData)));
}

async function loadImageAsDataUrl(url) {
  const imageData = await loadImageForPdf(url);
  return imageData?.dataUrl || null;
}

async function loadImageForPdf(url) {
  if (!url) return null;

  if (pdfImageCache.has(url)) {
    return pdfImageCache.get(url);
  }

  const loadPromise = (async () => {
    try {
      const response = await fetch(url, { mode: "cors" });

      if (!response.ok) throw new Error("No se pudo cargar la imagen");

      const blob = await response.blob();
      const originalDataUrl = await readBlobAsDataURL(blob);
      const optimized = await optimizeImageForPdf(originalDataUrl, {
        maxWidth: 420,
        maxHeight: 420,
        quality: 0.72,
      });

      return optimized;
    } catch (error) {
      console.error("No se pudo cargar la imagen para PDF:", error);
      return null;
    }
  })();

  pdfImageCache.set(url, loadPromise);
  return loadPromise;
}

function readBlobAsDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


async function optimizeImageForPdf(dataUrl, options = {}) {
  const {
    maxWidth = 420,
    maxHeight = 420,
    quality = 0.72,
  } = options;

  if (!dataUrl) return null;

  return await new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const ratio = Math.min(
        maxWidth / image.width,
        maxHeight / image.height,
        1,
      );

      const width = Math.max(1, Math.round(image.width * ratio));
      const height = Math.max(1, Math.round(image.height * ratio));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      resolve({
        dataUrl: canvas.toDataURL("image/jpeg", quality),
        format: "JPEG",
        width,
        height,
      });
    };

    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;

  async function runner() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () =>
    runner(),
  );

  await Promise.all(runners);
  return results;
}

function capitalizeFirstLetter(value) {
  const text = safeText(value, "").trim();

  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function splitIntoChunks(array, size) {
  const chunks = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}

function safeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function fitImageContain(imgW, imgH, boxW, boxH) {
  if (!imgW || !imgH) {
    return {
      width: boxW,
      height: boxH,
      x: 0,
      y: 0,
    };
  }

  const ratio = Math.min(boxW / imgW, boxH / imgH);
  const width = imgW * ratio;
  const height = imgH * ratio;

  return {
    width,
    height,
    x: (boxW - width) / 2,
    y: (boxH - height) / 2,
  };
}

async function getImageDimensions(dataUrl) {
  if (!dataUrl) return null;

  return await new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function getImageFormat(dataUrl) {
  if (String(dataUrl).startsWith("data:image/png")) return "PNG";
  if (String(dataUrl).startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

export async function previewProductsImportFromExcel(
  file,
  currentProducts = [],
) {
  if (!file) return { changes: [], errors: [] };

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  const currentMap = new Map(currentProducts.map((p) => [String(p.id), p]));

  const errors = [];
  const changes = [];

  const editableFields = [
    "codigo",
    "nombre",
    "descripcion",
    "categoria",
    "unidad",
    "precio_compra",
    "precio",
    "cantidad_caja",
    "habilitado",
    "clave_sat",
    "clave_unidad_sat",
    "iva_porcentaje",
  ];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const id = String(row.id || "").trim();

    if (!id) {
      errors.push(`Fila ${rowNumber}: falta id`);
      return;
    }

    const original = currentMap.get(id);

    if (!original) {
      errors.push(`Fila ${rowNumber}: no existe producto con id ${id}`);
      return;
    }

    const payload = {
      codigo: String(row.codigo || "").trim(),
      nombre: String(row.nombre || "").trim(),
      descripcion: String(row.descripcion || "").trim(),
      categoria: String(row.categoria || "").trim(),
      unidad: String(row.unidad || "").trim(),
      precio_compra: Number(row.precio_compra || 0),
      precio: Number(row.precio || 0),
      cantidad_caja: Number(row.cantidad_caja || 0),
      habilitado:
        row.habilitado === true ||
        String(row.habilitado).toLowerCase() === "true" ||
        String(row.habilitado).toLowerCase() === "sí" ||
        String(row.habilitado).toLowerCase() === "si",
      clave_sat: String(row.clave_sat || "").trim(),
      clave_unidad_sat: String(row.clave_unidad_sat || "").trim(),
      iva_porcentaje: Number(row.iva_porcentaje || 16),
      updated_at: new Date().toISOString(),
    };

    if (!payload.nombre) {
      errors.push(`Fila ${rowNumber}: falta nombre`);
      return;
    }

    const fieldChanges = editableFields
      .map((field) => {
        const before = normalizeCompareValue(original[field]);
        const after = normalizeCompareValue(payload[field]);

        if (before === after) return null;

        return {
          field,
          before: original[field],
          after: payload[field],
        };
      })
      .filter(Boolean);

    if (fieldChanges.length) {
      changes.push({
        id,
        rowNumber,
        nombre: original.nombre || payload.nombre,
        payload,
        changes: fieldChanges,
      });
    }
  });

  return { changes, errors };
}

export async function applyProductsImportChanges(
  changes = [],
  { updateProduct },
) {
  const errors = [];
  let updated = 0;

  for (const item of changes) {
    try {
      await updateProduct(item.id, item.payload);
      updated += 1;
    } catch (error) {
      errors.push(`Producto ${item.nombre}: ${error.message}`);
    }
  }

  return { updated, errors };
}

function normalizeCompareValue(value) {
  if (typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  if (!Number.isNaN(Number(value)) && value !== "")
    return String(Number(value));
  return String(value).trim();
}
