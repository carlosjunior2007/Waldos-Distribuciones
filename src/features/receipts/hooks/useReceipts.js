import { useEffect, useState } from "react";

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
      alert(error.message || "No se pudieron cargar los contra recibos.");
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
      alert(error.message || "No se pudo cargar el contra recibo.");
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
      alert(error.message || "No se pudo generar el PDF.");
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
      alert(error.message || "No se pudo eliminar el contra recibo.");
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

    loadData,
    downloadReceipt,
  };
}