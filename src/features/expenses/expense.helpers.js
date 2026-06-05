import {
  Wallet,
  Receipt,
  Truck,
  Package,
  TrendingUp,
  BanknoteArrowUp,
  BanknoteArrowDown,
  Clock3,
} from "lucide-react";

import { formatInputDate, parseBusinessDate, parseTimestampDate } from "../../utils/dates";
import { parseNumberish } from "../../utils/formatters";

export function startOfLocalDay(value) {
  const d = parseBusinessDate(value);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function endOfLocalDay(value) {
  const d = parseBusinessDate(value);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function formatExpenseDate(value, { isTimestamp = false } = {}) {
  const date = isTimestamp ? parseTimestampDate(value) : parseBusinessDate(value);

  if (!date) return "Sin fecha";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(isTimestamp ? { timeZone: "America/Tijuana" } : {}),
  });
}

export function getTijuanaDayKeyFromTimestamp(value) {
  const d = parseTimestampDate(value);
  if (!d) return null;
  return formatInputDate(d);
}

export function getDayLabelFromBusinessDate(value) {
  const d = parseBusinessDate(value);
  if (!d) return "";

  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

export function normalizeExpenseType(type) {
  if (type === "compra") return "gasto_compra";
  if (type === "envio") return "gasto_envio";
  if (type === "operativo") return "gasto_operativo";
  return "gasto_extra";
}

export function getMovementType(type) {
  if (type === "gasto_compra") {
    return {
      label: "Gasto de compra",
      icon: Package,
      className: "border-primary-100 bg-primary-50 text-primary-700",
    };
  }

  if (type === "gasto_envio") {
    return {
      label: "Gasto de envío",
      icon: Truck,
      className: "border-info-100 bg-info-50 text-info-700",
    };
  }

  if (type === "gasto_operativo") {
    return {
      label: "Gasto operativo",
      icon: Wallet,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  if (type === "ganancia_pedido") {
    return {
      label: "Ganancia de pedido",
      icon: TrendingUp,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  return {
    label: "Gasto extra",
    icon: Receipt,
    className: "border-accent-100 bg-accent-50 text-accent-700",
  };
}

export function getNatureStyles(nature) {
  if (nature === "ganancia") {
    return {
      label: "Realizada",
      icon: BanknoteArrowUp,
      className: "border-success-100 bg-success-50 text-success-700",
      amountClass: "border-success-100 bg-success-50 text-success-700",
    };
  }

  if (nature === "pendiente") {
    return {
      label: "Pendiente",
      icon: Clock3,
      className: "border-slate-200 bg-slate-50 text-slate-700",
      amountClass: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  return {
    label: "Gasto",
    icon: BanknoteArrowDown,
    className: "border-error-100 bg-error-50 text-error-700",
    amountClass: "border-error-100 bg-error-50 text-error-700",
  };
}

export function deliveryCountsAsDelivered(status) {
  return String(status || "").toLowerCase() === "entregada";
}

export function getRealDeliveredQuantityByDetail(order = {}) {
  const deliveredByDetail = new Map();

  for (const delivery of order.entregas || []) {
    if (!deliveryCountsAsDelivered(delivery.estado)) continue;

    for (const row of delivery.entrega_detalles || []) {
      const key = row.pedido_detalle_id;
      deliveredByDetail.set(
        key,
        (deliveredByDetail.get(key) || 0) + parseNumberish(row.cantidad_entregada),
      );
    }
  }

  return deliveredByDetail;
}

export function getRealOrderProgress(order = {}) {
  const deliveredByDetail = getRealDeliveredQuantityByDetail(order);
  const details = order.pedido_detalles || [];

  const total = details.reduce(
    (sum, item) => sum + parseNumberish(item.cantidad_pedida),
    0,
  );

  const delivered = details.reduce((sum, item) => {
    return sum + Math.min(
      parseNumberish(item.cantidad_pedida),
      parseNumberish(deliveredByDetail.get(item.id)),
    );
  }, 0);

  return {
    total,
    delivered,
    pending: Math.max(total - delivered, 0),
    complete: total > 0 && delivered >= total,
  };
}

export function isOrderPaid(order = {}) {
  return String(order.estado_pago || "").toLowerCase() === "pagado";
}

export function isOrderRealized(order = {}) {
  const estado = String(order.estado || "").toLowerCase();
  if (estado === "cancelado" || estado === "borrador") return false;
  return getRealOrderProgress(order).complete && isOrderPaid(order);
}

export function buildConsumptionMap(inventoryConsumptionRows = []) {
  const map = new Map();

  for (const row of inventoryConsumptionRows || []) {
    if (!row?.pedido_id) continue;
    if (!map.has(row.pedido_id)) map.set(row.pedido_id, []);
    map.get(row.pedido_id).push(row);
  }

  return map;
}

export function getDetailMap(order = {}) {
  const map = new Map();

  for (const detail of order.pedido_detalles || []) {
    map.set(detail.id, detail);
  }

  return map;
}

export function calculateEstimatedOrderCost(order = {}) {
  return (order.pedido_detalles || []).reduce((sum, item) => {
    return sum + parseNumberish(item.cantidad_pedida) * parseNumberish(item.costo_unitario);
  }, 0);
}

export function calculateEstimatedOrderSaleWithoutTax(order = {}) {
  return (order.pedido_detalles || []).reduce((sum, item) => {
    return sum + parseNumberish(item.cantidad_pedida) * parseNumberish(item.precio_unitario);
  }, 0);
}

export function calculateRealOrderNumbers(order = {}, consumptionRows = []) {
  const detailMap = getDetailMap(order);

  let ventaRealSinIva = 0;
  let costoMercanciaReal = 0;
  const productLines = new Map();

  for (const consumption of consumptionRows || []) {
    const detail = detailMap.get(consumption.pedido_detalle_id);
    if (!detail) continue;

    const quantity = parseNumberish(consumption.cantidad);
    const saleUnit = parseNumberish(detail.precio_unitario);
    const fallbackCostUnit = parseNumberish(detail.costo_unitario);
    const realCostUnit = parseNumberish(
      consumption.inventario_lotes?.costo_unitario ?? fallbackCostUnit,
    );

    const sale = quantity * saleUnit;
    const cost = quantity * realCostUnit;

    ventaRealSinIva += sale;
    costoMercanciaReal += cost;

    const key = detail.id;
    const current = productLines.get(key) || {
      pedido_detalle_id: detail.id,
      producto_id: detail.producto_id,
      codigo: detail.codigo,
      nombre_producto: detail.nombre_producto,
      cantidad_pedida: parseNumberish(detail.cantidad_pedida),
      cantidad_entregada_real: 0,
      precio_unitario: saleUnit,
      costo_estimado_unitario: fallbackCostUnit,
      costo_real_total: 0,
      venta_real_sin_iva: 0,
      ganancia_real: 0,
      facturas: [],
    };

    current.cantidad_entregada_real += quantity;
    current.costo_real_total += cost;
    current.venta_real_sin_iva += sale;
    current.ganancia_real = current.venta_real_sin_iva - current.costo_real_total;

    const entrada = consumption.inventario_entradas;
    const referencia = entrada?.numero_factura || entrada?.folio || "Sin referencia";
    if (!current.facturas.includes(referencia)) current.facturas.push(referencia);

    productLines.set(key, current);
  }

  const hasRealConsumption = consumptionRows?.length > 0 && costoMercanciaReal > 0;

  const estimatedSaleWithoutTax = calculateEstimatedOrderSaleWithoutTax(order);
  const estimatedCost = calculateEstimatedOrderCost(order);

  return {
    ventaEstimadaSinIva: estimatedSaleWithoutTax,
    costoEstimadoMercancia: estimatedCost,
    gananciaEstimada: estimatedSaleWithoutTax - estimatedCost,
    ventaRealSinIva: hasRealConsumption ? ventaRealSinIva : 0,
    costoMercanciaReal: hasRealConsumption ? costoMercanciaReal : 0,
    utilidadBrutaReal: hasRealConsumption ? ventaRealSinIva - costoMercanciaReal : 0,
    productLines: Array.from(productLines.values()),
    hasRealConsumption,
  };
}

export function buildPreparedRows({ orderRows, expenseRows, inventoryConsumptionRows = [] }) {
  const expenseMap = new Map();
  const consumptionMap = buildConsumptionMap(inventoryConsumptionRows);

  for (const expense of expenseRows) {
    const key = expense.pedido_id;
    if (!key) continue;
    if (!expenseMap.has(key)) expenseMap.set(key, []);
    expenseMap.get(key).push(expense);
  }

  return orderRows.map((order) => {
    const relatedExpenses = expenseMap.get(order.id) || [];
    const relatedConsumptions = consumptionMap.get(order.id) || [];
    const totalExpenses = relatedExpenses.reduce(
      (acc, item) => acc + parseNumberish(item.monto),
      0,
    );

    const realized = isOrderRealized(order);
    const realNumbers = calculateRealOrderNumbers(order, relatedConsumptions);
    const fallbackEstimatedProfit = realNumbers.gananciaEstimada;
    const grossProfit = realized
      ? realNumbers.hasRealConsumption
        ? realNumbers.utilidadBrutaReal
        : fallbackEstimatedProfit
      : 0;

    const costoMercanciaReal = realNumbers.hasRealConsumption
      ? realNumbers.costoMercanciaReal
      : realized
        ? realNumbers.costoEstimadoMercancia
        : 0;

    const ventaRealSinIva = realNumbers.hasRealConsumption
      ? realNumbers.ventaRealSinIva
      : realized
        ? realNumbers.ventaEstimadaSinIva
        : 0;

    const montoPagado = parseNumberish(order.pago_monto) || (isOrderPaid(order) ? parseNumberish(order.total) : 0);
    const netProfit = realized ? grossProfit - totalExpenses : -totalExpenses;
    const dateValue = order.pago_fecha || order.fecha_fin || order.fecha_inicio || order.fecha_emision || order.created_at;
    const progress = getRealOrderProgress(order);

    return {
      id: order.id,
      folio: order.folio || "Sin folio",
      referencia: order.pago_referencia || order.folio || "Sin folio",
      cliente: order.cliente_nombre || "Cliente sin nombre",
      cliente_email: order.cliente_email || "",
      cliente_telefono: order.cliente_telefono || "",
      fechaISO: dateValue,
      fecha: formatExpenseDate(dateValue, { isTimestamp: !/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || "")) }),
      totalPedido: parseNumberish(order.total),
      ventaEstimadaSinIva: realNumbers.ventaEstimadaSinIva,
      costoEstimadoMercancia: realNumbers.costoEstimadoMercancia,
      gananciaEstimada: realNumbers.gananciaEstimada,
      ventaRealSinIva,
      montoPagado,
      pagoReferencia: order.pago_referencia || "Sin referencia de pago",
      pagoFecha: order.pago_fecha || "",
      pagoNotas: order.pago_notas || "",
      costoPedido: costoMercanciaReal,
      costoMercanciaReal,
      utilidadBruta: grossProfit,
      gastos: totalExpenses,
      ganancia: netProfit,
      realizada: realized,
      pagado: isOrderPaid(order),
      entregado: progress.complete,
      progreso: progress,
      naturaleza: realized ? "ganancia" : totalExpenses > 0 ? "gasto" : "pendiente",
      tipo: "ganancia_pedido",
      concepto: realized
        ? `Ganancia real por pedido ${order.folio || ""}`.trim()
        : `Pedido pendiente ${order.folio || ""}`.trim(),
      notas: order.notas || "",
      expenseCount: relatedExpenses.length,
      expenses: relatedExpenses,
      consumptions: relatedConsumptions,
      productLines: realNumbers.productLines,
      hasRealConsumption: realNumbers.hasRealConsumption,
      order,
    };
  });
}

export function resolveRowDateMs(row) {
  if (!row?.fechaISO) return 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(row.fechaISO))) {
    return startOfLocalDay(row.fechaISO)?.getTime() || 0;
  }

  return parseTimestampDate(row.fechaISO)?.getTime() || 0;
}
