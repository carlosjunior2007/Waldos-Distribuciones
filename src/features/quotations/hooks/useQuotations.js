import { useEffect, useMemo, useState } from "react";
import { createMessageState } from "../components/QuotationsMessageModal";

import {
  fetchQuotations,
  fetchQuotationSummary,
  fetchQuotationById,
  deleteQuotation,
  getCurrentMonthValue,
  convertQuotationToOrder,
} from "../services/quotations.js";

import { generateQuotationPDF } from "../../../utils/quotationPdf";
import { generateQuotationSuppliersPDF } from "../services/quotationSuppliersPdf";
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
  const [messageModal, setMessageModal] = useState(createMessageState());

  const monthOptions = useMemo(() => buildLastMonthsOptions(18), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

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

      if (listRes.page && listRes.page !== page) {
        setPage(listRes.page);
      }
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudieron cargar las cotizaciones",
        error.message || "Intenta de nuevo.",
        "error",
      );
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
      showMessage(
        "No se pudo cargar la cotización",
        error.message || "Intenta de nuevo.",
        "error",
      );
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
      showMessage(
        "No se pudo eliminar la cotización",
        error.message || "Intenta de nuevo.",
        "error",
      );
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
      showMessage(
        "No se pudo generar el PDF",
        error.message || "Intenta de nuevo.",
        "error",
      );
    }
  }


  async function downloadSuppliersPdf(id) {
    try {
      const quotation = await fetchQuotationById(id);
      generateQuotationSuppliersPDF(quotation);
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudo generar el PDF de proveedores",
        error.message || "Intenta de nuevo.",
        "error",
      );
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

      if (!quotation?.cliente_id) {
        showMessage(
          "Cliente no asociado",
          "Para pasar esta cotización a pedido, primero tienes que asociar un cliente registrado en el sistema.",
          "warning",
        );
        return;
      }

      setQuotationToConvert(quotation);
      setConvertModalOpen(true);
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudo cargar la cotización",
        error.message || "Intenta de nuevo.",
        "error",
      );
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
      showMessage(
        "Cotización convertida a pedido",
        "El pedido se creó correctamente desde la cotización.",
        "success",
      );
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudo convertir a pedido",
        error.message || "Intenta de nuevo.",
        "error",
      );
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
    downloadSuppliersPdf,

    quotationToConvert,
    convertModalOpen,
    converting,

    messageModal,
    closeMessageModal,
    showMessage,

    openConvertModal,
    closeConvertModal,
    confirmConvertToOrder,
  };
}
