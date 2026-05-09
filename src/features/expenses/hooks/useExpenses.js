import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { parseTimestampDate } from "../../../utils/dates";
import { parseNumberish } from "../../../utils/formatters";
import {
  getCurrentMonthRange,
  getThisYearRange,
  getLast30DaysRange,
} from "../../../utils/ranges";

import { deleteExpense, fetchExpensesData } from "../services/expenses.service";
import {
  buildPreparedRows,
  endOfLocalDay,
  formatExpenseDate,
  getDayLabelFromBusinessDate,
  getTijuanaDayKeyFromTimestamp,
  normalizeExpenseType,
  resolveRowDateMs,
  startOfLocalDay,
} from "../expense.helpers";

import { PAGE_SIZE } from "../expense.constants";

export function useExpenses() {
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

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await fetchExpensesData();

      setQuoteRows(data.quoteRows);
      setExpenseRows(data.expenseRows);
      setDetailRows(data.detailRows);
      setProductRows(data.productRows);
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

  function closeExpenseModal() {
    setModalOpen(false);
    setEditingExpense(null);
    setSelectedQuoteId("");
  }

  async function removeExpense(expenseId) {
    if (!expenseId) return;

    try {
      setDeletingExpenseId(expenseId);
      await deleteExpense(expenseId);
      setSelectedDeleteExpense(null);
      await loadData(true);
    } catch (err) {
      console.error("Error eliminando gasto:", err);
      alert(err.message || "No se pudo eliminar el gasto.");
    } finally {
      setDeletingExpenseId(null);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const preparedRows = useMemo(() => {
    return buildPreparedRows({
      quoteRows,
      expenseRows,
      detailRows,
      productRows,
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
          ? formatExpenseDate(expense.fecha)
          : formatExpenseDate(expense.created_at, { isTimestamp: true }),
        fechaISO: expenseDateValue,
        gastos: monto,
        ganancia: -monto,
        totalCotizacion: 0,
        expenseCount: 1,
        expenses: [expense],
        notas: expense.descripcion || "",
      };
    });

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

  function setCurrentMonthRange() {
    const range = getCurrentMonthRange();
    setDateFrom(range.start);
    setDateTo(range.end);
  }

  function setLast30DaysRange() {
    const range = getLast30DaysRange();
    setDateFrom(range.start);
    setDateTo(range.end);
  }

  function setThisYearRange() {
    const range = getThisYearRange();
    setDateFrom(range.start);
    setDateTo(range.end);
  }

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
        ? formatExpenseDate(item.fecha)
        : formatExpenseDate(item.created_at, { isTimestamp: true }),
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

    XLSX.writeFile(
      workbook,
      `ganancias_${dateFrom || "inicio"}_a_${dateTo || "hoy"}.xlsx`,
    );
  }

  return {
    loading,
    refreshing,

    search,
    setSearch,
    quickFilter,
    setQuickFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,

    page,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,

    quoteRows,
    summary,
    chartData,
    chartStrokeColor,
    paginatedRows,
    unifiedRows,

    modalOpen,
    selectedQuoteId,
    editingExpense,
    selectedDetail,
    selectedDeleteExpense,
    deletingExpenseId,

    setSelectedDetail,
    setSelectedDeleteExpense,

    loadData,
    openNewExpense,
    openEditExpense,
    closeExpenseModal,
    removeExpense,

    setCurrentMonthRange,
    setLast30DaysRange,
    setThisYearRange,

    exportToExcel,
  };
}