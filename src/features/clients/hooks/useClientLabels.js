import { useEffect, useState } from "react";

import { generateLabelPDF } from "../../../utils/labelPdf";
import { createMessageState } from "../components/ClientMessageModal";

import {
  COMPANY_DEFAULTS,
  COMPANY_STORAGE_KEY,
  normalizeCompanyOptions,
} from "../label.constants";

import {
  deleteLabel,
  fetchLabelsByClient,
  fetchProductsForLabels,
} from "../services/labels.service";

export function useClientLabels(selectedClient) {
  const [products, setProducts] = useState([]);
  const [labels, setLabels] = useState([]);

  const [loadingLabels, setLoadingLabels] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelToDelete, setLabelToDelete] = useState(null);
  const [deletingLabel, setDeletingLabel] = useState(false);

  const [printPayload, setPrintPayload] = useState(null);
  const [messageModal, setMessageModal] = useState(createMessageState());

  const [companyOptions, setCompanyOptions] = useState(() => {
    try {
      const raw = localStorage.getItem(COMPANY_STORAGE_KEY);
      return raw
        ? normalizeCompanyOptions({ ...COMPANY_DEFAULTS, ...JSON.parse(raw) })
        : normalizeCompanyOptions(COMPANY_DEFAULTS);
    } catch {
      return normalizeCompanyOptions(COMPANY_DEFAULTS);
    }
  });

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
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(companyOptions));
  }, [companyOptions]);

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      const data = await fetchProductsForLabels();
      setProducts(data);
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudieron cargar los productos",
        error.message || "Intenta de nuevo.",
        "error",
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadLabels(clientId = selectedClient?.id) {
    if (!clientId) {
      setLabels([]);
      return;
    }

    try {
      setLoadingLabels(true);
      const data = await fetchLabelsByClient(clientId);
      setLabels(data);
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudieron cargar las etiquetas",
        error.message || "Intenta de nuevo.",
        "error",
      );
    } finally {
      setLoadingLabels(false);
    }
  }

  async function removeLabel() {
    if (!labelToDelete?.id) return;

    try {
      setDeletingLabel(true);
      await deleteLabel(labelToDelete.id);
      setLabelToDelete(null);
      await loadLabels(selectedClient?.id);
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudo eliminar la etiqueta",
        error.message || "Intenta de nuevo.",
        "error",
      );
    } finally {
      setDeletingLabel(false);
    }
  }

  async function quickDownload(label) {
    const product = label.productos || null;
    const client = label.clientes || selectedClient || null;

    const form = {
      cliente_id: label.cliente_id || "",
      producto_id: label.producto_id || "",
      codigo_barras: label.codigo_barras || "",
      codigo: label.codigo || "",
      texto_extra: label.texto_extra || "",
      ancho_mm: Number(label.ancho_mm || 100),
      alto_mm: Number(label.alto_mm || 75),
    };

    try {
      setPrintPayload({
        form,
        client,
        product,
        companyOptions: normalizeCompanyOptions(companyOptions),
      });

      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const previewEl = document.getElementById("quick-label-print");

      await generateLabelPDF({
        element: previewEl,
        filename: `${product?.nombre || "etiqueta"}.pdf`,
        widthMm: Number(label.ancho_mm || 100),
        heightMm: Number(label.alto_mm || 75),
      });
    } catch (error) {
      console.error(error);
      showMessage(
        "No se pudo generar el PDF de etiqueta",
        error.message || "Revisa la vista previa e intenta de nuevo.",
        "error",
      );
    } finally {
      setPrintPayload(null);
    }
  }

  function openCreateModal() {
    if (!selectedClient?.id) {
      showMessage(
        "Selecciona un cliente",
        "Necesitas seleccionar un cliente antes de crear una etiqueta.",
        "warning",
      );
      return;
    }

    setEditingLabel(null);
    setLabelModalOpen(true);
  }

  function openEditModal(label) {
    setEditingLabel(label);
    setLabelModalOpen(true);
  }

  function closeModal() {
    setLabelModalOpen(false);
    setEditingLabel(null);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadLabels(selectedClient?.id || null);
  }, [selectedClient?.id]);

  return {
    products,
    labels,
    loadingLabels,
    loadingProducts,

    labelModalOpen,
    editingLabel,
    labelToDelete,
    setLabelToDelete,
    deletingLabel,

    printPayload,

    messageModal,
    closeMessageModal,

    companyOptions,
    setCompanyOptions,

    loadLabels,
    removeLabel,
    quickDownload,

    openCreateModal,
    openEditModal,
    closeModal,
  };
}
