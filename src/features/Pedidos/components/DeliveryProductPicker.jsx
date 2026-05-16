import { AlertCircle, CheckCircle2, PackageCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function getDeliveryQuantity(delivery, detailId) {
  if (!delivery) return 0;
  const rows = delivery.details || delivery.entrega_detalles || [];
  const row = rows.find((item) => item.pedido_detalle_id === detailId);
  return Number(row?.cantidad_entregada || 0);
}

function getInitialRows(details = [], delivery = null) {
  return (details || [])
    .map((product) => {
      const currentDeliveryQuantity = getDeliveryQuantity(delivery, product.id);
      const pendingWithoutThisDelivery = Number(product.cantidad_pendiente || 0);
      const available = pendingWithoutThisDelivery + currentDeliveryQuantity;
      const deliveredBeforeThisDelivery = Math.max(
        Number(product.cantidad_entregada || 0) - currentDeliveryQuantity,
        0,
      );

      return {
        id: product.id,
        pedido_detalle_id: product.id,
        producto_id: product.producto_id,
        codigo: product.codigo,
        nombre_producto: product.nombre_producto,
        cantidad_pedida: Number(product.cantidad_pedida || 0),
        cantidad_entregada_previa: deliveredBeforeThisDelivery,
        cantidad_pendiente: available,
        pendiente: available,
        cantidad_entregada: currentDeliveryQuantity,
      };
    })
    .filter((product) => product.pendiente > 0 || Number(product.cantidad_entregada || 0) > 0);
}

export default function DeliveryProductPicker({ order, delivery = null, value, onChange }) {
  const initialRows = useMemo(() => getInitialRows(order?.details || [], delivery), [order, delivery]);
  const [localRows, setLocalRows] = useState(initialRows);
  const rows = value || localRows;

  useEffect(() => {
    setLocalRows(initialRows);
    onChange?.(initialRows);
  }, [initialRows]);

  function setRows(updater) {
    const nextRows = typeof updater === "function" ? updater(rows) : updater;
    if (value) onChange?.(nextRows);
    else setLocalRows(nextRows);
  }

  const summary = useMemo(() => {
    const totalPending = rows.reduce((acc, row) => acc + Number(row.pendiente || 0), 0);
    const totalToDeliver = rows.reduce((acc, row) => acc + Number(row.cantidad_entregada || 0), 0);
    const selectedProducts = rows.filter((row) => Number(row.cantidad_entregada || 0) > 0).length;
    const hasOverLimit = rows.some((row) => Number(row.cantidad_entregada || 0) > Number(row.pendiente || 0));

    return { totalPending, totalToDeliver, selectedProducts, hasOverLimit };
  }, [rows]);

  function updateQuantity(rowId, value) {
    const nextValue = value === "" ? "" : Math.max(Number(value), 0);
    setRows((prev) => prev.map((row) => row.id === rowId ? { ...row, cantidad_entregada: nextValue } : row));
  }

  function deliverAll(rowId) {
    setRows((prev) => prev.map((row) => row.id === rowId ? { ...row, cantidad_entregada: row.pendiente } : row));
  }

  function clearAll() {
    setRows((prev) => prev.map((row) => ({ ...row, cantidad_entregada: 0 })));
  }

  if (!rows.length) {
    return (
      <section className="rounded-[24px] border border-border bg-background p-5">
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <PackageCheck className="mx-auto h-8 w-8 text-success-600" />
          <p className="mt-3 font-bold text-text-primary">Este pedido no tiene productos disponibles</p>
          <p className="mt-1 text-sm text-text-secondary">No hay cantidades pendientes para esta entrega.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[24px] border border-border bg-background p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-sm font-bold text-text-primary">Productos de esta entrega</h4>
          <p className="mt-1 max-w-3xl text-sm text-text-secondary">
            {delivery ? "Ajusta las cantidades de esta entrega." : "Captura solo lo que sale ahora. Todo inicia en 0."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
          <SummaryCard label="Disponible" value={summary.totalPending} />
          <SummaryCard label="A entregar" value={summary.totalToDeliver} />
          <SummaryCard label="Productos" value={summary.selectedProducts} />
        </div>
      </div>

      {summary.hasOverLimit ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-error-100 bg-error-50 p-3 text-sm text-error-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Hay productos con cantidad mayor a la disponible.
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-border">
        <div className="max-h-[420px] overflow-auto">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface-soft">
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3 text-right">Pedido</th>
                <th className="px-4 py-3 text-right">Entregado antes</th>
                <th className="px-4 py-3 text-right">Disponible</th>
                <th className="px-4 py-3 text-right">Esta entrega</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border bg-surface">
              {rows.map((row) => {
                const quantity = Number(row.cantidad_entregada || 0);
                const isOverLimit = quantity > Number(row.pendiente || 0);
                const willComplete = quantity > 0 && quantity === Number(row.pendiente || 0);

                return (
                  <tr key={row.id} className={quantity > 0 ? "bg-accent-50/40" : ""}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text-primary">{row.nombre_producto}</div>
                      <div className="mt-1 text-xs text-text-muted">Disponible: {row.pendiente}</div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{row.codigo || "Sin código"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary">{row.cantidad_pedida}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{row.cantidad_entregada_previa}</td>
                    <td className="px-4 py-3 text-right font-bold text-text-primary">{row.pendiente}</td>
                    <td className="px-4 py-3">
                      <div className="ml-auto w-36">
                        <input
                          type="number"
                          min="0"
                          max={row.pendiente}
                          step="0.01"
                          value={row.cantidad_entregada}
                          onChange={(event) => updateQuantity(row.id, event.target.value)}
                          className={`h-11 w-full rounded-2xl border bg-background px-3 text-right text-sm font-semibold text-text-primary outline-none focus:border-primary-400 ${isOverLimit ? "border-error-300" : "border-border"}`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {willComplete ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-success-100 bg-success-50 px-2 py-1 text-xs font-semibold text-success-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Completa
                          </span>
                        ) : null}

                        <button type="button" onClick={() => deliverAll(row.id)} className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-text-primary transition hover:bg-surface-soft">
                          Todo
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface-soft p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">Solo se guardan productos con cantidad mayor a 0.</p>
        <button type="button" onClick={clearAll} className="h-10 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary">
          Poner todo en 0
        </button>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-3 py-2">
      <p className="text-lg font-black text-text-primary">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</p>
    </div>
  );
}
