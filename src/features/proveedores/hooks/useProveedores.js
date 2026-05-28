import { useEffect, useMemo, useState } from "react";
import { createMessageState } from "../components/ProveedoresMessageModal";
import { normalizeText } from "../../../utils/formatters";

import { INITIAL_PROVIDER_FORM, ITEMS_PER_PAGE } from "../proveedores.constants";

import {
  buildNextProviderCode,
  buildProviderForm,
  getProviderStatus,
  normalizeProviderCode,
  normalizeProviderTextField,
  validateProviderForm,
} from "../proveedores.helpers";

import {
  buildProviderProductImportPreview,
  bulkAssociateProviderProducts,
  createProvider,
  deleteProvider,
  fetchProviders,
  getProviderDeleteImpact,
  getCurrentUserId,
  updateProvider,
} from "../services/proveedores.service";

const CAPITALIZED_TEXT_FIELDS = [
  "nombre",
  "razon_social",
  "contacto_nombre",
  "direccion",
  "ciudad",
  "estado",
  "pais",
  "notas",
];

export function useProveedores() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteImpactLoading, setDeleteImpactLoading] = useState(false);
  const [deleteImpact, setDeleteImpact] = useState({
    relatedProducts: [],
    productsWithoutSuppliers: [],
  });
  const [hideProductsWithoutSuppliers, setHideProductsWithoutSuppliers] =
    useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalMode, setModalMode] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [form, setForm] = useState(INITIAL_PROVIDER_FORM);

  const [importPreview, setImportPreview] = useState(null);
  const [loadingImportPreview, setLoadingImportPreview] = useState(false);
  const [applyingImport, setApplyingImport] = useState(false);
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

  async function loadProviders() {
    try {
      setLoading(true);
      const data = await fetchProviders();
      setProviders(data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  function openCreateModal() {
    setSelectedProvider(null);
    setForm({
      ...INITIAL_PROVIDER_FORM,
      codigo: buildNextProviderCode(providers.length),
    });
    setModalMode("create");
  }

  function openViewModal(provider) {
    setSelectedProvider(provider);
    setForm(buildProviderForm(provider));
    setModalMode("view");
  }

  function openEditModal(provider) {
    setSelectedProvider(provider);
    setForm(buildProviderForm(provider));
    setModalMode("edit");
  }

  function openImportModal(provider) {
    setSelectedProvider(provider);
    setImportPreview(null);
    setModalMode("import");
  }

  async function openDeleteModal(provider) {
    setSelectedProvider(provider);
    setModalMode("delete");
    setHideProductsWithoutSuppliers(true);
    setDeleteImpact({
      relatedProducts: [],
      productsWithoutSuppliers: [],
    });

    try {
      setDeleteImpactLoading(true);
      const impact = await getProviderDeleteImpact(provider.id);
      setDeleteImpact(impact);
    } catch (error) {
      console.error("Error al cargar impacto de eliminación:", error);
      setDeleteImpact({
        relatedProducts: [],
        productsWithoutSuppliers: [],
      });
    } finally {
      setDeleteImpactLoading(false);
    }
  }

  function closeModal() {
    setSelectedProvider(null);
    setForm(INITIAL_PROVIDER_FORM);
    setModalMode(null);
    setDeleteImpact({
      relatedProducts: [],
      productsWithoutSuppliers: [],
    });
    setHideProductsWithoutSuppliers(true);
    setImportPreview(null);
    setLoadingImportPreview(false);
    setApplyingImport(false);
  }

  function onInputChange(event) {
    const { name, value, type, checked } = event.target;

    if (name === "codigo") {
      setForm((prev) => ({
        ...prev,
        [name]: normalizeProviderCode(value),
      }));
      return;
    }

    if (name === "codigo_postal") {
      setForm((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, "").slice(0, 5),
      }));
      return;
    }

    if (name === "rfc") {
      setForm((prev) => ({
        ...prev,
        [name]: value.toUpperCase(),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : CAPITALIZED_TEXT_FIELDS.includes(name)
            ? normalizeProviderTextField(value)
            : value,
    }));
  }

  async function saveProvider(event) {
    event.preventDefault();

    const validationError = validateProviderForm(form);

    if (validationError) {
      showMessage("Revisa la información del proveedor", validationError, "warning");
      return;
    }

    try {
      setSaving(true);

      const userId = await getCurrentUserId();
      const isEdit = modalMode === "edit";

      const payload = {
        codigo: normalizeProviderCode(form.codigo),
        nombre: normalizeProviderTextField(form.nombre),
        razon_social: normalizeProviderTextField(form.razon_social),
        rfc: String(form.rfc || "").trim().toUpperCase() || null,
        telefono: String(form.telefono || "").trim() || null,
        correo: String(form.correo || "").trim().toLowerCase() || null,
        sitio_web: String(form.sitio_web || "").trim() || null,
        contacto_nombre: normalizeProviderTextField(form.contacto_nombre),
        direccion: normalizeProviderTextField(form.direccion),
        ciudad: normalizeProviderTextField(form.ciudad),
        estado: normalizeProviderTextField(form.estado),
        codigo_postal: String(form.codigo_postal || "").trim() || null,
        pais: normalizeProviderTextField(form.pais || "México"),
        notas: normalizeProviderTextField(form.notas),
        activo: Boolean(form.activo),
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        await updateProvider(form.id, payload);
      } else {
        await createProvider({
          ...payload,
          created_by: userId,
          created_at: new Date().toISOString(),
        });
      }

      await loadProviders();
      closeModal();
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      showMessage(
        "No se pudo guardar el proveedor",
        error.message || "Intenta de nuevo.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeProvider() {
    if (!selectedProvider?.id) return;

    try {
      setDeleting(true);
      await deleteProvider(selectedProvider.id, {
        hideProductsWithoutSuppliers,
      });
      await loadProviders();
      closeModal();
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
      showMessage(
        "No se pudo eliminar el proveedor",
        error.message || "Intenta de nuevo.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function loadImportPreview(rows) {
    if (!selectedProvider?.id) return;

    try {
      setLoadingImportPreview(true);
      const preview = await buildProviderProductImportPreview(
        selectedProvider.id,
        rows,
      );
      setImportPreview(preview);
    } catch (error) {
      console.error("Error al validar importación:", error);
      showMessage(
        "No se pudo validar el Excel",
        error.message || "Revisa el archivo e intenta de nuevo.",
        "error",
      );
      setImportPreview(null);
    } finally {
      setLoadingImportPreview(false);
    }
  }

  function clearImportPreview() {
    setImportPreview(null);
  }

  async function applyProviderProductImport() {
    if (!selectedProvider?.id || !importPreview?.rows?.length) return;

    try {
      setApplyingImport(true);
      const result = await bulkAssociateProviderProducts(
        selectedProvider.id,
        importPreview.rows,
      );

      showMessage(
        "Importación aplicada",
        `Asociaciones guardadas: ${result.applied}. Omitidas: ${result.skipped}.`,
        result.skipped ? "warning" : "success",
      );

      closeModal();
    } catch (error) {
      console.error("Error al aplicar importación:", error);
      showMessage(
        "No se pudo aplicar la importación",
        error.message || "Intenta de nuevo.",
        "error",
      );
    } finally {
      setApplyingImport(false);
    }
  }

  const filteredProviders = useMemo(() => {
    const terms = normalizeText(search)
      .split(",")
      .map((term) => normalizeText(term))
      .filter(Boolean);

    return providers.filter((provider) => {
      const status = getProviderStatus(provider);

      const searchableFields = [
        provider.codigo,
        provider.nombre,
        provider.razon_social,
        provider.rfc,
        provider.telefono,
        provider.correo,
        provider.contacto_nombre,
        provider.ciudad,
        provider.estado,
      ].map(normalizeText);

      const matchesSearch =
        terms.length === 0 ||
        terms.some((term) =>
          searchableFields.some((field) => field.includes(term)),
        );

      const matchesStatus =
        statusFilter === "todos" ? true : status.key === statusFilter.slice(0, -1);

      return matchesSearch && matchesStatus;
    });
  }, [providers, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProviders.length / ITEMS_PER_PAGE),
  );

  const paginatedProviders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProviders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProviders, currentPage]);

  const stats = useMemo(() => {
    return {
      total: providers.length,
      activos: providers.filter((item) => item.activo !== false).length,
      inactivos: providers.filter((item) => item.activo === false).length,
    };
  }, [providers]);

  const startItem =
    filteredProviders.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredProviders.length,
  );

  return {
    providers,
    loading,
    saving,
    deleting,
    deleteImpactLoading,
    loadingImportPreview,
    applyingImport,
    importPreview,
    messageModal,
    closeMessageModal,
    showMessage,
    deleteImpact,
    hideProductsWithoutSuppliers,
    setHideProductsWithoutSuppliers,

    search,
    setSearch,
    statusFilter,
    setStatusFilter,

    modalMode,
    selectedProvider,
    form,

    stats,
    filteredProviders,
    paginatedProviders,

    currentPage,
    totalPages,
    startItem,
    endItem,

    openCreateModal,
    openViewModal,
    openEditModal,
    openDeleteModal,
    openImportModal,
    closeModal,

    onInputChange,
    saveProvider,
    removeProvider,
    loadProviders,
    loadImportPreview,
    clearImportPreview,
    applyProviderProductImport,

    goToPreviousPage: () => setCurrentPage((prev) => Math.max(prev - 1, 1)),
    goToNextPage: () =>
      setCurrentPage((prev) => Math.min(prev + 1, totalPages)),
  };
}
