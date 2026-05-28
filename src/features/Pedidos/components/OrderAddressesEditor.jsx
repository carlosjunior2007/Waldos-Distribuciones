import { MapPin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { capitalizeFirstLetter } from "../order.helpers";

function createAddress() {
  return {
    id: crypto?.randomUUID?.() || String(Date.now()),
    nombre: "",
    direccion: "",
    ciudad: "Tijuana",
    estado: "Baja California",
    codigo_postal: "",
    pais: "México",
    contacto_nombre: "",
    contacto_telefono: "",
    notas: "",
    principal: false,
  };
}

export default function OrderAddressesEditor({ initialAddresses = [] }) {
  const [addresses, setAddresses] = useState(() =>
    initialAddresses.length
      ? initialAddresses
      : [{ ...createAddress(), principal: true }],
  );

  function addAddress() {
    setAddresses((prev) => [...prev, createAddress()]);
  }

  function updateAddress(id, key, value) {
    const textFields = new Set([
      "nombre",
      "direccion",
      "ciudad",
      "estado",
      "pais",
      "contacto_nombre",
      "notas",
    ]);
    const nextValue = textFields.has(key) ? capitalizeFirstLetter(value) : value;

    setAddresses((prev) =>
      prev.map((address) =>
        address.id === id ? { ...address, [key]: nextValue } : address,
      ),
    );
  }

  function removeAddress(id) {
    setAddresses((prev) => {
      const next = prev.filter((address) => address.id !== id);

      if (!next.length) return [{ ...createAddress(), principal: true }];

      if (!next.some((address) => address.principal)) {
        return next.map((address, index) => ({
          ...address,
          principal: index === 0,
        }));
      }

      return next;
    });
  }

  function setPrincipal(id) {
    setAddresses((prev) =>
      prev.map((address) => ({
        ...address,
        principal: address.id === id,
      })),
    );
  }

  return (
    <section className="rounded-[24px] border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent-500" />

            <h4 className="text-sm font-bold text-text-primary">
              Direcciones guardadas del cliente
            </h4>
          </div>

          <p className="mt-1 text-sm text-text-secondary">
            Estas direcciones deben vivir ligadas al cliente, no solo al pedido. Luego el pedido solo selecciona cuáles usará.
          </p>
        </div>

        <button
          type="button"
          onClick={addAddress}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
        >
          <Plus className="h-4 w-4" />
          Agregar dirección al cliente
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {addresses.map((address, index) => (
          <article
            key={address.id}
            className="rounded-2xl border border-border bg-surface-soft p-4"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-text-primary">
                  Dirección {index + 1}
                </p>

                <p className="text-xs text-text-muted">
                  {address.principal
                    ? "Dirección principal"
                    : "Dirección secundaria"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPrincipal(address.id)}
                  className={`h-9 rounded-xl border px-3 text-xs font-semibold ${
                    address.principal
                      ? "border-success-100 bg-success-50 text-success-700"
                      : "border-border bg-surface text-text-primary"
                  }`}
                >
                  Principal
                </button>

                <button
                  type="button"
                  onClick={() => removeAddress(address.id)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-error-100 bg-error-50 px-3 text-xs font-semibold text-error-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Quitar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Nombre"
                value={address.nombre}
                placeholder="Sucursal, almacén, oficina..."
                onChange={(v) => updateAddress(address.id, "nombre", v)}
              />

              <Input
                label="Contacto"
                value={address.contacto_nombre}
                placeholder="Nombre de quien recibe"
                onChange={(v) =>
                  updateAddress(address.id, "contacto_nombre", v)
                }
              />

              <Input
                label="Teléfono"
                value={address.contacto_telefono}
                placeholder="Teléfono de contacto"
                onChange={(v) =>
                  updateAddress(address.id, "contacto_telefono", v)
                }
              />

              <Input
                label="Código postal"
                value={address.codigo_postal}
                placeholder="22000"
                onChange={(v) => updateAddress(address.id, "codigo_postal", v)}
              />

              <Input
                label="Ciudad"
                value={address.ciudad}
                placeholder="Tijuana"
                onChange={(v) => updateAddress(address.id, "ciudad", v)}
              />

              <Input
                label="Estado"
                value={address.estado}
                placeholder="Baja California"
                onChange={(v) => updateAddress(address.id, "estado", v)}
              />

              <Input
                label="Dirección"
                value={address.direccion}
                placeholder="Calle, número, colonia..."
                className="md:col-span-2"
                onChange={(v) => updateAddress(address.id, "direccion", v)}
              />

              <Input
                label="Notas"
                value={address.notas}
                placeholder="Indicaciones de entrega..."
                className="md:col-span-2"
                onChange={(v) => updateAddress(address.id, "notas", v)}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Input({ label, value, onChange, placeholder, className = "" }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none focus:border-primary-400"
      />
    </label>
  );
}
