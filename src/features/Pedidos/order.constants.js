export const ORDER_STATUS_OPTIONS = [
  ["todos", "Todos"],
  ["borrador", "Borradores"],
  ["creado", "Creados"],
  ["parcial", "Parciales"],
  ["entregado", "Entregados"],
  ["cancelado", "Cancelados"],
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Parcial" },
  { value: "pagado", label: "Pagado" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "Sin definir" },
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "credito", label: "Crédito" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "cheque", label: "Cheque" },
  { value: "otro", label: "Otro" },
];

export const DELIVERY_STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_ruta", label: "En ruta" },
  { value: "parcial", label: "Parcial" },
  { value: "entregada", label: "Entregada" },
  { value: "cancelada", label: "Cancelada" },
];

export const ITEMS_PER_PAGE = 8;
