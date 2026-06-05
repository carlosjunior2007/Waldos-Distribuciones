import { CalendarClock, Home, MapPin, PackageCheck, Store, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import { DELIVERY_STATUS_OPTIONS } from "../order.constants";
import { capitalizeFirstLetter, getAddressLabel, normalizeCapitalizedText } from "../order.helpers";
import DeliveryProductPicker from "./DeliveryProductPicker";
import { Field, ModalFooter, ModalSection, ReadOnlyCard, inputClass, modalBodyClass, primaryButtonClass, secondaryButtonClass, textareaClass } from "./ModalUI";

const PICKUP_OPTION_VALUE = "__pickup__";
const PICKUP_NOTE = "Recogido por el cliente";

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function DeliveryFormModal({ open, order, delivery = null, saving = false, onClose, onSave }) {
  const [form, setForm] = useState({
    id: "",
    tipo_entrega: "domicilio",
    cliente_direccion_id: "",
    fecha_entrega: "",
    estado: "pendiente",
    recibido_por: "",
    notas: "",
  });
  const [rows, setRows] = useState([]);

  const clientAddresses = useMemo(() => order?.cliente_direcciones || [], [order]);
  const isEditing = Boolean(delivery?.id);
  const selectedAddress = clientAddresses.find((item) => item.id === form.cliente_direccion_id);
  const isPickup = form.tipo_entrega === "recogido";

  useEffect(() => {
    if (!open || !order) return;
    const principal = clientAddresses.find((item) => item.es_principal) || clientAddresses[0];
    const activeAddress = clientAddresses.find((item) => item.id === delivery?.cliente_direccion_id) || principal;
    const editingPickup = Boolean(delivery?.id && !delivery?.cliente_direccion_id);
    const usePickup = editingPickup || (!delivery?.id && !activeAddress?.id);

    setForm({
      id: delivery?.id || "",
      tipo_entrega: usePickup ? "recogido" : "domicilio",
      cliente_direccion_id: usePickup ? "" : activeAddress?.id || "",
      fecha_entrega: toDateTimeLocal(delivery?.fecha_entrega),
      estado: delivery?.estado || "pendiente",
      recibido_por: delivery?.recibido_por || (usePickup ? order.cliente_nombre || "Cliente" : activeAddress?.contacto_nombre || ""),
      notas: delivery?.notas || (usePickup ? PICKUP_NOTE : ""),
    });
  }, [open, order, delivery, clientAddresses]);

  if (!order) return null;

  function updateForm(field, value) {
    const textFields = new Set(["recibido_por", "notas"]);
    const nextValue = textFields.has(field) ? capitalizeFirstLetter(value) : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
  }

  function handleDeliveryType(nextType) {
    if (nextType === "recogido") {
      setForm((current) => ({
        ...current,
        tipo_entrega: "recogido",
        cliente_direccion_id: "",
        recibido_por: current.recibido_por || order.cliente_nombre || "Cliente",
        notas: current.notas || PICKUP_NOTE,
      }));
      return;
    }

    const principal = clientAddresses.find((item) => item.es_principal) || clientAddresses[0];
    setForm((current) => ({
      ...current,
      tipo_entrega: "domicilio",
      cliente_direccion_id: principal?.id || "",
      recibido_por: capitalizeFirstLetter(principal?.contacto_nombre || ""),
      notas: current.notas === PICKUP_NOTE ? "" : current.notas,
    }));
  }

  function handleAddressChange(value) {
    if (value === PICKUP_OPTION_VALUE) {
      handleDeliveryType("recogido");
      return;
    }

    const address = clientAddresses.find((item) => item.id === value);
    setForm((current) => ({
      ...current,
      tipo_entrega: "domicilio",
      cliente_direccion_id: value,
      recibido_por: capitalizeFirstLetter(address?.contacto_nombre || ""),
      notas: current.notas === PICKUP_NOTE ? "" : current.notas,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave?.({
      order,
      delivery: {
        ...form,
        cliente_direccion_id: isPickup ? null : form.cliente_direccion_id,
        recibido_por: normalizeCapitalizedText(form.recibido_por),
        notas: normalizeCapitalizedText(form.notas || (isPickup ? PICKUP_NOTE : "")),
      },
      products: rows,
    });
  }

  const willConsumeStock = String(form.estado || "").toLowerCase() === "entregada";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${isEditing ? "Editar entrega" : "Programar entrega"} · ${order.folio}`}
      subtitle="Define cómo saldrá el pedido, quién recibe y qué cantidades se entregan."
      width="max-w-6xl"
    >
      <form onSubmit={handleSubmit} className={modalBodyClass}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <ModalSection
              icon={CalendarClock}
              eyebrow="Nueva salida"
              title={isEditing ? delivery.folio : "Entrega del pedido"}
              description="Elige si se entrega a domicilio o si el cliente recoge. Las cantidades se capturan abajo."
              action={<span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 ring-1 ring-slate-200">Tracking: {order.tracking_token || "Sin tracking"}</span>}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DeliveryTypeCard
                  active={!isPickup}
                  icon={Home}
                  title="Entrega a domicilio"
                  description="Usa una dirección guardada del cliente."
                  onClick={() => handleDeliveryType("domicilio")}
                />
                <DeliveryTypeCard
                  active={isPickup}
                  icon={Store}
                  title="Recogido por el cliente"
                  description="No requiere dirección de entrega."
                  onClick={() => handleDeliveryType("recogido")}
                />
              </div>
            </ModalSection>

            <ModalSection title="Datos de la entrega" description="Captura la información operativa para esta salida.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ReadOnlyCard label="Folio" value={isEditing ? delivery.folio : "Se crea al guardar"} />

                <Field
                  label="Estado"
                  helper={willConsumeStock ? "Al guardar como entregada se descuenta stock FIFO." : "Mientras no esté entregada, no se descuenta stock."}
                >
                  <select className={inputClass} value={form.estado} onChange={(event) => updateForm("estado", event.target.value)}>
                    {DELIVERY_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </Field>

                <Field label="Fecha y hora">
                  <input type="datetime-local" className={inputClass} value={form.fecha_entrega} onChange={(event) => updateForm("fecha_entrega", event.target.value)} />
                </Field>

                {!isPickup ? (
                  <Field label="Entregar en" className="md:col-span-2" helper="Las direcciones se editan desde el perfil del cliente.">
                    <select
                      className={inputClass}
                      value={form.cliente_direccion_id}
                      onChange={(event) => handleAddressChange(event.target.value)}
                    >
                      <option value="">Seleccionar dirección del cliente</option>
                      <option value={PICKUP_OPTION_VALUE}>Recogido por el cliente</option>
                      {clientAddresses.map((address) => (
                        <option key={address.id} value={address.id}>{address.nombre} · {getAddressLabel(address)}</option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <div className="md:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <div className="flex gap-3">
                      <PackageCheck className="mt-0.5 h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-black">El cliente recogerá este pedido.</p>
                        <p className="mt-1 leading-6">Se guardará sin dirección de entrega y aparecerá como “Recogido por el cliente” en documentos e historial.</p>
                      </div>
                    </div>
                  </div>
                )}

                <Field label="Recibido por">
                  <input className={inputClass} value={form.recibido_por} onChange={(event) => updateForm("recibido_por", event.target.value)} placeholder="Nombre de quien recibe" />
                </Field>

                {!clientAddresses.length && !isPickup ? (
                  <div className="md:col-span-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                    <div className="flex gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                      <span>Este cliente no tiene direcciones guardadas. Puedes elegir “Recogido por el cliente” o agregar una dirección desde Clientes.</span>
                    </div>
                  </div>
                ) : null}

                <Field label="Notas" className="md:col-span-3">
                  <textarea className={textareaClass} value={form.notas} onChange={(event) => updateForm("notas", event.target.value)} placeholder="Notas internas para esta entrega..." />
                </Field>
              </div>
            </ModalSection>

            <DeliveryProductPicker order={order} delivery={delivery} value={rows} onChange={setRows} />

            <div className={`rounded-2xl border px-4 py-3 text-sm ${willConsumeStock ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              <strong>{willConsumeStock ? "Esta entrega sí descontará stock." : "Esta entrega no descontará stock todavía."}</strong>
              <span className="ml-1">
                {willConsumeStock
                  ? "El sistema usará FIFO y guardará qué factura/entrada alimentó cada producto."
                  : "Puedes dejarla pendiente, en ruta o parcial sin tocar inventario. El stock se mueve hasta marcarla como entregada."}
              </span>
            </div>
          </div>

          <aside className="space-y-4">
            <ModalSection title="Resumen" description="Revisa antes de guardar." className="xl:sticky xl:top-5">
              <div className="space-y-3 text-sm">
                <SummaryRow label="Pedido" value={order.folio} />
                <SummaryRow label="Cliente" value={order.cliente_nombre} />
                <SummaryRow label="Tipo" value={isPickup ? "Recogido por el cliente" : "Entrega a domicilio"} />
                <SummaryRow label="Dirección" value={isPickup ? "No aplica" : selectedAddress ? getAddressLabel(selectedAddress) : "Sin seleccionar"} />
                <SummaryRow label="Recibe" value={form.recibido_por || "Pendiente"} />
                <SummaryRow label="Stock" value={willConsumeStock ? "Se descuenta al guardar" : "No se descuenta"} />
              </div>
            </ModalSection>
          </aside>
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancelar</button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            <Truck className="h-4 w-4" /> {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar entrega"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function DeliveryTypeCard({ active, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex gap-3 rounded-2xl border p-4 text-left transition ${active ? "border-primary-400 bg-primary-50 ring-4 ring-primary-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-primary-700 text-white" : "bg-slate-100 text-slate-600"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-black text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-500">{description}</span>
      </span>
    </button>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2.5">
      <span className="text-slate-500">{label}</span>
      <strong className="text-right text-slate-950">{value || "-"}</strong>
    </div>
  );
}
