import { useEffect, useMemo, useState } from "react";
import supabase from "../../utils/supabase";
import * as XLSX from "xlsx";
import {
  Wallet,
  Search,
  Plus,
  Eye,
  Trash2,
  Receipt,
  Truck,
  Package,
  CircleDollarSign,
  CalendarDays,
  Building2,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  BanknoteArrowUp,
  BanknoteArrowDown,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCcw,
  BarChart3,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const PAGE_SIZE = 10;

function formatMXN(value) {
  const n = Number(value || 0);
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

/**
 * Convierte una fecha de negocio o ISO a Date LOCAL sin corrimiento por timezone.
 * - "2026-03-09"
 * - "2026-03-09T00:00:00+00:00"
 * - Date
 */
const BUSINESS_TZ = "America/Tijuana";

function parseBusinessDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "string") {
    const raw = value.slice(0, 10);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
      const [, year, month, day] = match;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  return null;
}

function parseTimestampDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfLocalDay(value) {
  const d = parseBusinessDate(value);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(value) {
  const d = parseBusinessDate(value);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function formatDate(value, { isTimestamp = false } = {}) {
  const date = isTimestamp
    ? parseTimestampDate(value)
    : parseBusinessDate(value);

  if (!date) return "Sin fecha";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(isTimestamp ? { timeZone: BUSINESS_TZ } : {}),
  });
}

function formatInputDate(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const raw = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  }

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getTijuanaDayKeyFromTimestamp(value) {
  const d = parseTimestampDate(value);
  if (!d) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getDayLabelFromBusinessDate(value) {
  const d = parseBusinessDate(value);
  if (!d) return "";

  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start: formatInputDate(start),
    end: formatInputDate(end),
  };
}

function getThisYearRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);

  return {
    start: formatInputDate(start),
    end: formatInputDate(end),
  };
}

function getLast30DaysRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

  return {
    start: formatInputDate(start),
    end: formatInputDate(now),
  };
}

function parseNumberish(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeExpenseType(type) {
  if (type === "compra") return "gasto_compra";
  if (type === "envio") return "gasto_envio";
  if (type === "operativo") return "gasto_operativo";
  return "gasto_extra";
}

function getMovementType(type) {
  if (type === "gasto_compra") {
    return {
      label: "Gasto de compra",
      icon: Package,
      className: "border-primary-100 bg-primary-50 text-primary-700",
    };
  }

  if (type === "gasto_envio") {
    return {
      label: "Gasto de envío",
      icon: Truck,
      className: "border-info-100 bg-info-50 text-info-700",
    };
  }

  if (type === "gasto_operativo") {
    return {
      label: "Gasto operativo",
      icon: Wallet,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  if (type === "ganancia_cotizacion") {
    return {
      label: "Ganancia de cotización",
      icon: TrendingUp,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  return {
    label: "Gasto extra",
    icon: Receipt,
    className: "border-accent-100 bg-accent-50 text-accent-700",
  };
}

function getNatureStyles(nature) {
  if (nature === "ganancia") {
    return {
      label: "Ganancia",
      icon: BanknoteArrowUp,
      className: "border-success-100 bg-success-50 text-success-700",
      amountClass: "border-success-100 bg-success-50 text-success-700",
    };
  }

  return {
    label: "Gasto",
    icon: BanknoteArrowDown,
    className: "border-error-100 bg-error-50 text-error-700",
    amountClass: "border-error-100 bg-error-50 text-error-700",
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

function SummaryCard({ icon: Icon, title, value, note, tone = "primary" }) {
  const toneStyles =
    tone === "success"
      ? "border-success-100 bg-success-50 text-success-700"
      : tone === "warning"
        ? "border-warning-100 bg-warning-50 text-warning-700"
        : tone === "error"
          ? "border-error-100 bg-error-50 text-error-700"
          : "border-primary-100 bg-primary-50 text-primary-700";

  return (
    <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneStyles}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-sm text-text-muted">{note}</p>
    </article>
  );
}

function EmptyState({ loading }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-soft">
        <BarChart3 className="h-7 w-7 text-text-muted" />
      </div>

      <h4 className="mt-4 text-lg font-bold text-text-primary">
        {loading ? "Cargando ganancias..." : "No hay resultados"}
      </h4>

      <p className="mt-2 max-w-md text-sm text-text-secondary">
        {loading
          ? "Estamos trayendo tus cotizaciones completadas y sus gastos asociados."
          : "No se encontraron ganancias para el filtro actual. Porque claro, la vida no siempre coopera."}
      </p>
    </div>
  );
}

function ExpenseModal({
  open,
  onClose,
  onSaved,
  options = [],
  selectedQuoteId = "",
  editingExpense = null,
}) {
  const [form, setForm] = useState({
    cotizacion_id: "",
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
        cotizacion_id: editingExpense.cotizacion_id || "",
        concepto: editingExpense.concepto || "",
        descripcion: editingExpense.descripcion || "",
        monto: editingExpense.monto ?? "",
        fecha: formatInputDate(editingExpense.fecha),
        tipo: editingExpense.tipo || "extra",
      });
    } else {
      setForm({
        cotizacion_id: selectedQuoteId || "",
        concepto: "",
        descripcion: "",
        monto: "",
        fecha: formatInputDate(new Date()),
        tipo: "extra",
      });
    }

    setError("");
  }, [open, selectedQuoteId, editingExpense]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  if (!open) return null;

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
        cotizacion_id: form.cotizacion_id || null,
        concepto: form.concepto.trim(),
        descripcion: form.descripcion.trim() || null,
        monto: parseNumberish(form.monto),
        fecha: form.fecha || formatInputDate(new Date()),
        tipo: form.tipo,
      };

      let result;

      if (editingExpense?.id) {
        result = await supabase
          .from("gastos")
          .update(payload)
          .eq("id", editingExpense.id);
      } else {
        result = await supabase.from("gastos").insert(payload);
      }

      if (result.error) throw result.error;

      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "No se pudo guardar el gasto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex h-full items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-2xl rounded-[28px] border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5 md:p-6">
          <div>
            <p className="text-sm font-semibold text-accent-600">
              {editingExpense ? "Editar gasto" : "Nuevo gasto"}
            </p>
            <h3 className="mt-1 text-xl font-bold text-text-primary">
              {editingExpense ? "Modificar gasto" : "Registrar gasto"}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Puedes ligarlo a una cotización o dejarlo independiente.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-border-strong hover:bg-surface-soft hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                Cotización <span className="text-text-muted">(opcional)</span>
              </label>
              <select
                value={form.cotizacion_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    cotizacion_id: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">Sin cotización asociada</option>
                {options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.folio} · {item.cliente_nombre || "Sin cliente"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                Concepto
              </label>
              <input
                type="text"
                value={form.concepto}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, concepto: e.target.value }))
                }
                placeholder="Ej. Envío de mercancía"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                Tipo
              </label>
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tipo: e.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="compra">Compra</option>
                <option value="envio">Envío</option>
                <option value="operativo">Operativo</option>
                <option value="extra">Extra</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                Monto
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.monto}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, monto: e.target.value }))
                }
                placeholder="0.00"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                Fecha
              </label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fecha: e.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                Descripción
              </label>
              <textarea
                rows={4}
                value={form.descripcion}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, descripcion: e.target.value }))
                }
                placeholder="Opcional"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
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
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const defaultRange = useMemo(() => getCurrentMonthRange(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState(defaultRange.start);
  const [dateTo, setDateTo] = useState(defaultRange.end);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteItem, setSelectedDeleteItem] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [productRows, setProductRows] = useState([]);

  const [page, setPage] = useState(1);

  const [quoteRows, setQuoteRows] = useState([]);
  const [expenseRows, setExpenseRows] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);

  async function fetchData(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: quotes, error: quoteError } = await supabase
        .from("cotizaciones")
        .select(
          `
          id,
          folio,
          cliente_nombre,
          cliente_telefono,
          cliente_email,
          subtotal,
          descuento,
          total,
          gastos,
          ganancia,
          fecha_vencimiento,
          fecha_completado,
          notas,
          created_at
        `,
        )
        .not("fecha_completado", "is", null)
        .order("fecha_completado", { ascending: false });

      if (quoteError) throw quoteError;

      const { data: expenses, error: expenseError } = await supabase
        .from("gastos")
        .select(
          `
          id,
          concepto,
          descripcion,
          monto,
          fecha,
          cotizacion_id,
          created_at,
          tipo
        `,
        )
        .order("fecha", { ascending: false });

      if (expenseError) throw expenseError;

      const { data: details, error: detailError } = await supabase.from(
        "cotizacion_detalles",
      ).select(`
          id,
          cotizacion_id,
          producto_id,
          cantidad
        `);

      if (detailError) throw detailError;

      const { data: products, error: productError } = await supabase.from(
        "productos",
      ).select(`
          id,
          nombre,
          precio_compra,
          precio_utilidad
        `);

      if (productError) throw productError;

      setQuoteRows(Array.isArray(quotes) ? quotes : []);
      setExpenseRows(Array.isArray(expenses) ? expenses : []);
      setDetailRows(Array.isArray(details) ? details : []);
      setProductRows(Array.isArray(products) ? products : []);
    } catch (err) {
      console.error("Error cargando ganancias:", err);
      setQuoteRows([]);
      setExpenseRows([]);
      setDetailRows([]);
      setProductRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openDetailModal(item) {
    setSelectedDetail(item);
    setDetailModalOpen(true);
  }

  function openDeleteModal(item) {
    if (!item?.expenses?.length) return;
    setSelectedDeleteItem(item);
    setDeleteModalOpen(true);
  }

  function openEditExpense(expense) {
    setEditingExpense(expense);
    setSelectedQuoteId(expense?.cotizacion_id || "");
    setModalOpen(true);
  }

  const preparedRows = useMemo(() => {
    const expenseMap = new Map();
    const detailMap = new Map();
    const productMap = new Map();

    for (const expense of expenseRows) {
      const key = expense.cotizacion_id;
      if (!expenseMap.has(key)) {
        expenseMap.set(key, []);
      }
      expenseMap.get(key).push(expense);
    }

    for (const detail of detailRows) {
      const key = detail.cotizacion_id;
      if (!detailMap.has(key)) {
        detailMap.set(key, []);
      }
      detailMap.get(key).push(detail);
    }

    for (const product of productRows) {
      productMap.set(product.id, product);
    }

    return quoteRows.map((quote) => {
      const relatedExpenses = expenseMap.get(quote.id) || [];
      const relatedDetails = detailMap.get(quote.id) || [];

      const totalExpenses = relatedExpenses.reduce(
        (acc, item) => acc + parseNumberish(item.monto),
        0,
      );

      const utilidadBruta = relatedDetails.reduce((acc, detail) => {
        const product = productMap.get(detail.producto_id);
        const utilidadUnidad = parseNumberish(product?.precio_utilidad);
        const cantidad = parseNumberish(detail.cantidad || 0);
        return acc + utilidadUnidad * cantidad;
      }, 0);

      const netProfit = utilidadBruta - totalExpenses;
      const quoteDateValue = quote.fecha_completado || quote.created_at;

      return {
        id: quote.id,
        folio: quote.folio || "Sin folio",
        referencia: quote.folio || "Sin folio",
        cliente: quote.cliente_nombre || "Cliente sin nombre",
        cliente_email: quote.cliente_email || "",
        cliente_telefono: quote.cliente_telefono || "",
        fechaISO: quoteDateValue,
        fecha: formatDate(quoteDateValue, { isTimestamp: true }),

        totalCotizacion: parseNumberish(quote.total),
        utilidadBruta,
        gastos: totalExpenses,
        ganancia: netProfit,

        estado: "registrado",
        naturaleza: netProfit >= 0 ? "ganancia" : "gasto",
        tipo: "ganancia_cotizacion",
        concepto: `Ganancia por cotización ${quote.folio || ""}`.trim(),
        tercero: quote.cliente_nombre || "Cliente sin nombre",
        notas: quote.notas || "",
        expenseCount: relatedExpenses.length,
        expenses: relatedExpenses,

        detalles: relatedDetails.map((detail) => {
          const product = productMap.get(detail.producto_id);
          const cantidad = parseNumberish(detail.cantidad || 0);
          const precioUtilidad = parseNumberish(product?.precio_utilidad);

          return {
            ...detail,
            producto_nombre: product?.nombre || "Producto",
            precio_utilidad: precioUtilidad,
            utilidad_total: cantidad * precioUtilidad,
          };
        }),
      };
    });
  }, [quoteRows, expenseRows, detailRows, productRows]);

  const filteredRows = useMemo(() => {
    const from = dateFrom ? startOfLocalDay(dateFrom) : null;
    const to = dateTo ? endOfLocalDay(dateTo) : null;
    const term = search.trim().toLowerCase();

    return preparedRows.filter((item) => {
      const itemDate = item.fechaISO ? parseTimestampDate(item.fechaISO) : null;

      if (from && itemDate && itemDate < from) return false;
      if (to && itemDate && itemDate > to) return false;

      if (quickFilter === "ganancias" && item.naturaleza !== "ganancia") {
        return false;
      }

      if (quickFilter === "gastos" && item.naturaleza !== "gasto") {
        return false;
      }

      if (!term) return true;

      const haystack = [
        item.concepto,
        item.folio,
        item.referencia,
        item.cliente,
        item.cliente_email,
        item.cliente_telefono,
        item.notas,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [preparedRows, dateFrom, dateTo, search, quickFilter]);

  const filteredStandaloneExpenses = useMemo(() => {
    const from = dateFrom ? startOfLocalDay(dateFrom) : null;
    const to = dateTo ? endOfLocalDay(dateTo) : null;
    const term = search.trim().toLowerCase();

    return expenseRows.filter((expense) => {
      if (expense.cotizacion_id) return false;

      const expenseDate = expense.fecha
        ? startOfLocalDay(expense.fecha)
        : parseTimestampDate(expense.created_at);

      if (from && expenseDate && expenseDate < from) return false;
      if (to && expenseDate && expenseDate > to) return false;

      if (quickFilter === "ganancias") return false;

      if (!term) return true;

      const haystack = [expense.concepto, expense.descripcion, expense.tipo]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [expenseRows, dateFrom, dateTo, search, quickFilter]);

  const unifiedRows = useMemo(() => {
    const profitRows = filteredRows.map((item) => ({
      id: `profit-${item.id}`,
      rawId: item.id,
      rowType: "ganancia",
      concepto: item.concepto,
      referencia: item.referencia,
      tipo: item.tipo,
      naturaleza: item.naturaleza,
      cliente: item.cliente,
      fecha: item.fecha,
      fechaISO: item.fechaISO,
      gastos: parseNumberish(item.gastos),
      ganancia: parseNumberish(item.ganancia),
      totalCotizacion: parseNumberish(item.totalCotizacion),
      expenseCount: item.expenseCount,
      expenses: item.expenses || [],
      cliente_email: item.cliente_email || "",
      cliente_telefono: item.cliente_telefono || "",
      notas: item.notas || "",
    }));

    const standaloneExpenseRows = filteredStandaloneExpenses.map((expense) => {
      const monto = parseNumberish(expense.monto);
      const normalizedType = normalizeExpenseType(expense.tipo);
      const expenseDateValue = expense.fecha || expense.created_at;

      return {
        id: `expense-${expense.id}`,
        rawId: expense.id,
        rowType: "gasto",
        concepto: expense.concepto || "Gasto independiente",
        referencia: "Sin cotización",
        tipo: normalizedType,
        naturaleza: "gasto",
        cliente: "Sin cotización asociada",
        fecha: expense.fecha
          ? formatDate(expense.fecha)
          : formatDate(expense.created_at, { isTimestamp: true }),
        fechaISO: expenseDateValue,
        gastos: monto,
        ganancia: -monto,
        totalCotizacion: 0,
        expenseCount: 1,
        expenses: [expense],
        cliente_email: "",
        cliente_telefono: "",
        notas: expense.descripcion || "",
      };
    });

    function resolveRowDateMs(row) {
      if (!row?.fechaISO) return 0;

      if (row.rowType === "ganancia") {
        return parseTimestampDate(row.fechaISO)?.getTime() || 0;
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(String(row.fechaISO))) {
        return startOfLocalDay(row.fechaISO)?.getTime() || 0;
      }

      return parseTimestampDate(row.fechaISO)?.getTime() || 0;
    }

    return [...profitRows, ...standaloneExpenseRows].sort((a, b) => {
      return resolveRowDateMs(b) - resolveRowDateMs(a);
    });
  }, [filteredRows, filteredStandaloneExpenses]);

  const summary = useMemo(() => {
    const grossProfitTotal = filteredRows.reduce(
      (acc, item) => acc + parseNumberish(item.utilidadBruta),
      0,
    );

    const linkedExpensesTotal = filteredRows.reduce(
      (acc, item) => acc + parseNumberish(item.gastos),
      0,
    );

    const standaloneExpensesTotal = filteredStandaloneExpenses.reduce(
      (acc, item) => acc + parseNumberish(item.monto),
      0,
    );

    const expensesTotal = linkedExpensesTotal + standaloneExpensesTotal;
    const netTotal = grossProfitTotal - expensesTotal;

    const withExpenses = filteredRows.filter((item) => item.gastos > 0).length;

    return {
      quoteTotal: grossProfitTotal,
      expensesTotal,
      netTotal,
      withExpenses,
    };
  }, [filteredRows, filteredStandaloneExpenses]);

  const chartData = useMemo(() => {
    const map = new Map();

    for (const item of filteredRows) {
      const key = getTijuanaDayKeyFromTimestamp(item.fechaISO);
      if (!key) continue;

      if (!map.has(key)) {
        map.set(key, {
          key,
          label: getDayLabelFromBusinessDate(key),
          netoDia: 0,
        });
      }

      const bucket = map.get(key);
      bucket.netoDia += parseNumberish(item.ganancia);
    }

    for (const expense of filteredStandaloneExpenses) {
      const key = expense.fecha
        ? expense.fecha.slice(0, 10)
        : getTijuanaDayKeyFromTimestamp(expense.created_at);

      if (!key) continue;

      if (!map.has(key)) {
        map.set(key, {
          key,
          label: getDayLabelFromBusinessDate(key),
          netoDia: 0,
        });
      }

      const bucket = map.get(key);
      bucket.netoDia -= parseNumberish(expense.monto);
    }

    const sorted = Array.from(map.values()).sort((a, b) =>
      a.key.localeCompare(b.key),
    );

    let acumulado = 0;

    return sorted.map((item) => {
      acumulado += item.netoDia;
      return {
        ...item,
        neto: acumulado,
      };
    });
  }, [filteredRows, filteredStandaloneExpenses]);

  const chartStrokeColor = useMemo(() => {
    if (!chartData.length) return "#16a34a";
    const lastValue = chartData[chartData.length - 1]?.neto || 0;
    return lastValue >= 0 ? "#16a34a" : "#dc2626";
  }, [chartData]);

  const totalPages = Math.max(1, Math.ceil(unifiedRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, quickFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return unifiedRows.slice(start, start + PAGE_SIZE);
  }, [unifiedRows, page]);

  function exportToExcel() {
    const quoteRowsExcel = filteredRows.map((item) => ({
      Tipo: "Cotización completada",
      Folio: item.folio,
      Cliente: item.cliente,
      Fecha: item.fecha,
      "Venta total": parseNumberish(item.totalCotizacion),
      "Utilidad bruta real": parseNumberish(item.utilidadBruta),
      "Gastos asociados": parseNumberish(item.gastos),
      "Ganancia neta": parseNumberish(item.ganancia),
      "Cantidad de gastos": item.expenseCount,
      Email: item.cliente_email,
      Teléfono: item.cliente_telefono,
      Notas: item.notas || "",
    }));

    const standaloneExpensesExcel = filteredStandaloneExpenses.map((item) => ({
      Tipo: "Gasto independiente",
      Folio: "",
      Cliente: "",
      Fecha: item.fecha
        ? formatDate(item.fecha)
        : formatDate(item.created_at, { isTimestamp: true }),
      "Venta total": 0,
      "Utilidad bruta real": 0,
      "Gastos asociados": parseNumberish(item.monto),
      "Ganancia neta": -parseNumberish(item.monto),
      "Cantidad de gastos": 1,
      Email: "",
      Teléfono: "",
      Notas: item.descripcion || item.concepto || "",
    }));

    const rows = [...quoteRowsExcel, ...standaloneExpensesExcel];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ganancias");

    const from = dateFrom || "inicio";
    const to = dateTo || "hoy";
    XLSX.writeFile(workbook, `ganancias_${from}_a_${to}.xlsx`);
  }

  function openNewExpense(quoteId = "") {
    setEditingExpense(null);
    setSelectedQuoteId(quoteId);
    setModalOpen(true);
  }

  async function deleteExpense(expenseId) {
    if (!expenseId) return;

    try {
      setDeletingExpenseId(expenseId);

      const { error } = await supabase
        .from("gastos")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      setDeleteModalOpen(false);
      setSelectedDeleteItem(null);
      await fetchData(true);
    } catch (err) {
      console.error("Error eliminando gasto:", err);
      alert(err.message || "No se pudo eliminar el gasto.");
    } finally {
      setDeletingExpenseId(null);
    }
  }

  return (
    <section className="space-y-6">
      <ExpenseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
          setSelectedQuoteId("");
        }}
        onSaved={() => fetchData(true)}
        options={quoteRows}
        selectedQuoteId={selectedQuoteId}
        editingExpense={editingExpense}
      />

      {detailModalOpen && selectedDetail ? (
        <div className="fixed inset-0 z-49 flex h-full items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-2xl rounded-[28px] border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-5 md:p-6">
              <div>
                <p className="text-sm font-semibold text-accent-600">Detalle</p>
                <h3 className="mt-1 text-xl font-bold text-text-primary">
                  {selectedDetail.rowType === "ganancia"
                    ? "Detalle de ganancia"
                    : "Detalle de gasto"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedDetail(null);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-border-strong hover:bg-surface-soft hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5 md:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-surface-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Concepto
                  </p>
                  <p className="mt-2 text-sm font-medium text-text-primary">
                    {selectedDetail.concepto}
                  </p>
                </div>

                <div className="rounded-2xl bg-surface-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Referencia
                  </p>
                  <p className="mt-2 text-sm font-medium text-text-primary">
                    {selectedDetail.referencia}
                  </p>
                </div>

                <div className="rounded-2xl bg-surface-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Cliente
                  </p>
                  <p className="mt-2 text-sm font-medium text-text-primary">
                    {selectedDetail.cliente}
                  </p>
                </div>

                <div className="rounded-2xl bg-surface-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Fecha
                  </p>
                  <p className="mt-2 text-sm font-medium text-text-primary">
                    {selectedDetail.fecha}
                  </p>
                </div>

                <div className="rounded-2xl bg-surface-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Gastos
                  </p>
                  <p className="mt-2 text-sm font-bold text-error-700">
                    {formatMXN(selectedDetail.gastos)}
                  </p>
                </div>

                <div className="rounded-2xl bg-surface-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Neto
                  </p>
                  <p
                    className={`mt-2 text-sm font-bold ${
                      selectedDetail.ganancia >= 0
                        ? "text-success-700"
                        : "text-error-700"
                    }`}
                  >
                    {formatMXN(selectedDetail.ganancia)}
                  </p>
                </div>
              </div>

              {selectedDetail.expenses?.length ? (
                <div className="rounded-2xl border border-border bg-surface-soft p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    Gastos relacionados
                  </p>

                  <div className="mt-3 space-y-3">
                    {selectedDetail.expenses.map((gasto) => (
                      <div
                        key={gasto.id}
                        className="rounded-2xl border border-border bg-surface p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {gasto.concepto}
                            </p>
                            <p className="mt-1 text-sm text-text-secondary">
                              {gasto.descripcion || "Sin descripción"}
                            </p>
                            <p className="mt-2 text-sm font-bold text-error-700">
                              {formatMXN(gasto.monto)}
                            </p>
                            <p className="mt-1 text-xs text-text-muted">
                              {gasto.fecha
                                ? formatDate(gasto.fecha)
                                : formatDate(gasto.created_at, {
                                    isTimestamp: true,
                                  })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditExpense(gasto)}
                              className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openDeleteModal({
                                  expenses: [gasto],
                                })
                              }
                              className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700"
                            >
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
          </div>
        </div>
      ) : null}

      {deleteModalOpen && selectedDeleteItem ? (
        <div className="fixed inset-0 z-50 flex h-full items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-[28px] border border-border bg-surface shadow-2xl">
            <div className="border-b border-border p-5">
              <p className="text-sm font-semibold text-error-600">Eliminar</p>
              <h3 className="mt-1 text-xl font-bold text-text-primary">
                Confirmar eliminación
              </h3>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm text-text-secondary">
                Vas a eliminar este gasto:
              </p>

              <div className="rounded-2xl border border-border bg-surface-soft p-4">
                <p className="text-sm font-semibold text-text-primary">
                  {selectedDeleteItem.expenses[0]?.concepto || "Sin concepto"}
                </p>
                <p className="mt-1 text-sm font-bold text-error-700">
                  {formatMXN(selectedDeleteItem.expenses[0]?.monto || 0)}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSelectedDeleteItem(null);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteExpense(selectedDeleteItem.expenses[0]?.id)
                  }
                  disabled={
                    deletingExpenseId === selectedDeleteItem.expenses[0]?.id
                  }
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-error-600 px-4 text-sm font-semibold text-white transition hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deletingExpenseId === selectedDeleteItem.expenses[0]?.id
                    ? "Eliminando..."
                    : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={TrendingDown}
          title="Gastos descontados"
          value={formatMXN(summary.expensesTotal)}
          note="Suma de los gastos asociados a las cotizaciones filtradas."
          tone="error"
        />

        <SummaryCard
          icon={TrendingUp}
          title="Ventas completadas"
          value={formatMXN(summary.quoteTotal)}
          note="Total de cotizaciones completadas dentro del filtro actual."
          tone="success"
        />

        <SummaryCard
          icon={CircleDollarSign}
          title="Ganancia neta"
          value={formatMXN(summary.netTotal)}
          note="Cotizaciones completadas menos gastos registrados."
          tone="primary"
        />

        <SummaryCard
          icon={AlertTriangle}
          title="Cotizaciones con gastos"
          value={`${summary.withExpenses}`}
          note="Cantidad de cotizaciones a las que ya se les cargaron gastos."
          tone="warning"
        />
      </div>

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent-600">
              Gestión financiera
            </p>
            <h3 className="mt-1 text-xl font-bold text-text-primary md:text-2xl">
              Ganancias por cotización
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
              Aquí solo ves lo que ganaste realmente: cotizaciones completadas
              menos gastos asociados. Increíble concepto, llevar cuentas claras.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => fetchData(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
            >
              <RefreshCcw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>

            <button
              type="button"
              onClick={() => openNewExpense("")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              <Plus className="h-4 w-4" />
              Registrar gasto
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por folio, cliente, correo, teléfono..."
                className="h-12 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2">
                <CalendarDays className="h-4 w-4 text-text-muted" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent text-sm text-text-primary outline-none"
                />
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2">
                <CalendarDays className="h-4 w-4 text-text-muted" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent text-sm text-text-primary outline-none"
                />
              </div>

              <button
                type="button"
                onClick={exportToExcel}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
              >
                <Download className="h-4 w-4" />
                Exportar Excel
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="Todos"
              active={quickFilter === "todos"}
              onClick={() => setQuickFilter("todos")}
            />
            <FilterPill
              label="Ganancias"
              active={quickFilter === "ganancias"}
              onClick={() => setQuickFilter("ganancias")}
            />
            <FilterPill
              label="Gastos"
              active={quickFilter === "gastos"}
              onClick={() => setQuickFilter("gastos")}
            />
            <FilterPill
              label="Mes actual"
              active={false}
              onClick={() => {
                const range = getCurrentMonthRange();
                setDateFrom(range.start);
                setDateTo(range.end);
              }}
            />
            <FilterPill
              label="Últimos 30 días"
              active={false}
              onClick={() => {
                const range = getLast30DaysRange();
                setDateFrom(range.start);
                setDateTo(range.end);
              }}
            />
            <FilterPill
              label="Año actual"
              active={false}
              onClick={() => {
                const range = getThisYearRange();
                setDateFrom(range.start);
                setDateTo(range.end);
              }}
            />
          </div>
        </div>

        <div className="border-b border-border p-5 md:p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-text-primary">
              Evolución neta
            </p>
            <p className="text-sm text-text-secondary">
              Tendencia acumulada de ganancias y gastos dentro del rango
              seleccionado.
            </p>
          </div>

          <div className="h-[320px] w-full rounded-[28px] border border-border bg-surface-soft p-4 md:p-5">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="2 6" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      `$${Number(v || 0).toLocaleString("es-MX")}`
                    }
                  />
                  <Tooltip
                    formatter={(value) => [formatMXN(value), "Neto acumulado"]}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid var(--color-border, #e5e7eb)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="neto"
                    name="Neto"
                    stroke={chartStrokeColor}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 5,
                      stroke: chartStrokeColor,
                      fill: chartStrokeColor,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-text-secondary">
                No hay datos para la gráfica en el filtro actual.
              </div>
            )}
          </div>
        </div>

        <div className="hidden xl:block">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-surface-soft">
                <tr>
                  <th className="w-[20%] px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Concepto
                  </th>
                  <th className="w-[12%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Referencia
                  </th>
                  <th className="w-[12%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Tipo
                  </th>
                  <th className="w-[11%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Naturaleza
                  </th>
                  <th className="w-[15%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Cliente
                  </th>
                  <th className="w-[11%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Fecha
                  </th>
                  <th className="w-[10%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Gastos
                  </th>
                  <th className="w-[12%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Ganancia
                  </th>
                  <th className="w-[12%] px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length ? (
                  paginatedRows.map((item) => {
                    const movementType = getMovementType(item.tipo);
                    const TypeIcon = movementType.icon;
                    const nature = getNatureStyles(item.naturaleza);
                    const NatureIcon = nature.icon;

                    return (
                      <tr
                        key={item.id}
                        className="border-t border-border align-top transition hover:bg-surface-soft/70"
                      >
                        <td className="px-6 py-5">
                          <div className="pr-3">
                            <p className="line-clamp-2 text-sm font-semibold leading-6 text-text-primary">
                              {item.concepto}
                            </p>
                            <p className="mt-1 text-xs text-text-muted">
                              {item.rowType === "ganancia"
                                ? `${item.expenseCount} gasto(s) asociado(s)`
                                : "Gasto independiente"}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-border bg-surface-soft px-3 py-2 text-sm font-medium text-text-primary">
                            <FileText className="h-4 w-4 shrink-0 text-primary-500" />
                            <span className="truncate">{item.referencia}</span>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${movementType.className}`}
                          >
                            <TypeIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {movementType.label}
                            </span>
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${nature.className}`}
                          >
                            <NatureIcon className="h-3.5 w-3.5 shrink-0" />
                            {nature.label}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex items-start gap-2 pr-2">
                            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                            <span className="line-clamp-2 text-sm leading-5 text-text-primary">
                              {item.cliente}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
                            <CalendarDays className="h-4 w-4 shrink-0 text-primary-500" />
                            <span className="whitespace-nowrap">
                              {item.fecha}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <div className="inline-flex whitespace-nowrap items-center gap-2 rounded-xl border border-error-100 bg-error-50 px-3 py-2 text-sm font-bold text-error-700">
                            <TrendingDown className="h-4 w-4 shrink-0" />
                            {formatMXN(item.gastos)}
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <div
                            className={`inline-flex whitespace-nowrap items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${nature.amountClass}`}
                          >
                            <CircleDollarSign className="h-4 w-4 shrink-0" />
                            {formatMXN(item.ganancia)}
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              title="Ver gastos"
                              onClick={() => openDetailModal(item)}
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              title="Editar gasto"
                              disabled={!item.expenses.length}
                              onClick={() => openEditExpense(item.expenses[0])}
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Receipt className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              title="Agregar gasto"
                              onClick={() =>
                                openNewExpense(
                                  item.rowType === "ganancia" ? item.rawId : "",
                                )
                              }
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                            >
                              <Plus className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              title="Eliminar"
                              disabled={!item.expenses.length}
                              onClick={() => openDeleteModal(item)}
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState loading={loading} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
          {paginatedRows.length ? (
            paginatedRows.map((item) => {
              const movementType = getMovementType(item.tipo);
              const TypeIcon = movementType.icon;
              const nature = getNatureStyles(item.naturaleza);
              const NatureIcon = nature.icon;

              return (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {item.concepto}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {item.referencia}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${nature.className}`}
                      >
                        <NatureIcon className="h-3.5 w-3.5" />
                        {nature.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-surface-soft p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Cliente
                      </p>
                      <p className="mt-2 text-sm font-medium text-text-primary">
                        {item.cliente}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-surface-soft p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Fecha
                      </p>
                      <p className="mt-2 text-sm font-medium text-text-primary">
                        {item.fecha}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-surface-soft p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Gastos
                      </p>
                      <p className="mt-2 text-sm font-bold text-error-700">
                        {formatMXN(item.gastos)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-surface-soft p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Ganancia
                      </p>
                      <p
                        className={`mt-2 text-sm font-bold ${
                          item.ganancia >= 0
                            ? "text-success-700"
                            : "text-error-700"
                        }`}
                      >
                        {formatMXN(item.ganancia)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${movementType.className}`}
                    >
                      <TypeIcon className="h-3.5 w-3.5" />
                      {movementType.label}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-text-primary">
                      {item.rowType === "ganancia"
                        ? `${item.expenseCount} gasto(s)`
                        : "Gasto independiente"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openDetailModal(item)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </button>

                    <button
                      type="button"
                      disabled={!item.expenses.length}
                      onClick={() => openEditExpense(item.expenses[0])}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Receipt className="h-4 w-4" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openNewExpense(
                          item.rowType === "ganancia" ? item.rawId : "",
                        )
                      }
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                    >
                      <Plus className="h-4 w-4" />
                      Gasto
                    </button>

                    <button
                      type="button"
                      disabled={!item.expenses.length}
                      onClick={() => openDeleteModal(item)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingExpenseId &&
                      item.expenses[0]?.id === deletingExpenseId
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState loading={loading} />
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-border p-5 md:p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-text-secondary">
            Mostrando{" "}
            <span className="font-semibold text-text-primary">
              {unifiedRows.length ? (page - 1) * PAGE_SIZE + 1 : 0}
            </span>{" "}
            a{" "}
            <span className="font-semibold text-text-primary">
              {Math.min(page * PAGE_SIZE, unifiedRows.length)}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-text-primary">
              {unifiedRows.length}
            </span>{" "}
            resultados
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <div className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary">
              Página {page} de {totalPages}
            </div>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
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
