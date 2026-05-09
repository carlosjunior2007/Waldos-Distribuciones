import {
  Wallet,
  Receipt,
  Truck,
  Package,
  TrendingUp,
  BanknoteArrowUp,
  BanknoteArrowDown,
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

  if (type === "ganancia_cotizacion") {
    return {
      label: "Ganancia de cotización",
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
      label: "Ganancia",
      icon: BanknoteArrowUp,
      className: "border-success-100 bg-success-50 text-success-700",
      amountClass: "border-success-100 bg-success-50 text-success-700",
    };
  }

  return {
    label: "Gasto",
    icon: BanknoteArrowDown,
    className: "border-error-100 bg-error-50 text-error-700",
    amountClass: "border-error-100 bg-error-50 text-error-700",
  };
}

export function buildPreparedRows({ quoteRows, expenseRows, detailRows, productRows }) {
  const expenseMap = new Map();
  const detailMap = new Map();
  const productMap = new Map();

  for (const expense of expenseRows) {
    const key = expense.cotizacion_id;
    if (!expenseMap.has(key)) expenseMap.set(key, []);
    expenseMap.get(key).push(expense);
  }

  for (const detail of detailRows) {
    const key = detail.cotizacion_id;
    if (!detailMap.has(key)) detailMap.set(key, []);
    detailMap.get(key).push(detail);
  }

  for (const product of productRows) {
    productMap.set(product.id, product);
  }

  return quoteRows.map((quote) => {
    const relatedExpenses = expenseMap.get(quote.id) || [];
    const relatedDetails = detailMap.get(quote.id) || [];

    const totalExpenses = relatedExpenses.reduce(
      (acc, item) => acc + parseNumberish(item.monto),
      0,
    );

    const utilidadBruta = relatedDetails.reduce((acc, detail) => {
      const product = productMap.get(detail.producto_id);
      const utilidadUnidad = parseNumberish(product?.precio_utilidad);
      const cantidad = parseNumberish(detail.cantidad || 0);
      return acc + utilidadUnidad * cantidad;
    }, 0);

    const netProfit = utilidadBruta - totalExpenses;
    const quoteDateValue = quote.fecha_completado || quote.created_at;

    return {
      id: quote.id,
      folio: quote.folio || "Sin folio",
      referencia: quote.folio || "Sin folio",
      cliente: quote.cliente_nombre || "Cliente sin nombre",
      cliente_email: quote.cliente_email || "",
      cliente_telefono: quote.cliente_telefono || "",
      fechaISO: quoteDateValue,
      fecha: formatExpenseDate(quoteDateValue, { isTimestamp: true }),
      totalCotizacion: parseNumberish(quote.total),
      utilidadBruta,
      gastos: totalExpenses,
      ganancia: netProfit,
      naturaleza: netProfit >= 0 ? "ganancia" : "gasto",
      tipo: "ganancia_cotizacion",
      concepto: `Ganancia por cotización ${quote.folio || ""}`.trim(),
      notas: quote.notas || "",
      expenseCount: relatedExpenses.length,
      expenses: relatedExpenses,
    };
  });
}

export function resolveRowDateMs(row) {
  if (!row?.fechaISO) return 0;

  if (row.rowType === "ganancia") {
    return parseTimestampDate(row.fechaISO)?.getTime() || 0;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(row.fechaISO))) {
    return startOfLocalDay(row.fechaISO)?.getTime() || 0;
  }

  return parseTimestampDate(row.fechaISO)?.getTime() || 0;
}