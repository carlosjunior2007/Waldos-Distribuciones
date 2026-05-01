import { useEffect, useMemo, useState } from "react";
import supabase from "../../utils/supabase";
import * as XLSX from "xlsx";

import {
  Wallet,
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
  RefreshCcw,
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

import SummaryCard from "../../components/ui/SummaryCard";
import FilterPill from "../../components/ui/FilterPill";
import SearchInput from "../../components/ui/SearchInput";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal";
import EmptyState from "../../components/ui/EmptyState";
import ActionIconButton from "../../components/ui/ActionIconButton";

import { formatMoney, parseNumberish } from "../../utils/formatters";
import {
  formatInputDate,
  parseBusinessDate,
  parseTimestampDate,
} from "../../utils/dates";
import {
  getCurrentMonthRange,
  getThisYearRange,
  getLast30DaysRange,
} from "../../utils/ranges";

const PAGE_SIZE = 10;

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
  const date = isTimestamp ? parseTimestampDate(value) : parseBusinessDate(value);

  if (!date) return "Sin fecha";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(isTimestamp ? { timeZone: "America/Tijuana" } : {}),
  });
}

function getTijuanaDayKeyFromTimestamp(value) {
  const d = parseTimestampDate(value);
  if (!d) return null;
  return formatInputDate(d);
}

function getDayLabelFromBusinessDate(value) {
  const d = parseBusinessDate(value);
  if (!d) return "";

  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
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

      const result = editingExpense?.id
        ? await supabase.from("gastos").update(payload).eq("id", editingExpense.id)
        : await supabase.from("gastos").insert(payload);

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
    <Modal
      open={open}
      onClose={onClose}
      title={editingExpense ? "Modificar gasto" : "Registrar gasto"}
      subtitle="Puedes ligarlo a una cotización o dejarlo independiente."
      width="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="p-5 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-text-primary">
              Cotización <span className="text-text-muted">(opcional)</span>
            </span>

            <select
              value={form.cotizacion_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, cotizacion_id: e.target.value }))
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
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">
              Concepto
            </span>

            <input
              type="text"
              value={form.concepto}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, concepto: e.target.value }))
              }
              placeholder="Ej. Envío de mercancía"
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">Tipo</span>

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
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">Monto</span>

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
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">Fecha</span>

            <input
              type="date"
              value={form.fecha}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fecha: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>

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
              className="min-h-[110px] w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
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
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft sm:w-auto"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
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

function DetailModal({ open, item, onClose, onEditExpense, onDeleteExpense }) {
  if (!item) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item.rowType === "ganancia" ? "Detalle de ganancia" : "Detalle de gasto"}
      subtitle="Detalle del movimiento seleccionado."
      width="max-w-2xl"
      zIndex="z-[80]"
    >
      <div className="space-y-4 p-5 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ["Concepto", item.concepto],
            ["Referencia", item.referencia],
            ["Cliente", item.cliente],
            ["Fecha", item.fecha],
            ["Gastos", formatMoney(item.gastos)],
            ["Neto", formatMoney(item.ganancia)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                {label}
              </p>
              <p className="mt-2 text-sm font-medium text-text-primary">
                {value}
              </p>
            </div>
          ))}
        </div>

        {item.expenses?.length ? (
          <div className="rounded-2xl border border-border bg-surface-soft p-4">
            <p className="text-sm font-semibold text-text-primary">
              Gastos relacionados
            </p>

            <div className="mt-3 space-y-3">
              {item.expenses.map((gasto) => (
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
                        {formatMoney(gasto.monto)}
                      </p>

                      <p className="mt-1 text-xs text-text-muted">
                        {gasto.fecha
                          ? formatDate(gasto.fecha)
                          : formatDate(gasto.created_at, { isTimestamp: true })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditExpense(gasto)}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteExpense(gasto)}
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
    </Modal>
  );
}

export default function ExpensesPage() {
  const defaultRange = useMemo(() => getCurrentMonthRange(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState(defaultRange.start);
  const [dateTo, setDateTo] = useState(defaultRange.end);
  const [page, setPage] = useState(1);

  const [quoteRows, setQuoteRows] = useState([]);
  const [expenseRows, setExpenseRows] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  const [productRows, setProductRows] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [selectedDeleteExpense, setSelectedDeleteExpense] = useState(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);

  async function fetchData(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [quoteResult, expenseResult, detailResult, productResult] =
        await Promise.all([
          supabase
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
            .order("fecha_completado", { ascending: false }),

          supabase
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
            .order("fecha", { ascending: false }),

          supabase.from("cotizacion_detalles").select(`
            id,
            cotizacion_id,
            producto_id,
            cantidad
          `),

          supabase.from("productos").select(`
            id,
            nombre,
            precio_compra,
            precio_utilidad
          `),
        ]);

      if (quoteResult.error) throw quoteResult.error;
      if (expenseResult.error) throw expenseResult.error;
      if (detailResult.error) throw detailResult.error;
      if (productResult.error) throw productResult.error;

      setQuoteRows(Array.isArray(quoteResult.data) ? quoteResult.data : []);
      setExpenseRows(Array.isArray(expenseResult.data) ? expenseResult.data : []);
      setDetailRows(Array.isArray(detailResult.data) ? detailResult.data : []);
      setProductRows(Array.isArray(productResult.data) ? productResult.data : []);
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

  function openNewExpense(quoteId = "") {
    setEditingExpense(null);
    setSelectedQuoteId(quoteId);
    setModalOpen(true);
  }

  function openEditExpense(expense) {
    setEditingExpense(expense);
    setSelectedQuoteId(expense?.cotizacion_id || "");
    setModalOpen(true);
  }

  async function deleteExpense(expenseId) {
    if (!expenseId) return;

    try {
      setDeletingExpenseId(expenseId);

      const { error } = await supabase.from("gastos").delete().eq("id", expenseId);

      if (error) throw error;

      setSelectedDeleteExpense(null);
      await fetchData(true);
    } catch (err) {
      console.error("Error eliminando gasto:", err);
      alert(err.message || "No se pudo eliminar el gasto.");
    } finally {
      setDeletingExpenseId(null);
    }
  }

  const preparedRows = useMemo(() => {
    const expenseMap = new Map();
    const detailMap = new Map();
    const productMap = new Map();

    for (const expense of expenseRows) {
      const key = expense.cotizacion_id;
      if (!expenseMap.has(key)) expenseMap.set(key, []);
      expenseMap.get(key).push(expense);
    }

    for (const detail of detailRows) {
      const key = detail.cotizacion_id;
      if (!detailMap.has(key)) detailMap.set(key, []);
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
        naturaleza: netProfit >= 0 ? "ganancia" : "gasto",
        tipo: "ganancia_cotizacion",
        concepto: `Ganancia por cotización ${quote.folio || ""}`.trim(),
        notas: quote.notas || "",
        expenseCount: relatedExpenses.length,
        expenses: relatedExpenses,
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

      if (quickFilter === "ganancias" && item.naturaleza !== "ganancia") return false;
      if (quickFilter === "gastos" && item.naturaleza !== "gasto") return false;

      if (!term) return true;

      return [
        item.concepto,
        item.folio,
        item.referencia,
        item.cliente,
        item.cliente_email,
        item.cliente_telefono,
        item.notas,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
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

      return [expense.concepto, expense.descripcion, expense.tipo]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [expenseRows, dateFrom, dateTo, search, quickFilter]);

  const unifiedRows = useMemo(() => {
    const profitRows = filteredRows.map((item) => ({
      id: `profit-${item.id}`,
      rawId: item.id,
      rowType: "ganancia",
      ...item,
    }));

    const standaloneExpenseRows = filteredStandaloneExpenses.map((expense) => {
      const monto = parseNumberish(expense.monto);
      const expenseDateValue = expense.fecha || expense.created_at;

      return {
        id: `expense-${expense.id}`,
        rawId: expense.id,
        rowType: "gasto",
        concepto: expense.concepto || "Gasto independiente",
        referencia: "Sin cotización",
        tipo: normalizeExpenseType(expense.tipo),
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

    return [...profitRows, ...standaloneExpenseRows].sort(
      (a, b) => resolveRowDateMs(b) - resolveRowDateMs(a),
    );
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

    return {
      quoteTotal: grossProfitTotal,
      expensesTotal,
      netTotal: grossProfitTotal - expensesTotal,
      withExpenses: filteredRows.filter((item) => item.gastos > 0).length,
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

      map.get(key).netoDia += parseNumberish(item.ganancia);
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

      map.get(key).netoDia -= parseNumberish(expense.monto);
    }

    let acumulado = 0;

    return Array.from(map.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((item) => {
        acumulado += item.netoDia;
        return { ...item, neto: acumulado };
      });
  }, [filteredRows, filteredStandaloneExpenses]);

  const chartStrokeColor = useMemo(() => {
    if (!chartData.length) return "#16a34a";
    return (chartData[chartData.length - 1]?.neto || 0) >= 0
      ? "#16a34a"
      : "#dc2626";
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

    const worksheet = XLSX.utils.json_to_sheet([
      ...quoteRowsExcel,
      ...standaloneExpensesExcel,
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ganancias");

    XLSX.writeFile(workbook, `ganancias_${dateFrom || "inicio"}_a_${dateTo || "hoy"}.xlsx`);
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

      <DetailModal
        open={Boolean(selectedDetail)}
        item={selectedDetail}
        onClose={() => setSelectedDetail(null)}
        onEditExpense={openEditExpense}
        onDeleteExpense={setSelectedDeleteExpense}
      />

      <ConfirmDeleteModal
        open={Boolean(selectedDeleteExpense)}
        title="Confirmar eliminación"
        message="Vas a eliminar este gasto."
        itemName={selectedDeleteExpense?.concepto || "Sin concepto"}
        loading={deletingExpenseId === selectedDeleteExpense?.id}
        onClose={() => setSelectedDeleteExpense(null)}
        onConfirm={() => deleteExpense(selectedDeleteExpense?.id)}
        confirmText="Eliminar"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={TrendingDown}
          title="Gastos descontados"
          value={formatMoney(summary.expensesTotal)}
          note="Suma de los gastos asociados a las cotizaciones filtradas."
          tone="error"
        />

        <SummaryCard
          icon={TrendingUp}
          title="Ventas completadas"
          value={formatMoney(summary.quoteTotal)}
          note="Total de cotizaciones completadas dentro del filtro actual."
          tone="success"
        />

        <SummaryCard
          icon={CircleDollarSign}
          title="Ganancia neta"
          value={formatMoney(summary.netTotal)}
          note="Cotizaciones completadas menos gastos registrados."
          tone="primary"
        />

        <SummaryCard
          icon={AlertTriangle}
          title="Cotizaciones con gastos"
          value={summary.withExpenses}
          note="Cantidad de cotizaciones a las que ya se les cargaron gastos."
          tone="warning"
        />
      </div>

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Gestión financiera"
          title="Ganancias por cotización"
          description="Aquí solo ves lo que ganaste realmente: cotizaciones completadas menos gastos asociados."
          actions={
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => fetchData(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
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
          }
        />

        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por folio, cliente, correo, teléfono..."
              className="w-full xl:max-w-md"
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <DateInput value={dateFrom} onChange={setDateFrom} />
              <DateInput value={dateTo} onChange={setDateTo} />

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
              onClick={() => {
                const range = getCurrentMonthRange();
                setDateFrom(range.start);
                setDateTo(range.end);
              }}
            />
            <FilterPill
              label="Últimos 30 días"
              onClick={() => {
                const range = getLast30DaysRange();
                setDateFrom(range.start);
                setDateTo(range.end);
              }}
            />
            <FilterPill
              label="Año actual"
              onClick={() => {
                const range = getThisYearRange();
                setDateFrom(range.start);
                setDateTo(range.end);
              }}
            />
          </div>
        </div>

        <ChartSection
          chartData={chartData}
          chartStrokeColor={chartStrokeColor}
        />

        <DesktopTable
          rows={paginatedRows}
          loading={loading}
          onDetail={setSelectedDetail}
          onEditExpense={openEditExpense}
          onNewExpense={openNewExpense}
          onDeleteExpense={setSelectedDeleteExpense}
        />

        <MobileCards
          rows={paginatedRows}
          loading={loading}
          deletingExpenseId={deletingExpenseId}
          onDetail={setSelectedDetail}
          onEditExpense={openEditExpense}
          onNewExpense={openNewExpense}
          onDeleteExpense={setSelectedDeleteExpense}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={unifiedRows.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </section>
    </section>
  );
}

function DateInput({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2">
      <CalendarDays className="h-4 w-4 text-text-muted" />

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm text-text-primary outline-none"
      />
    </div>
  );
}

function ChartSection({ chartData, chartStrokeColor }) {
  return (
    <div className="border-b border-border p-5 md:p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold text-text-primary">Evolución neta</p>
        <p className="text-sm text-text-secondary">
          Tendencia acumulada de ganancias y gastos dentro del rango seleccionado.
        </p>
      </div>

      <div className="h-[320px] w-full rounded-[28px] border border-border bg-surface-soft p-4 md:p-5">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 6" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${Number(v || 0).toLocaleString("es-MX")}`}
              />
              <Tooltip
                formatter={(value) => [formatMoney(value), "Neto acumulado"]}
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
                activeDot={{ r: 5, stroke: chartStrokeColor, fill: chartStrokeColor }}
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
  );
}

function DesktopTable({
  rows,
  loading,
  onDetail,
  onEditExpense,
  onNewExpense,
  onDeleteExpense,
}) {
  return (
    <div className="hidden xl:block">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <thead className="bg-surface-soft">
            <tr>
              {[
                "Concepto",
                "Referencia",
                "Tipo",
                "Naturaleza",
                "Cliente",
                "Fecha",
                "Gastos",
                "Ganancia",
                "Acciones",
              ].map((header, index) => (
                <th
                  key={header}
                  className={[
                    "px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted",
                    index === 0 ? "w-[20%] px-6" : "",
                    index === 8 ? "text-right" : "",
                  ].join(" ")}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((item) => (
                <ExpenseTableRow
                  key={item.id}
                  item={item}
                  onDetail={onDetail}
                  onEditExpense={onEditExpense}
                  onNewExpense={onNewExpense}
                  onDeleteExpense={onDeleteExpense}
                />
              ))
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
  );
}

function ExpenseTableRow({
  item,
  onDetail,
  onEditExpense,
  onNewExpense,
  onDeleteExpense,
}) {
  const movementType = getMovementType(item.tipo);
  const TypeIcon = movementType.icon;
  const nature = getNatureStyles(item.naturaleza);
  const NatureIcon = nature.icon;

  return (
    <tr className="border-t border-border align-top transition hover:bg-surface-soft/70">
      <td className="px-6 py-5">
        <p className="line-clamp-2 text-sm font-semibold leading-6 text-text-primary">
          {item.concepto}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {item.rowType === "ganancia"
            ? `${item.expenseCount} gasto(s) asociado(s)`
            : "Gasto independiente"}
        </p>
      </td>

      <td className="px-4 py-5">
        <Badge icon={FileText}>{item.referencia}</Badge>
      </td>

      <td className="px-4 py-5">
        <StatusBadge icon={TypeIcon} className={movementType.className}>
          {movementType.label}
        </StatusBadge>
      </td>

      <td className="px-4 py-5">
        <StatusBadge icon={NatureIcon} className={nature.className}>
          {nature.label}
        </StatusBadge>
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
          <span className="whitespace-nowrap">{item.fecha}</span>
        </div>
      </td>

      <td className="px-4 py-5">
        <AmountBadge icon={TrendingDown} className="border-error-100 bg-error-50 text-error-700">
          {formatMoney(item.gastos)}
        </AmountBadge>
      </td>

      <td className="px-4 py-5">
        <AmountBadge icon={CircleDollarSign} className={nature.amountClass}>
          {formatMoney(item.ganancia)}
        </AmountBadge>
      </td>

      <td className="px-4 py-5">
        <div className="flex items-center justify-end gap-2">
          <ActionIconButton icon={Eye} label="Ver gastos" tone="default" onClick={() => onDetail(item)} />

          <ActionIconButton
            icon={Receipt}
            label="Editar gasto"
            tone="default"
            disabled={!item.expenses.length}
            onClick={() => onEditExpense(item.expenses[0])}
          />

          <ActionIconButton
            icon={Plus}
            label="Agregar gasto"
            tone="default"
            onClick={() => onNewExpense(item.rowType === "ganancia" ? item.rawId : "")}
          />

          <ActionIconButton
            icon={Trash2}
            label="Eliminar"
            tone="default"
            disabled={!item.expenses.length}
            onClick={() => onDeleteExpense(item.expenses[0])}
          />
        </div>
      </td>
    </tr>
  );
}

function MobileCards({
  rows,
  loading,
  deletingExpenseId,
  onDetail,
  onEditExpense,
  onNewExpense,
  onDeleteExpense,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
      {rows.length ? (
        rows.map((item) => (
          <ExpenseMobileCard
            key={item.id}
            item={item}
            deletingExpenseId={deletingExpenseId}
            onDetail={onDetail}
            onEditExpense={onEditExpense}
            onNewExpense={onNewExpense}
            onDeleteExpense={onDeleteExpense}
          />
        ))
      ) : (
        <EmptyState loading={loading} />
      )}
    </div>
  );
}

function ExpenseMobileCard({
  item,
  deletingExpenseId,
  onDetail,
  onEditExpense,
  onNewExpense,
  onDeleteExpense,
}) {
  const movementType = getMovementType(item.tipo);
  const TypeIcon = movementType.icon;
  const nature = getNatureStyles(item.naturaleza);
  const NatureIcon = nature.icon;

  return (
    <article className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">{item.concepto}</p>
          <p className="mt-1 text-sm text-text-secondary">{item.referencia}</p>
        </div>

        <StatusBadge icon={NatureIcon} className={nature.className}>
          {nature.label}
        </StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo label="Cliente" value={item.cliente} />
        <MiniInfo label="Fecha" value={item.fecha} />
        <MiniInfo label="Gastos" value={formatMoney(item.gastos)} valueClass="text-error-700" />
        <MiniInfo
          label="Ganancia"
          value={formatMoney(item.ganancia)}
          valueClass={item.ganancia >= 0 ? "text-success-700" : "text-error-700"}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge icon={TypeIcon} className={movementType.className}>
          {movementType.label}
        </StatusBadge>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-text-primary">
          {item.rowType === "ganancia" ? `${item.expenseCount} gasto(s)` : "Gasto independiente"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MobileAction icon={Eye} label="Ver" onClick={() => onDetail(item)} />

        <MobileAction
          icon={Receipt}
          label="Editar"
          disabled={!item.expenses.length}
          onClick={() => onEditExpense(item.expenses[0])}
        />

        <MobileAction
          icon={Plus}
          label="Gasto"
          onClick={() => onNewExpense(item.rowType === "ganancia" ? item.rawId : "")}
        />

        <MobileAction
          icon={Trash2}
          label={
            deletingExpenseId && item.expenses[0]?.id === deletingExpenseId
              ? "Eliminando..."
              : "Eliminar"
          }
          disabled={!item.expenses.length}
          onClick={() => onDeleteExpense(item.expenses[0])}
        />
      </div>
    </article>
  );
}

function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  return (
    <div className="flex flex-col gap-4 border-t border-border p-5 md:p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-text-secondary">
        Mostrando{" "}
        <span className="font-semibold text-text-primary">
          {totalItems ? (page - 1) * pageSize + 1 : 0}
        </span>{" "}
        a{" "}
        <span className="font-semibold text-text-primary">
          {Math.min(page * pageSize, totalItems)}
        </span>{" "}
        de <span className="font-semibold text-text-primary">{totalItems}</span>{" "}
        resultados
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange((prev) => Math.max(1, prev - 1))}
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
          onClick={() => onPageChange((prev) => Math.min(totalPages, prev + 1))}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, children }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-border bg-surface-soft px-3 py-2 text-sm font-medium text-text-primary">
      <Icon className="h-4 w-4 shrink-0 text-primary-500" />
      <span className="truncate">{children}</span>
    </div>
  );
}

function StatusBadge({ icon: Icon, className, children }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function AmountBadge({ icon: Icon, className, children }) {
  return (
    <div
      className={`inline-flex whitespace-nowrap items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </div>
  );
}

function MiniInfo({ label, value, valueClass = "text-text-primary" }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>

      <p className={`mt-2 text-sm font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function MobileAction({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}