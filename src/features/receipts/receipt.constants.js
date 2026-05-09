import { getTodayInputDate } from "./services/receipts.js";

export const DEFAULT_CITY = "TIJUANA, BAJA CALIFORNIA, MÉXICO";

export const EMPTY_RECEIPT_FORM = {
  cliente_id: "",
  cotizacion_id: "",
  cliente_nombre: "",
  cliente_rfc: "",
  cliente_direccion: "",
  cliente_telefono: "",
  fecha: getTodayInputDate(),
  ciudad: DEFAULT_CITY,
  estado: "emitido",
  notas: "",
};