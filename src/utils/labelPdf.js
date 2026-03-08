import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export async function generateLabelPDF({
  element,
  filename = "etiqueta.pdf",
  widthMm,
  heightMm,
}) {
  if (!element) {
    throw new Error("No se encontró el preview de la etiqueta.");
  }

  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 3,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({
    orientation: Number(widthMm) > Number(heightMm) ? "landscape" : "portrait",
    unit: "mm",
    format: [Number(widthMm), Number(heightMm)],
    compress: true,
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, Number(widthMm), Number(heightMm));
  pdf.save(filename);
}