import {
  Clock3,
  CheckCircle2,
  XCircle,
  TimerReset,
  Send,
  FileCheck2,
} from "lucide-react";

import { parseBusinessDate, formatInputDate } from "../../utils/dates";

export function fromInputDate(value) {
  return value || null;
}

export function toBusinessInputDate(value) {
  return formatInputDate(parseBusinessDate(value));
}

export function addDaysInput(days = 14) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatInputDate(date);
}

export function addDaysISO(days = 14) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function getStatusStyles(status) {
  const value = String(status || "").toLowerCase();

  if (value === "borrador") {
    return {
      label: "Borrador",
      icon: Clock3,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  if (value === "enviada") {
    return {
      label: "Enviada",
      icon: Send,
      className: "border-info-100 bg-info-50 text-info-700",
    };
  }

  if (value === "aceptada") {
    return {
      label: "Aceptada",
      icon: CheckCircle2,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  if (value === "convertida") {
    return {
      label: "Convertida",
      icon: FileCheck2,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  if (value === "vencida") {
    return {
      label: "Vencida",
      icon: TimerReset,
      className: "border-error-100 bg-error-50 text-error-700",
    };
  }

  return {
    label: "Rechazada",
    icon: XCircle,
    className: "border-error-100 bg-error-50 text-error-700",
  };
}

export function buildLastMonthsOptions(total = 12) {
  const result = [];
  const today = new Date();

  for (let i = 0; i < total; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);

    result.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      }),
    });
  }

  return result;
}

export function calculateSalePriceFromUtility(cost, utilityPercent) {
  const costo = Number(cost || 0);
  const utilidad = Number(utilityPercent || 0);

  return costo * (1 + utilidad / 100);
}

export function calculateUtilityPercent(cost, salePrice) {
  const costo = Number(cost || 0);
  const precio = Number(salePrice || 0);

  if (costo <= 0) return 0;

  return ((precio - costo) / costo) * 100;
}

export function calculateLine({ cantidad, precio_unitario, costo_unitario }) {
  const qty = Number(cantidad || 0);
  const price = Number(precio_unitario || 0);
  const cost = Number(costo_unitario || 0);

  return {
    importe: qty * price,
    ganancia_linea: qty * (price - cost),
  };
}

export function buildQuotationItemsFromDetails(details = []) {
  return details.map((item) => {
    const precio = Number(item.precio_unitario ?? 0);
    const costo = Number(item.costo_unitario ?? 0);

    return {
      producto_id: item.producto_id,
      nombre_producto: item.nombre_producto,
      codigo: item.codigo || "",
      unidad: item.unidad || "",
      cantidad: Number(item.cantidad ?? 1),
      stock_disponible:
        Number(item.producto?.stock || item.stock_actual || 0) +
        Number(item.cantidad || 0),
      precio_unitario: precio,
      costo_unitario: costo,
      utilidad_porcentaje: calculateUtilityPercent(costo, precio),
      importe: Number(item.importe || 0),
      ganancia_linea: Number(item.ganancia_linea || 0),
    };
  });
}

export function calculateQuotationTotals(items = [], form = {}) {
  const rows = items.map((item) => {
    const line = calculateLine(item);

    return {
      ...item,
      ...line,
    };
  });

  const subtotal = rows.reduce(
    (acc, item) => acc + Number(item.importe || 0),
    0,
  );

  const descuento = Number(form.descuento || 0);
  const base = Math.max(subtotal - descuento, 0);
  const ivaPorcentaje = Number(form.iva_porcentaje || 0);
  const ivaMonto = base * (ivaPorcentaje / 100);
  const total = base + ivaMonto;

  const ganancia = rows.reduce(
    (acc, item) => acc + Number(item.ganancia_linea || 0),
    0,
  );

  return {
    rows,
    subtotal,
    descuento,
    base,
    ivaMonto,
    total,
    ganancia,
  };
}

export function buildQuotationPayload({ form, totals }) {
  const cleanItems = totals.rows.map((item) => ({
    producto_id: item.producto_id,
    nombre_producto: item.nombre_producto || null,
    codigo: item.codigo || null,
    cantidad: Number(item.cantidad || 0),
    precio_unitario: Number(item.precio_unitario || 0),
    costo_unitario: Number(item.costo_unitario || 0),
    importe: Number(item.importe || 0),
    ganancia_linea: Number(item.ganancia_linea || 0),
  }));

  return {
    header: {
      cliente_id: form.cliente_id || null,
      cliente_nombre: form.cliente_nombre.trim(),
      cliente_telefono: form.cliente_telefono.trim() || null,
      cliente_email: form.cliente_email.trim() || null,
      estado: form.estado || "borrador",
      subtotal: Number(totals.subtotal || 0),
      descuento: Number(totals.descuento || 0),
      iva_porcentaje: Number(form.iva_porcentaje || 0),
      total: Number(totals.total || 0),
      fecha_vencimiento: form.fecha_vencimiento || null,
      notas: form.notas || null,
    },
    items: cleanItems,
  };
}