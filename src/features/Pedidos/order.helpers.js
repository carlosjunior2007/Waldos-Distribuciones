import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";

export function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));
}

export function getOrderStatusMeta(status) {
  const value = String(status || "").toLowerCase();

  if (value === "borrador") {
    return {
      key: "borrador",
      label: "Borrador",
      icon: FileCheck2,
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (value === "creado") {
    return {
      key: "creado",
      label: "Creado",
      icon: Clock3,
      className: "border-info-100 bg-info-50 text-info-700",
    };
  }

  if (value === "parcial") {
    return {
      key: "parcial",
      label: "Entrega parcial",
      icon: Truck,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  if (value === "entregado") {
    return {
      key: "entregado",
      label: "Entregado",
      icon: PackageCheck,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  if (value === "cancelado") {
    return {
      key: "cancelado",
      label: "Cancelado",
      icon: XCircle,
      className: "border-error-100 bg-error-50 text-error-700",
    };
  }

  return {
    key: "pendiente",
    label: "Pendiente",
    icon: AlertTriangle,
    className: "border-warning-100 bg-warning-50 text-warning-700",
  };
}

export function getPaymentStatusMeta(status) {
  const value = String(status || "").toLowerCase();

  if (value === "pagado") {
    return {
      label: "Pagado",
      icon: CheckCircle2,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  if (value === "parcial") {
    return {
      label: "Pago parcial",
      icon: FileCheck2,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  return {
    label: "Pendiente",
    icon: Clock3,
    className: "border-slate-200 bg-slate-50 text-slate-700",
  };
}

export function getDeliveryStatusMeta(status) {
  const value = String(status || "").toLowerCase();

  if (value === "entregada") {
    return {
      label: "Entregada",
      icon: CheckCircle2,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  if (value === "en_ruta") {
    return {
      label: "En ruta",
      icon: Truck,
      className: "border-info-100 bg-info-50 text-info-700",
    };
  }

  if (value === "parcial") {
    return {
      label: "Parcial",
      icon: Truck,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  if (value === "cancelada") {
    return {
      label: "Cancelada",
      icon: XCircle,
      className: "border-error-100 bg-error-50 text-error-700",
    };
  }

  return {
    label: "Pendiente",
    icon: Clock3,
    className: "border-slate-200 bg-slate-50 text-slate-700",
  };
}

export function calculateOrderProgress(details = []) {
  const total = details.reduce(
    (acc, item) => acc + Number(item.cantidad_pedida || 0),
    0,
  );

  const delivered = details.reduce(
    (acc, item) => acc + Number(item.cantidad_entregada || 0),
    0,
  );

  if (total <= 0) {
    return {
      total,
      delivered,
      pending: 0,
      percent: 0,
    };
  }

  return {
    total,
    delivered,
    pending: Math.max(total - delivered, 0),
    percent: Math.min(Math.round((delivered / total) * 100), 100),
  };
}

export function getAddressLabel(address) {
  if (!address) return "Sin dirección";

  return [
    address.nombre,
    address.direccion,
    address.ciudad,
    address.estado,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function getPendingProducts(details = []) {
  return details
    .map((item) => ({
      ...item,
      pendiente: Math.max(
        Number(item.cantidad_pedida || 0) -
          Number(item.cantidad_entregada || 0),
        0,
      ),
    }))
    .filter((item) => item.pendiente > 0);
}


export function calculateDerivedOrderStatus(order = {}) {
  const rawStatus = String(order.estado || "").toLowerCase();
  if (rawStatus === "cancelado") {
    return "cancelado";
  }
  if (rawStatus === "borrador") {
    return "borrador";
  }

  const progress = calculateOrderProgress(order.details || []);

  if (progress.total <= 0) return "creado";
  if (progress.delivered <= 0) return "creado";
  if (progress.pending <= 0) return "entregado";

  return "parcial";
}

export function isOrderProfitRealized(order = {}) {
  const status = calculateDerivedOrderStatus(order);
  const paymentStatus = String(order.estado_pago || "").toLowerCase();

  return status === "entregado" && paymentStatus === "pagado";
}

export function calculateOrderProfit(details = []) {
  const subtotal = details.reduce((sum, item) => {
    return sum + Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0);
  }, 0);

  const cost = details.reduce((sum, item) => {
    return sum + Number(item.cantidad_pedida || 0) * Number(item.costo_unitario || 0);
  }, 0);

  const profit = subtotal - cost;
  const margin = subtotal > 0 ? (profit / subtotal) * 100 : 0;
  const markup = cost > 0 ? (profit / cost) * 100 : 0;

  return {
    subtotal,
    cost,
    profit,
    margin,
    markup,
  };
}


export function getOrderInvoiceReadiness(order = {}) {
  const paymentStatus = String(order.estado_pago || "").toLowerCase();
  const derivedStatus = calculateDerivedOrderStatus(order);
  const progress = calculateOrderProgress(order.details || []);

  const isPaid = paymentStatus === "pagado";
  const isDelivered = derivedStatus === "entregado" && progress.total > 0 && progress.pending <= 0;

  const reasons = [];

  if (!isPaid) {
    reasons.push("El pedido debe estar pagado.");
  }

  if (!isDelivered) {
    reasons.push("El pedido debe estar entregado completamente.");
  }

  return {
    ready: isPaid && isDelivered,
    isPaid,
    isDelivered,
    progress,
    reasons,
  };
}

export function calculateLineProfit(item = {}) {
  const quantity = Number(item.cantidad_pedida || 0);
  const price = Number(item.precio_unitario || 0);
  const costUnit = Number(item.costo_unitario || 0);
  const sale = quantity * price;
  const cost = quantity * costUnit;
  const profit = sale - cost;
  const margin = sale > 0 ? (profit / sale) * 100 : 0;

  return { sale, cost, profit, margin };
}


export function calculateOrderRealProfit(order = {}) {
  const details = order.details || [];
  const subtotal = Number(order.subtotal || 0);
  const total = Number(order.total || 0);
  const paidAmount = Number(order.pago_monto || (String(order.estado_pago || '').toLowerCase() === 'pagado' ? total : 0));
  const paidWithoutTax = total > 0 && subtotal > 0 ? paidAmount * (subtotal / total) : paidAmount;

  const deliveredSale = details.reduce((sum, item) => {
    return sum + Number(item.cantidad_entregada || 0) * Number(item.precio_unitario || 0);
  }, 0);

  const realCost = details.reduce((sum, item) => {
    const fallbackCost = Number(item.cantidad_entregada || 0) * Number(item.costo_unitario || 0);
    return sum + Number(item.costo_real_fifo ?? fallbackCost);
  }, 0);

  const estimatedSale = details.reduce((sum, item) => {
    return sum + Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0);
  }, 0);

  const estimatedCost = details.reduce((sum, item) => {
    return sum + Number(item.cantidad_pedida || 0) * Number(item.costo_unitario || 0);
  }, 0);

  const realProfit = deliveredSale - realCost;
  const collectedProfit = paidWithoutTax - realCost;
  const estimatedProfit = estimatedSale - estimatedCost;

  return {
    estimatedSale,
    estimatedCost,
    estimatedProfit,
    deliveredSale,
    realCost,
    realProfit,
    paidAmount,
    paidWithoutTax,
    collectedProfit,
    realMargin: deliveredSale > 0 ? (realProfit / deliveredSale) * 100 : 0,
    collectedMargin: paidWithoutTax > 0 ? (collectedProfit / paidWithoutTax) * 100 : 0,
  };
}


export function capitalizeFirstLetter(value) {
  const text = String(value ?? "");
  const firstLetterIndex = text.search(/[A-Za-zÀ-ÖØ-öø-ÿ]/);

  if (firstLetterIndex === -1) return text;

  return (
    text.slice(0, firstLetterIndex) +
    text.charAt(firstLetterIndex).toLocaleUpperCase("es-MX") +
    text.slice(firstLetterIndex + 1)
  );
}

export function normalizeCapitalizedText(value) {
  return capitalizeFirstLetter(String(value ?? "").trim());
}
