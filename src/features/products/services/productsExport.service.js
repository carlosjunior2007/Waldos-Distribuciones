import * as XLSX from "xlsx";
import jsPDF from "jspdf";

import { getCategoryLabel } from "../product.helpers";

export function exportProductsToExcel(products = []) {
  const dataToExport = products.map((item) => ({
    id: item.id || "",
    codigo: item.codigo || "",
    nombre: item.nombre || "",
    descripcion: item.descripcion || "",
    categoria: item.categoria || "",
    unidad: item.unidad || "",
    precio_compra: Number(item.precio_compra || 0),
    precio: Number(item.precio || 0),
    stock: Number(item.stock || 0),
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

export async function exportProductsToPDF(filteredProducts = []) {
  const dataToExport = filteredProducts.filter((item) =>
    Boolean(item.habilitado),
  );

  if (!dataToExport.length) {
    alert(
      "No hay productos visibles en web y disponibles para exportar en PDF.",
    );
    return;
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const marginX = 14;
  const marginBottom = 12;

  const BRAND_ACCENT = [226, 17, 42];
  const BG = [248, 250, 252];
  const SURFACE = [255, 255, 255];
  const BORDER = [226, 232, 240];
  const TEXT_PRIMARY = [15, 23, 42];
  const TEXT_SECONDARY = [51, 65, 85];
  const TEXT_MUTED = [100, 116, 139];

  const logoData = await loadImageAsDataUrl("/Logo.png");

  const groupedProducts = splitIntoChunks(dataToExport, 3);
  const totalPages = groupedProducts.length;

  for (let pageIndex = 0; pageIndex < groupedProducts.length; pageIndex++) {
    const group = groupedProducts[pageIndex];

    if (pageIndex > 0) pdf.addPage();

    pdf.setFillColor(...SURFACE);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    const headerH = 18;

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, headerH, "F");

    if (logoData) {
      try {
        pdf.addImage(logoData, "PNG", marginX, 4, 30, 9);
      } catch (error) {
        console.error("No se pudo insertar el logo:", error);
      }
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(35, 35, 35);
    pdf.text("Catálogo de productos", pageWidth / 2, 11, {
      align: "center",
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `Página ${pageIndex + 1} de ${totalPages}`,
      pageWidth - marginX,
      11,
      {
        align: "right",
      },
    );

    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.4);
    pdf.line(marginX, headerH - 1.5, pageWidth - marginX, headerH - 1.5);

    const contentTop = 28;
    const contentBottom = pageHeight - marginBottom;
    const availableHeight = contentBottom - contentTop;
    const gap = 8;
    const cardHeight = (availableHeight - gap * 2) / 3;
    const cardWidth = pageWidth - marginX * 2;

    for (let i = 0; i < group.length; i++) {
      const item = group[i];

      const cardX = marginX;
      const cardY = contentTop + i * (cardHeight + gap);

      pdf.setFillColor(...SURFACE);
      pdf.setDrawColor(...BORDER);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 5, 5, "FD");

      const innerPad = 6;
      const imageBoxX = cardX + innerPad;
      const imageBoxY = cardY + 18;
      const imageBoxW = 42;
      const imageBoxH = cardHeight - 24;

      const textX = imageBoxX + imageBoxW + 8;
      const textW = cardWidth - (textX - cardX) - innerPad;
      const titleY = cardY + 24;

      pdf.setFillColor(...BG);
      pdf.setDrawColor(...BORDER);
      pdf.roundedRect(imageBoxX, imageBoxY, imageBoxW, imageBoxH, 4, 4, "FD");

      const imageData = await loadImageAsDataUrl(item.imagen);

      if (imageData) {
        try {
          const dimensions = await getImageDimensions(imageData);

          const fit = fitImageContain(
            dimensions?.width || imageBoxW,
            dimensions?.height || imageBoxH,
            imageBoxW - 4,
            imageBoxH - 4,
          );

          const format = getImageFormat(imageData);

          pdf.addImage(
            imageData,
            format,
            imageBoxX + 2 + fit.x,
            imageBoxY + 2 + fit.y,
            fit.width,
            fit.height,
          );
        } catch (error) {
          console.error("No se pudo insertar la imagen:", error);

          pdf.setTextColor(...TEXT_MUTED);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.text("Imagen no disponible", imageBoxX + 5, imageBoxY + 12);
        }
      } else {
        pdf.setTextColor(...TEXT_MUTED);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text("Sin imagen", imageBoxX + 11, imageBoxY + imageBoxH / 2);
      }

      const categoryLabel = getCategoryLabel(item.categoria);

      pdf.setFillColor(...BRAND_ACCENT);
      pdf.roundedRect(textX, cardY + 6, 34, 6.5, 2, 2, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.text(categoryLabel, textX + 2.5, cardY + 10.5);

      pdf.setTextColor(...TEXT_PRIMARY);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);

      const titleLines = pdf.splitTextToSize(
        safeText(item.nombre, "Sin nombre"),
        textW,
      );
      pdf.text(titleLines.slice(0, 2), textX, titleY);

      const titleLineCount = Math.min(titleLines.length, 2);
      const afterTitleY = titleY + titleLineCount * 5.5 + 2;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(...TEXT_MUTED);
      pdf.text(
        `Código: ${safeText(item.codigo, "Sin código")}`,
        textX,
        afterTitleY,
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(...TEXT_SECONDARY);

      const desc = safeText(item.descripcion, "Sin descripción disponible.");
      const descLines = pdf.splitTextToSize(desc, textW);

      const finalDescLines = descLines.slice(0, 6);

      if (descLines.length > 6) {
        const last = finalDescLines[5];
        finalDescLines[5] = `${last.slice(0, Math.max(0, last.length - 3))}...`;
      }

      pdf.text(finalDescLines, textX, afterTitleY + 8);

      pdf.setDrawColor(...BORDER);
      pdf.line(
        textX,
        cardY + cardHeight - 12,
        cardX + cardWidth - innerPad,
        cardY + cardHeight - 12,
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...TEXT_MUTED);
      pdf.text("Disponible en catálogo", textX, cardY + cardHeight - 6);
    }

    pdf.setDrawColor(...BORDER);
    pdf.line(marginX, pageHeight - 8, pageWidth - marginX, pageHeight - 8);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...TEXT_MUTED);
    pdf.text("Catálogo generado automáticamente", marginX, pageHeight - 3.5);
    pdf.text(
      new Date().toLocaleDateString("es-MX"),
      pageWidth - marginX,
      pageHeight - 3.5,
      {
        align: "right",
      },
    );
  }

  pdf.save(`catalogo_productos_${new Date().toISOString().slice(0, 10)}.pdf`);
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
        stock: Number(row.stock || 0),
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

async function loadImageAsDataUrl(url) {
  if (!url) return null;

  try {
    const response = await fetch(url, { mode: "cors" });

    if (!response.ok) throw new Error("No se pudo cargar la imagen");

    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("No se pudo cargar la imagen para PDF:", error);
    return null;
  }
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

export async function previewProductsImportFromExcel(file, currentProducts = []) {
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
    "stock",
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
      stock: Number(row.stock || 0),
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

export async function applyProductsImportChanges(changes = [], { updateProduct }) {
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
  if (!Number.isNaN(Number(value)) && value !== "") return String(Number(value));
  return String(value).trim();
}