import { AlertCircle, CheckCircle2, Minus, PackageCheck, Plus } from "lucide-react";
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
      const pendingWithoutThisDelivery = Number(product.cantidad_disponible ?? product.cantidad_pendiente ?? 0);
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
    const digits = String(value ?? "").replace(/[^0-9]/g, "");
    const nextValue = digits === "" ? "" : Math.max(Number(digits), 0);
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, cantidad_entregada: nextValue } : row)));
  }

  function increment(rowId, amount) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const current = Number(row.cantidad_entregada || 0);
        const next = Math.min(Math.max(current + amount, 0), Number(row.pendiente || 0));
        return { ...row, cantidad_entregada: next };
      }),
    );
  }

  function deliverAll(rowId) {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, cantidad_entregada: row.pendiente } : row)));
  }

  function clearRow(rowId) {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, cantidad_entregada: 0 } : row)));
  }

  function clearAll() {
    setRows((prev) => prev.map((row) => ({ ...row, cantidad_entregada: 0 })));
  }

  function deliverAllRows() {
    setRows((prev) => prev.map((row) => ({ ...row, cantidad_entregada: row.pendiente })));
  }

  if (!rows.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <PackageCheck className="mx-auto h-8 w-8 text-success-600" />
          <p className="mt-3 font-black text-slate-950">Este pedido no tiene productos disponibles</p>
          <p className="mt-1 text-sm text-slate-500">No hay cantidades pendientes para esta entrega.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-600">Productos</p>
          <h4 className="mt-1 text-base font-black text-slate-950">Cantidades de esta entrega</h4>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            {delivery ? "Ajusta lo entregado sin pelearte con una tabla horizontal." : "Captura solo lo que sale ahora. Todos los productos empiezan en 0."}
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-center sm:min-w-[360px]">
          <SummaryCard label="Disponible" value={summary.totalPending} />
          <SummaryCard label="A entregar" value={summary.totalToDeliver} highlighted />
          <SummaryCard label="Productos" value={summary.selectedProducts} />
        </div>
      </div>

      {summary.hasOverLimit ? (
        <div className="mx-5 mt-4 flex items-start gap-2 rounded-2xl border border-error-100 bg-error-50 p-3 text-sm text-error-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Hay productos con cantidad mayor a la disponible.
        </div>
      ) : null}

      <div className="max-h-[420px] overflow-y-auto px-5 py-4">
        <div className="grid gap-3">
          {rows.map((row) => {
            const quantity = Number(row.cantidad_entregada || 0);
            const pending = Number(row.pendiente || 0);
            const isOverLimit = quantity > pending;
            const willComplete = quantity > 0 && quantity === pending;
            const percent = pending > 0 ? Math.min((quantity / pending) * 100, 100) : 0;

            return (
              <article
                key={row.id}
                className={`rounded-2xl border p-4 transition ${quantity > 0 ? "border-primary-200 bg-primary-50/40" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="min-w-0 truncate text-sm font-black text-slate-950">{row.nombre_producto}</h5>
                      {willComplete ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-success-100 bg-success-50 px-2 py-1 text-[11px] font-bold text-success-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Completa
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{row.codigo || "Sin código"}</p>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm sm:max-w-lg">
                      <MiniStat label="Pedido" value={row.cantidad_pedida} />
                      <MiniStat label="Antes" value={row.cantidad_entregada_previa} />
                      <MiniStat label="Disponible" value={pending} strong />
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-primary-600" style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Esta entrega</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => increment(row.id, -1)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                        aria-label="Restar uno"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={row.cantidad_entregada}
                        onChange={(event) => updateQuantity(row.id, event.target.value)}
                        className={`h-12 min-w-0 flex-1 rounded-xl border bg-white px-3 text-center text-lg font-black text-slate-950 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100 ${isOverLimit ? "border-error-300" : "border-slate-200"}`}
                      />
                      <button
                        type="button"
                        onClick={() => increment(row.id, 1)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                        aria-label="Sumar uno"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => deliverAll(row.id)} className="h-9 rounded-xl bg-slate-900 px-3 text-xs font-black text-white transition hover:bg-slate-800">
                        Todo
                      </button>
                      <button type="button" onClick={() => clearRow(row.id)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                        Cero
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Solo se guardan productos con cantidad mayor a 0.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={clearAll} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            Poner todo en 0
          </button>
          <button type="button" onClick={deliverAllRows} className="h-10 rounded-xl bg-slate-900 px-3 text-sm font-black text-white transition hover:bg-slate-800">
            Entregar todo disponible
          </button>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, highlighted = false }) {
  return (
    <div className={`px-3 py-3 ${highlighted ? "bg-white" : ""}`}>
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

function MiniStat({ label, value, strong = false }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm ${strong ? "font-black text-slate-950" : "font-bold text-slate-700"}`}>{value}</p>
    </div>
  );
}
