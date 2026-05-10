import { Receipt, Package2, WalletCards, ShoppingCart } from "lucide-react";

import { formatMoney } from "../../utils/formatters";
import { getToneClass } from "../../utils/styles";

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

export function getRangeDates(range) {
  const now = new Date();

  if (range === "all") return { start: null, end: null };

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

  if (range === "year") {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    return { start, end };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return { start, end };
}

export function getMonthKey(value) {
  const date = toDate(value);

  if (!date) return "Sin fecha";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

export function getMonthLabel(monthKey) {
  if (monthKey === "Sin fecha") return monthKey;

  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  return date.toLocaleDateString("es-MX", {
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

export function isClosedOrder(estado) {
  return ["entregado", "parcialmente_entregado"].includes(
    String(estado || "").toLowerCase(),
  );
}

export function calculateOrderProfit(order, pedidoDetalles) {
  const detalles = pedidoDetalles.filter((item) => item.pedido_id === order.id);

  return detalles.reduce((acc, item) => {
    const cantidad = Number(item.cantidad_pedida || 0);
    const precio = Number(item.precio_unitario || 0);
    const costo = Number(item.costo_unitario || 0);

    return acc + (precio - costo) * cantidad;
  }, 0);
}

export function getMovementMeta(type) {
  if (type === "pedido") {
    return {
      icon: ShoppingCart,
      className: getToneClass("success"),
    };
  }

  if (type === "cotizacion") {
    return {
      icon: Receipt,
      className: getToneClass("info"),
    };
  }

  if (type === "gasto") {
    return {
      icon: WalletCards,
      className: getToneClass("warning"),
    };
  }

  return {
    icon: Package2,
    className: getToneClass("primary"),
  };
}

export function buildOrderMovement(item) {
  return {
    id: `ped-${item.id}`,
    entityId: item.id,
    title: `Pedido ${item.folio || item.id?.slice(0, 8) || "sin folio"}`,
    description: `${item.cliente_nombre || "Cliente sin nombre"} • Estado: ${
      item.estado || "sin estado"
    } • Total: ${formatMoney(item.total)}`,
    date: item.updated_at || item.created_at,
    type: "pedido",
    ...item,
  };
}

export function buildQuotationMovement(item) {
  return {
    id: `cot-${item.id}`,
    entityId: item.id,
    title: `Cotización ${item.folio || item.id?.slice(0, 8) || "sin folio"}`,
    description: `${item.cliente_nombre || "Cliente sin nombre"} • Estado: ${
      item.estado || "sin estado"
    } • Total: ${formatMoney(item.total)}`,
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
    description: `${item.tipo || "Sin tipo"} • ${formatMoney(item.monto)}${
      item.descripcion ? ` • ${item.descripcion}` : ""
    }`,
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
    description: `${item.codigo || "Sin código"} • ${
      item.categoria || "Sin categoría"
    } • Precio: ${formatMoney(item.precio)}`,
    date: item.updated_at || item.created_at,
    type: "producto",
    ...item,
  };
}

export function getLatestMovements(rows, builder, limit = 3) {
  return rows
    .map(builder)
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

export function groupByPeriod({
  cotizaciones = [],
  pedidos = [],
  pedidoDetalles = [],
  gastos = [],
  range,
}) {
  const useWeekly = range === "week";
  const keyGetter = useWeekly ? getWeekKey : getMonthKey;
  const labelGetter = useWeekly ? (key) => key : getMonthLabel;

  const map = new Map();

  function ensure(key) {
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: labelGetter(key),
        cotizaciones: 0,
        pedidos: 0,
        ganancias: 0,
        gastos: 0,
        neto: 0,
      });
    }

    return map.get(key);
  }

  cotizaciones.forEach((item) => {
    const key = keyGetter(item.created_at);
    const bucket = ensure(key);
    bucket.cotizaciones += 1;
  });

  pedidos.forEach((item) => {
    const key = keyGetter(item.created_at);
    const bucket = ensure(key);

    bucket.pedidos += 1;

    if (isClosedOrder(item.estado)) {
      bucket.ganancias += calculateOrderProfit(item, pedidoDetalles);
    }
  });

  gastos.forEach((item) => {
    const key = keyGetter(item.fecha || item.created_at);
    const bucket = ensure(key);
    bucket.gastos += Number(item.monto || 0);
  });

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      neto: item.ganancias - item.gastos,
    }))
    .sort((a, b) => String(a.key).localeCompare(String(b.key)));
}

export function calculateDashboardSummary({
  filteredData,
  productos,
  pedidoDetalles,
}) {
  const pedidosCerrados = filteredData.pedidos.filter((item) =>
    isClosedOrder(item.estado),
  );

  const ventaTotal = pedidosCerrados.reduce(
    (acc, item) => acc + Number(item.total || 0),
    0,
  );

  const gananciaBruta = pedidosCerrados.reduce(
    (acc, item) => acc + calculateOrderProfit(item, pedidoDetalles),
    0,
  );

  const gastoTotal = filteredData.gastos.reduce(
    (acc, item) => acc + Number(item.monto || 0),
    0,
  );

  const cotizacionesPorEstado = filteredData.cotizaciones.reduce(
    (acc, item) => {
      const estado = String(item.estado || "sin_estado").toLowerCase();
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    },
    {},
  );

  const pedidosPorEstado = filteredData.pedidos.reduce((acc, item) => {
    const estado = String(item.estado || "sin_estado").toLowerCase();
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {});

  const productosActivos = productos.filter(
    (item) => item.habilitado === true && Number(item.stock || 0) > 0,
  ).length;

  return {
    ventaTotalCompletada: ventaTotal,
    gananciaBrutaReal: gananciaBruta,
    gastoTotal,
    gananciaNetaReal: gananciaBruta - gastoTotal,

    totalCotizaciones: filteredData.cotizaciones.length,
    cotizacionesBorrador: cotizacionesPorEstado.borrador || 0,
    cotizacionesEnviadas: cotizacionesPorEstado.enviada || 0,
    cotizacionesAceptadas: cotizacionesPorEstado.aceptada || 0,
    cotizacionesRechazadas: cotizacionesPorEstado.rechazada || 0,
    cotizacionesVencidas: cotizacionesPorEstado.vencida || 0,
    cotizacionesConvertidas: cotizacionesPorEstado.convertida || 0,

    totalPedidos: filteredData.pedidos.length,
    pedidosCreados: pedidosPorEstado.creado || 0,
    pedidosEnPreparacion: pedidosPorEstado.en_preparacion || 0,
    pedidosParciales: pedidosPorEstado.parcialmente_entregado || 0,
    pedidosEntregados: pedidosPorEstado.entregado || 0,
    pedidosCancelados: pedidosPorEstado.cancelado || 0,

    productosActivos,
    totalProductos: productos.length,
    productosNuevos: filteredData.productos.length,
  };
}