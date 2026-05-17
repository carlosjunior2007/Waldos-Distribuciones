import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  History,
  Mail,
  Pencil,
  ReceiptText,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import Modal from "../../../components/ui/Modal";
import { formatMoney } from "../order.helpers";

const DEFAULT_SERIE = "F";
const DEFAULT_CURRENCY = "MXN";
const DEFAULT_PAYMENT_FORM = "99";
const DEFAULT_PAYMENT_METHOD = "PUE";
const DEFAULT_EXPEDITION_PLACE = "22000";

const REGIMEN_FISCAL_OPTIONS = [
  { value: "", label: "Seleccionar régimen" },
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
  { value: "605", label: "605 - Sueldos y Salarios" },
  { value: "606", label: "606 - Arrendamiento" },
  { value: "612", label: "612 - Actividades Empresariales y Profesionales" },
  { value: "616", label: "616 - Sin obligaciones fiscales" },
  { value: "626", label: "626 - RESICO" },
];

const USO_CFDI_OPTIONS = [
  { value: "", label: "Seleccionar uso CFDI" },
  { value: "G01", label: "G01 - Adquisición de mercancías" },
  { value: "G02", label: "G02 - Devoluciones/descuentos" },
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "I04", label: "I04 - Equipo de cómputo" },
  { value: "S01", label: "S01 - Sin efectos fiscales" },
];

const PAYMENT_FORM_OPTIONS = [
  { value: "", label: "Seleccionar forma" },
  { value: "01", label: "01 - Efectivo" },
  { value: "02", label: "02 - Cheque nominativo" },
  { value: "03", label: "03 - Transferencia electrónica" },
  { value: "04", label: "04 - Tarjeta de crédito" },
  { value: "28", label: "28 - Tarjeta de débito" },
  { value: "99", label: "99 - Por definir" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "PUE", label: "PUE - Pago en una sola exhibición" },
  { value: "PPD", label: "PPD - Pago en parcialidades o diferido" },
];

const CURRENCY_OPTIONS = [
  { value: "MXN", label: "MXN - Peso mexicano" },
  { value: "USD", label: "USD - Dólar estadounidense" },
];

const CANCEL_REASON_OPTIONS = [
  { value: "02", label: "02 - Errores sin relación" },
  { value: "03", label: "03 - No se llevó a cabo la operación" },
  { value: "01", label: "01 - Errores con relación / sustitución" },
  { value: "04", label: "04 - Operación nominativa en factura global" },
];

const TAB_OPTIONS = [
  { value: "datos", label: "Datos fiscales" },
  { value: "conceptos", label: "Conceptos y totales" },
  { value: "historial", label: "Historial" },
  { value: "cancelacion", label: "Cancelación" },
];

function normalize(value) {
  return String(value || "").trim();
}

function normalizeUpper(value) {
  return normalize(value).toUpperCase();
}

function isCanceledInvoice(invoice = {}) {
  return ["cancelada", "cancelado", "cancelled"].includes(String(invoice.status || "").toLowerCase());
}

function isLocalDeleted(invoice = {}) {
  const status = String(invoice.status || "").trim().toLowerCase();
  return status === "local_eliminada" || status === "local_eliminado" || invoice.deleted_local === true;
}

function getVisibleInvoices(order = {}) {
  return (order.facturas || []).filter((invoice) => !isLocalDeleted(invoice));
}

function getInvoiceStatus(order = {}) {
  return String(order.factura_status || "").toLowerCase();
}

function getActiveInvoice(order = {}) {
  const orderStatus = getInvoiceStatus(order);

  if (order.facturama_id && order.factura_uuid && orderStatus !== "cancelada") {
    return {
      id: null,
      facturama_id: order.facturama_id,
      uuid: order.factura_uuid,
      serie: order.factura_serie,
      folio: order.factura_folio,
      status: orderStatus || "timbrada",
      created_at: order.factura_fecha || order.factura_timbrada_at,
    };
  }

  return getVisibleInvoices(order).find((invoice) => {
    const status = String(invoice.status || "").toLowerCase();
    return !isCanceledInvoice(invoice) && status !== "error" && (invoice.facturama_id || invoice.uuid);
  }) || null;
}

function getCanceledInvoices(order = {}, hiddenInvoiceIds = []) {
  const hiddenIds = new Set((hiddenInvoiceIds || []).map((id) => String(id)));
  const hasLoadedInvoiceHistory = Array.isArray(order.facturas);

  const invoices = getVisibleInvoices(order).filter((invoice) => {
    if (!isCanceledInvoice(invoice) || !invoice.uuid) return false;
    if (invoice.id && hiddenIds.has(String(invoice.id))) return false;
    return true;
  });

  // Si ya existe historial desde la tabla facturas, no se crea una opción extra
  // desde los campos resumen del pedido para evitar mostrar registros eliminados.
  if (hasLoadedInvoiceHistory) return invoices;

  if (getInvoiceStatus(order) === "cancelada" && order.factura_uuid) {
    const exists = invoices.some((invoice) => invoice.uuid === order.factura_uuid);
    if (!exists) {
      invoices.unshift({
        id: "pedido-cancelado",
        uuid: order.factura_uuid,
        serie: order.factura_serie,
        folio: order.factura_folio,
        status: "cancelada",
        cancel_reason: order.factura_cancel_reason,
        replacement_uuid: order.factura_replacement_uuid,
        created_at: order.factura_fecha || order.factura_timbrada_at,
        cancelada_at: order.factura_cancelada_at,
      });
    }
  }

  return invoices;
}

function getFacturamaErrorMessage(error) {
  if (!error) return "Error desconocido de Facturama.";
  if (typeof error === "string") return error;
  if (error.Message) return error.Message;
  if (error.message) return error.message;
  if (error.ModelState) {
    return Object.entries(error.ModelState)
      .flatMap(([field, messages]) => {
        if (Array.isArray(messages)) return messages.map((message) => `${field}: ${message}`);
        return [`${field}: ${messages}`];
      })
      .join("\n");
  }
  return JSON.stringify(error);
}

function buildInvoiceDraft(orderInput = {}) {
  const order = orderInput || {};
  const client = order.clientes || order.cliente || {};

  const rawRfc = order.cliente_rfc || client.rfc || "";
  const rawName = order.cliente_razon_social || client.razon_social || order.cliente_nombre || client.nombre || "";
  const rawRegime = order.cliente_regimen_fiscal || client.regimen_fiscal || "";

  const isPublicGeneral =
    normalizeUpper(rawRfc) === "XAXX010101000" ||
    normalizeUpper(rawName) === "PUBLICO EN GENERAL" ||
    normalize(rawRegime) === "616";

  return {
    receiverName: normalizeUpper(rawName || (isPublicGeneral ? "PUBLICO EN GENERAL" : "")),
    receiverRfc: normalizeUpper(rawRfc || (isPublicGeneral ? "XAXX010101000" : "")),
    receiverFiscalRegime: normalize(rawRegime || (isPublicGeneral ? "616" : "")),
    receiverCfdiUse: normalizeUpper(order.cliente_uso_cfdi || client.uso_cfdi || (isPublicGeneral ? "S01" : "")),
    receiverTaxZipCode: normalize(order.cliente_codigo_postal || client.codigo_postal || DEFAULT_EXPEDITION_PLACE),
    receiverEmail: normalize(order.cliente_email || client.correo || ""),
    serie: normalize(order.serie_factura || DEFAULT_SERIE),
    folio: normalize(order.folio_factura || order.folio || ""),
    paymentForm: normalize(order.payment_form || client.factura_payment_form || DEFAULT_PAYMENT_FORM),
    paymentMethod: normalize(order.payment_method || client.factura_payment_method || DEFAULT_PAYMENT_METHOD),
    currency: normalize(order.currency || client.factura_currency || DEFAULT_CURRENCY),
    expeditionPlace: normalize(order.expedition_place || DEFAULT_EXPEDITION_PLACE),
  };
}

function getInvoiceData(draft = {}) {
  const receiver = {
    name: normalizeUpper(draft.receiverName),
    rfc: normalizeUpper(draft.receiverRfc),
    fiscalRegime: normalize(draft.receiverFiscalRegime),
    cfdiUse: normalizeUpper(draft.receiverCfdiUse),
    taxZipCode: normalize(draft.receiverTaxZipCode),
    email: normalize(draft.receiverEmail),
  };

  if (receiver.rfc === "XAXX010101000" || receiver.name === "PUBLICO EN GENERAL" || receiver.fiscalRegime === "616") {
    receiver.rfc = "XAXX010101000";
    receiver.name = "PUBLICO EN GENERAL";
    receiver.fiscalRegime = "616";
    receiver.cfdiUse = "S01";
  }

  return {
    receiver,
    header: {
      cfdiType: "I",
      serie: normalize(draft.serie || DEFAULT_SERIE),
      folio: normalize(draft.folio),
      paymentForm: normalize(draft.paymentForm || DEFAULT_PAYMENT_FORM),
      paymentMethod: normalize(draft.paymentMethod || DEFAULT_PAYMENT_METHOD),
      currency: normalize(draft.currency || DEFAULT_CURRENCY),
      expeditionPlace: normalize(draft.expeditionPlace || DEFAULT_EXPEDITION_PLACE),
      exportation: "01",
    },
  };
}

function validateInvoice(invoiceData, order = {}) {
  const errors = [];
  const receiver = invoiceData.receiver;
  const header = invoiceData.header;

  if (String(order.estado || "").toLowerCase() === "cancelado" && !getActiveInvoice(order)) {
    errors.push("No puedes timbrar un pedido cancelado si no tiene una factura previa.");
  }

  if (!receiver.name) errors.push("Falta razón social del receptor.");
  if (!receiver.rfc) errors.push("Falta RFC del receptor.");
  if (!receiver.fiscalRegime) errors.push("Falta régimen fiscal del receptor.");
  if (!receiver.cfdiUse) errors.push("Falta uso CFDI del receptor.");
  if (!/^[0-9]{5}$/.test(receiver.taxZipCode)) errors.push("El código postal fiscal debe tener 5 dígitos.");
  if (!header.folio) errors.push("Falta folio fiscal.");
  if (!header.serie) errors.push("Falta serie fiscal.");
  if (!/^[0-9]{5}$/.test(header.expeditionPlace)) errors.push("El lugar de expedición debe estar configurado como código postal de 5 dígitos.");
  if (!header.paymentForm) errors.push("Falta forma de pago.");
  if (!header.paymentMethod) errors.push("Falta método de pago.");
  if (header.paymentMethod === "PPD" && header.paymentForm !== "99") errors.push("Si usas PPD, normalmente la forma de pago debe ser 99 - Por definir.");
  if (header.paymentMethod === "PUE" && header.paymentForm === "99") errors.push("Si usas PUE, conviene elegir la forma real de pago, por ejemplo 03 - Transferencia.");

  const rows = order.details || [];
  if (!rows.length) errors.push("El pedido no tiene productos.");

  rows.forEach((item) => {
    if (!item.nombre_producto) errors.push("Hay un producto sin nombre.");
    if (Number(item.cantidad_pedida || 0) <= 0) errors.push(`${item.nombre_producto || "Producto"}: cantidad inválida.`);
    if (Number(item.precio_unitario || 0) <= 0) errors.push(`${item.nombre_producto || "Producto"}: precio unitario inválido.`);
  });

  return { ready: errors.length === 0, errors };
}

function getInvoiceTotals(order = {}) {
  const subtotal = Number(order.subtotal || 0);
  const iva = Number(order.iva_monto || 0);
  const isr = Number(order.isr_monto || 0);
  const total = Number(order.total || 0);
  return { subtotal, iva, isr, total };
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function StatusPill({ children, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${tones[tone] || tones.slate}`}>{children}</span>;
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <section className="rounded-[26px] border border-border bg-background p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-50 text-primary-700">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <h3 className="text-base font-extrabold text-text-primary">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function FieldView({ label, value, muted }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-soft px-4 py-3">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-text-muted">{label}</p>
      <p className={`mt-2 text-sm font-extrabold ${muted ? "text-text-secondary" : "text-text-primary"}`}>{value || "Pendiente"}</p>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block rounded-2xl border border-border bg-background px-4 py-3">
      <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-text-muted">{label}</span>
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full bg-transparent text-sm font-bold text-text-primary outline-none placeholder:text-text-muted"
      />
    </label>
  );
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <label className="block rounded-2xl border border-border bg-background px-4 py-3">
      <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-text-muted">{label}</span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full bg-transparent text-sm font-bold text-text-primary outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function EditableFiscalField({ editing, type = "input", label, value, onChange, options, placeholder }) {
  if (editing) {
    if (type === "select") return <FieldSelect label={label} value={value} onChange={onChange} options={options} />;
    return <FieldInput label={label} value={value} onChange={onChange} placeholder={placeholder} />;
  }

  const labelText = type === "select" ? options?.find((option) => option.value === value)?.label || value : value;
  return <FieldView label={label} value={labelText} />;
}

function ActionButton({ icon: Icon, title, description, onClick, disabled, tone = "default" }) {
  const tones = {
    default: "border-border bg-background text-text-primary hover:border-primary-200 hover:bg-primary-50",
    primary: "border-primary-600 bg-primary-700 text-white hover:bg-primary-800",
    danger: "border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone] || tones.default}`}
    >
      {Icon ? <Icon className="mt-0.5 h-5 w-5 shrink-0" /> : null}
      <span>
        <span className="block text-sm font-extrabold">{title}</span>
        {description ? <span className="mt-1 block text-xs leading-5 opacity-80">{description}</span> : null}
      </span>
    </button>
  );
}

function getInvoiceDisplayTitle(invoice = {}, fallback = "Factura") {
  return [invoice.serie, invoice.folio].filter(Boolean).join("-") || invoice.uuid || fallback;
}

function ConfirmBox({ action, onCancel, onConfirm, canceledInvoices = [], selectedReplacementUuid = "", onSelectReplacement }) {
  if (!action) return null;

  const copy = {
    stamp: {
      title: "Confirmar timbrado sandbox",
      description: "Se validarán los datos y, si todo está correcto, se enviará el CFDI a Facturama Sandbox.",
      confirm: "Facturar",
    },
    cancel: {
      title: "Cancelar CFDI en SAT sandbox",
      description: "Esta acción solicita la cancelación del CFDI en Facturama Sandbox. No elimina el registro local.",
      confirm: "Cancelar CFDI",
    },
    deleteLocal: {
      title: "Borrar registro del historial",
      description: action.invoice
        ? `Solo se borrará este registro del historial: ${getInvoiceDisplayTitle(action.invoice)}. Esto no cancela nada en SAT.`
        : "Solo se permite cuando el CFDI ya está cancelado. Esto no cancela nada en SAT, solo limpia el registro local.",
      confirm: "Borrar este registro",
    },
    email: {
      title: "Enviar factura por correo",
      description: "Se mandará el CFDI al correo registrado del cliente y se confirmará si el envío fue correcto.",
      confirm: "Enviar correo",
    },
  }[action.type] || { title: "Confirmar acción", description: "Confirma para continuar.", confirm: "Confirmar" };

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/45 px-4">
      <div className="w-full max-w-2xl rounded-[28px] border border-border bg-background p-6 shadow-2xl">
        <h3 className="text-lg font-extrabold text-text-primary">{copy.title}</h3>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{copy.description}</p>

        {action?.type === "stamp" && canceledInvoices.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-border bg-surface-soft p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-extrabold text-text-primary">Relacionar con CFDI cancelado</p>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  Si esta factura sustituye a una cancelada, selecciona exactamente cuál. El folio puede repetirse, por eso aquí se muestra UUID, fecha de emisión y fecha de cancelación para distinguir cada registro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectReplacement?.("")}
                className={`rounded-2xl border px-3 py-2 text-xs font-extrabold transition ${!selectedReplacementUuid ? "border-primary-600 bg-primary-700 text-white" : "border-border bg-background text-text-secondary hover:bg-primary-50"}`}
              >
                No relacionar
              </button>
            </div>

            <div className="mt-4 max-h-[320px] space-y-3 overflow-auto pr-1">
              {canceledInvoices.map((invoice, index) => {
                const title = getInvoiceDisplayTitle(invoice, `Factura cancelada ${index + 1}`);
                const checked = selectedReplacementUuid === invoice.uuid;

                return (
                  <button
                    key={invoice.id || invoice.uuid || `${title}-${index}`}
                    type="button"
                    onClick={() => onSelectReplacement?.(invoice.uuid)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${checked ? "border-primary-600 bg-primary-50 ring-2 ring-primary-100" : "border-border bg-background hover:border-primary-200 hover:bg-primary-50/50"}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-text-primary">{title}</span>
                          <StatusPill tone="red">Cancelada</StatusPill>
                          <span className="rounded-full bg-surface-soft px-2 py-1 text-[0.68rem] font-bold text-text-secondary">#{index + 1}</span>
                        </div>
                        <p className="mt-2 break-all text-xs text-text-secondary">UUID: {invoice.uuid || "-"}</p>
                      </div>
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${checked ? "border-primary-700 bg-primary-700" : "border-border bg-background"}`}>
                        {checked ? <CheckCircle2 className="h-4 w-4 text-white" /> : null}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      <div><span className="text-text-muted">Emitida:</span> <strong className="text-text-primary">{formatDate(invoice.timbrada_at || invoice.created_at)}</strong></div>
                      <div><span className="text-text-muted">Cancelada:</span> <strong className="text-text-primary">{formatDate(invoice.cancelada_at)}</strong></div>
                      <div><span className="text-text-muted">Motivo:</span> <strong className="text-text-primary">{invoice.cancel_reason || "-"}</strong></div>
                      <div><span className="text-text-muted">Facturama ID:</span> <strong className="break-all text-text-primary">{invoice.facturama_id || "-"}</strong></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-2xl border border-border px-4 py-2 text-sm font-bold text-text-primary">
            Volver
          </button>
          <button type="button" onClick={onConfirm} className="rounded-2xl bg-primary-700 px-4 py-2 text-sm font-bold text-white">
            {copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-sm font-extrabold transition ${
        active ? "bg-primary-700 text-white shadow-sm" : "border border-border bg-background text-text-secondary hover:bg-surface-soft"
      }`}
    >
      {children}
    </button>
  );
}

function EditFiscalActions({ editing, busy, localSaving, onEdit, onSave, onCancel }) {
  if (editing) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-background px-3 text-xs font-bold text-text-primary disabled:opacity-50"
        >
          <X className="h-4 w-4" /> Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 rounded-2xl bg-primary-700 px-3 text-xs font-bold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {localSaving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      disabled={busy}
      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-background px-3 text-xs font-bold text-text-primary hover:bg-primary-50 disabled:opacity-50"
    >
      <Pencil className="h-4 w-4" /> Editar
    </button>
  );
}

export default function InvoicePreviewModal({
  open,
  order,
  saving = false,
  onClose,
  onSaveDraft,
  onStampInvoice,
  onDownloadInvoicePdf,
  onDownloadInvoiceXml,
  onCancelInvoice,
  onDeleteLocalInvoice,
  onSendInvoiceEmail,
}) {
  const [draft, setDraft] = useState(() => buildInvoiceDraft(order));
  const [editingSection, setEditingSection] = useState(null);
  const [localSaving, setLocalSaving] = useState(false);
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [cancelReason, setCancelReason] = useState("02");
  const [replacementUuid, setReplacementUuid] = useState("");
  const [selectedReplacementUuid, setSelectedReplacementUuid] = useState("");
  const [activeTab, setActiveTab] = useState("datos");
  const [hiddenInvoiceIds, setHiddenInvoiceIds] = useState([]);

  useEffect(() => {
    const nextDraft = buildInvoiceDraft(order);
    setDraft(nextDraft);
    setEditingSection(null);
    setResult(null);
    setConfirmAction(null);
    setCancelReason("02");
    setReplacementUuid("");
    setSelectedReplacementUuid("");
    setHiddenInvoiceIds([]);
    setActiveTab("datos");
  }, [order?.id, open]);

  const invoiceData = useMemo(() => getInvoiceData(draft), [draft]);
  const validation = useMemo(() => validateInvoice(invoiceData, order || {}), [invoiceData, order]);
  const totals = getInvoiceTotals(order || {});
  const activeInvoice = getActiveInvoice(order || {});
  const invoices = getVisibleInvoices(order || {}).filter((invoice) => !invoice?.id || !hiddenInvoiceIds.includes(String(invoice.id)));
  const canceledInvoices = getCanceledInvoices(order || {}, hiddenInvoiceIds);
  const hasActiveInvoice = Boolean(activeInvoice?.facturama_id || activeInvoice?.uuid);
  const canDeleteLocal = !hasActiveInvoice && (canceledInvoices.length > 0 || getInvoiceStatus(order || {}) === "cancelada");
  const busy = saving || localSaving || working;
  const clientEmail = invoiceData.receiver.email;

  if (!open || !order) return null;

  function updateDraft(key, value) {
    setDraft((current) => ({ ...(current || buildInvoiceDraft(order)), [key]: value }));
    setResult(null);
  }

  function getActionInvoiceData() {
    return selectedReplacementUuid
      ? {
          ...invoiceData,
          relatedCfdi: {
            type: "04",
            uuid: selectedReplacementUuid,
          },
        }
      : invoiceData;
  }

  function handleStamp() {
    setResult(null);

    if (!onStampInvoice) {
      setResult({ ok: false, title: "Sin conexión", message: "No hay función conectada para timbrar." });
      return;
    }

    if (hasActiveInvoice) {
      setResult({ ok: false, title: "Factura activa", message: "Este pedido ya tiene un CFDI activo. Cancélalo antes de timbrar otro." });
      return;
    }

    if (!validation.ready) {
      setResult({ ok: false, title: "Revisa los datos fiscales", message: "No se envió nada a Facturama.", errors: validation.errors });
      setActiveTab("datos");
      return;
    }

    setConfirmAction({ type: "stamp" });
  }

  async function executeStamp() {
    try {
      setWorking(true);
      setConfirmAction(null);
      const response = await onStampInvoice({ order, invoiceData: getActionInvoiceData() });
      setResult({ ok: true, title: "Factura timbrada", message: response?.message || "CFDI timbrado correctamente.", data: response });
      setActiveTab("historial");
    } catch (error) {
      setResult({
        ok: false,
        title: "Error de Facturama",
        message: getFacturamaErrorMessage(error.facturamaData) || error.message || "No se pudo timbrar.",
        facturamaData: error.facturamaData,
        payloadSent: error.payloadSent,
      });
      setActiveTab("cancelacion");
    } finally {
      setWorking(false);
    }
  }

  async function saveDraft() {
    try {
      setLocalSaving(true);
      await onSaveDraft?.({ order, values: draft || buildInvoiceDraft(order) });
      setEditingSection(null);
      setResult({ ok: true, title: "Datos guardados", message: "Los datos fiscales se actualizaron." });
    } catch (error) {
      setResult({ ok: false, title: "No se pudo guardar", message: error.message || "Error guardando datos fiscales." });
    } finally {
      setLocalSaving(false);
    }
  }

  async function handleDownload(format) {
    try {
      setWorking(true);
      setResult(null);
      if (format === "pdf") await onDownloadInvoicePdf?.(order);
      if (format === "xml") await onDownloadInvoiceXml?.(order);
      setResult({ ok: true, title: "Descarga lista", message: `${format.toUpperCase()} descargado correctamente.` });
    } catch (error) {
      setResult({ ok: false, title: `No se pudo descargar ${format.toUpperCase()}`, message: getFacturamaErrorMessage(error.facturamaData) || error.message });
    } finally {
      setWorking(false);
    }
  }

  function handleCancel() {
    if (!hasActiveInvoice) {
      setResult({ ok: false, title: "Sin CFDI activo", message: "No hay CFDI activo para cancelar." });
      return;
    }
    setConfirmAction({ type: "cancel" });
  }

  async function executeCancel() {
    try {
      setWorking(true);
      setConfirmAction(null);
      const response = await onCancelInvoice?.({ order, reason: cancelReason, replacementUuid });
      setResult({ ok: true, title: "CFDI cancelado", message: response?.message || "CFDI cancelado correctamente.", data: response });
      setActiveTab("historial");
    } catch (error) {
      setResult({ ok: false, title: "No se pudo cancelar", message: getFacturamaErrorMessage(error.facturamaData) || error.message, facturamaData: error.facturamaData });
    } finally {
      setWorking(false);
    }
  }

  function handleDeleteLocal(invoice) {
    if (!canDeleteLocal || !isCanceledInvoice(invoice)) {
      setResult({ ok: false, title: "No permitido", message: "Solo puedes eliminar del historial una factura cancelada." });
      return;
    }
    if (!invoice?.id) {
      setResult({ ok: false, title: "Sin ID de factura", message: "Este registro no trae ID, así que no se puede borrar de forma segura sin arriesgar borrar otros registros." });
      return;
    }
    setConfirmAction({ type: "deleteLocal", invoice });
  }

  async function executeDeleteLocal() {
    const invoice = confirmAction?.invoice;

    try {
      setWorking(true);
      setConfirmAction(null);
      const response = await onDeleteLocalInvoice?.({ order, invoice });
      if (invoice?.id) {
        setHiddenInvoiceIds((current) => Array.from(new Set([...current, String(invoice.id)])));
      }
      setSelectedReplacementUuid((current) => current === invoice?.uuid ? "" : current);
      setResult({ ok: true, title: "Registro local eliminado", message: response?.message || "Se limpió solo la factura seleccionada del historial." });
    } catch (error) {
      setResult({ ok: false, title: "No se pudo eliminar", message: error.message || "Error eliminando registro local." });
    } finally {
      setWorking(false);
    }
  }

  function handleEmail() {
    if (!hasActiveInvoice) {
      setResult({ ok: false, title: "Sin CFDI activo", message: "Primero timbra la factura." });
      return;
    }
    if (!clientEmail || !clientEmail.includes("@")) {
      setResult({ ok: false, title: "Cliente sin correo", message: "El cliente no tiene un correo válido registrado en el sistema." });
      setActiveTab("datos");
      return;
    }
    setConfirmAction({ type: "email" });
  }

  async function executeEmail() {
    try {
      setWorking(true);
      setConfirmAction(null);
      const response = await onSendInvoiceEmail?.({ order, email: clientEmail });
      setResult({ ok: true, title: "Correo enviado", message: response?.message || "Factura enviada por correo." });
    } catch (error) {
      setResult({ ok: false, title: "No se pudo enviar", message: getFacturamaErrorMessage(error.facturamaData) || error.message || "Error enviando correo." });
    } finally {
      setWorking(false);
    }
  }

  function executeConfirmedAction() {
    if (confirmAction?.type === "stamp") return executeStamp();
    if (confirmAction?.type === "cancel") return executeCancel();
    if (confirmAction?.type === "deleteLocal") return executeDeleteLocal();
    if (confirmAction?.type === "email") return executeEmail();
    return null;
  }

  const headerStatus = hasActiveInvoice
    ? { label: `Timbrada ${activeInvoice?.serie || ""}${activeInvoice?.folio ? `-${activeInvoice.folio}` : ""}`, tone: "green" }
    : getInvoiceStatus(order) === "cancelada"
      ? { label: "CFDI cancelado", tone: "red" }
      : getInvoiceStatus(order) === "error"
        ? { label: "Error factura", tone: "amber" }
        : { label: "No timbrado", tone: "slate" };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Factura · ${order.folio}`}
      subtitle="Revisa, timbra, descarga, envía, cancela o sustituye CFDI del pedido."
      width="max-w-[1420px]"
      zIndex="z-[96]"
    >
      <ConfirmBox
        action={confirmAction}
        onCancel={() => setConfirmAction(null)}
        onConfirm={executeConfirmedAction}
        canceledInvoices={canceledInvoices}
        selectedReplacementUuid={selectedReplacementUuid}
        onSelectReplacement={setSelectedReplacementUuid}
      />

      <div className="grid min-h-0 grid-cols-1 bg-surface-soft xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-h-0 space-y-5 p-5 md:p-7">
          <div className="rounded-[28px] border border-border bg-background p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={headerStatus.tone}>{headerStatus.label}</StatusPill>
                  <StatusPill tone="blue">Sandbox</StatusPill>
                </div>
                <h3 className="text-xl font-extrabold text-text-primary">Factura del pedido</h3>
                <p className="max-w-3xl text-sm leading-6 text-text-secondary">
                  Revisa datos, conceptos, historial y acciones del CFDI.
                </p>
              </div>


            </div>
          </div>

          {result ? (
            <section className={`rounded-[24px] border p-4 ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
              <div className="flex items-start gap-3">
                {result.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5" /> : <AlertTriangle className="mt-0.5 h-5 w-5" />}
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{result.title || (result.ok ? "Correcto" : "Error")}</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6">{result.message}</p>
                  {result.errors?.length ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                      {result.errors.map((error) => <li key={error}>{error}</li>)}
                    </ul>
                  ) : null}
                  {result.facturamaData || result.payloadSent ? (
                    <details className="mt-3 rounded-2xl bg-white/60 p-3 text-xs">
                      <summary className="cursor-pointer font-bold">Ver detalle técnico</summary>
                      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap">{JSON.stringify({ facturamaData: result.facturamaData, payloadSent: result.payloadSent }, null, 2)}</pre>
                    </details>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-2 rounded-[24px] border border-border bg-background p-2 shadow-sm">
            {TAB_OPTIONS.map((tab) => (
              <TabButton key={tab.value} active={activeTab === tab.value} onClick={() => setActiveTab(tab.value)}>{tab.label}</TabButton>
            ))}
          </div>

          {activeTab === "datos" ? (
            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1fr_1fr]">
              <Section
                title="Cliente receptor"
                icon={ShieldCheck}
                action={
                  <EditFiscalActions
                    editing={editingSection === "receiver"}
                    busy={busy}
                    localSaving={localSaving}
                    onEdit={() => setEditingSection("receiver")}
                    onSave={saveDraft}
                    onCancel={() => { setDraft(buildInvoiceDraft(order)); setEditingSection(null); }}
                  />
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditableFiscalField editing={editingSection === "receiver"} label="Razón social" value={invoiceData.receiver.name} onChange={(value) => updateDraft("receiverName", value)} placeholder="Razón social" />
                  <EditableFiscalField editing={editingSection === "receiver"} label="RFC" value={invoiceData.receiver.rfc} onChange={(value) => updateDraft("receiverRfc", value.toUpperCase())} placeholder="RFC" />
                  <EditableFiscalField editing={editingSection === "receiver"} type="select" label="Régimen fiscal" value={invoiceData.receiver.fiscalRegime} options={REGIMEN_FISCAL_OPTIONS} onChange={(value) => updateDraft("receiverFiscalRegime", value)} />
                  <EditableFiscalField editing={editingSection === "receiver"} type="select" label="Uso CFDI" value={invoiceData.receiver.cfdiUse} options={USO_CFDI_OPTIONS} onChange={(value) => updateDraft("receiverCfdiUse", value)} />
                  <EditableFiscalField editing={editingSection === "receiver"} label="CP fiscal" value={invoiceData.receiver.taxZipCode} onChange={(value) => updateDraft("receiverTaxZipCode", value.replace(/[^0-9]/g, "").slice(0, 5))} placeholder="00000" />
                  <EditableFiscalField editing={editingSection === "receiver"} label="Correo" value={invoiceData.receiver.email} onChange={(value) => updateDraft("receiverEmail", value)} placeholder="correo@cliente.com" />
                </div>
              </Section>

              <Section
                title="Comprobante"
                icon={ReceiptText}
                action={
                  <EditFiscalActions
                    editing={editingSection === "header"}
                    busy={busy}
                    localSaving={localSaving}
                    onEdit={() => setEditingSection("header")}
                    onSave={saveDraft}
                    onCancel={() => { setDraft(buildInvoiceDraft(order)); setEditingSection(null); }}
                  />
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldView label="Tipo CFDI" value="I - Ingreso" />
                  <EditableFiscalField editing={editingSection === "header"} label="Serie" value={invoiceData.header.serie} onChange={(value) => updateDraft("serie", value.toUpperCase())} placeholder="F" />
                  <EditableFiscalField editing={editingSection === "header"} label="Folio" value={invoiceData.header.folio} onChange={(value) => updateDraft("folio", value)} placeholder="Folio" />
                  <EditableFiscalField editing={editingSection === "header"} type="select" label="Moneda" value={invoiceData.header.currency} options={CURRENCY_OPTIONS} onChange={(value) => updateDraft("currency", value)} />
                  <EditableFiscalField editing={editingSection === "header"} type="select" label="Forma de pago" value={invoiceData.header.paymentForm} options={PAYMENT_FORM_OPTIONS} onChange={(value) => updateDraft("paymentForm", value)} />
                  <EditableFiscalField editing={editingSection === "header"} type="select" label="Método de pago" value={invoiceData.header.paymentMethod} options={PAYMENT_METHOD_OPTIONS} onChange={(value) => updateDraft("paymentMethod", value)} />
                  <FieldView label="Exportación" value="01 - No aplica" />
                </div>
              </Section>
            </div>
          ) : null}

          {activeTab === "conceptos" ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Section title="Conceptos del pedido" icon={FileText}>
                <div className="overflow-hidden rounded-2xl border border-border">
                  <div className="max-h-[420px] overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 bg-surface-soft text-left text-[0.68rem] uppercase tracking-[0.16em] text-text-muted">
                        <tr>
                          <th className="px-4 py-3">Código</th>
                          <th className="px-4 py-3">Producto</th>
                          <th className="px-4 py-3 text-right">Cant.</th>
                          <th className="px-4 py-3 text-right">Precio</th>
                          <th className="px-4 py-3 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        {(order.details || []).map((item) => (
                          <tr key={item.id || item.codigo || item.nombre_producto}>
                            <td className="px-4 py-3 font-bold text-text-secondary">{item.codigo || "-"}</td>
                            <td className="px-4 py-3 font-bold text-text-primary">{item.nombre_producto}</td>
                            <td className="px-4 py-3 text-right font-bold">{Number(item.cantidad_pedida || 0)}</td>
                            <td className="px-4 py-3 text-right">{formatMoney(item.precio_unitario)}</td>
                            <td className="px-4 py-3 text-right font-bold">{formatMoney(item.importe || Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Section>

              <Section title="Totales" icon={ReceiptText}>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><strong>{formatMoney(totals.subtotal)}</strong></div>
                  <div className="flex justify-between"><span className="text-text-secondary">IVA {Number(order.iva_porcentaje || 0)}%</span><strong>{formatMoney(totals.iva)}</strong></div>
                  {Number(totals.isr || 0) > 0 ? <div className="flex justify-between"><span className="text-text-secondary">ISR retenido</span><strong>-{formatMoney(totals.isr)}</strong></div> : null}
                  <div className="mt-4 flex justify-between rounded-2xl bg-primary-700 px-4 py-3 text-white"><span>Total</span><strong>{formatMoney(totals.total)}</strong></div>
                </div>
              </Section>
            </div>
          ) : null}

          {activeTab === "historial" ? (
            <div className="grid grid-cols-1 gap-5">
              <Section title="Historial de facturas" icon={History}>
                {invoices.length ? (
                  <div className="grid gap-3">
                    {invoices.map((invoice, index) => {
                      const title = getInvoiceDisplayTitle(invoice, `Factura ${index + 1}`);
                      const canceled = isCanceledInvoice(invoice);
                      const canDeleteThisLocal = canceled && canDeleteLocal;

                      return (
                        <article key={invoice.id || invoice.uuid || invoice.facturama_id || `${title}-${index}`} className="rounded-2xl border border-border bg-surface-soft p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-extrabold text-text-primary">{title}</p>
                                <span className="rounded-full bg-background px-2 py-1 text-[0.68rem] font-bold text-text-secondary">Registro #{index + 1}</span>
                              </div>
                              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-3">
                                <p className="break-all text-text-secondary"><span className="font-bold text-text-muted">UUID:</span> {invoice.uuid || "-"}</p>
                                <p className="break-all text-text-secondary"><span className="font-bold text-text-muted">Facturama ID:</span> {invoice.facturama_id || "-"}</p>
                                <p className="text-text-secondary"><span className="font-bold text-text-muted">Emitida:</span> {formatDate(invoice.timbrada_at || invoice.created_at)}</p>
                                <p className="text-text-secondary"><span className="font-bold text-text-muted">Cancelada:</span> {canceled ? formatDate(invoice.cancelada_at) : "No cancelada"}</p>
                                <p className="text-text-secondary"><span className="font-bold text-text-muted">Motivo:</span> {invoice.cancel_reason || "-"}</p>
                                <p className="break-all text-text-secondary"><span className="font-bold text-text-muted">Relacionada con:</span> {invoice.replacement_uuid || "-"}</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <StatusPill tone={canceled ? "red" : "green"}>{canceled ? "Cancelada" : invoice.status || "Timbrada"}</StatusPill>
                              {canceled ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLocal(invoice)}
                                  disabled={busy || !canDeleteThisLocal}
                                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  title={hasActiveInvoice ? "Primero cancela el CFDI activo antes de limpiar el historial local." : "Borrar registro local cancelado"}
                                >
                                  <Trash2 className="h-4 w-4" /> Borrar del historial
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-border bg-surface-soft p-5 text-sm text-text-secondary">Este pedido todavía no tiene historial de facturas.</p>
                )}
              </Section>
            </div>
          ) : null}

          {activeTab === "cancelacion" ? (
            <div className="grid grid-cols-1 gap-5">
              <Section title="Cancelar CFDI" icon={XCircle}>
                <p className="mb-3 text-sm leading-6 text-text-secondary">
                  Cancela el CFDI activo en Facturama/SAT sandbox. La cancelación no elimina el historial local. Si después quieres limpiar un registro, hazlo desde Historial y solo aparecerá cuando la factura ya esté cancelada.
                </p>
                <select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none">
                  {CANCEL_REASON_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {cancelReason === "01" ? (
                  <input value={replacementUuid} onChange={(event) => setReplacementUuid(event.target.value)} placeholder="UUID sustituto" className="mt-3 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none" />
                ) : null}
                <button type="button" onClick={handleCancel} disabled={busy || !hasActiveInvoice} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                  <XCircle className="h-4 w-4" /> Cancelar en SAT
                </button>
              </Section>
            </div>
          ) : null}
        </div>

        <aside className="border-t border-border bg-background p-5 xl:border-l xl:border-t-0">
          <div className="sticky top-4 space-y-4">
            <section className="rounded-[26px] border border-border bg-surface-soft p-5">
              <h3 className="font-extrabold text-text-primary">Estado</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-text-secondary">Factura</span><strong>{headerStatus.label}</strong></div>
                <div className="flex justify-between gap-4"><span className="text-text-secondary">Total</span><strong>{formatMoney(totals.total)}</strong></div>
                <div className="flex justify-between gap-4"><span className="text-text-secondary">Historial</span><strong>{invoices.length}</strong></div>
              </div>
            </section>

            <section className={`rounded-[26px] border p-5 ${validation.ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                {validation.ready ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" /> : <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />}
                <div>
                  <h3 className="font-extrabold text-text-primary">Validación</h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {validation.ready ? "Los datos mínimos están completos." : "Hay datos pendientes antes de facturar."}
                  </p>
                </div>
              </div>
              {!validation.ready ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-text-secondary">
                  {validation.errors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              ) : null}
            </section>

            <section className="rounded-[26px] border border-border bg-surface-soft p-5">
              <h3 className="font-extrabold text-text-primary">Acciones</h3>
              <div className="mt-4 grid gap-3">
                <ActionButton icon={Send} title={busy ? "Procesando..." : "Facturar sandbox"} description="Valida y timbra si todo está correcto." onClick={handleStamp} disabled={busy || hasActiveInvoice || Boolean(editingSection)} tone="primary" />
                <ActionButton icon={Download} title="Descargar PDF" description="Descarga el PDF timbrado." onClick={() => handleDownload("pdf")} disabled={busy || !hasActiveInvoice} />
                <ActionButton icon={Download} title="Descargar XML" description="Descarga el XML timbrado." onClick={() => handleDownload("xml")} disabled={busy || !hasActiveInvoice} />
                <ActionButton icon={Mail} title="Enviar al cliente" description="Envía la factura al correo registrado del cliente." onClick={handleEmail} disabled={busy || !hasActiveInvoice || !onSendInvoiceEmail || !clientEmail} />
                <ActionButton icon={XCircle} title="Cancelar CFDI" description="Cancela la factura activa. El borrado local queda en Historial." onClick={() => setActiveTab("cancelacion")} disabled={busy} tone="danger" />
              </div>
            </section>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
