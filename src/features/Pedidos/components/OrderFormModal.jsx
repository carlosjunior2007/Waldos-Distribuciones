import { Save } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { PAYMENT_STATUS_OPTIONS } from "../order.constants";
import { formatMoney } from "../order.helpers";
import OrderAddressesEditor from "./OrderAddressesEditor";

export default function OrderFormModal({ open, order, onClose }) {
  const isEdit = Boolean(order);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar pedido ${order.folio}` : "Crear pedido manual"}
      subtitle="Captura datos del pedido, productos y direcciones de entrega. Solo visual por ahora."
      width="max-w-6xl"
    >
      <form className="space-y-5 p-5 md:p-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Cliente">
            <input className={inputClass} defaultValue={order?.cliente_nombre || ""} placeholder="Nombre del cliente" />
          </Field>

          <Field label="Teléfono">
            <input className={inputClass} defaultValue={order?.cliente_telefono || ""} placeholder="Teléfono" />
          </Field>

          <Field label="Email">
            <input className={inputClass} defaultValue={order?.cliente_email || ""} placeholder="Correo" />
          </Field>

          <Field label="Método de pago">
            <input className={inputClass} defaultValue={order?.metodo_pago || ""} placeholder="Transferencia, crédito, efectivo..." />
          </Field>

          <Field label="Estado de pago">
            <select className={inputClass} defaultValue={order?.estado_pago || "pendiente"}>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Estado operativo">
            <input
              className={inputClass}
              value="Automático según entregas"
              readOnly
            />
          </Field>

          <Field label="Tracking interno">
            <input className={inputClass} defaultValue={order?.tracking_token || "Se generará automáticamente"} readOnly />
          </Field>

          <Field label="Entrega inicio">
            <input type="date" className={inputClass} />
          </Field>

          <Field label="Entrega fin">
            <input type="date" className={inputClass} />
          </Field>

          <Field label="Notas" className="md:col-span-3">
            <textarea className={`${inputClass} min-h-28 py-3`} defaultValue={order?.notas || ""} placeholder="Notas internas del pedido..." />
          </Field>
        </section>

        <OrderAddressesEditor initialAddresses={order?.addresses || []} />

        <section className="rounded-[24px] border border-border bg-background p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-bold text-text-primary">Productos</h4>
            <button type="button" className="h-10 rounded-xl border border-border px-3 text-sm font-semibold">
              Agregar producto
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  <th className="py-3 pr-4">Producto</th>
                  <th className="py-3 pr-4">Cantidad</th>
                  <th className="py-3 pr-4">Precio</th>
                  <th className="py-3 pr-4">Importe</th>
                  <th className="py-3 pr-4">Acción</th>
                </tr>
              </thead>

              <tbody>
                {(order?.details || []).map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="py-3 pr-4">{item.nombre_producto}</td>
                    <td className="py-3 pr-4">
                      <input className={`${inputClass} w-24`} defaultValue={item.cantidad_pedida} />
                    </td>
                    <td className="py-3 pr-4">
                      <input className={`${inputClass} w-32`} defaultValue={item.precio_unitario} />
                    </td>
                    <td className="py-3 pr-4 font-bold">{formatMoney(item.importe)}</td>
                    <td className="py-3 pr-4">
                      <button type="button" className="text-sm font-semibold text-error-700">Quitar</button>
                    </td>
                  </tr>
                ))}

                {!order?.details?.length ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-text-muted">
                      Agrega productos para armar el pedido.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-border px-4 text-sm font-semibold">
            Cancelar
          </button>

          <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white">
            <Save className="h-4 w-4" />
            {isEdit ? "Guardar cambios" : "Crear pedido"}
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
