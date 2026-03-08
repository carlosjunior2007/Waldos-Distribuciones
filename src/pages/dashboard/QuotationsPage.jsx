import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CheckCircle2,
  XCircle,
  TimerReset,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  fetchQuotations,
  fetchQuotationSummary,
  fetchQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  searchProducts,
  getCurrentMonthValue,
} from "../../services/quotations";

import { generateQuotationPDF } from "../../utils/quotationPdf";

function money(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromInputDate(value) {
  if (!value) return null;
  return new Date(`${value}T12:00:00`).toISOString();
}

function getStatusStyles(status) {
  if (status === "pendiente") {
    return {
      label: "Pendiente",
      icon: Clock3,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  if (status === "en_proceso") {
    return {
      label: "En proceso",
      icon: TimerReset,
      className: "border-info-100 bg-info-50 text-info-700",
    };
  }

  if (status === "completado") {
    return {
      label: "Completado",
      icon: CheckCircle2,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  if (status === "vencido") {
    return {
      label: "Vencido",
      icon: XCircle,
      className: "border-error-100 bg-error-50 text-error-700",
    };
  }

  return {
    label: "Cancelado",
    icon: XCircle,
    className: "border-error-100 bg-error-50 text-error-700",
  };
}

function FilterPill({ label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center rounded-full border px-3 py-2 text-sm font-semibold transition",
        active
          ? "border-accent-500 bg-accent-500 text-white"
          : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-soft hover:text-text-primary",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function buildLastMonthsOptions(total = 12) {
  const result = [];
  const today = new Date();

  for (let i = 0; i < total; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
    const label = d.toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    });
    result.push({ value, label });
  }

  return result;
}

function cleanNumericInput(value, { allowDecimal = true } = {}) {
  let next = String(value ?? "");

  // permite vacío
  if (next === "") return "";

  // quita caracteres inválidos
  next = allowDecimal
    ? next.replace(/[^0-9.]/g, "")
    : next.replace(/[^0-9]/g, "");

  // evita más de un punto decimal
  if (allowDecimal) {
    const parts = next.split(".");
    if (parts.length > 2) {
      next = `${parts[0]}.${parts.slice(1).join("")}`;
    }
  }

  // si empieza con ceros como 00012 => 12
  // pero conserva "0" y "0." mientras escriben
  if (allowDecimal) {
    if (/^0+\d/.test(next)) {
      next = next.replace(/^0+/, "");
    }
    if (next.startsWith(".")) {
      next = `0${next}`;
    }
  } else {
    if (/^0+\d/.test(next)) {
      next = next.replace(/^0+/, "");
    }
  }

  return next;
}

function QuotationFormModal({
  open,
  onClose,
  onSaved,
  editingQuotation,
  currentMonth,
}) {
  const [loading, setLoading] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [form, setForm] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    cliente_email: "",
    estado: "pendiente",
    descuento: "",
    gastos: "",
    fecha_vencimiento: "",
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (editingQuotation) {
      setForm({
        cliente_nombre: editingQuotation.cliente_nombre || "",
        cliente_telefono: editingQuotation.cliente_telefono || "",
        cliente_email: editingQuotation.cliente_email || "",
        estado: editingQuotation.estado || "pendiente",
        descuento:
          editingQuotation.descuento !== null &&
          editingQuotation.descuento !== undefined
            ? String(editingQuotation.descuento)
            : "",
        gastos:
          editingQuotation.gastos !== null &&
          editingQuotation.gastos !== undefined
            ? String(editingQuotation.gastos)
            : "",
        fecha_vencimiento: toInputDate(editingQuotation.fecha_vencimiento),
      });

      setItems(
        (editingQuotation.detalles || []).map((item) => ({
          producto_id: item.producto_id,
          nombre_producto: item.nombre_producto,
          codigo: item.codigo || "",
          unidad: item.unidad || "",
          cantidad: Number(item.cantidad ?? 1),
          precio_unitario: Number(item.precio_unitario ?? 0),
          costo_unitario: Number(item.costo_unitario ?? 0),
          importe: Number(item.importe || 0),
          ganancia_linea: Number(item.ganancia_linea || 0),
        })),
      );
    } else {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);

      setForm({
        cliente_nombre: "",
        cliente_telefono: "",
        cliente_email: "",
        estado: "pendiente",
        descuento: "",
        gastos: "",
        fecha_vencimiento: toInputDate(defaultDate.toISOString()),
      });
      setItems([]);
    }

    setProductQuery("");
    setProductResults([]);
  }, [open, editingQuotation]);

  useEffect(() => {
    if (!open) return;

    const t = setTimeout(async () => {
      try {
        const rows = await searchProducts(productQuery);
        setProductResults(rows);
      } catch (error) {
        console.error(error);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [productQuery, open]);

  const totals = useMemo(() => {
    const rows = items.map((item) => {
      const importe =
        Number(item.cantidad || 0) * Number(item.precio_unitario || 0);

      const gananciaLinea =
        Number(item.cantidad || 0) *
        (Number(item.precio_unitario || 0) - Number(item.costo_unitario || 0));

      return { ...item, importe, ganancia_linea: gananciaLinea };
    });

    const subtotal = rows.reduce(
      (acc, item) => acc + Number(item.importe || 0),
      0,
    );
    const ganancia = rows.reduce(
      (acc, item) => acc + Number(item.ganancia_linea || 0),
      0,
    );
    const total = subtotal - Number(form.descuento || 0);

    return { rows, subtotal, ganancia, total };
  }, [items, form.descuento]);

  function addProduct(product) {
    const existingIndex = items.findIndex(
      (item) => item.producto_id === product.id,
    );

    if (existingIndex >= 0) {
      const next = [...items];
      const current = next[existingIndex];
      const newQty = Number(current.cantidad || 0) + 1;

      next[existingIndex] = {
        ...current,
        cantidad: newQty,
        importe: newQty * Number(current.precio_unitario || 0),
        ganancia_linea:
          newQty *
          (Number(current.precio_unitario || 0) -
            Number(current.costo_unitario || 0)),
      };

      setItems(next);
      return;
    }

    const precio = Number(product.precio || 0);
    const costo = Number(product.precio_compra || 0);

    setItems((prev) => [
      ...prev,
      {
        producto_id: product.id,
        nombre_producto: product.nombre,
        codigo: product.codigo || "",
        unidad: product.unidad || "",
        cantidad: "1",
        precio_unitario: precio,
        costo_unitario: costo,
        importe: precio,
        ganancia_linea: precio - costo,
      },
    ]);
  }

  function updateItem(index, key, value) {
    const next = [...items];
    next[index] = { ...next[index], [key]: value };

    const cantidad = Number(next[index].cantidad || 0);
    const precio = Number(next[index].precio_unitario || 0);
    const costo = Number(next[index].costo_unitario || 0);

    next[index].importe = cantidad * precio;
    next[index].ganancia_linea = cantidad * (precio - costo);

    setItems(next);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.cliente_nombre.trim()) {
      alert("El nombre del cliente es obligatorio.");
      return;
    }

    if (!items.length) {
      alert("Agrega al menos un producto.");
      return;
    }

    try {
      setLoading(true);

      const cleanItems = totals.rows.map((item) => ({
        producto_id: item.producto_id,
        cantidad: Number(item.cantidad || 0),
        precio_unitario: Number(item.precio_unitario || 0),
        costo_unitario: Number(item.costo_unitario || 0),
        importe: Number(item.importe || 0),
        ganancia_linea: Number(item.ganancia_linea || 0),
      }));

      const payload = {
        header: {
          ...form,
          fecha_vencimiento: fromInputDate(form.fecha_vencimiento),
        },
        items: cleanItems,
      };

      if (editingQuotation?.id) {
        await updateQuotation(editingQuotation.id, payload);
      } else {
        await createQuotation({
          ...payload,
          month: currentMonth,
        });
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar la cotización.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    // evita que todo "salte" cuando desaparece la barra del navegador
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 p-4 h-full">
      <div className="flex h-full items-start justify-center overflow-y-auto">
        <div className="w-full max-w-7xl max-h-[95vh] overflow-y-auto rounded-[28px] border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <p className="text-sm font-semibold text-accent-600">
                {editingQuotation ? "Editar cotización" : "Nueva cotización"}
              </p>
              <h3 className="mt-1 text-xl font-bold text-text-primary">
                {editingQuotation?.folio || "Captura de cotización"}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-primary"
            >
              Cerrar
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-6 p-5 lg:grid-cols-12"
          >
            <div className="space-y-4 lg:col-span-4">
              <div className="rounded-[24px] border border-border bg-background p-4">
                <h4 className="text-sm font-bold text-text-primary">
                  Datos del cliente
                </h4>

                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre del cliente"
                    value={form.cliente_nombre}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        cliente_nombre: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
                  />

                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={form.cliente_telefono}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        cliente_telefono: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={form.cliente_email}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        cliente_email: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
                  />

                  <select
                    value={form.estado}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, estado: e.target.value }))
                    }
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>

                  <input
                    type="date"
                    value={form.fecha_vencimiento}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        fecha_vencimiento: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
                  />

                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Descuento"
                    value={form.descuento}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        descuento: cleanNumericInput(e.target.value, {
                          allowDecimal: true,
                        }),
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-background p-4">
                <h4 className="text-sm font-bold text-text-primary">Resumen</h4>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Subtotal</span>
                    <span className="font-semibold text-text-primary">
                      {money(totals.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Descuento</span>
                    <span className="font-semibold text-text-primary">
                      {money(form.descuento || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Total</span>
                    <span className="font-bold text-text-primary">
                      {money(totals.total)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-success-100 bg-success-50 px-3 py-2">
                    <span className="text-success-700">
                      {form.estado === "completado"
                        ? "Ganancia real"
                        : "Ganancia estimada"}
                    </span>
                    <span className="font-bold text-success-700">
                      {money(totals.ganancia)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-60"
                >
                  {loading ? "Guardando..." : "Guardar cotización"}
                </button>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-8">
              <div className="rounded-[24px] border border-border bg-background p-4">
                <h4 className="text-sm font-bold text-text-primary">
                  Buscar productos
                </h4>

                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-border bg-surface pl-10 pr-4 text-sm text-text-primary outline-none focus:border-primary-400"
                  />
                </div>

                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                  {productResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-3 text-left transition hover:border-primary-200 hover:bg-surface-soft"
                    >
                      <div>
                        <p className="font-semibold text-text-primary">
                          {product.nombre}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {product.codigo || "Sin código"} ·{" "}
                          {product.unidad || "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-text-primary">
                          {money(product.precio || 0)}
                        </p>
                        <p className="text-xs text-text-muted">
                          costo: {money(product.precio_compra || 0)}
                        </p>
                      </div>
                    </button>
                  ))}

                  {!productResults.length && (
                    <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                      No hay productos para mostrar.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-background p-4">
                <h4 className="text-sm font-bold text-text-primary">
                  Productos agregados
                </h4>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          Producto
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          Cantidad
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          Precio
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          Importe
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          Ganancia
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {totals.rows.map((item, index) => (
                        <tr
                          key={`${item.producto_id}-${index}`}
                          className="border-b border-border"
                        >
                          <td className="px-3 py-3">
                            <p className="font-semibold text-text-primary">
                              {item.nombre_producto}
                            </p>
                            <p className="text-xs text-text-muted">
                              {item.codigo || "Sin código"} ·{" "}
                              {item.unidad || "-"}
                            </p>
                          </td>

                          <td className="px-3 py-3">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.cantidad}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "cantidad",
                                  cleanNumericInput(e.target.value, {
                                    allowDecimal: false,
                                  }),
                                )
                              }
                              className="h-10 w-24 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary-400"
                            />
                          </td>

                          <td className="px-3 py-3">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.precio_unitario}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "precio_unitario",
                                  cleanNumericInput(e.target.value, {
                                    allowDecimal: true,
                                  }),
                                )
                              }
                              className="h-10 w-28 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary-400"
                            />
                          </td>

                          <td className="px-3 py-3 text-sm font-semibold text-text-primary">
                            {money(item.importe)}
                          </td>

                          <td className="px-3 py-3 text-sm font-semibold text-success-700">
                            {money(item.ganancia_linea)}
                          </td>

                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-error-200 bg-error-50 text-error-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!totals.rows.length && (
                    <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                      Todavía no agregas productos.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function QuotationsPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    completadas: 0,
    canceladas: 0,
    vencidas: 0,
    totalVentas: 0,
    totalGananciaReal: 0,
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("todas");
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);

  const monthOptions = useMemo(() => buildLastMonthsOptions(18), []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);

    return () => clearTimeout(t);
  }, [searchInput]);

  async function loadData() {
    try {
      setLoading(true);

      const [listRes, summaryRes] = await Promise.all([
        fetchQuotations({
          page,
          month,
          search,
          status,
        }),
        fetchQuotationSummary(month),
      ]);

      setRows(listRes.rows);
      setTotalPages(listRes.totalPages);
      setSummary(summaryRes);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron cargar las cotizaciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [page, month, search, status]);

  async function handleCreate() {
    setEditingQuotation(null);
    setModalOpen(true);
  }

  async function handleEdit(id) {
    try {
      const quotation = await fetchQuotationById(id);
      setEditingQuotation(quotation);
      setModalOpen(true);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo cargar la cotización.");
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("¿Seguro que quieres eliminar esta cotización?");
    if (!ok) return;

    try {
      await deleteQuotation(id);
      await loadData();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo eliminar la cotización.");
    }
  }

  async function handleDownloadPdf(id) {
    try {
      const quotation = await fetchQuotationById(id);
      generateQuotationPDF(quotation);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo generar el PDF.");
    }
  }

  return (
    <section className="space-y-6">
      <QuotationFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        editingQuotation={editingQuotation}
        currentMonth={month}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Cotizaciones del mes
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                {summary.total}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-700">
              <FileText className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-sm text-text-muted">
            Total del mes seleccionado.
          </p>
        </article>

        <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Pendientes
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                {summary.pendientes}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-warning-100 bg-warning-50 text-warning-700">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-sm text-text-muted">
            A la espera de respuesta.
          </p>
        </article>

        <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                En proceso
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                {summary.enProceso}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-info-100 bg-info-50 text-info-700">
              <TimerReset className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-sm text-text-muted">
            Con seguimiento activo.
          </p>
        </article>

        <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Ganancia real
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                {money(summary.totalGananciaReal)}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-success-100 bg-success-50 text-success-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-sm text-text-muted">
            Solo cotizaciones completadas.
          </p>
        </article>
      </div>

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent-600">
              Gestión comercial
            </p>
            <h3 className="mt-1 text-xl font-bold text-text-primary md:text-2xl">
              Cotizaciones
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Busca, filtra, edita, elimina y genera PDF sin guardar archivos en
              storage.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            <Plus className="h-4 w-4" />
            Nueva cotización
          </button>
        </div>

        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por folio o cliente..."
                className="h-12 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary">
                <SlidersHorizontal className="h-4 w-4" />
                <select
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent outline-none"
                >
                  {monthOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="Todas"
              active={status === "todas"}
              onClick={() => {
                setStatus("todas");
                setPage(1);
              }}
            />
            <FilterPill
              label="Pendientes"
              active={status === "pendiente"}
              onClick={() => {
                setStatus("pendiente");
                setPage(1);
              }}
            />
            <FilterPill
              label="En proceso"
              active={status === "en_proceso"}
              onClick={() => {
                setStatus("en_proceso");
                setPage(1);
              }}
            />
            <FilterPill
              label="Completadas"
              active={status === "completado"}
              onClick={() => {
                setStatus("completado");
                setPage(1);
              }}
            />
            <FilterPill
              label="Canceladas"
              active={status === "cancelado"}
              onClick={() => {
                setStatus("cancelado");
                setPage(1);
              }}
            />
            <FilterPill
              label="Vencidas"
              active={status === "vencido"}
              onClick={() => {
                setStatus("vencido");
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="hidden xl:block">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-surface-soft">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Folio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Fechas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Ganancia
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((item) => {
                  const statusMeta = getStatusStyles(item.estado);
                  const StatusIcon = statusMeta.icon;

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-border transition hover:bg-surface-soft/70"
                    >
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {item.folio}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            Cotización registrada
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-text-primary">
                          {item.cliente_nombre}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-1 flex items-start gap-4">
                          <div className="inline-flex items-center gap-1 text-sm text-text-secondary">
                            <CalendarDays className="h-4 w-4 text-primary-500" />
                            <span>Creada: {formatDate(item.created_at)}</span>
                          </div>
                          <div className="inline-flex items-center gap-1 text-sm text-text-secondary">
                            <Clock3 className="h-4 w-4 text-accent-500" />
                            <span>
                              Vence: {formatDate(item.fecha_vencimiento)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusMeta.className}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusMeta.label}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-semibold text-text-primary">
                          {money(item.total)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-success-100 bg-success-50 px-3 py-2 text-sm font-semibold text-success-700">
                          <CircleDollarSign className="h-4 w-4" />
                          {money(item.ganancia || 0)}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(item.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                            title="Descargar PDF"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(item.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && !rows.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-text-muted"
                    >
                      No hay cotizaciones para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
          {rows.map((item) => {
            const statusMeta = getStatusStyles(item.estado);
            const StatusIcon = statusMeta.icon;

            return (
              <article
                key={item.id}
                className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {item.folio}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {item.cliente_nombre}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${statusMeta.className}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusMeta.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Fecha
                    </p>
                    <p className="mt-2 text-sm font-medium text-text-primary">
                      {formatDate(item.created_at)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Vence
                    </p>
                    <p className="mt-2 text-sm font-medium text-text-primary">
                      {formatDate(item.fecha_vencimiento)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Total
                    </p>
                    <p className="mt-2 text-sm font-bold text-text-primary">
                      {money(item.total)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Ganancia
                    </p>
                    <p className="mt-2 text-sm font-bold text-success-700">
                      {money(item.ganancia || 0)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(item.id)}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <Eye className="h-4 w-4" />
                    PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(item.id)}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}

          {!loading && !rows.length && (
            <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
              No hay cotizaciones para este filtro.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border p-5">
          <p className="text-sm text-text-secondary">
            Página {page} de {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-text-primary disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-text-primary disabled:opacity-50"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
