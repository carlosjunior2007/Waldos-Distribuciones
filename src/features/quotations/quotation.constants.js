export const INITIAL_QUOTATION_FORM = {
  cliente_id: "",
  cliente_nombre: "",
  cliente_telefono: "",
  cliente_email: "",
  estado: "borrador",
  descuento: "",
  fecha_vencimiento: "",
  iva_porcentaje: "16",
  notas: "",
};

export const IVA_OPTIONS = [
  { value: "0", label: "Sin IVA 0%" },
  { value: "8", label: "IVA frontera 8%" },
  { value: "16", label: "IVA general 16%" },
];

export const QUOTATION_FILTERS = [
  ["todas", "Todas"],
  ["borrador", "Borrador"],
  ["enviada", "Enviadas"],
  ["aceptada", "Aceptadas"],
  ["rechazada", "Rechazadas"],
  ["vencida", "Vencidas"],
  ["convertida", "Convertidas"],
];