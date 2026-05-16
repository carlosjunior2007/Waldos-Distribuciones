import { CalendarClock, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import { DELIVERY_STATUS_OPTIONS } from "../order.constants";
import { getAddressLabel } from "../order.helpers";
import DeliveryProductPicker from "./DeliveryProductPicker";

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
    cliente_direccion_id: "",
    fecha_entrega: "",
    estado: "pendiente",
    recibido_por: "",
    notas: "",
  });
  const [rows, setRows] = useState([]);

  const clientAddresses = useMemo(() => order?.cliente_direcciones || [], [order]);
  const isEditing = Boolean(delivery?.id);

  useEffect(() => {
    if (!open || !order) return;
    const principal = clientAddresses.find((item) => item.es_principal) || clientAddresses[0];
    const selectedAddress = clientAddresses.find((item) => item.id === delivery?.cliente_direccion_id) || principal;

    setForm({
      id: delivery?.id || "",
      cliente_direccion_id: selectedAddress?.id || "",
      fecha_entrega: toDateTimeLocal(delivery?.fecha_entrega),
      estado: delivery?.estado || "pendiente",
      recibido_por: delivery?.recibido_por || selectedAddress?.contacto_nombre || "",
      notas: delivery?.notas || "",
    });
  }, [open, order, delivery, clientAddresses]);

  if (!order) return null;

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleAddressChange(value) {
    const address = clientAddresses.find((item) => item.id === value);
    setForm((current) => ({
      ...current,
      cliente_direccion_id: value,
      recibido_por: address?.contacto_nombre || "",
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave?.({
      order,
      delivery: form,
      products: rows,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${isEditing ? "Editar entrega" : "Programar entrega"} · ${order.folio}`}
      subtitle="Selecciona una dirección del cliente y captura cantidades."
      width="max-w-7xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5 md:p-6">
        <section className="rounded-[24px] border border-info-100 bg-info-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-info-700">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-info-900">{isEditing ? delivery.folio : "Nueva entrega"}</h4>
                <p className="mt-1 text-sm text-info-800">Las direcciones se editan desde el cliente.</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-info-900">
              <span className="font-bold">Tracking:</span> {order.tracking_token || "Sin tracking"}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm text-text-secondary">
            <p className="font-bold text-text-primary">Folio</p>
            <p className="mt-1">{isEditing ? delivery.folio : "Se crea al guardar"}</p>
          </div>

          <Field label="Estado">
            <select className={inputClass} value={form.estado} onChange={(event) => updateForm("estado", event.target.value)}>
              {DELIVERY_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>

          <Field label="Fecha y hora">
            <input type="datetime-local" className={inputClass} value={form.fecha_entrega} onChange={(event) => updateForm("fecha_entrega", event.target.value)} />
          </Field>

          <Field label="Entregar en" className="md:col-span-2">
            <select className={inputClass} value={form.cliente_direccion_id} onChange={(event) => handleAddressChange(event.target.value)}>
              <option value="">Seleccionar dirección del cliente</option>
              {clientAddresses.map((address) => (
                <option key={address.id} value={address.id}>{address.nombre} · {getAddressLabel(address)}</option>
              ))}
            </select>
          </Field>

          <Field label="Recibido por">
            <input className={inputClass} value={form.recibido_por} onChange={(event) => updateForm("recibido_por", event.target.value)} placeholder="Nombre de quien recibe" />
          </Field>

          {!clientAddresses.length ? (
            <div className="md:col-span-3 rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm font-semibold text-warning-700">
              Este cliente no tiene direcciones. Agrégalas desde la sección de clientes antes de programar la entrega.
            </div>
          ) : null}

          <Field label="Notas" className="md:col-span-3">
            <textarea className={`${inputClass} min-h-24 py-3`} value={form.notas} onChange={(event) => updateForm("notas", event.target.value)} placeholder="Notas para esta entrega..." />
          </Field>
        </section>

        <DeliveryProductPicker order={order} delivery={delivery} value={rows} onChange={setRows} />

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-border px-4 text-sm font-semibold">Cancelar</button>
          <button type="submit" disabled={saving || !clientAddresses.length} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white disabled:opacity-60">
            <Truck className="h-4 w-4" /> {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar entrega"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputClass = "h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none focus:border-primary-400 disabled:cursor-not-allowed disabled:opacity-70";

function Field({ label, children, className = "" }) {
  return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold text-text-primary">{label}</span>{children}</label>;
}
