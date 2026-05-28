import { useEffect, useState } from "react";
import { createMessageState } from "../components/ReceiptsMessageModal";

import {
  fetchReceipts,
  fetchReceiptById,
  deleteReceipt,
} from "../services/receipts.js";

import { generateReceiptPDF } from "../../../utils/receiptPdf";

export function useReceipts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);

  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  async function loadData() {
    try {
      setLoading(true);

      const res = await fetchReceipts({ page, search });

      setRows(res.rows);
      setTotalPages(res.totalPages);
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudieron cargar los contra recibos",
        error.message || "Intenta de nuevo.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [page, search]);

  function openCreateModal() {
    setEditingReceipt(null);
    setModalOpen(true);
  }

  async function openEditModal(id) {
    try {
      const receipt = await fetchReceiptById(id);
      setEditingReceipt(receipt);
      setModalOpen(true);
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudo cargar el contra recibo",
        error.message || "Intenta de nuevo.",
        "error",
      );
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingReceipt(null);
  }

  async function downloadReceipt(id) {
    try {
      const receipt = await fetchReceiptById(id);
      generateReceiptPDF(receipt);
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudo generar el PDF",
        error.message || "Intenta de nuevo.",
        "error",
      );
    }
  }

  async function removeReceipt() {
    if (!receiptToDelete?.id) return;

    try {
      setDeleting(true);
      await deleteReceipt(receiptToDelete.id);
      setReceiptToDelete(null);
      await loadData();
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudo eliminar el contra recibo",
        error.message || "Intenta de nuevo.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  }

  return {
    rows,
    loading,

    searchInput,
    setSearchInput,

    page,
    setPage,
    totalPages,

    modalOpen,
    editingReceipt,
    openCreateModal,
    openEditModal,
    closeModal,

    receiptToDelete,
    setReceiptToDelete,
    deleting,
    removeReceipt,

    messageModal,
    closeMessageModal,
    showMessage,

    loadData,
    downloadReceipt,
  };
}