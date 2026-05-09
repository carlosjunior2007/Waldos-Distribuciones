import { useEffect, useState } from "react";

import { useDebouncedValue } from "../../../hook/useDebouncedValue";
import { generateLabelPDF } from "../../../utils/labelPdf";

import {
  COMPANY_DEFAULTS,
  COMPANY_STORAGE_KEY,
} from "../label.constants";

import {
  deleteLabel,
  fetchLabelsByClient,
  fetchProductsForLabels,
  searchClientsForLabels,
} from "../services/labels.service";

export function useLabels() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [labels, setLabels] = useState([]);

  const [clientSearchInput, setClientSearchInput] = useState("");
  const clientSearch = useDebouncedValue(clientSearchInput);

  const [selectedClient, setSelectedClient] = useState(null);

  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingLabels, setLoadingLabels] = useState(false);

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelToDelete, setLabelToDelete] = useState(null);

  const [printPayload, setPrintPayload] = useState(null);

  const [companyOptions, setCompanyOptions] = useState(() => {
    try {
      const raw = localStorage.getItem(COMPANY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : COMPANY_DEFAULTS;
    } catch {
      return COMPANY_DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(companyOptions));
  }, [companyOptions]);

  async function loadProducts() {
    try {
      const data = await fetchProductsForLabels();
      setProducts(data);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron cargar los productos.");
    }
  }

  async function searchClients() {
    try {
      setLoadingClients(true);
      const data = await searchClientsForLabels(clientSearch);
      setClients(data);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron buscar clientes.");
    } finally {
      setLoadingClients(false);
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
      alert(error.message || "No se pudieron cargar las etiquetas.");
    } finally {
      setLoadingLabels(false);
    }
  }

  async function removeLabel() {
    if (!labelToDelete?.id) return;

    try {
      await deleteLabel(labelToDelete.id);
      setLabelToDelete(null);
      await loadLabels(selectedClient?.id);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo eliminar la etiqueta.");
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
        companyOptions,
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
      alert(error.message || "No se pudo generar el PDF.");
    } finally {
      setPrintPayload(null);
    }
  }

  function openCreateModal() {
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
    searchClients();
  }, [clientSearch]);

  useEffect(() => {
    loadLabels(selectedClient?.id || null);
  }, [selectedClient?.id]);

  return {
    clients,
    products,
    labels,

    clientSearchInput,
    setClientSearchInput,
    selectedClient,
    setSelectedClient,

    loadingClients,
    loadingLabels,

    labelModalOpen,
    editingLabel,
    labelToDelete,
    setLabelToDelete,

    printPayload,

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