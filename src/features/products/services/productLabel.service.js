import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";

const LABEL_WIDTH_MM = 100;
const LABEL_HEIGHT_MM = 75;

export async function downloadProductLabel(product) {
  if (!product) return;

  const productCode = String(product.codigo || "").trim();
  const productName = String(product.nombre || "Producto").trim();

  if (!productCode) {
    throw new Error("Este producto no tiene código. Agrega un código antes de descargar la etiqueta.");
  }

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [LABEL_WIDTH_MM, LABEL_HEIGHT_MM],
    compress: true,
  });

  const barcodeDataUrl = await createBarcodeDataUrl(productCode);

  drawProductLabel(pdf, {
    productName,
    productCode,
    barcodeDataUrl,
  });

  pdf.save(`${buildSafeFilename(productName || productCode)}_etiqueta.pdf`);
}

function drawProductLabel(pdf, { productName, productCode, barcodeDataUrl }) {
  const pageWidth = LABEL_WIDTH_MM;
  const pageHeight = LABEL_HEIGHT_MM;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  pdf.setDrawColor(217, 224, 231);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(1.5, 1.5, pageWidth - 3, pageHeight - 3, 4, 4, "S");

  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);

  const nameLines = pdf.splitTextToSize(productName || "Producto", pageWidth - 12);
  pdf.text(nameLines.slice(0, 2), pageWidth / 2, 17, { align: "center", lineHeightFactor: 1.05 });

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Código: ${productCode}`, pageWidth / 2, 39, { align: "center" });

  if (barcodeDataUrl) {
    pdf.addImage(barcodeDataUrl, "PNG", 20, 46, 60, 18);
  }
}

async function createBarcodeDataUrl(value) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  JsBarcode(svg, value, {
    format: "CODE128",
    displayValue: true,
    fontSize: 10,
    lineColor: "#111827",
    background: "#ffffff",
    height: 34,
    width: 1.1,
    margin: 0,
    textMargin: 3,
    font: "Arial",
  });

  const svgText = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgText], {
    type: "image/svg+xml;charset=utf-8",
  });

  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    return await convertImageUrlToPngDataUrl(svgUrl, 760, 230);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function convertImageUrlToPngDataUrl(url, width, height) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => reject(new Error("No se pudo generar el código de barras."));
    image.src = url;
  });
}

function buildSafeFilename(value) {
  return String(value || "producto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80)
    .toLowerCase() || "producto";
}
