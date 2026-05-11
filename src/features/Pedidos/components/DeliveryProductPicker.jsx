import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { getPendingProducts } from "../order.helpers";

export default function DeliveryProductPicker({ order }) {
  const pendingProducts = useMemo(
    () => getPendingProducts(order?.details || []),
    [order],
  );

  const [rows, setRows] = useState(() => {
    const first = pendingProducts[0];

    return first
      ? [
          {
            id: crypto?.randomUUID?.() || String(Date.now()),
            pedido_detalle_id: first.id,
            cantidad_entregada: first.pendiente,
          },
        ]
      : [];
  });

  function addRow() {
    const first = pendingProducts[0];

    setRows((prev) => [
      ...prev,
      {
        id: crypto?.randomUUID?.() || `${Date.now()}-${prev.length}`,
        pedido_detalle_id: first?.id || "",
        cantidad_entregada: first?.pendiente || "",
      },
    ]);
  }

  function updateRow(rowId, key, value) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [key]: value,
            }
          : row,
      ),
    );
  }

  function removeRow(rowId) {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  }

  function getSelectedProduct(row) {
    return pendingProducts.find((item) => item.id === row.pedido_detalle_id);
  }

  return (
    <section className="rounded-[24px] border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-text-primary">
            Productos de esta entrega
          </h4>
          <p className="mt-1 text-sm text-text-secondary">
            Selecciona el producto y escribe la cantidad que se entregará ahora.
          </p>
        </div>

        <button
          type="button"
          onClick={addRow}
          disabled={!pendingProducts.length}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Agregar producto
        </button>
      </div>

      {!pendingProducts.length ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-5 text-sm text-text-muted">
          No hay productos pendientes por entregar.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row, index) => {
            const selected = getSelectedProduct(row);

            return (
              <article
                key={row.id}
                className="rounded-2xl border border-border bg-surface-soft p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <label className="min-w-0 flex-1 space-y-2">
                    <span className="text-sm font-semibold text-text-primary">
                      Producto {index + 1}
                    </span>

                    <select
                      value={row.pedido_detalle_id}
                      onChange={(e) =>
                        updateRow(row.id, "pedido_detalle_id", e.target.value)
                      }
                      className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none focus:border-primary-400"
                    >
                      {pendingProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.nombre_producto}
                        </option>
                      ))}
                    </select>

                    {selected ? (
                      <p className="text-xs font-medium text-text-muted">
                        Pendiente por entregar:{" "}
                        <span className="font-bold text-text-primary">
                          {selected.pendiente}
                        </span>
                      </p>
                    ) : null}
                  </label>

                  <label className="w-full space-y-2 lg:w-40">
                    <span className="text-sm font-semibold text-text-primary">
                      Cantidad
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.cantidad_entregada}
                      onChange={(e) =>
                        updateRow(row.id, "cantidad_entregada", e.target.value)
                      }
                      className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none focus:border-primary-400"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-error-100 bg-error-50 px-4 text-sm font-semibold text-error-700 transition hover:bg-error-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
