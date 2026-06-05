import { MapPin, Save } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { capitalizeFirstLetter, getAddressLabel } from "../order.helpers";
import { Field, ModalFooter, ModalSection, inputClass, modalBodyClass, primaryButtonClass, secondaryButtonClass } from "./ModalUI";

export default function DeliveryAddressModal({ open, order, onClose }) {
  if (!order) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Direcciones de entrega · ${order.folio}`}
      subtitle="Administra direcciones guardadas por cliente para pedidos y entregas futuras."
      width="max-w-5xl"
    >
      <div className={modalBodyClass}>
        <ModalSection title="Direcciones guardadas" description="Estas direcciones se pueden usar al programar una entrega.">
          {order.addresses?.length ? (
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {order.addresses.map((address) => (
                <article key={address.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-slate-950">{address.nombre}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{getAddressLabel(address)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {address.contacto_nombre || "Sin contacto"} · {address.contacto_telefono || "Sin teléfono"}
                      </p>
                    </div>

                    {address.principal || address.es_principal ? (
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Principal
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Este cliente todavía no tiene direcciones guardadas.
            </div>
          )}
        </ModalSection>

        <ModalSection icon={MapPin} title="Nueva dirección del cliente" description="Captura una dirección clara para que futuras entregas sean más rápidas.">
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
        </ModalSection>

        <ModalFooter>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancelar</button>
          <button type="button" className={primaryButtonClass}>
            <Save className="h-4 w-4" /> Guardar en cliente
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

function Input({ label, placeholder, className = "" }) {
  const shouldCapitalize = !["Teléfono", "Código postal"].includes(label);
  return (
    <Field label={label} className={className}>
      <input
        placeholder={placeholder}
        onChange={(event) => {
          if (shouldCapitalize) {
            event.currentTarget.value = capitalizeFirstLetter(event.currentTarget.value);
          }
        }}
        className={inputClass}
      />
    </Field>
  );
}
