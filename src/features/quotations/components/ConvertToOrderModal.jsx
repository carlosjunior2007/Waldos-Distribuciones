import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, CreditCard, FileText, PackageCheck, X } from "lucide-react";

import { formatMoney } from "../../../utils/formatters";

const PAYMENT_METHODS = [
  { value: "", label: "Sin definir" },
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "credito", label: "Crédito" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "cheque", label: "Cheque" },
  { value: "deposito", label: "Depósito" },
  { value: "otro", label: "Otro" },
];

const PAYMENT_STATUS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Parcial" },
  { value: "pagado", label: "Pagado" },
];

function todayInput() {
  const date = new Date();
  return date.toISOString().slice(0, 10);
}

function toDateOrNull(value) {
  return value ? value : null;
}

function sumProducts(details = []) {
  return details.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
}

export default function ConvertToOrderModal({
  open,
  quotation,
  loading = false,
  onClose,
  onConfirm,
}) {
  const [form, setForm] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    metodo_pago: "",
    estado_pago: "pendiente",
    notas: "",
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      fecha_inicio: "",
      fecha_fin: "",
      metodo_pago: "",
      estado_pago: "pendiente",
      notas: quotation?.notas || "",
    });
  }, [open, quotation]);

  const productCount = quotation?.detalles?.length || 0;
  const unitCount = useMemo(() => sumProducts(quotation?.detalles || []), [quotation]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onConfirm?.({
      fecha_inicio: toDateOrNull(form.fecha_inicio),
      fecha_fin: toDateOrNull(form.fecha_fin),
      metodo_pago: form.metodo_pago || null,
      estado_pago: form.estado_pago || "pendiente",
      notas: form.notas || null,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5 min-h-full">
      <form
        onSubmit={handleSubmit}
        className="flex h-[min(96vh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-border bg-surface shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
      >
        <header className="shrink-0 flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-600">
              Convertir cotización
            </p>
            <h2 className="mt-1 text-xl font-bold text-text-primary">
              Crear pedido desde {quotation?.folio || "cotización"}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Revisa los datos del pedido. Las entregas se programan después.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-text-secondary transition hover:bg-surface-soft hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-soft/60 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="space-y-4">
              <div className="rounded-[22px] border border-border bg-surface p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-info-50 text-info-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Datos del pedido</h3>
                    <p className="text-xs text-text-muted">Todo es editable después.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Fecha inicio">
                    <input
                      type="date"
                      value={form.fecha_inicio}
                      onChange={(event) => updateField("fecha_inicio", event.target.value)}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Fecha fin">
                    <input
                      type="date"
                      min={form.fecha_inicio || undefined}
                      value={form.fecha_fin}
                      onChange={(event) => updateField("fecha_fin", event.target.value)}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Método de pago">
                    <select
                      value={form.metodo_pago}
                      onChange={(event) => updateField("metodo_pago", event.target.value)}
                      className={inputClass}
                    >
                      {PAYMENT_METHODS.map((option) => (
                        <option key={option.value || "none"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Estado de pago">
                    <select
                      value={form.estado_pago}
                      onChange={(event) => updateField("estado_pago", event.target.value)}
                      className={inputClass}
                    >
                      {PAYMENT_STATUS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Notas" className="md:col-span-2">
                    <textarea
                      value={form.notas}
                      onChange={(event) => updateField("notas", event.target.value)}
                      placeholder="Notas internas del pedido..."
                      className={`${inputClass} min-h-24 py-3`}
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-[22px] border border-border bg-surface p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-success-50 text-success-700">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Productos que se copiarán</h3>
                    <p className="text-xs text-text-muted">Se crea el pedido con las mismas cantidades.</p>
                  </div>
                </div>

                <div className="max-h-[320px] overflow-auto rounded-2xl border border-border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-surface-soft">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Producto</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Cantidad</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Precio</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(quotation?.detalles || []).map((item) => (
                        <tr key={item.id || `${item.producto_id}-${item.nombre_producto}`} className="border-t border-border">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-text-primary">{item.nombre_producto}</p>
                            <p className="text-xs text-text-muted">{item.codigo || "Sin código"}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-text-primary">{Number(item.cantidad || 0)}</td>
                          <td className="px-4 py-3 text-right text-text-secondary">{formatMoney(item.precio_unitario || 0)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-text-primary">{formatMoney(item.importe || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
              <div className="rounded-[22px] border border-border bg-surface p-5">
                <h3 className="text-sm font-bold text-text-primary">Resumen</h3>

                <div className="mt-4 space-y-3 text-sm">
                  <SummaryRow label="Cliente" value={quotation?.cliente_nombre || "-"} />
                  <SummaryRow label="Cotización" value={quotation?.folio || "-"} />
                  <SummaryRow label="Productos" value={`${productCount} partidas`} />
                  <SummaryRow label="Unidades" value={unitCount} />
                  <SummaryRow label="Subtotal" value={formatMoney(quotation?.subtotal || 0)} />
                  <SummaryRow label={`IVA ${Number(quotation?.iva_porcentaje || 0)}%`} value={formatMoney(Math.max(Number(quotation?.subtotal || 0) - Number(quotation?.descuento || 0), 0) * (Number(quotation?.iva_porcentaje || 0) / 100))} />
                </div>

                <div className="mt-4 rounded-2xl bg-accent-500 px-4 py-3 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold">Total</span>
                    <span className="text-lg font-black">{formatMoney(quotation?.total || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-info-100 bg-info-50 p-5 text-sm text-info-800">
                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>
                    Si no capturas fechas, el pedido se creará como borrador para completarlo después.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <footer className="shrink-0 flex flex-col-reverse gap-3 border-t border-border bg-surface px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-surface px-5 text-sm font-bold text-text-primary transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-5 text-sm font-bold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <CheckCircle2 className="h-4 w-4" />
            {loading ? "Creando pedido..." : "Crear pedido"}
          </button>
        </footer>
      </form>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm font-medium text-text-primary outline-none transition focus:border-accent-300 focus:ring-4 focus:ring-accent-100";

function Field({ label, children, className = "" }) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-2 last:border-b-0 last:pb-0">
      <span className="text-text-muted">{label}</span>
      <span className="text-right font-bold text-text-primary">{value}</span>
    </div>
  );
}
