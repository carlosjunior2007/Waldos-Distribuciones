import {
  Clock3,
  CheckCircle2,
  XCircle,
  TimerReset,
} from "lucide-react";

import {
  parseBusinessDate,
  formatInputDate,
} from "../../utils/dates";

export function fromInputDate(value) {
  return value || null;
}

export function toBusinessInputDate(value) {
  return formatInputDate(parseBusinessDate(value));
}

export function getStatusStyles(status) {
  if (status === "pendiente") {
    return {
      label: "Pendiente",
      icon: Clock3,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  if (status === "en_proceso") {
    return {
      label: "En proceso",
      icon: TimerReset,
      className: "border-info-100 bg-info-50 text-info-700",
    };
  }

  if (status === "completado") {
    return {
      label: "Completado",
      icon: CheckCircle2,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  if (status === "vencido") {
    return {
      label: "Vencido",
      icon: XCircle,
      className: "border-error-100 bg-error-50 text-error-700",
    };
  }

  return {
    label: "Cancelado",
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

export function buildQuotationItemsFromDetails(details = []) {
  return details.map((item) => ({
    producto_id: item.producto_id,
    nombre_producto: item.nombre_producto,
    codigo: item.codigo || "",
    unidad: item.unidad || "",
    cantidad: Number(item.cantidad ?? 1),
    stock_disponible:
      Number(item.producto?.cantidad || 0) + Number(item.cantidad || 0),
    precio_unitario: Number(item.precio_unitario ?? 0),
    costo_unitario: Number(item.costo_unitario ?? 0),
    importe: Number(item.importe || 0),
    ganancia_linea: Number(item.ganancia_linea || 0),
  }));
}

export function calculateQuotationTotals(items = [], form = {}) {
  const rows = items.map((item) => {
    const cantidad = Number(item.cantidad || 0);
    const precio = Number(item.precio_unitario || 0);
    const costo = Number(item.costo_unitario || 0);

    const importe = cantidad * precio;
    const gananciaLinea = cantidad * (precio - costo);

    return {
      ...item,
      importe,
      ganancia_linea: gananciaLinea,
    };
  });

  const subtotal = rows.reduce(
    (acc, item) => acc + Number(item.importe || 0),
    0,
  );

  const descuento = Number(form.descuento || 0);
  const base = Math.max(subtotal - descuento, 0);

  const ivaMonto = base * (Number(form.iva_porcentaje || 0) / 100);
  const isrMonto = base * (Number(form.isr_porcentaje || 0) / 100);
  const retencionIvaMonto =
    base * (Number(form.retencion_iva_porcentaje || 0) / 100);

  const totalImpuestos = ivaMonto;
  const totalRetenciones = isrMonto + retencionIvaMonto;
  const total = base + totalImpuestos - totalRetenciones;

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
    isrMonto,
    retencionIvaMonto,
    totalImpuestos,
    totalRetenciones,
    ganancia,
    total,
  };
}

export function buildQuotationPayload({ form, totals }) {
  const cleanItems = totals.rows.map((item) => ({
    producto_id: item.producto_id,
    cantidad: Number(item.cantidad || 0),
    precio_unitario: Number(item.precio_unitario || 0),
    costo_unitario: Number(item.costo_unitario || 0),
    importe: Number(item.importe || 0),
    ganancia_linea: Number(item.ganancia_linea || 0),
  }));

  return {
    header: {
      ...form,
      cliente_id: form.cliente_id || null,
      cliente_nombre: form.cliente_nombre.trim(),
      cliente_telefono: form.cliente_telefono.trim() || null,
      cliente_email: form.cliente_email.trim() || null,
      cliente_rfc: form.cliente_rfc.trim().toUpperCase() || null,
      cliente_razon_social: form.cliente_razon_social.trim() || null,
      descuento: Number(form.descuento || 0),
      gastos: Number(form.gastos || 0),
      iva_porcentaje: Number(form.iva_porcentaje || 0),
      iva_monto: totals.ivaMonto,
      isr_porcentaje: Number(form.isr_porcentaje || 0),
      isr_monto: totals.isrMonto,
      retencion_iva_porcentaje: Number(form.retencion_iva_porcentaje || 0),
      retencion_iva_monto: totals.retencionIvaMonto,
      total_impuestos: totals.totalImpuestos,
      total_retenciones: totals.totalRetenciones,
      subtotal: totals.subtotal,
      total: totals.total,
      ganancia: totals.ganancia,
      fecha_vencimiento: fromInputDate(form.fecha_vencimiento),
    },
    items: cleanItems,
  };
}