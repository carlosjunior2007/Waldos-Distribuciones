import Modal from "../../../components/ui/Modal";

import { formatMoney } from "../../../utils/formatters";
import { formatExpenseDate } from "../expense.helpers";

export default function ExpenseDetailModal({
  open,
  item,
  onClose,
  onEditExpense,
  onDeleteExpense,
}) {
  if (!item) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item.rowType === "ganancia" ? "Ganancia real del pedido" : "Detalle de gasto"}
      subtitle="Venta, costo real FIFO, gastos asociados y pago registrado. Sí, por fin todo en el mismo lugar."
      width="max-w-4xl"
      zIndex="z-[80]"
    >
      <div className="space-y-4 p-5 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Info label="Pedido / concepto" value={item.folio || item.concepto} />
          <Info label="Cliente" value={item.cliente} />
          <Info label="Fecha" value={item.fecha} />
          <Info label="Referencia pago" value={item.pagoReferencia || item.referencia} />
          <Info label="Monto pagado" value={formatMoney(item.montoPagado || 0)} />
          <Info label="Estado" value={item.realizada ? "Realizado" : "Pendiente"} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Venta real s/IVA" value={formatMoney(item.ventaRealSinIva || 0)} strong />
          <Info label="Costo mercancía FIFO" value={formatMoney(item.costoMercanciaReal || 0)} strong />
          <Info label="Gastos extra" value={formatMoney(item.gastos || 0)} strong valueClass="text-error-700" />
          <Info label="Ganancia real neta" value={formatMoney(item.ganancia || 0)} strong valueClass={item.ganancia >= 0 ? "text-success-700" : "text-error-700"} />
        </div>

        <div className="rounded-2xl border border-border bg-surface-soft p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">Productos y costo real</p>
              <p className="mt-1 text-sm text-text-secondary">
                Sale de los lotes consumidos por FIFO. Si no hay consumo, el sistema usa estimado.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.14em] text-text-muted">
                  <th className="py-3 pr-4">Producto</th>
                  <th className="py-3 pr-4 text-right">Cant.</th>
                  <th className="py-3 pr-4 text-right">Venta s/IVA</th>
                  <th className="py-3 pr-4 text-right">Costo FIFO</th>
                  <th className="py-3 pr-4 text-right">Ganancia</th>
                  <th className="py-3 text-left">Factura / entrada</th>
                </tr>
              </thead>
              <tbody>
                {item.productLines?.length ? (
                  item.productLines.map((line) => (
                    <tr key={line.pedido_detalle_id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-semibold text-text-primary">
                        {line.nombre_producto}
                        <p className="mt-1 text-xs font-normal text-text-muted">{line.codigo || "Sin código"}</p>
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold">{line.cantidad_entregada_real}</td>
                      <td className="py-3 pr-4 text-right font-semibold">{formatMoney(line.venta_real_sin_iva)}</td>
                      <td className="py-3 pr-4 text-right font-semibold">{formatMoney(line.costo_real_total)}</td>
                      <td className={`py-3 pr-4 text-right font-semibold ${line.ganancia_real >= 0 ? "text-success-700" : "text-error-700"}`}>
                        {formatMoney(line.ganancia_real)}
                      </td>
                      <td className="py-3 text-sm text-text-secondary">
                        {line.facturas?.join(", ") || "Sin referencia"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-text-secondary">
                      No hay consumo FIFO registrado para este pedido.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {item.expenses?.length ? (
          <div className="rounded-2xl border border-border bg-surface-soft p-4">
            <p className="text-sm font-semibold text-text-primary">Gastos asociados</p>

            <div className="mt-3 space-y-3">
              {item.expenses.map((gasto) => (
                <div key={gasto.id} className="rounded-2xl border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{gasto.concepto}</p>
                      <p className="mt-1 text-sm text-text-secondary">{gasto.descripcion || "Sin descripción"}</p>
                      <p className="mt-2 text-sm font-bold text-error-700">{formatMoney(gasto.monto)}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {gasto.fecha ? formatExpenseDate(gasto.fecha) : formatExpenseDate(gasto.created_at, { isTimestamp: true })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => onEditExpense(gasto)} className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700">
                        Editar
                      </button>
                      <button type="button" onClick={() => onDeleteExpense(gasto)} className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function Info({ label, value, strong = false, valueClass = "text-text-primary" }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className={`mt-2 ${strong ? "text-lg font-black" : "text-sm font-medium"} ${valueClass}`}>
        {value || "-"}
      </p>
    </div>
  );
}
