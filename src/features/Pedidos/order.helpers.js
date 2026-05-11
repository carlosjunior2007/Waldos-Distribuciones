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
    label: "Programada",
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
  if (String(order.estado || "").toLowerCase() === "cancelado") {
    return "cancelado";
  }

  const progress = calculateOrderProgress(order.details || []);

  if (progress.total <= 0) return "creado";
  if (progress.delivered <= 0) return "creado";
  if (progress.pending <= 0) return "entregado";

  return "parcial";
}
