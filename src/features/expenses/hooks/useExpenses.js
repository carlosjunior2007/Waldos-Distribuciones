import { useEffect, useMemo, useState } from "react";
import { createMessageState } from "../components/ExpensesMessageModal";
import * as XLSX from "xlsx";

import { parseBusinessDate, parseTimestampDate } from "../../../utils/dates";
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

function getRowDate(row) {
  if (!row?.fechaISO) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(row.fechaISO))) {
    return parseBusinessDate(row.fechaISO);
  }

  return parseTimestampDate(row.fechaISO);
}

export function useExpenses() {
  const defaultRange = useMemo(() => getCurrentMonthRange(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState(defaultRange.start);
  const [dateTo, setDateTo] = useState(defaultRange.end);
  const [page, setPage] = useState(1);

  const [orderRows, setOrderRows] = useState([]);
  const [expenseRows, setExpenseRows] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [selectedDeleteExpense, setSelectedDeleteExpense] = useState(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [messageModal, setMessageModal] = useState(createMessageState());

  function showMessage(title, message, tone = "info") {
    setMessageModal({
      open: true,
      title,
      message,
      tone,
    });
  }

  function closeMessageModal() {
    setMessageModal(createMessageState());
  }

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await fetchExpensesData();

      setOrderRows(data.orderRows);
      setExpenseRows(data.expenseRows);
    } catch (err) {
      console.error("Error cargando ganancias y gastos:", err);
      setOrderRows([]);
      setExpenseRows([]);
      showMessage(
        "No se pudieron cargar los datos financieros",
        err.message || "Revisa tu conexión o intenta de nuevo.",
        "error",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openNewExpense(orderId = "") {
    setEditingExpense(null);
    setSelectedOrderId(orderId);
    setModalOpen(true);
  }

  function openEditExpense(expense) {
    setEditingExpense(expense);
    setSelectedOrderId(expense?.pedido_id || "");
    setModalOpen(true);
  }

  function closeExpenseModal() {
    setModalOpen(false);
    setEditingExpense(null);
    setSelectedOrderId("");
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
      showMessage(
        "No se pudo eliminar el gasto",
        err.message || "Intenta de nuevo.",
        "error",
      );
    } finally {
      setDeletingExpenseId(null);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const preparedRows = useMemo(() => {
    return buildPreparedRows({
      orderRows,
      expenseRows,
    });
  }, [orderRows, expenseRows]);

  const filteredRows = useMemo(() => {
    const from = dateFrom ? startOfLocalDay(dateFrom) : null;
    const to = dateTo ? endOfLocalDay(dateTo) : null;
    const term = search.trim().toLowerCase();

    return preparedRows.filter((item) => {
      const itemDate = getRowDate(item);

      if (from && itemDate && itemDate < from) return false;
      if (to && itemDate && itemDate > to) return false;

      if (quickFilter === "ganancias" && !item.realizada) return false;
      if (quickFilter === "gastos" && item.gastos <= 0) return false;
      if (quickFilter === "pendientes" && item.realizada) return false;

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
      if (expense.pedido_id) return false;

      const expenseDate = expense.fecha
        ? startOfLocalDay(expense.fecha)
        : parseTimestampDate(expense.created_at);

      if (from && expenseDate && expenseDate < from) return false;
      if (to && expenseDate && expenseDate > to) return false;

      if (quickFilter === "ganancias" || quickFilter === "pendientes") return false;

      if (!term) return true;

      return [expense.concepto, expense.descripcion, expense.tipo]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [expenseRows, dateFrom, dateTo, search, quickFilter]);

  const unifiedRows = useMemo(() => {
    const orderProfitRows = filteredRows.map((item) => ({
      id: `order-${item.id}`,
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
        referencia: "Sin pedido",
        tipo: normalizeExpenseType(expense.tipo),
        naturaleza: "gasto",
        cliente: "Sin pedido asociado",
        fecha: expense.fecha
          ? formatExpenseDate(expense.fecha)
          : formatExpenseDate(expense.created_at, { isTimestamp: true }),
        fechaISO: expenseDateValue,
        gastos: monto,
        ganancia: -monto,
        totalPedido: 0,
        utilidadBruta: 0,
        expenseCount: 1,
        expenses: [expense],
        notas: expense.descripcion || "",
        realizada: false,
      };
    });

    return [...orderProfitRows, ...standaloneExpenseRows].sort(
      (a, b) => resolveRowDateMs(b) - resolveRowDateMs(a),
    );
  }, [filteredRows, filteredStandaloneExpenses]);

  const summary = useMemo(() => {
    const realizedOrderRows = filteredRows.filter((item) => item.realizada);

    const realizedGrossProfit = realizedOrderRows.reduce(
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
      orderTotal: realizedGrossProfit,
      expensesTotal,
      netTotal: realizedGrossProfit - expensesTotal,
      withExpenses: filteredRows.filter((item) => item.gastos > 0).length,
      realizedOrders: realizedOrderRows.length,
      pendingOrders: filteredRows.filter((item) => !item.realizada).length,
    };
  }, [filteredRows, filteredStandaloneExpenses]);

  const chartData = useMemo(() => {
    const map = new Map();

    for (const item of filteredRows) {
      const key = getTijuanaDayKeyFromTimestamp(item.fechaISO) || String(item.fechaISO || "").slice(0, 10);
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
    const orderRowsExcel = filteredRows.map((item) => ({
      Tipo: item.realizada ? "Pedido entregado y pagado" : "Pedido pendiente",
      Folio: item.folio,
      Cliente: item.cliente,
      Fecha: item.fecha,
      "Venta total": parseNumberish(item.totalPedido),
      "Costo total": parseNumberish(item.costoPedido),
      "Utilidad bruta realizada": parseNumberish(item.utilidadBruta),
      "Gastos asociados": parseNumberish(item.gastos),
      "Ganancia neta": parseNumberish(item.ganancia),
      "Pagado": item.pagado ? "Sí" : "No",
      "Entregado": item.entregado ? "Sí" : "No",
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
      "Costo total": 0,
      "Utilidad bruta realizada": 0,
      "Gastos asociados": parseNumberish(item.monto),
      "Ganancia neta": -parseNumberish(item.monto),
      "Pagado": "",
      "Entregado": "",
      "Cantidad de gastos": 1,
      Email: "",
      Teléfono: "",
      Notas: item.descripcion || item.concepto || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet([
      ...orderRowsExcel,
      ...standaloneExpensesExcel,
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ganancias");

    XLSX.writeFile(
      workbook,
      `ganancias_pedidos_${dateFrom || "inicio"}_a_${dateTo || "hoy"}.xlsx`,
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

    orderRows,
    summary,
    chartData,
    chartStrokeColor,
    paginatedRows,
    unifiedRows,

    modalOpen,
    selectedOrderId,
    editingExpense,
    selectedDetail,
    selectedDeleteExpense,
    deletingExpenseId,
    messageModal,
    closeMessageModal,

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
