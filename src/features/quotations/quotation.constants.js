export const INITIAL_QUOTATION_FORM = {
  cliente_id: "",
  cliente_nombre: "",
  cliente_telefono: "",
  cliente_email: "",
  cliente_rfc: "",
  cliente_razon_social: "",
  estado: "pendiente",
  descuento: "",
  gastos: "",
  fecha_vencimiento: "",
  iva_porcentaje: "16",
  isr_porcentaje: "0",
  retencion_iva_porcentaje: "0",
};

export const IVA_OPTIONS = [
  { value: "0", label: "Sin IVA 0%" },
  { value: "8", label: "IVA frontera 8%" },
  { value: "16", label: "IVA general 16%" },
];

export const ISR_OPTIONS = [
  { value: "0", label: "Sin ISR 0%" },
  { value: "1.25", label: "ISR retenido 1.25%" },
  { value: "10", label: "ISR retenido 10%" },
];

export const RETENCION_IVA_OPTIONS = [
  { value: "0", label: "Sin retención 0%" },
  { value: "4", label: "Retención IVA 4%" },
  { value: "10.6667", label: "Retención IVA 2/3" },
];

export const QUOTATION_FILTERS = [
  ["todas", "Todas"],
  ["pendiente", "Pendientes"],
  ["en_proceso", "En proceso"],
  ["completado", "Completadas"],
  ["cancelado", "Canceladas"],
  ["vencido", "Vencidas"],
];