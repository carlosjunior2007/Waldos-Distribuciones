import { useEffect, useMemo, useState } from "react";
import { generarCodigoProducto } from "../../../utils/CodeGenerator";
import { normalizeText } from "../../../utils/formatters";

import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  fetchProducts,
  getAuthUserEmail,
  getCurrentUser,
  getCurrentUserId,
  updateProduct,
  uploadProductImage,
} from "../services/products.service";

import {
  buildProductForm,
  generateUUID,
  getAuthUserLabel,
  getInventoryStatus,
  getStoragePathFromUrl,
  looksLikeUUID,
  validateProductForm,
} from "../product.helpers";

import { INITIAL_PRODUCT_FORM, ITEMS_PER_PAGE } from "../product.constants";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [localImagePreview, setLocalImagePreview] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [modalMode, setModalMode] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_PRODUCT_FORM);

  const [authUser, setAuthUser] = useState(null);
  const [userLabels, setUserLabels] = useState({});

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCurrentUser() {
    try {
      const user = await getCurrentUser();
      setAuthUser(user);
    } catch (error) {
      console.error("Error al obtener usuario actual:", error);
      setAuthUser(null);
    }
  }

  async function resolveUserLabels(rows = []) {
    const ids = [
      ...new Set(
        rows
          .flatMap((item) => [item.created_by, item.modified_by])
          .filter(Boolean)
          .filter((id) => looksLikeUUID(id)),
      ),
    ];

    if (!ids.length) {
      setUserLabels({});
      return;
    }

    const nextLabels = {};

    for (const id of ids) {
      if (authUser?.id === id) {
        nextLabels[id] = getAuthUserLabel(authUser) || "Usuario actual";
        continue;
      }

      const email = await getAuthUserEmail(id);
      nextLabels[id] = email || "Usuario no disponible";
    }

    setUserLabels(nextLabels);
  }

  useEffect(() => {
    loadCurrentUser();
    loadProducts();
  }, []);

  useEffect(() => {
    resolveUserLabels(products);
  }, [products, authUser?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    return () => {
      if (localImagePreview) URL.revokeObjectURL(localImagePreview);
    };
  }, [localImagePreview]);

  function resetForm() {
    setForm(INITIAL_PRODUCT_FORM);
  }

  function openCreateModal() {
    const newId = generateUUID();

    setSelectedProduct(null);
    setLocalImagePreview("");
    setForm({
      ...INITIAL_PRODUCT_FORM,
      id: newId,
      codigo: generarCodigoProducto(newId),
      habilitado: true,
    });
    setModalMode("create");
  }

  function fillFormFromProduct(product) {
    setSelectedProduct(product);
    setForm(buildProductForm(product));
    setLocalImagePreview("");
  }

  function openViewModal(product) {
    fillFormFromProduct(product);
    setModalMode("view");
  }

  function openEditModal(product) {
    fillFormFromProduct(product);
    setModalMode("edit");
  }

  function openDeleteModal(product) {
    setSelectedProduct(product);
    setModalMode("delete");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedProduct(null);
    setLocalImagePreview("");
    resetForm();
  }

  function removeCurrentImage() {
    setForm((prev) => ({
      ...prev,
      imagen: "",
      imagenFile: null,
    }));

    setLocalImagePreview("");
  }

  function onInputChange(e) {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files?.[0] || null;

      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setLocalImagePreview(previewUrl);
      } else {
        setLocalImagePreview("");
      }

      setForm((prev) => ({
        ...prev,
        [name]: file,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function saveProduct(e) {
    e.preventDefault();

    const validationError = validateProductForm(form);

    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setSaving(true);

      const userId = await getCurrentUserId();
      const isEdit = modalMode === "edit";

      const productId = form.id || generateUUID();
      const codigo = form.codigo || generarCodigoProducto(productId);

      let imageUrl = form.imagen || null;

      if (form.imagenFile) {
        const validTypes = [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/webp",
        ];
        const maxSize = 2 * 1024 * 1024;

        if (!validTypes.includes(form.imagenFile.type)) {
          alert("La imagen debe ser PNG, JPG o WEBP.");
          return;
        }

        if (form.imagenFile.size > maxSize) {
          alert("La imagen no debe superar los 2MB.");
          return;
        }

        setUploadingImage(true);
        imageUrl = await uploadProductImage(form.imagenFile, productId);
        setUploadingImage(false);
      }

      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio: Number(form.precio),
        imagen: imageUrl,

        precio_compra: Number(form.precio_compra),
        cantidad_caja: Number(form.cantidad_caja),

        habilitado: Boolean(form.habilitado),
        categoria: form.categoria,
        unidad: form.unidad,
        codigo,

        clave_sat: form.clave_sat.trim(),
        clave_unidad_sat: form.clave_unidad_sat.trim(),
        iva_porcentaje: Number(form.iva_porcentaje),

        modified_by: userId,
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        await updateProduct(productId, payload);
      } else {
        await createProduct({
          id: productId,
          ...payload,
          codigo,
          created_by: userId,
          modified_by: userId,
          created_at: new Date().toISOString(),
        });
      }

      await loadProducts();
      closeModal();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert(error.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  }

  async function removeProduct() {
    if (!selectedProduct?.id) return;

    try {
      setDeleting(true);

      if (selectedProduct.imagen) {
        const imagePath = getStoragePathFromUrl(selectedProduct.imagen);

        if (imagePath) {
          try {
            await deleteProductImage(imagePath);
          } catch (error) {
            console.error("Error al eliminar imagen:", error);
          }
        }
      }

      await deleteProduct(selectedProduct.id);
      await loadProducts();
      closeModal();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert(error.message || "No se pudo eliminar el producto.");
    } finally {
      setDeleting(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const searchTerms = normalizeText(search)
      .split(",")
      .map((term) => normalizeText(term))
      .filter(Boolean);

    return products.filter((item) => {
      const status = getInventoryStatus(item);

      const searchableFields = [
        normalizeText(item.nombre),
        normalizeText(item.codigo),
        normalizeText(item.categoria),
      ];

      const matchesSearch =
        searchTerms.length === 0 ||
        searchTerms.some((term) =>
          searchableFields.some((field) => field.includes(term)),
        );

      const matchesStatus =
        statusFilter === "todos" ? true : status.key === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE),
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const stats = useMemo(() => {
    return {
      total: products.length,

      activos: products.filter(
        (item) => getInventoryStatus(item).key === "activo",
      ).length,

      ocultos: products.filter(
        (item) => getInventoryStatus(item).key === "oculto",
      ).length,
    };
  }, [products]);

  const startItem =
    filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredProducts.length,
  );

  function calculateSalePriceFromUtility(cost, utilityPercent) {
    const costo = Number(cost || 0);
    const utilidad = Number(utilityPercent || 0);

    if (costo <= 0) return 0;
    if (utilidad >= 100) return 0;

    return costo / (1 - utilidad / 100);
  }

  function calculateUtilityPercent(cost, salePrice) {
    const costo = Number(cost || 0);
    const precio = Number(salePrice || 0);

    if (costo <= 0 || precio <= 0) return 0;

    return ((precio - costo) / precio) * 100;
  }

  function onPriceBlur(fieldName) {
    setForm((prev) => {
      const next = { ...prev };

      const costo = Number(next.precio_compra || 0);
      const utilidad = Number(next.precio_utilidad || 0);
      const precio = Number(next.precio || 0);

      if (fieldName === "precio_utilidad" || fieldName === "precio_compra") {
        next.precio = Number(
          calculateSalePriceFromUtility(costo, utilidad).toFixed(2),
        );
      }

      if (fieldName === "precio") {
        next.precio_utilidad = Number(
          calculateUtilityPercent(costo, precio).toFixed(2),
        );
      }

      return next;
    });
  }

  return {
    products,
    loading,
    saving,
    deleting,
    uploadingImage,

    search,
    setSearch,
    statusFilter,
    setStatusFilter,

    modalMode,
    selectedProduct,
    form,
    localImagePreview,
    authUser,
    userLabels,

    stats,
    filteredProducts,
    paginatedProducts,

    currentPage,
    totalPages,
    startItem,
    endItem,

    openCreateModal,
    openViewModal,
    openEditModal,
    openDeleteModal,
    closeModal,

    onInputChange,
    saveProduct,
    removeProduct,
    removeCurrentImage,
    loadProducts,
    onPriceBlur,

    goToPreviousPage: () => setCurrentPage((prev) => Math.max(prev - 1, 1)),
    goToNextPage: () =>
      setCurrentPage((prev) => Math.min(prev + 1, totalPages)),
  };
}
