import { MapPin, Save } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { capitalizeFirstLetter, getAddressLabel } from "../order.helpers";

export default function DeliveryAddressModal({ open, order, onClose }) {
  if (!order) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Direcciones de entrega · ${order.folio}`}
      subtitle="Direcciones guardadas por cliente para usarlas en pedidos y entregas futuras."
      width="max-w-5xl"
    >
      <div className="space-y-5 p-5 md:p-6">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {order.addresses.map((address) => (
            <article key={address.id} className="rounded-[24px] border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-text-primary">{address.nombre}</p>
                  <p className="mt-1 text-sm text-text-secondary">{getAddressLabel(address)}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {address.contacto_nombre} · {address.contacto_telefono}
                  </p>
                </div>

                {address.principal ? (
                  <span className="rounded-full border border-success-100 bg-success-50 px-3 py-1 text-xs font-semibold text-success-700">
                    Principal
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[24px] border border-border bg-surface-soft p-4">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent-500" />
            <h4 className="text-sm font-bold text-text-primary">Nueva dirección del cliente</h4>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Nombre" placeholder="Sucursal, almacén, dirección principal..." />
            <Input label="Contacto" placeholder="Nombre de quien recibe" />
            <Input label="Teléfono" placeholder="Teléfono de contacto" />
            <Input label="Código postal" placeholder="22000" />
            <Input label="Ciudad" placeholder="Tijuana" />
            <Input label="Estado" placeholder="Baja California" />
            <Input label="Dirección" placeholder="Calle, número, colonia..." className="md:col-span-2" />
            <Input label="Notas" placeholder="Indicaciones de entrega..." className="md:col-span-2" />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-border px-4 text-sm font-semibold">
            Cancelar
          </button>
          <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white">
            <Save className="h-4 w-4" />
            Guardar en cliente
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Input({ label, placeholder, className = "" }) {
  const shouldCapitalize = !["Teléfono", "Código postal"].includes(label);
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      <input
        placeholder={placeholder}
        onChange={(event) => {
          if (shouldCapitalize) {
            event.currentTarget.value = capitalizeFirstLetter(event.currentTarget.value);
          }
        }}
        className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none focus:border-primary-400"
      />
    </label>
  );
}
