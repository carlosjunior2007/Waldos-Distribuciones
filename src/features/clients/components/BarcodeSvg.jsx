import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export default function BarcodeSvg({ value }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, String(value).trim(), {
        format: "CODE128",
        displayValue: true,
        fontSize: 12,
        lineColor: "#111827",
        background: "#ffffff",
        height: 42,
        width: 1.4,
        margin: 0,
        textMargin: 4,
        font: "Arial",
      });
    } catch (error) {
      console.error("Error generando barcode:", error);
      svgRef.current.innerHTML = "";
    }
  }, [value]);

  if (!value) return null;

  return (
    <svg
      ref={svgRef}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        overflow: "visible",
      }}
    />
  );
}