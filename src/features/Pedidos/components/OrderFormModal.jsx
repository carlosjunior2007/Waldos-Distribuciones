import { Plus, Save, Search, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from "../order.constants";
import { calculateLineProfit, calculateOrderProfit, formatMoney } from "../order.helpers";

const emptyForm = {
  cliente_id: "",
  metodo_pago: "",
  estado_pago: "pendiente",
  iva_porcentaje: 8,
  isr_porcentaje: 0,
  fecha_inicio: "",
  fecha_fin: "",
  notas: "",
};

function onlyDigits(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function toIntegerValue(value, fallback = 0) {
  const digits = onlyDigits(value);
  if (digits === "") return "";
  return String(Math.max(Number(digits), fallback));
}

export default function OrderFormModal({
  open,
  order,
  clients = [],
  products = [],
  saving = false,
  onClose,
  onSave,
}) {
  const isEdit = Boolean(order?.id);
  const [form, setForm] = useState(emptyForm);
  const [details, setDetails] = useState([]);
  const selectedClient = clients.find((client) => client.id === form.cliente_id);

  useEffect(() => {
    if (!open) return;

    if (order) {
      setForm({
        cliente_id: order.cliente_id || "",
        metodo_pago: order.metodo_pago || "",
        estado_pago: order.estado_pago || "pendiente",
        iva_porcentaje: toIntegerValue(order.iva_porcentaje ?? 8),
        isr_porcentaje:
          order.isr_porcentaje !== null && order.isr_porcentaje !== undefined
            ? String(order.isr_porcentaje)
            : "0",
        fecha_inicio: toDateInput(order.fecha_inicio || order.entrega_inicio),
        fecha_fin: toDateInput(order.fecha_fin || order.entrega_fin),
        notas: order.notas || "",
      });

      setDetails(
        (order.details || []).map((item) => ({
          id: item.id,
          producto_id: item.producto_id,
          codigo: item.codigo || "",
          nombre_producto: item.nombre_producto || "",
          cantidad_pedida: Number(item.cantidad_pedida || 0),
          cantidad_entregada: Number(item.cantidad_entregada || 0),
          precio_unitario: Number(item.precio_unitario || 0),
          costo_unitario: Number(item.costo_unitario || 0),
        })),
      );
    } else {
      setForm(emptyForm);
      setDetails([]);
    }
  }, [open, order]);

  const totals = useMemo(() => {
    const subtotal = details.reduce((acc, item) => {
      return acc + Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0);
    }, 0);
    const iva = Number(form.iva_porcentaje || 0);
    const isr = Number(form.isr_porcentaje || 0);
    const ivaMonto = subtotal * (iva / 100);
    const isrMonto = subtotal * (isr / 100);
    const profit = calculateOrderProfit(details);
    return {
      subtotal,
      iva,
      isr,
      ivaMonto,
      isrMonto,
      total: Math.max(subtotal + ivaMonto - isrMonto, 0),
      ...profit,
    };
  }, [details, form.iva_porcentaje, form.isr_porcentaje]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addProduct(productId) {
    if (!productId) return;
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const exists = details.some((item) => item.producto_id === productId);
    if (exists) {
      setDetails((current) =>
        current.map((item) =>
          item.producto_id === productId
            ? { ...item, cantidad_pedida: Number(item.cantidad_pedida || 0) + 1 }
            : item,
        ),
      );
      return;
    }

    setDetails((current) => [
      ...current,
      {
        producto_id: product.id,
        codigo: product.codigo || "",
        nombre_producto: product.nombre || product.descripcion || "Producto",
        cantidad_pedida: 1,
        cantidad_entregada: 0,
        precio_unitario: Number(product.precio || 0),
        costo_unitario: Number(product.precio_compra || 0),
      },
    ]);
  }

  function updateDetail(index, field, value) {
    setDetails((current) => {
      const copy = [...current];
      const currentItem = copy[index];
      const nextValue = value === "" ? "" : Number(toIntegerValue(value));
      copy[index] = { ...currentItem, [field]: nextValue };
      return copy;
    });
  }

  function removeDetail(index) {
    const item = details[index];
    if (Number(item?.cantidad_entregada || 0) > 0) {
      alert("No puedes quitar un producto que ya tiene entregas registradas.");
      return;
    }
    setDetails((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.cliente_id) {
      alert("Selecciona un cliente.");
      return;
    }

    const validDetails = details.filter((item) => item.producto_id && Number(item.cantidad_pedida || 0) > 0);

    if (!validDetails.length) {
      alert("Agrega al menos un producto.");
      return;
    }

    onSave?.({
      id: order?.id,
      order: {
        cliente_id: form.cliente_id,
        cliente_nombre: selectedClient?.nombre || order?.cliente_nombre || null,
        cliente_telefono: selectedClient?.numero || selectedClient?.telefono || order?.cliente_telefono || null,
        cliente_email: selectedClient?.correo || selectedClient?.email || order?.cliente_email || null,
        metodo_pago: form.metodo_pago || null,
        estado_pago: form.estado_pago,
        iva_porcentaje: Number(toIntegerValue(form.iva_porcentaje || 0)),
        isr_porcentaje: Number(form.isr_porcentaje || 0),
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        notas: form.notas,
      },
      details: validDetails,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar pedido ${order.folio}` : "Nuevo pedido"}
      subtitle="Selecciona cliente y productos. Las entregas se programan después."
      width="max-w-6xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5 md:p-6">
        <section className="rounded-[24px] border border-border bg-background p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">Cliente</h4>
              <p className="mt-1 text-sm text-text-secondary">Sus datos se toman del perfil del cliente.</p>
            </div>
          </div>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Cliente">
              <select className={inputClass} value={form.cliente_id} onChange={(event) => updateForm("cliente_id", event.target.value)}>
                <option value="">Seleccionar cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.nombre}</option>
                ))}
              </select>
            </Field>

            <Field label="Teléfono">
              <input className={`${inputClass} bg-surface-soft`} value={selectedClient?.numero || selectedClient?.telefono || order?.cliente_telefono || ""} readOnly />
            </Field>

            <Field label="Correo">
              <input className={`${inputClass} bg-surface-soft`} value={selectedClient?.correo || selectedClient?.email || order?.cliente_email || ""} readOnly />
            </Field>
          </section>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Método de pago">
            <select className={inputClass} value={form.metodo_pago} onChange={(event) => updateForm("metodo_pago", event.target.value)}>
              {PAYMENT_METHOD_OPTIONS.map((option) => <option key={option.value || "empty"} value={option.value}>{option.label}</option>)}
            </select>
          </Field>

          <Field label="Estado de pago">
            <select className={inputClass} value={form.estado_pago} onChange={(event) => updateForm("estado_pago", event.target.value)}>
              {PAYMENT_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>

          <Field label="IVA %">
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              pattern="[0-9]*"
              className={inputClass}
              value={form.iva_porcentaje}
              onChange={(event) => updateForm("iva_porcentaje", toIntegerValue(event.target.value))}
              onBlur={() => updateForm("iva_porcentaje", toIntegerValue(form.iva_porcentaje || 0))}
            />
          </Field>

          <Field label="ISR retenido %">
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className={inputClass}
              value={form.isr_porcentaje}
              onChange={(event) => updateForm("isr_porcentaje", event.target.value)}
              onBlur={() => updateForm("isr_porcentaje", String(Number(form.isr_porcentaje || 0)))}
            />
          </Field>

          <Field label="Fecha inicio">
            <input type="date" className={inputClass} value={form.fecha_inicio} onChange={(event) => updateForm("fecha_inicio", event.target.value)} />
          </Field>

          <Field label="Fecha fin">
            <input type="date" className={inputClass} value={form.fecha_fin} onChange={(event) => updateForm("fecha_fin", event.target.value)} />
          </Field>

          <div className="rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm text-text-secondary">
            <p className="font-bold text-text-primary">Tracking</p>
            <p className="mt-1">{order?.tracking_token || "Se crea al guardar"}</p>
          </div>

          <Field label="Notas" className="md:col-span-3">
            <textarea className={`${inputClass} min-h-28 py-3`} value={form.notas} onChange={(event) => updateForm("notas", event.target.value)} placeholder="Notas del pedido..." />
          </Field>
        </section>

        <section className="rounded-[24px] border border-border bg-background p-4">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="text-sm font-bold text-text-primary">Productos</h4>
              <p className="mt-1 text-sm text-text-secondary">Busca y da clic para agregar.</p>
            </div>
            <ProductQuickAdd products={products} selectedDetails={details} onAdd={addProduct} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full text-sm">
                <thead className="bg-surface-soft">
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-right">Costo</th>
                    <th className="px-4 py-3 text-right">Utilidad estimada</th>
                    <th className="px-4 py-3 text-right">Entregado</th>
                    <th className="px-4 py-3 text-right">Importe</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {details.map((item, index) => {
                    const lineProfit = calculateLineProfit(item);

                    return (
                      <tr key={item.id || item.producto_id}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-text-primary">{item.nombre_producto}</div>
                          <div className="mt-1 text-xs text-text-muted">{item.codigo || "Sin código"}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input type="number" min={item.cantidad_entregada || 0} step="1" inputMode="numeric" pattern="[0-9]*" className={`${inputClass} ml-auto w-28 text-right`} value={item.cantidad_pedida} onChange={(event) => updateDetail(index, "cantidad_pedida", toIntegerValue(event.target.value))} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input type="number" min="0" step="0.01" className={`${inputClass} ml-auto w-32 text-right`} value={item.precio_unitario} onChange={(event) => updateDetail(index, "precio_unitario", event.target.value)} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input type="number" min="0" step="0.01" className={`${inputClass} ml-auto w-32 text-right`} value={item.costo_unitario} onChange={(event) => updateDetail(index, "costo_unitario", event.target.value)} />
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${lineProfit.profit >= 0 ? "text-success-700" : "text-error-700"}`}>
                          {formatMoney(lineProfit.profit)}
                          <span className="mt-1 block text-xs font-medium text-text-muted">{lineProfit.margin.toFixed(1)}%</span>
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary">{Number(item.cantidad_entregada || 0)}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatMoney(Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0))}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => removeDetail(index)} className="inline-flex items-center gap-1 text-sm font-semibold text-error-700">
                            <Trash2 className="h-4 w-4" /> Quitar
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {!details.length ? (
                    <tr><td colSpan={8} className="py-8 text-center text-text-muted">Agrega productos desde la lista.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface-soft p-4 text-sm md:grid-cols-6">
            <TotalPill label="Subtotal" value={formatMoney(totals.subtotal)} />
            <TotalPill label="Costo" value={formatMoney(totals.cost)} />
            <TotalPill label="Utilidad estimada" value={`${formatMoney(totals.profit)} · ${totals.margin.toFixed(1)}%`} tone={totals.profit >= 0 ? "success" : "error"} />
            <TotalPill label="IVA" value={`${Number(totals.iva || 0)}% · ${formatMoney(totals.ivaMonto)}`} />
            <TotalPill label="ISR retenido" value={`${Number(totals.isr || 0)}% · -${formatMoney(totals.isrMonto)}`} tone="error" />
            <TotalPill label="Total" value={formatMoney(totals.total)} strong />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-border px-4 text-sm font-semibold">Cancelar</button>
          <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear pedido"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TotalPill({ label, value, tone = "default", strong = false }) {
  const toneClass = tone === "success" ? "text-success-700" : tone === "error" ? "text-error-700" : "text-text-primary";

  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className={`mt-1 ${strong ? "text-lg font-black" : "text-sm font-bold"} ${toneClass}`}>{value}</p>
    </div>
  );
}

function ProductQuickAdd({ products, selectedDetails, onAdd }) {
  const [search, setSearch] = useState("");
  const selectedIds = new Set(selectedDetails.map((item) => item.producto_id));
  const term = search.trim().toLowerCase();

  const filteredProducts = products
    .filter((product) => {
      if (!term) return true;
      return [product.nombre, product.descripcion, product.codigo]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    })
    .slice(0, 40);

  return (
    <div className="w-full lg:max-w-[460px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          className={`${inputClass} pl-10`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar producto por nombre o código..."
        />
      </div>

      <div className="mt-2 max-h-60 overflow-y-auto rounded-2xl border border-border bg-surface shadow-sm">
        {filteredProducts.map((product) => {
          const added = selectedIds.has(product.id);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onAdd(product.id)}
              className={`flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-surface-soft ${added ? "bg-primary-50/70" : ""}`}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-text-primary">{product.nombre || product.descripcion}</span>
                <span className="mt-0.5 block truncate text-xs text-text-muted">{product.codigo || "Sin código"} · {formatMoney(product.precio || 0)}</span>
              </span>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${added ? "bg-primary-100 text-primary-700" : "bg-surface-soft text-text-secondary"}`}>
                <Plus className="h-3.5 w-3.5" />
                {added ? "+1" : "Agregar"}
              </span>
            </button>
          );
        })}

        {!filteredProducts.length ? (
          <div className="px-4 py-5 text-center text-sm text-text-muted">No encontré productos.</div>
        ) : null}
      </div>
    </div>
  );
}

const inputClass = "h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none focus:border-primary-400 disabled:cursor-not-allowed disabled:opacity-70";

function Field({ label, children, className = "" }) {
  return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold text-text-primary">{label}</span>{children}</label>;
}

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}
