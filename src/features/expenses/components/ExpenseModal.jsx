import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import { formatInputDate } from "../../../utils/dates";
import { parseNumberish } from "../../../utils/formatters";
import { createExpense, updateExpense } from "../services/expenses.service";

export default function ExpenseModal({
  open,
  onClose,
  onSaved,
  options = [],
  selectedOrderId = "",
  editingExpense = null,
}) {
  const [form, setForm] = useState({
    pedido_id: "",
    concepto: "",
    descripcion: "",
    monto: "",
    fecha: formatInputDate(new Date()),
    tipo: "extra",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (editingExpense) {
      setForm({
        pedido_id: editingExpense.pedido_id || "",
        concepto: editingExpense.concepto || "",
        descripcion: editingExpense.descripcion || "",
        monto: editingExpense.monto ?? "",
        fecha: formatInputDate(editingExpense.fecha),
        tipo: editingExpense.tipo || "extra",
      });
    } else {
      setForm({
        pedido_id: selectedOrderId || "",
        concepto: "",
        descripcion: "",
        monto: "",
        fecha: formatInputDate(new Date()),
        tipo: "extra",
      });
    }

    setError("");
  }, [open, selectedOrderId, editingExpense]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.concepto.trim()) {
      setError("Escribe el concepto del gasto.");
      return;
    }

    if (!parseNumberish(form.monto)) {
      setError("Ingresa un monto válido.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        pedido_id: form.pedido_id || null,
        cotizacion_id: null,
        concepto: form.concepto.trim(),
        descripcion: form.descripcion.trim() || null,
        monto: parseNumberish(form.monto),
        fecha: form.fecha || formatInputDate(new Date()),
        tipo: form.tipo,
      };

      if (editingExpense?.id) {
        await updateExpense(editingExpense.id, payload);
      } else {
        await createExpense(payload);
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "No se pudo guardar el gasto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingExpense ? "Modificar gasto" : "Registrar gasto"}
      subtitle="Puedes ligarlo a un pedido o dejarlo independiente."
      width="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="p-5 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-text-primary">
              Pedido <span className="text-text-muted">(opcional)</span>
            </span>

            <select
              value={form.pedido_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, pedido_id: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none"
            >
              <option value="">Sin pedido asociado</option>

              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.folio} · {item.cliente_nombre || "Sin cliente"}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Concepto"
            value={form.concepto}
            onChange={(value) => setForm((prev) => ({ ...prev, concepto: value }))}
            placeholder="Ej. Envío de mercancía"
          />

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">Tipo</span>

            <select
              value={form.tipo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tipo: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none"
            >
              <option value="compra">Compra</option>
              <option value="envio">Envío</option>
              <option value="operativo">Operativo</option>
              <option value="extra">Extra</option>
            </select>
          </label>

          <Input
            label="Monto"
            type="number"
            min="0"
            step="0.01"
            value={form.monto}
            onChange={(value) => setForm((prev) => ({ ...prev, monto: value }))}
            placeholder="0.00"
          />

          <Input
            label="Fecha"
            type="date"
            value={form.fecha}
            onChange={(value) => setForm((prev) => ({ ...prev, fecha: value }))}
          />

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-text-primary">
              Descripción
            </span>

            <textarea
              rows={4}
              value={form.descripcion}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, descripcion: e.target.value }))
              }
              placeholder="Opcional"
              className="min-h-[110px] w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary sm:w-auto"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white disabled:opacity-70 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {saving
              ? editingExpense
                ? "Guardando cambios..."
                : "Guardando..."
              : editingExpense
                ? "Guardar cambios"
                : "Guardar gasto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Input({ label, value, onChange, type = "text", ...props }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-text-primary">{label}</span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none"
        {...props}
      />
    </label>
  );
}