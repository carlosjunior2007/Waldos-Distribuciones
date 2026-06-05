import { CalendarDays, CreditCard, PackagePlus, Plus, Save, Search, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "../../../components/ui/Modal";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from "../order.constants";
import { calculateLineProfit, calculateOrderProfit, capitalizeFirstLetter, formatMoney, normalizeCapitalizedText } from "../order.helpers";

const emptyForm = {
  cliente_id: "",
  metodo_pago: "",
  estado_pago: "pendiente",
  pago_referencia: "",
  pago_monto: "",
  pago_fecha: "",
  pago_notas: "",
  iva_porcentaje: 8,
  isr_porcentaje: 0,
  fecha_inicio: "",
  fecha_fin: "",
  notas: "",
};

const DEFAULT_DELIVERY_DAYS = 15;

function toLocalDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateInputDaysFromToday(daysToAdd = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysToAdd);

  return toLocalDateInput(date);
}

function getDefaultOrderForm() {
  return {
    ...emptyForm,
    fecha_inicio: getDateInputDaysFromToday(0),
    fecha_fin: getDateInputDaysFromToday(DEFAULT_DELIVERY_DAYS),
  };
}

function onlyDigits(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function toIntegerValue(value, fallback = 0) {
  const digits = onlyDigits(value);
  if (digits === "") return "";
  return String(Math.max(Number(digits), fallback));
}

function toDecimalValue(value, fallback = 0) {
  const text = String(value ?? "").replace(",", ".");
  const cleaned = text.replace(/[^0-9.]/g, "");
  const [integerPart, ...decimalParts] = cleaned.split(".");
  const hasDecimalPoint = cleaned.includes(".");
  const decimals = decimalParts.join("").slice(0, 2);
  const integer = integerPart || (hasDecimalPoint ? "0" : "");

  if (!integer && !hasDecimalPoint) return "";

  const result = hasDecimalPoint ? `${integer}.${decimals}` : integer;
  const number = Number(result);

  if (!Number.isFinite(number)) return String(fallback);
  return result;
}

function normalizeDecimalOnBlur(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return Number(fallback).toFixed(2);
  return Math.max(number, fallback).toFixed(2);
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
  const [form, setForm] = useState(() => getDefaultOrderForm());
  const [details, setDetails] = useState([]);
  const [formMessage, setFormMessage] = useState({ open: false, title: "", message: "" });
  const selectedClient = clients.find((client) => client.id === form.cliente_id);

  useEffect(() => {
    if (!open) return;

    if (order) {
      setForm({
        cliente_id: order.cliente_id || "",
        metodo_pago: order.metodo_pago || "",
        estado_pago: order.estado_pago || "pendiente",
        pago_referencia: order.pago_referencia || "",
        pago_monto: order.pago_monto !== null && order.pago_monto !== undefined ? String(order.pago_monto) : "",
        pago_fecha: toDateInput(order.pago_fecha),
        pago_notas: order.pago_notas || "",
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
      setForm(getDefaultOrderForm());
      setDetails([]);
    }
  }, [open, order]);

  const totals = useMemo(() => {
    const subtotal = details.reduce((acc, item) => acc + Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0), 0);
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

  function showFormMessage(title, message) {
    setFormMessage({ open: true, title, message });
  }

  function closeFormMessage() {
    setFormMessage({ open: false, title: "", message: "" });
  }

  function updateForm(field, value) {
    const textFields = new Set(["notas", "pago_referencia", "pago_notas"]);
    const nextValue = textFields.has(field) ? capitalizeFirstLetter(value) : value;

    setForm((current) => {
      const next = { ...current, [field]: nextValue };

      if (field === "estado_pago" && value === "pagado") {
        if (!next.pago_monto) next.pago_monto = normalizeDecimalOnBlur(totals.total, 0);
        if (!next.pago_fecha) next.pago_fecha = getDateInputDaysFromToday(0);
      }

      if (field === "metodo_pago" && value !== "transferencia" && !next.pago_referencia) {
        next.pago_referencia = "";
      }

      return next;
    });
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
      const decimalFields = new Set(["precio_unitario", "costo_unitario"]);
      const nextValue = decimalFields.has(field)
        ? toDecimalValue(value)
        : value === ""
          ? ""
          : Number(toIntegerValue(value));

      copy[index] = { ...currentItem, [field]: nextValue };
      return copy;
    });
  }

  function normalizeDetailDecimal(index, field) {
    setDetails((current) => {
      const copy = [...current];
      const currentItem = copy[index];
      copy[index] = { ...currentItem, [field]: normalizeDecimalOnBlur(currentItem?.[field] || 0) };
      return copy;
    });
  }

  function removeDetail(index) {
    const item = details[index];
    if (Number(item?.cantidad_entregada || 0) > 0) {
      showFormMessage("No se puede quitar el producto", "Este producto ya tiene entregas registradas.");
      return;
    }
    setDetails((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.cliente_id) {
      showFormMessage("Selecciona un cliente", "Necesitas asociar el pedido a un cliente antes de guardarlo.");
      return;
    }

    const validDetails = details.filter((item) => item.producto_id && Number(item.cantidad_pedida || 0) > 0);

    if (!validDetails.length) {
      showFormMessage("Agrega productos", "Agrega al menos un producto al pedido.");
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
        pago_referencia: normalizeCapitalizedText(form.pago_referencia),
        pago_monto: Number(form.pago_monto || 0),
        pago_fecha: form.pago_fecha || null,
        pago_notas: normalizeCapitalizedText(form.pago_notas),
        iva_porcentaje: Number(toIntegerValue(form.iva_porcentaje || 0)),
        isr_porcentaje: Number(form.isr_porcentaje || 0),
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        notas: normalizeCapitalizedText(form.notas),
      },
      details: validDetails,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar pedido ${order.folio}` : "Nuevo pedido"}
      subtitle="Datos generales, productos y totales en una vista más limpia. Las entregas se programan después."
      width="max-w-7xl"
    >
      <FormMessageModal dialog={formMessage} onClose={closeFormMessage} />

      <form onSubmit={handleSubmit} className="bg-slate-50">
        <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px] md:p-6">
          <main className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                icon={UserRound}
                eyebrow="Cliente"
                title="Datos del cliente"
                description="Selecciona el cliente y revisa sus datos de contacto sin llenar campos de más."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Cliente" className="md:col-span-1">
                  <select className={inputClass} value={form.cliente_id} onChange={(event) => updateForm("cliente_id", event.target.value)}>
                    <option value="">Seleccionar cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.nombre}</option>
                    ))}
                  </select>
                </Field>

                <ReadOnlyField label="Teléfono" value={selectedClient?.numero || selectedClient?.telefono || order?.cliente_telefono || "Sin teléfono"} />
                <ReadOnlyField label="Correo" value={selectedClient?.correo || selectedClient?.email || order?.cliente_email || "Sin correo"} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                icon={CreditCard}
                eyebrow="Condiciones"
                title="Pago, impuestos y fechas"
                description="Agrupado para que el formulario no parezca una fila interminable de inputs aburridos."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Método de pago">
                  <select className={inputClass} value={form.metodo_pago} onChange={(event) => updateForm("metodo_pago", event.target.value)}>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Estado de pago">
                  <select className={inputClass} value={form.estado_pago} onChange={(event) => updateForm("estado_pago", event.target.value)}>
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Referencia de pago" className="md:col-span-2">
                  <input
                    className={inputClass}
                    value={form.pago_referencia}
                    onChange={(event) => updateForm("pago_referencia", event.target.value)}
                    placeholder="Ej. transferencia, SPEI, autorización, cheque..."
                  />
                </Field>

                <Field label="Monto pagado">
                  <input
                    className={inputClass}
                    value={form.pago_monto}
                    onChange={(event) => updateForm("pago_monto", toDecimalValue(event.target.value))}
                    onBlur={(event) => updateForm("pago_monto", normalizeDecimalOnBlur(event.target.value, 0))}
                    placeholder="0.00"
                  />
                </Field>

                <Field label="Fecha de pago">
                  <input type="date" className={inputClass} value={form.pago_fecha} onChange={(event) => updateForm("pago_fecha", event.target.value)} />
                </Field>

                <Field label="Nota de pago" className="md:col-span-2">
                  <input
                    className={inputClass}
                    value={form.pago_notas}
                    onChange={(event) => updateForm("pago_notas", event.target.value)}
                    placeholder="Banco, últimos dígitos, aclaraciones internas..."
                  />
                </Field>

                <Field label="IVA %">
                  <input className={inputClass} value={form.iva_porcentaje} onChange={(event) => updateForm("iva_porcentaje", toIntegerValue(event.target.value))} />
                </Field>

                <Field label="ISR retenido %">
                  <input className={inputClass} value={form.isr_porcentaje} onChange={(event) => updateForm("isr_porcentaje", toDecimalValue(event.target.value))} />
                </Field>

                <Field label="Fecha inicio" className="md:col-span-1 xl:col-span-2">
                  <input type="date" className={inputClass} value={form.fecha_inicio} onChange={(event) => updateForm("fecha_inicio", event.target.value)} />
                </Field>

                <Field label="Fecha fin" className="md:col-span-1 xl:col-span-2">
                  <input type="date" className={inputClass} value={form.fecha_fin} onChange={(event) => updateForm("fecha_fin", event.target.value)} />
                </Field>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Tracking</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{order?.tracking_token || "Se crea al guardar"}</p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                icon={PackagePlus}
                eyebrow="Productos"
                title="Productos del pedido"
                description="Agrega productos y edita cantidades sin usar una tabla que ocupa medio continente."
                action={<ProductQuickAdd products={products} selectedDetails={details} onAdd={addProduct} />}
              />

              <div className="grid gap-3">
                {details.map((item, index) => (
                  <OrderProductCard
                    key={item.id || item.producto_id}
                    item={item}
                    index={index}
                    onUpdate={updateDetail}
                    onBlurDecimal={normalizeDetailDecimal}
                    onRemove={removeDetail}
                  />
                ))}

                {!details.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <PackagePlus className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-3 font-black text-slate-950">Todavía no hay productos</p>
                    <p className="mt-1 text-sm text-slate-500">Busca un producto arriba y agrégalo al pedido.</p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader icon={CalendarDays} eyebrow="Notas" title="Notas internas" description="Información adicional para el equipo." />
              <textarea className={`${inputClass} min-h-28 py-3`} value={form.notas} onChange={(event) => updateForm("notas", event.target.value)} placeholder="Notas del pedido..." />
            </section>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-0 xl:self-start">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-600">Resumen</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{isEdit ? order?.folio : "Nuevo pedido"}</h3>
              <p className="mt-1 text-sm text-slate-500">{selectedClient?.nombre || order?.cliente_nombre || "Sin cliente seleccionado"}</p>

              <div className="mt-5 space-y-3">
                <SummaryRow label="Productos" value={details.length} />
                <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal)} />
                <SummaryRow label="Costo" value={formatMoney(totals.cost)} />
                <SummaryRow label="IVA" value={`${Number(totals.iva || 0)}% · ${formatMoney(totals.ivaMonto)}`} />
                <SummaryRow label="ISR" value={`${Number(totals.isr || 0)}% · -${formatMoney(totals.isrMonto)}`} muted />
                <div className="border-t border-slate-200 pt-3">
                  <SummaryRow label="Total" value={formatMoney(totals.total)} strong />
                  <SummaryRow label="Pagado" value={formatMoney(form.pago_monto || 0)} />
                  <SummaryRow label="Referencia" value={form.pago_referencia || "Sin referencia"} muted />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Utilidad estimada</p>
              <p className={`mt-2 text-3xl font-black ${totals.profit >= 0 ? "text-success-700" : "text-error-700"}`}>{formatMoney(totals.profit)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{totals.margin.toFixed(1)}% de margen</p>
              <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">La utilidad es estimada. Se considera real hasta que el pedido esté entregado y pagado.</p>
            </section>
          </aside>
        </div>

        <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent-500 px-5 text-sm font-black text-white shadow-sm transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear pedido"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 gap-3">
        {Icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-600">{eyebrow}</p> : null}
          <h4 className="mt-1 text-base font-black text-slate-950">{title}</h4>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="w-full shrink-0 lg:w-auto">{action}</div> : null}
    </div>
  );
}

function OrderProductCard({ item, index, onUpdate, onBlurDecimal, onRemove }) {
  const lineProfit = calculateLineProfit(item);
  const lockedQuantity = Number(item.cantidad_entregada || 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h5 className="truncate text-sm font-black text-slate-950">{item.nombre_producto}</h5>
          <p className="mt-1 text-xs font-semibold text-slate-500">{item.codigo || "Sin código"}</p>
        </div>
        <button type="button" onClick={() => onRemove(index)} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-rose-100 bg-white px-3 text-xs font-black text-rose-700 transition hover:bg-rose-50">
          <Trash2 className="h-4 w-4" /> Quitar
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Field label="Cantidad">
          <input type="number" min={lockedQuantity} step="1" inputMode="numeric" pattern="[0-9]*" className={`${inputClass} text-right font-bold`} value={item.cantidad_pedida} onChange={(event) => onUpdate(index, "cantidad_pedida", toIntegerValue(event.target.value))} />
        </Field>
        <Field label="Precio">
          <input type="text" inputMode="decimal" className={`${inputClass} text-right font-bold`} value={item.precio_unitario} onChange={(event) => onUpdate(index, "precio_unitario", event.target.value)} onBlur={() => onBlurDecimal(index, "precio_unitario")} />
        </Field>
        <Field label="Costo">
          <input type="text" inputMode="decimal" className={`${inputClass} text-right font-bold`} value={item.costo_unitario} onChange={(event) => onUpdate(index, "costo_unitario", event.target.value)} onBlur={() => onBlurDecimal(index, "costo_unitario")} />
        </Field>
        <ReadOnlyField label="Entregado" value={lockedQuantity} />
        <ReadOnlyField label="Importe" value={formatMoney(Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0))} strong />
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold text-slate-500">Utilidad estimada</span>
        <span className={`font-black ${lineProfit.profit >= 0 ? "text-success-700" : "text-error-700"}`}>
          {formatMoney(lineProfit.profit)} · {lineProfit.margin.toFixed(1)}%
        </span>
      </div>
    </article>
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
    .slice(0, 30);

  return (
    <div className="relative w-full lg:w-[430px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className={`${inputClass} pl-10`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar producto por nombre o código..." />
      </div>

      {search.trim() ? (
        <div className="absolute right-0 z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          {filteredProducts.map((product) => {
            const added = selectedIds.has(product.id);
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onAdd(product.id)}
                className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-slate-50 ${added ? "bg-primary-50/70" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-950">{product.nombre || product.descripcion}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{product.codigo || "Sin código"} · {formatMoney(product.precio || 0)}</span>
                </span>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${added ? "bg-primary-100 text-primary-700" : "bg-slate-50 text-slate-600"}`}>
                  <Plus className="h-3.5 w-3.5" /> {added ? "+1" : "Agregar"}
                </span>
              </button>
            );
          })}
          {!filteredProducts.length ? <div className="px-4 py-5 text-center text-sm text-slate-500">No encontré productos.</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value, strong = false, muted = false }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`${strong ? "text-xl font-black text-slate-950" : "font-black text-slate-900"} ${muted ? "text-slate-500" : ""}`}>{value}</span>
    </div>
  );
}

function ReadOnlyField({ label, value, strong = false, className = "" }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 ${className}`}>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-sm ${strong ? "font-black" : "font-bold"} text-slate-950`}>{value || "-"}</p>
    </div>
  );
}

function FormMessageModal({ dialog, onClose }) {
  if (!dialog?.open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex min-h-screen w-screen items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <h3 className="text-lg font-black text-slate-950">{dialog.title || "Revisa el formulario"}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{dialog.message || "Hay información pendiente."}</p>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50">
            Entendido
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function Field({ label, children, className = "" }) {
  return <label className={`space-y-2 ${className}`}><span className="text-sm font-bold text-slate-800">{label}</span>{children}</label>;
}

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}
