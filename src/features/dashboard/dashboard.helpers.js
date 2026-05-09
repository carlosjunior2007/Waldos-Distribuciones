import {
  Receipt,
  Package2,
  WalletCards,
} from "lucide-react";

import { formatMoney } from "../../utils/formatters";
import {
  normalizeQuotationStatus,
  isCompletedQuotation,
} from "../../utils/status";
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

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

export function getMovementMeta(type) {
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

export function groupByPeriod({ cotizaciones, gastos, range }) {
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

    if (isCompletedQuotation(item.estado)) {
      bucket.ganancias += Number(item.ganancia || 0);
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

export function calculateDashboardSummary({ filteredData, productos }) {
  const cotizacionesCompletadas = filteredData.cotizaciones.filter((item) =>
    isCompletedQuotation(item.estado),
  );

  const ventaTotalCompletada = cotizacionesCompletadas.reduce(
    (acc, item) => acc + Number(item.total || 0),
    0,
  );

  const gananciaBrutaReal = cotizacionesCompletadas.reduce(
    (acc, item) => acc + Number(item.ganancia || 0),
    0,
  );

  const gastoTotal = filteredData.gastos.reduce(
    (acc, item) => acc + Number(item.monto || 0),
    0,
  );

  const estados = filteredData.cotizaciones.reduce(
    (acc, item) => {
      const estado = normalizeQuotationStatus(item.estado);
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    },
    {
      pendiente: 0,
      completada: 0,
      cancelada: 0,
      otro: 0,
    },
  );

  const productosActivos = productos.filter(
    (item) => item.disponibilidad === true && item.habilitado === true,
  ).length;

  return {
    ventaTotalCompletada,
    gananciaBrutaReal,
    gastoTotal,
    gananciaNetaReal: gananciaBrutaReal - gastoTotal,
    totalCotizaciones: filteredData.cotizaciones.length,
    pendientes: estados.pendiente || 0,
    completadas: estados.completada || 0,
    canceladas: estados.cancelada || 0,
    otros: estados.otro || 0,
    productosActivos,
    totalProductos: productos.length,
    productosNuevos: filteredData.productos.length,
  };
}