import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  Package2,
  Receipt,
  ShoppingCart,
  Truck,
  WalletCards,
} from "lucide-react";

import { formatMoney } from "../../utils/formatters";
import { getToneClass } from "../../utils/styles";

export function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

export function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isBetween(dateValue, start, end) {
  const date = toDate(dateValue);
  if (!date) return false;
  if (!start && !end) return true;
  return date >= start && date <= end;
}

export function getRangeDates(range, filters = {}) {
  const now = new Date();

  if (range === "all") return { start: null, end: null };

  if (range === "custom") {
    const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
    const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999`) : null;
    return { start, end };
  }

  if (range === "selectedMonth" && filters.month) {
    const [year, month] = filters.month.split("-").map(Number);
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (range === "week") {
    const start = new Date(now);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === "lastMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (range === "year") {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getPeriodLabel(start, end, range) {
  if (range === "all" || (!start && !end)) return "Todo el historial";
  const formatter = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (start && end) return `${formatter.format(start)} - ${formatter.format(end)}`;
  if (start) return `Desde ${formatter.format(start)}`;
  return `Hasta ${formatter.format(end)}`;
}

export function getMonthKey(value) {
  const date = toDate(value);
  if (!date) return "Sin fecha";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(monthKey) {
  if (monthKey === "Sin fecha") return monthKey;
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-MX", {
    month: "short",
    year: "numeric",
  });
}

export function getWeekKey(value) {
  const date = toDate(value);
  if (!date) return "Sin fecha";
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date - firstDay) / 86400000);
  const week = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
  return `${date.getFullYear()}-S${String(week).padStart(2, "0")}`;
}

export function normalizeStatus(value) {
  return String(value || "sin_estado").trim().toLowerCase();
}

export function isCanceledOrder(order) {
  return normalizeStatus(order?.estado) === "cancelado";
}

export function isDeliveredOrder(order) {
  return normalizeStatus(order?.estado) === "entregado";
}

export function isPaidOrder(order) {
  return normalizeStatus(order?.estado_pago) === "pagado";
}

export function getPaymentAmount(row = {}) {
  const explicitAmount = toNumber(
    row.monto_pagado
      ?? row.pago_monto
      ?? row.monto_cobrado
      ?? row.total_pagado
      ?? row.pagado,
  );

  if (explicitAmount > 0) return explicitAmount;

  // Si el pedido está marcado como pagado pero no trae monto capturado en la vista,
  // usamos el total del pedido como cobrado para que el resumen no quede en cero.
  if (isPaidOrder(row)) return toNumber(row.total);

  return 0;
}

export function hasPaymentReference(row = {}) {
  return Boolean(row.referencia_pago || row.pago_referencia || row.metodo_pago || getPaymentAmount(row) > 0);
}

export function isRealizedOrder(order) {
  return isDeliveredOrder(order) && isPaidOrder(order) && !isCanceledOrder(order);
}

export function isPendingOrder(order) {
  const estado = normalizeStatus(order?.estado);
  return !["entregado", "cancelado"].includes(estado);
}

export function isPendingPayment(order) {
  const estadoPago = normalizeStatus(order?.estado_pago);
  return !isCanceledOrder(order) && !["pagado", "cancelado"].includes(estadoPago);
}

export function isPendingDelivery(delivery) {
  const estado = normalizeStatus(delivery?.estado);
  return ["pendiente", "programada", "en_ruta", "creada", "creado", "parcial"].includes(estado);
}

export function isDeliveredDelivery(delivery) {
  return normalizeStatus(delivery?.estado) === "entregada";
}

export function isCanceledDelivery(delivery) {
  return normalizeStatus(delivery?.estado) === "cancelada";
}

export function getPedidoFinancial(row = {}) {
  const ventaReal = toNumber(row.venta_real_sin_iva ?? row.venta_entregada_sin_iva ?? row.venta_entregada ?? row.subtotal_real);
  const costoFifo = toNumber(row.costo_real_fifo ?? row.costo_fifo ?? row.costo_real);
  const gastosExtra = toNumber(row.gastos_extra ?? row.gastos_pedido);
  const gananciaReal = toNumber(row.ganancia_real ?? ventaReal - costoFifo);
  const gananciaNeta = toNumber(row.ganancia_neta ?? gananciaReal - gastosExtra);
  const montoPagado = getPaymentAmount(row);

  return {
    ventaReal,
    costoFifo,
    gastosExtra,
    gananciaReal,
    gananciaNeta,
    montoPagado,
    referenciaPago: row.referencia_pago || "Sin referencia",
  };
}

export function getOrderFinancialFallback(order, pedidoDetalles) {
  const detalles = pedidoDetalles.filter((item) => item.pedido_id === order.id);
  return detalles.reduce(
    (acc, item) => {
      const cantidadEntregada = toNumber(item.cantidad_entregada);
      const cantidadPedida = toNumber(item.cantidad_pedida);
      const cantidadBase = cantidadEntregada || cantidadPedida;
      const precio = toNumber(item.precio_unitario);
      const costo = toNumber(item.costo_unitario);
      acc.ventaReal += precio * cantidadBase;
      acc.costoFifo += costo * cantidadBase;
      return acc;
    },
    { ventaReal: 0, costoFifo: 0 },
  );
}

export function getFinancialByPedido(pedidoGanancias = []) {
  const map = new Map();
  pedidoGanancias.forEach((item) => {
    const pedidoId = item.pedido_id || item.id;
    if (!pedidoId) return;
    map.set(pedidoId, item);
  });
  return map;
}

export function calculateOrderUnits(order, pedidoDetalles) {
  const detalles = pedidoDetalles.filter((item) => item.pedido_id === order.id);
  return detalles.reduce(
    (acc, item) => {
      acc.pedidas += toNumber(item.cantidad_pedida);
      acc.entregadas += toNumber(item.cantidad_entregada);
      acc.pendientes += toNumber(item.cantidad_pendiente);
      return acc;
    },
    { pedidas: 0, entregadas: 0, pendientes: 0 },
  );
}

export function getMovementMeta(type) {
  if (type === "pedido") return { icon: ShoppingCart, className: getToneClass("success") };
  if (type === "cotizacion") return { icon: Receipt, className: getToneClass("info") };
  if (type === "gasto") return { icon: WalletCards, className: getToneClass("warning") };
  if (type === "entrega") return { icon: Truck, className: getToneClass("primary") };
  if (type === "compra") return { icon: FileSpreadsheet, className: getToneClass("info") };
  if (type === "inventario_entrada") return { icon: ArrowDownToLine, className: getToneClass("success") };
  if (type === "inventario_salida") return { icon: ArrowUpFromLine, className: getToneClass("warning") };
  return { icon: Package2, className: getToneClass("primary") };
}

export function buildOrderMovement(item) {
  const financial = getPedidoFinancial(item);
  return {
    id: `ped-${item.id || item.pedido_id}`,
    entityId: item.id || item.pedido_id,
    title: `Pedido ${item.folio || item.pedido_folio || "sin folio"}`,
    description: `${item.cliente_nombre || "Cliente sin nombre"} • ${item.estado || "sin estado"} • Venta real: ${formatMoney(financial.ventaReal)} • Ganancia neta: ${formatMoney(financial.gananciaNeta)}`,
    date: item.fecha_pago || item.updated_at || item.created_at,
    type: "pedido",
    ...item,
  };
}

export function buildQuotationMovement(item) {
  return {
    id: `cot-${item.id}`,
    entityId: item.id,
    title: `Cotización ${item.folio || item.id?.slice(0, 8) || "sin folio"}`,
    description: `${item.cliente_nombre || "Cliente sin nombre"} • Estado: ${item.estado || "sin estado"} • Total: ${formatMoney(item.total)}`,
    date: item.updated_at || item.created_at,
    type: "cotizacion",
    ...item,
  };
}

export function buildExpenseMovement(item) {
  return {
    id: `gas-${item.id}`,
    entityId: item.id,
    title: `Gasto: ${item.concepto || "Sin concepto"}`,
    description: `${item.tipo || "Sin tipo"} • ${formatMoney(item.monto)}${item.descripcion ? ` • ${item.descripcion}` : ""}`,
    date: item.fecha || item.created_at,
    type: "gasto",
    ...item,
  };
}

export function buildProductMovement(item) {
  return {
    id: `pro-${item.id}`,
    entityId: item.id,
    title: `Producto: ${item.nombre || "Sin nombre"}`,
    description: `${item.codigo || "Sin código"} • ${item.categoria || "Sin categoría"} • Venta: ${formatMoney(item.precio)}`,
    date: item.updated_at || item.created_at,
    type: "producto",
    ...item,
  };
}

export function buildDeliveryMovement(item) {
  return {
    id: `ent-${item.id}`,
    entityId: item.id,
    title: `Entrega ${item.folio || item.id?.slice(0, 8) || "sin folio"}`,
    description: `Pedido: ${item.pedido_id?.slice?.(0, 8) || "sin pedido"} • Estado: ${item.estado || "sin estado"} ${item.recibido_por ? `• Recibió: ${item.recibido_por}` : ""}`,
    date: item.fecha_entrega || item.updated_at || item.created_at,
    type: "entrega",
    ...item,
  };
}

export function buildInventoryMovement(item) {
  const tipo = normalizeStatus(item.tipo);
  return {
    id: `mov-${item.id}`,
    entityId: item.id,
    title: `${tipo === "salida" ? "Salida" : tipo === "entrada" ? "Entrada" : "Movimiento"} FIFO`,
    description: `${item.productos?.nombre || "Producto"} • ${toNumber(item.cantidad)} unidad(es) • ${item.referencia || "Sin referencia"}`,
    date: item.created_at,
    type: tipo === "salida" ? "inventario_salida" : "inventario_entrada",
    ...item,
  };
}

export function buildPurchaseMovement(item) {
  return {
    id: `com-${item.id}`,
    entityId: item.id,
    title: `Compra ${item.numero_factura || item.folio || "sin referencia"}`,
    description: `${item.proveedores?.nombre || "Sin proveedor"} • ${formatMoney(item.total)} • ${item.estado || "sin estado"}`,
    date: item.fecha_compra || item.created_at,
    type: "compra",
    ...item,
  };
}

export function getLatestMovements(rows, builder, limit = 5) {
  return rows
    .map(builder)
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

export function groupByPeriod({ pedidosGanancia = [], gastos = [], compras = [], movimientos = [], range }) {
  const useWeekly = range === "week";
  const keyGetter = useWeekly ? getWeekKey : getMonthKey;
  const labelGetter = useWeekly ? (key) => key : getMonthLabel;
  const map = new Map();

  function ensure(key) {
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: labelGetter(key),
        venta: 0,
        costoFifo: 0,
        gastos: 0,
        compras: 0,
        ganancia: 0,
        neto: 0,
        entradas: 0,
        salidas: 0,
      });
    }
    return map.get(key);
  }

  pedidosGanancia.forEach((item) => {
    const key = keyGetter(item.fecha_pago || item.updated_at || item.created_at);
    const bucket = ensure(key);
    const financial = getPedidoFinancial(item);
    bucket.venta += financial.ventaReal;
    bucket.costoFifo += financial.costoFifo;
    bucket.ganancia += financial.gananciaReal;
  });

  gastos.forEach((item) => {
    const key = keyGetter(item.fecha || item.created_at);
    ensure(key).gastos += toNumber(item.monto);
  });

  compras.forEach((item) => {
    const key = keyGetter(item.fecha_compra || item.created_at);
    ensure(key).compras += toNumber(item.total || item.subtotal);
  });

  movimientos.forEach((item) => {
    const key = keyGetter(item.created_at);
    const bucket = ensure(key);
    if (normalizeStatus(item.tipo) === "entrada") bucket.entradas += toNumber(item.cantidad);
    if (normalizeStatus(item.tipo) === "salida") bucket.salidas += toNumber(item.cantidad);
  });

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      neto: item.ganancia - item.gastos,
    }))
    .sort((a, b) => String(a.key).localeCompare(String(b.key)));
}

export function calculateDashboardSummary({ filteredData, productos, pedidoDetalles }) {
  const financialByPedido = getFinancialByPedido(filteredData.pedidoGanancias);
  const pedidosRealizados = filteredData.pedidos.filter(isRealizedOrder);

  const totals = pedidosRealizados.reduce(
    (acc, order) => {
      const row = financialByPedido.get(order.id);
      const financial = row ? getPedidoFinancial(row) : getOrderFinancialFallback(order, pedidoDetalles);
      acc.ventaReal += financial.ventaReal;
      acc.costoFifo += financial.costoFifo;
      acc.gastosPedido += financial.gastosExtra || 0;
      acc.gananciaReal += financial.gananciaReal ?? financial.ventaReal - financial.costoFifo;
      return acc;
    },
    { ventaReal: 0, costoFifo: 0, gastosPedido: 0, gananciaReal: 0 },
  );

  const gastoTotal = filteredData.gastos.reduce((acc, item) => acc + toNumber(item.monto), 0);
  const comprasTotal = filteredData.inventarioEntradas.reduce((acc, item) => acc + toNumber(item.total || item.subtotal), 0);

  const pedidosPorEstado = filteredData.pedidos.reduce((acc, item) => {
    const estado = normalizeStatus(item.estado);
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {});

  const entregasPorEstado = filteredData.entregas.reduce((acc, item) => {
    const estado = normalizeStatus(item.estado);
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {});

  const pedidosPendientes = filteredData.pedidos.filter(isPendingOrder).length;
  const pagosPendientes = filteredData.pedidos.filter(isPendingPayment).length;
  const pagosPagados = filteredData.pedidos.filter(isPaidOrder).length;

  // El resumen de cobros se basa primero en la vista financiera real, porque ahí vive la
  // información consolidada que ve el dashboard. Si la vista no trae el monto, usamos pedidos.
  const paymentSource = filteredData.pedidoGanancias.length ? filteredData.pedidoGanancias : filteredData.pedidos;
  const paymentRows = paymentSource.filter((item) => getPaymentAmount(item) > 0);
  const pagosConMonto = paymentRows.length;
  const montoPagadoRegistrado = paymentRows.reduce((acc, item) => acc + getPaymentAmount(item), 0);

  const entregasPendientes = filteredData.entregas.filter(isPendingDelivery).length;
  const entregasEntregadas = filteredData.entregas.filter(isDeliveredDelivery).length;
  const entregasCanceladas = filteredData.entregas.filter(isCanceledDelivery).length;

  const unidadesPendientes = filteredData.pedidos.reduce((acc, order) => {
    if (isCanceledOrder(order) || isDeliveredOrder(order)) return acc;
    return acc + calculateOrderUnits(order, pedidoDetalles).pendientes;
  }, 0);

  const pendingSource = filteredData.pedidoGanancias.length ? filteredData.pedidoGanancias : filteredData.pedidos;
  const valorPendienteCobro = pendingSource.reduce((acc, order) => {
    const estadoPago = normalizeStatus(order.estado_pago);
    if (isCanceledOrder(order) || ["pagado", "cancelado"].includes(estadoPago)) return acc;
    return acc + Math.max(toNumber(order.total) - getPaymentAmount(order), 0);
  }, 0);

  const productosActivos = productos.filter((item) => item.habilitado === true).length;
  const stockDisponible = filteredData.inventarioLotes.reduce((acc, lote) => acc + toNumber(lote.cantidad_disponible), 0);
  const valorFifoDisponible = filteredData.inventarioLotes.reduce((acc, lote) => acc + toNumber(lote.cantidad_disponible) * toNumber(lote.costo_unitario), 0);
  const entradasFifo = filteredData.inventarioMovimientos.filter((item) => normalizeStatus(item.tipo) === "entrada").reduce((acc, item) => acc + toNumber(item.cantidad), 0);
  const salidasFifo = filteredData.inventarioMovimientos.filter((item) => normalizeStatus(item.tipo) === "salida").reduce((acc, item) => acc + toNumber(item.cantidad), 0);

  const gananciaNeta = totals.gananciaReal - gastoTotal;
  const margenReal = totals.ventaReal > 0 ? (gananciaNeta / totals.ventaReal) * 100 : 0;

  return {
    ventaReal: totals.ventaReal,
    costoFifo: totals.costoFifo,
    gananciaReal: totals.gananciaReal,
    gastoTotal,
    gastosPedido: totals.gastosPedido,
    gananciaNetaReal: gananciaNeta,
    margenReal,
    montoPagado: montoPagadoRegistrado,
    comprasTotal,
    stockDisponible,
    valorFifoDisponible,
    entradasFifo,
    salidasFifo,

    totalPedidos: filteredData.pedidos.length,
    pedidosPendientes,
    pedidosBorrador: pedidosPorEstado.borrador || 0,
    pedidosCreados: pedidosPorEstado.creado || 0,
    pedidosParciales: pedidosPorEstado.parcial || pedidosPorEstado.parcialmente_entregado || 0,
    pedidosEntregados: pedidosPorEstado.entregado || 0,
    pedidosCancelados: pedidosPorEstado.cancelado || 0,
    pagosPendientes,
    pagosPagados,
    pagosConMonto,
    valorPendienteCobro,
    unidadesPendientes,

    totalEntregas: filteredData.entregas.length,
    entregasPendientes,
    entregasProgramadas: entregasPorEstado.programada || 0,
    entregasEnRuta: entregasPorEstado.en_ruta || 0,
    entregasEntregadas,
    entregasCanceladas,

    totalCompras: filteredData.inventarioEntradas.length,
    totalMovimientos: filteredData.inventarioMovimientos.length,
    productosActivos,
    totalProductos: productos.length,
    productosNuevos: filteredData.productos.length,
  };
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCellPayload(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      value: value.value ?? "",
      href: value.href || "",
    };
  }

  return { value, href: "" };
}

function buildWorksheet(name, rows) {
  const safeRows = rows.length ? rows : [{ Mensaje: "Sin registros en el periodo" }];
  const headers = Array.from(new Set(safeRows.flatMap((row) => Object.keys(row))));
  const headerXml = headers.map((header) => `<Cell><Data ss:Type="String">${xmlEscape(header)}</Data></Cell>`).join("");
  const rowsXml = safeRows
    .map((row) => {
      const cells = headers
        .map((header) => {
          const payload = getCellPayload(row[header]);
          const isNumber = typeof payload.value === "number" && Number.isFinite(payload.value);
          const href = payload.href ? ` ss:HRef="${xmlEscape(payload.href)}"` : "";
          return `<Cell${href}><Data ss:Type="${isNumber ? "Number" : "String"}">${xmlEscape(payload.value)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<Worksheet ss:Name="${xmlEscape(name).slice(0, 31)}"><Table><Row>${headerXml}</Row>${rowsXml}</Table></Worksheet>`;
}

function linkCell(label, url) {
  return url ? { value: label, href: url } : "";
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDashboardExcel({ resumen, periodLabel, filteredData }) {
  const resumenRows = [
    { Concepto: "Periodo", Valor: periodLabel },
    { Concepto: "Venta real s/IVA entregada", Valor: resumen.ventaReal },
    { Concepto: "Costo real FIFO vendido", Valor: resumen.costoFifo },
    { Concepto: "Ganancia bruta real", Valor: resumen.gananciaReal },
    { Concepto: "Gastos del periodo", Valor: resumen.gastoTotal },
    { Concepto: "Ganancia neta real", Valor: resumen.gananciaNetaReal },
    { Concepto: "Margen neto real %", Valor: Number(resumen.margenReal.toFixed(2)) },
    { Concepto: "Compras de mercancía con IVA", Valor: resumen.comprasTotal },
    { Concepto: "Cobrado registrado", Valor: resumen.montoPagado },
    { Concepto: "Pendiente de cobro", Valor: resumen.valorPendienteCobro },
    { Concepto: "Entregas entregadas", Valor: resumen.entregasEntregadas },
    { Concepto: "Entregas pendientes", Valor: resumen.entregasPendientes },
  ];

  const ventasCobrosRows = filteredData.pedidoGanancias.map((item) => {
    const f = getPedidoFinancial(item);
    const totalPedido = toNumber(item.total);
    const montoPagado = getPaymentAmount(item);
    return {
      Pedido: item.folio || item.pedido_folio,
      Cliente: item.cliente_nombre,
      Estado_pedido: item.estado,
      Estado_pago: item.estado_pago,
      Metodo_pago: item.metodo_pago || "",
      Referencia_pago: item.referencia_pago || item.pago_referencia || "",
      Fecha_pago: item.fecha_pago || "",
      Total_con_IVA: totalPedido,
      Monto_cobrado: montoPagado,
      Pendiente_cobro: Math.max(totalPedido - montoPagado, 0),
      Venta_real_sin_IVA: f.ventaReal,
      Costo_FIFO: f.costoFifo,
      Gastos_extra: f.gastosExtra,
      Ganancia_neta: f.gananciaNeta,
    };
  });

  const comprasFacturasRows = filteredData.inventarioEntradas.map((item) => ({
    Folio_compra: item.folio,
    Factura: item.numero_factura,
    Proveedor: item.proveedores?.nombre || "",
    Fecha_compra: item.fecha_compra,
    Subtotal: toNumber(item.subtotal),
    IVA: toNumber(item.iva),
    Total: toNumber(item.total),
    Estado: item.estado,
    Archivo: item.archivo_nombre || "",
    Factura_digital: linkCell("Abrir factura", item.archivo_url),
  }));

  const detalleComprasRows = filteredData.inventarioLotes.map((item) => {
    const entrada = item.inventario_entradas || {};
    return {
      Folio_compra: entrada.folio || item.entrada_id,
      Factura: entrada.numero_factura || "",
      Proveedor: entrada.proveedores?.nombre || "",
      Fecha_compra: entrada.fecha_compra || item.fecha_compra || "",
      Producto: item.productos?.nombre || item.producto_id,
      Codigo: item.productos?.codigo || "",
      Cantidad_comprada: toNumber(item.cantidad_inicial),
      Cantidad_disponible: toNumber(item.cantidad_disponible),
      Costo_unitario_sin_IVA: toNumber(item.costo_unitario),
      Costo_total_sin_IVA: toNumber(item.cantidad_inicial) * toNumber(item.costo_unitario),
      Valor_disponible_FIFO: toNumber(item.cantidad_disponible) * toNumber(item.costo_unitario),
      Factura_digital: linkCell("Abrir factura", entrada.archivo_url),
    };
  });

  const costeoFifoRows = filteredData.pedidoInventarioFacturas.map((item) => ({
    Pedido: item.pedido_folio || item.folio || item.pedido_id,
    Cliente: item.cliente_nombre || "",
    Entrega: item.entrega_folio || item.entrega_id || "",
    Fecha_entrega: item.fecha_entrega || "",
    Producto_vendido: item.nombre_producto || item.producto_nombre,
    Codigo: item.codigo || "",
    Cantidad_consumida: toNumber(item.cantidad),
    Costo_unitario_FIFO: toNumber(item.costo_unitario),
    Costo_total_FIFO: toNumber(item.costo_total),
    Folio_compra_origen: item.entrada_folio || item.folio_entrada || item.entrada_id,
    Factura_compra_origen: item.numero_factura || "",
    Proveedor: item.proveedor_nombre || "",
    Fecha_compra: item.fecha_compra || "",
    Factura_digital: linkCell("Abrir factura", item.archivo_url),
  }));

  const gastosRows = filteredData.gastos.map((item) => ({
    Fecha: item.fecha || item.created_at,
    Concepto: item.concepto,
    Tipo: item.tipo,
    Monto: toNumber(item.monto),
    Pedido_relacionado: item.pedido_id || "",
    Cotizacion_relacionada: item.cotizacion_id || "",
    Descripcion: item.descripcion || "",
  }));

  const pendientesRows = [
    ...filteredData.pedidoGanancias
      .filter((item) => Math.max(toNumber(item.total) - getPaymentAmount(item), 0) > 0)
      .map((item) => ({
        Tipo: "Cobro pendiente",
        Referencia: item.folio || item.pedido_folio,
        Cliente: item.cliente_nombre || "",
        Estado: item.estado_pago || "",
        Fecha: item.fecha_pago || item.created_at || "",
        Monto: Math.max(toNumber(item.total) - getPaymentAmount(item), 0),
      })),
    ...filteredData.entregas
      .filter((item) => isPendingDelivery(item))
      .map((item) => ({
        Tipo: "Entrega pendiente",
        Referencia: item.folio || item.id,
        Cliente: "",
        Estado: item.estado || "",
        Fecha: item.fecha_entrega || item.created_at || "",
        Monto: "",
      })),
  ];

  const workbook = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 ${buildWorksheet("00 Resumen", resumenRows)}
 ${buildWorksheet("01 Ventas cobros", ventasCobrosRows)}
 ${buildWorksheet("02 Compras facturas", comprasFacturasRows)}
 ${buildWorksheet("03 Detalle compras", detalleComprasRows)}
 ${buildWorksheet("04 Costeo FIFO", costeoFifoRows)}
 ${buildWorksheet("05 Gastos", gastosRows)}
 ${buildWorksheet("06 Pendientes", pendientesRows)}
</Workbook>`;

  downloadBlob(workbook, `reporte-contable-${new Date().toISOString().slice(0, 10)}.xls`, "application/vnd.ms-excel;charset=utf-8");
}

export function getTopProducts(productRows = []) {
  const map = new Map();
  productRows.forEach((item) => {
    const key = item.producto_id || item.codigo || item.nombre_producto;
    if (!key) return;
    const current = map.get(key) || {
      key,
      nombre: item.nombre_producto || "Producto sin nombre",
      codigo: item.codigo || "",
      cantidad: 0,
      venta: 0,
      costo: 0,
      ganancia: 0,
    };
    current.cantidad += toNumber(item.cantidad_entregada);
    current.venta += toNumber(item.venta_real_sin_iva || item.venta_entregada);
    current.costo += toNumber(item.costo_real_fifo || item.costo_fifo);
    current.ganancia += toNumber(item.ganancia_real);
    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => b.ganancia - a.ganancia).slice(0, 5);
}

export const DASHBOARD_ICONS = {
  Boxes,
  ClipboardList,
  CreditCard,
};
