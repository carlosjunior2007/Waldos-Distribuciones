import { Truck } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { DELIVERY_STATUS_OPTIONS } from "../order.constants";
import { getAddressLabel } from "../order.helpers";
import DeliveryProductPicker from "./DeliveryProductPicker";

export default function DeliveryFormModal({ open, order, onClose }) {
  if (!order) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Programar entrega · ${order.folio}`}
      subtitle="Entrega parcial o completa por dirección. Solo visual por ahora."
      width="max-w-6xl"
    >
      <form className="space-y-5 p-5 md:p-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Folio de entrega">
            <input className={inputClass} defaultValue="Se generará automáticamente" readOnly />
          </Field>

          <Field label="Estado">
            <select className={inputClass} defaultValue="programada">
              {DELIVERY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fecha de entrega">
            <input type="datetime-local" className={inputClass} />
          </Field>

          <Field label="Dirección" className="md:col-span-2">
            <select className={inputClass}>
              {order.addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {getAddressLabel(address)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Recibido por">
            <input className={inputClass} placeholder="Nombre de quien recibe" />
          </Field>

          <Field label="Notas" className="md:col-span-3">
            <textarea className={`${inputClass} min-h-24 py-3`} placeholder="Notas de entrega..." />
          </Field>
        </section>

        <DeliveryProductPicker order={order} />

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-border px-4 text-sm font-semibold">
            Cancelar
          </button>
          <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white">
            <Truck className="h-4 w-4" />
            Guardar entrega
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none focus:border-primary-400";

function Field({ label, children, className = "" }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      {children}
    </label>
  );
}
