import { toPng } from "html-to-image";
import jsPDF from "jspdf";

const MM_TO_PX = 3.7795275591;

async function waitForImages(container) {
  const images = Array.from(container.querySelectorAll("img"));

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();

      return new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    }),
  );
}

async function waitForFonts() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
}

export async function generateLabelPDF({
  element,
  filename = "etiqueta.pdf",
  widthMm,
  heightMm,
}) {
  if (!element) {
    throw new Error("No se encontró el preview de la etiqueta.");
  }

  const safeWidthMm = Number(widthMm);
  const safeHeightMm = Number(heightMm);

  if (!safeWidthMm || !safeHeightMm) {
    throw new Error("Las dimensiones de la etiqueta no son válidas.");
  }

  const exportWidthPx = Math.round(safeWidthMm * MM_TO_PX);
  const exportHeightPx = Math.round(safeHeightMm * MM_TO_PX);

  await waitForFonts();
  await waitForImages(element);

  // dos frames para que termine de pintarse barcode/svg/imágenes
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 3,
    backgroundColor: "#ffffff",
    canvasWidth: exportWidthPx * 3,
    canvasHeight: exportHeightPx * 3,
    width: exportWidthPx,
    height: exportHeightPx,
    style: {
      width: `${safeWidthMm}mm`,
      height: `${safeHeightMm}mm`,
      margin: "0",
      transform: "none",
    },
  });

  const pdf = new jsPDF({
    orientation: safeWidthMm > safeHeightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [safeWidthMm, safeHeightMm],
    compress: true,
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, safeWidthMm, safeHeightMm, undefined, "FAST");
  pdf.save(filename);
}