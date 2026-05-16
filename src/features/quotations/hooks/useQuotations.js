import { useEffect, useMemo, useState } from "react";

import {
  fetchQuotations,
  fetchQuotationSummary,
  fetchQuotationById,
  deleteQuotation,
  getCurrentMonthValue,
  convertQuotationToOrder,
} from "../services/quotations.js";

import { generateQuotationPDF } from "../../../utils/quotationPdf";
import { buildLastMonthsOptions } from "../quotation.helpers";

export function useQuotations() {
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

  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [quotationToConvert, setQuotationToConvert] = useState(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  const monthOptions = useMemo(() => buildLastMonthsOptions(18), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
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
        fetchQuotationSummary({
          month,
          search,
          status,
        }),
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

  function openCreateModal() {
    setEditingQuotation(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingQuotation(null);
  }

  async function openEditModal(id) {
    try {
      const quotation = await fetchQuotationById(id);
      setEditingQuotation(quotation);
      setModalOpen(true);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo cargar la cotización.");
    }
  }

  async function removeQuotation() {
    if (!quotationToDelete?.id) return;

    try {
      setDeleting(true);
      await deleteQuotation(quotationToDelete.id);
      setQuotationToDelete(null);
      await loadData();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo eliminar la cotización.");
    } finally {
      setDeleting(false);
    }
  }

  async function downloadPdf(id) {
    try {
      const quotation = await fetchQuotationById(id);
      generateQuotationPDF(quotation);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo generar el PDF.");
    }
  }

  function updateMonth(value) {
    setMonth(value);
    setPage(1);
  }

  function updateStatus(value) {
    setStatus(value);
    setPage(1);
  }

  async function openConvertModal(id) {
    try {
      setConverting(false);
      const quotation = await fetchQuotationById(id);
      setQuotationToConvert(quotation);
      setConvertModalOpen(true);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo cargar la cotización.");
    }
  }

  function closeConvertModal() {
    if (converting) return;

    setConvertModalOpen(false);
    setQuotationToConvert(null);
  }

  async function confirmConvertToOrder(extra = {}) {
    if (!quotationToConvert?.id) return;

    try {
      setConverting(true);

      await convertQuotationToOrder(quotationToConvert.id, extra);

      setConvertModalOpen(false);
      setQuotationToConvert(null);
      await loadData();
      alert("Cotización convertida a pedido.");
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo convertir a pedido.");
    } finally {
      setConverting(false);
    }
  }

  return {
    rows,
    summary,
    loading,

    searchInput,
    setSearchInput,

    status,
    setStatus: updateStatus,

    month,
    setMonth: updateMonth,
    monthOptions,

    page,
    setPage,
    totalPages,

    modalOpen,
    editingQuotation,
    openCreateModal,
    openEditModal,
    closeModal,

    quotationToDelete,
    setQuotationToDelete,
    deleting,
    removeQuotation,

    loadData,
    downloadPdf,

    quotationToConvert,
    convertModalOpen,
    converting,
    openConvertModal,
    closeConvertModal,
    confirmConvertToOrder,
  };
}
