import { useEffect, useMemo, useState } from "react";
import supabase from "../../utils/supabase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Boxes,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Barcode,
  Tag,
  Warehouse,
  Loader2,
  Image as ImageIcon,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { generarCodigoProducto } from "../../utils/CodeGenerator";
import { formatMoney, normalizeText } from "../../utils/formatters";

import SummaryCard from "../../components/ui/SummaryCard";
import FilterPill from "../../components/ui/FilterPill";
import SearchInput from "../../components/ui/SearchInput";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal";
import EmptyState from "../../components/ui/EmptyState";
import ActionIconButton from "../../components/ui/ActionIconButton";

const ITEMS_PER_PAGE = 10;

const CATEGORY_OPTIONS = [
  { value: "limpieza", label: "Limpieza" },
  { value: "lavanderia", label: "Lavandería" },
  { value: "higiene_personal", label: "Higiene personal" },
  { value: "cocina", label: "Cocina" },
  { value: "desechables", label: "Desechables" },
  { value: "papeleria", label: "Papelería" },
  { value: "mascotas", label: "Mascotas" },
  { value: "alimentos", label: "Alimentos" },
  { value: "bebidas", label: "Bebidas" },
  { value: "otros", label: "Otros" },
];

const UNIT_OPTIONS = [
  { value: "pieza", label: "Pieza" },
  { value: "caja", label: "Caja" },
  { value: "paquete", label: "Paquete" },
  { value: "bolsa", label: "Bolsa" },
  { value: "botella", label: "Botella" },
  { value: "galon", label: "Galón" },
  { value: "litro", label: "Litro" },
  { value: "mililitro", label: "Mililitro" },
  { value: "kilogramo", label: "Kilogramo" },
  { value: "gramo", label: "Gramo" },
  { value: "metro", label: "Metro" },
  { value: "rollo", label: "Rollo" },
  { value: "bidon", label: "Bidón" },
];

const INITIAL_FORM = {
  id: "",
  nombre: "",
  descripcion: "",
  precio: "",
  imagen: "",
  imagenFile: null,
  disponibilidad: true,
  cantidad: "",
  cantidad_caja: "",
  precio_compra: "",
  precio_utilidad: "",
  habilitado: true,
  categoria: "",
  unidad: "",
  codigo: "",
};

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function looksLikeUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );
}

function getAuthUserLabel(user) {
  if (!user) return null;

  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.username ||
    user.email ||
    null
  );
}

function getProductCreatorLabel(product, authUser, userLabels = {}) {
  if (!product) return "Sin dato";

  const directLabel =
    product.created_by_name ||
    product.created_by_email ||
    product.modified_by_name ||
    product.modified_by_email ||
    product.creator_name ||
    product.creator_email ||
    null;

  if (directLabel) return directLabel;

  const userId = product.created_by || product.modified_by || null;

  if (!userId) return "Sin dato";

  if (userLabels[userId]) return userLabels[userId];

  if (authUser?.id === userId) {
    return getAuthUserLabel(authUser) || "Usuario actual";
  }

  if (!looksLikeUUID(userId)) {
    return userId;
  }

  return "Usuario no disponible";
}

function getCategoryLabel(value) {
  const match = CATEGORY_OPTIONS.find((item) => item.value === value);
  return match?.label || value || "Sin categoría";
}

function getInventoryStatus(product) {
  const stock = Number(product?.cantidad || 0);

  if (!product?.habilitado || !product?.disponibilidad) {
    return {
      key: "oculto",
      label: "Oculto",
      icon: Archive,
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (stock <= 0) {
    return {
      key: "agotado",
      label: "Agotado",
      icon: Archive,
      className: "border-error-100 bg-error-50 text-error-700",
    };
  }

  if (stock <= 10) {
    return {
      key: "stock_bajo",
      label: "Stock bajo",
      icon: AlertTriangle,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  return {
    key: "activo",
    label: "Activo",
    icon: CheckCircle2,
    className: "border-success-100 bg-success-50 text-success-700",
  };
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const [localImagePreview, setLocalImagePreview] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [modalMode, setModalMode] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const [authUser, setAuthUser] = useState(null);
  const [userLabels, setUserLabels] = useState({});

  useEffect(() => {
    loadCurrentUser();
    fetchProducts();
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

  async function loadCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) throw error;

      setAuthUser(data?.user || null);
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

      try {
        const { data, error } = await supabase.rpc("get_auth_user_email", {
          p_user_id: id,
        });

        if (!error && data) {
          nextLabels[id] = data;
          continue;
        }
      } catch (error) {
        console.error("No se pudo resolver el usuario:", error);
      }

      nextLabels[id] = "Usuario no disponible";
    }

    setUserLabels(nextLabels);
  }

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al cargar productos:", error);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  async function uploadProductImage(file, productId) {
    if (!file) return null;

    try {
      setUploadingImage(true);

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${productId}-${Date.now()}.${fileExt}`;
      const filePath = `productos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("productos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("productos")
        .getPublicUrl(filePath);

      return data?.publicUrl || null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function getCurrentUserId() {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    setAuthUser(data?.user || null);

    return data?.user?.id || null;
  }

  function resetForm() {
    setForm(INITIAL_FORM);
  }

  function openCreateModal() {
    const newId = generateUUID();

    setSelectedProduct(null);
    setLocalImagePreview("");
    setForm({
      ...INITIAL_FORM,
      id: newId,
      codigo: generarCodigoProducto(newId),
    });
    setModalMode("create");
  }

  function fillFormFromProduct(product) {
    setSelectedProduct(product);
    setForm({
      id: product.id || "",
      nombre: product.nombre || "",
      descripcion: product.descripcion || "",
      precio: product.precio ?? "",
      imagen: product.imagen || "",
      imagenFile: null,
      disponibilidad: Boolean(product.disponibilidad),
      cantidad: product.cantidad ?? "",
      cantidad_caja: product.cantidad_caja ?? "",
      precio_compra: product.precio_compra ?? "",
      precio_utilidad: product.precio_utilidad ?? "",
      habilitado: Boolean(product.habilitado),
      categoria: product.categoria || "",
      unidad: product.unidad || "",
      codigo: product.codigo || "",
    });
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

  function validateForm() {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (!form.categoria) return "Selecciona una categoría.";
    if (!form.unidad) return "Selecciona una unidad.";

    if (form.precio === "" || Number(form.precio) < 0) {
      return "El precio debe ser válido.";
    }

    if (form.precio_compra === "" || Number(form.precio_compra) < 0) {
      return "El precio de compra debe ser válido.";
    }

    if (form.precio_utilidad === "" || Number(form.precio_utilidad) < 0) {
      return "La utilidad debe ser válida.";
    }

    if (form.cantidad === "" || Number(form.cantidad) < 0) {
      return "La cantidad debe ser válida.";
    }

    if (form.cantidad_caja === "" || Number(form.cantidad_caja) < 0) {
      return "La cantidad por caja debe ser válida.";
    }

    return null;
  }

  function getStoragePathFromUrl(imageUrl, bucketName = "productos") {
    if (!imageUrl) return null;

    try {
      const url = new URL(imageUrl);
      const marker = `/storage/v1/object/public/${bucketName}/`;
      const index = url.pathname.indexOf(marker);

      if (index === -1) return null;

      return decodeURIComponent(url.pathname.slice(index + marker.length));
    } catch {
      return null;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationError = validateForm();

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
          setSaving(false);
          return;
        }

        if (form.imagenFile.size > maxSize) {
          alert("La imagen no debe superar los 2MB.");
          setSaving(false);
          return;
        }

        imageUrl = await uploadProductImage(form.imagenFile, productId);
      }

      const payload = {
        id: productId,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio: Number(form.precio),
        imagen: imageUrl,
        disponibilidad: Boolean(form.disponibilidad),
        cantidad: Number(form.cantidad),
        cantidad_caja: Number(form.cantidad_caja),
        precio_compra: Number(form.precio_compra),
        precio_utilidad: Number(form.precio_utilidad),
        habilitado: Boolean(form.habilitado),
        categoria: form.categoria,
        unidad: form.unidad,
        codigo,
        modified_by: userId,
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        const { error } = await supabase
          .from("productos")
          .update({
            nombre: payload.nombre,
            descripcion: payload.descripcion,
            precio: payload.precio,
            imagen: payload.imagen,
            disponibilidad: payload.disponibilidad,
            cantidad: payload.cantidad,
            cantidad_caja: payload.cantidad_caja,
            precio_compra: payload.precio_compra,
            precio_utilidad: payload.precio_utilidad,
            habilitado: payload.habilitado,
            categoria: payload.categoria,
            unidad: payload.unidad,
            modified_by: payload.modified_by,
            updated_at: payload.updated_at,
          })
          .eq("id", productId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("productos").insert([
          {
            ...payload,
            created_by: userId,
            modified_by: userId,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      }

      await fetchProducts();
      closeModal();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert(error.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedProduct?.id) return;

    try {
      setDeleting(true);

      if (selectedProduct.imagen) {
        const imagePath = getStoragePathFromUrl(selectedProduct.imagen);

        if (imagePath) {
          const { error: storageError } = await supabase.storage
            .from("productos")
            .remove([imagePath]);

          if (storageError) {
            console.error(
              "Error al eliminar imagen del storage:",
              storageError,
            );
          }
        }
      }

      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", selectedProduct.id);

      if (error) throw error;

      await fetchProducts();
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

  const startItem =
    filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredProducts.length,
  );

  const stats = useMemo(() => {
    return {
      total: products.length,
      activos: products.filter(
        (item) => getInventoryStatus(item).key === "activo",
      ).length,
      bajo: products.filter(
        (item) => getInventoryStatus(item).key === "stock_bajo",
      ).length,
      agotados: products.filter(
        (item) => getInventoryStatus(item).key === "agotado",
      ).length,
      ocultos: products.filter(
        (item) => getInventoryStatus(item).key === "oculto",
      ).length,
    };
  }, [products]);

  function goToPreviousPage() {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }

  function goToNextPage() {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }

  function handleExportExcel() {
    const dataToExport = filteredProducts
      .filter(
        (item) => Boolean(item.disponibilidad) && Boolean(item.habilitado),
      )
      .map((item) => ({
        Nombre: item.nombre || "",
        Código: item.codigo || "",
        Descripción: item.descripcion || "",
        Categoría: item.categoria || "",
        Unidad: item.unidad || "",
        Precio: Number(item.precio || 0),
        Cantidad: Number(item.cantidad || 0),
        "Cantidad por caja": Number(item.cantidad_caja || 0),
      }));

    if (!dataToExport.length) {
      alert("No hay productos visibles en web y disponibles para exportar.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
    XLSX.writeFile(
      workbook,
      `productos_web_disponibles_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  async function handleExportPDF() {
    const rows = filteredProducts.filter(
      (item) => Boolean(item.disponibilidad) && Boolean(item.habilitado),
    );

    if (!rows.length) {
      alert(
        "No hay productos visibles en web y disponibles para exportar en PDF.",
      );
      return;
    }

    try {
      setIsExportingPDF(true);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 14;
      let y = 20;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("Catálogo de productos", margin, y);

      y += 10;

      rows.forEach((item, index) => {
        if (y > 260) {
          pdf.addPage();
          y = 20;
        }

        pdf.setDrawColor(220, 220, 220);
        pdf.roundedRect(margin, y, pageWidth - margin * 2, 34, 4, 4);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(
          String(item.nombre || "Sin nombre").slice(0, 65),
          margin + 5,
          y + 8,
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(`Código: ${item.codigo || "Sin código"}`, margin + 5, y + 15);
        pdf.text(
          `Categoría: ${getCategoryLabel(item.categoria)}`,
          margin + 5,
          y + 21,
        );
        pdf.text(
          `Stock: ${Number(item.cantidad || 0)} ${item.unidad || ""}`,
          margin + 5,
          y + 27,
        );

        pdf.setFont("helvetica", "bold");
        pdf.text(formatMoney(item.precio), pageWidth - margin - 5, y + 15, {
          align: "right",
        });

        y += 42;

        if (index === rows.length - 1) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.text(
            `Generado el ${new Date().toLocaleDateString("es-MX")}`,
            margin,
            288,
          );
        }
      });

      pdf.save(
        `catalogo_productos_${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("No se pudo generar el PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  }

  return (
    <section className="space-y-6">
      <ProductFormModal
        open={["create", "view", "edit"].includes(modalMode)}
        mode={modalMode}
        form={form}
        saving={saving}
        onClose={closeModal}
        onChange={onInputChange}
        onSubmit={handleSubmit}
        selectedProduct={selectedProduct}
        onRemoveImage={removeCurrentImage}
        uploadingImage={uploadingImage}
        localImagePreview={localImagePreview}
        authUser={authUser}
        userLabels={userLabels}
      />

      <ConfirmDeleteModal
        open={modalMode === "delete"}
        title="Eliminar producto"
        message="¿Seguro que quieres eliminar este producto?"
        itemName={selectedProduct?.nombre}
        loading={deleting}
        onClose={closeModal}
        onConfirm={handleDelete}
        confirmText="Eliminar producto"
      />

      <StatsGrid stats={stats} />

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Gestión comercial"
          title="Productos"
          description="Administra el catálogo, revisa stock, controla visibilidad en web y edita todo desde modales."
          actions={
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              <Plus className="h-4 w-4" />
              Crear producto
            </button>
          }
        />

        <Toolbar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          filteredProducts={filteredProducts}
          isExportingPDF={isExportingPDF}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />

        {loading ? (
          <EmptyState
            loading
            title="Cargando productos..."
            className="min-h-[240px]"
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay productos para mostrar"
            description="Revisa la búsqueda o crea un producto nuevo."
            className="min-h-[240px]"
          />
        ) : (
          <>
            <ProductsTable
              products={paginatedProducts}
              onView={openViewModal}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />

            <ProductsMobileList
              products={paginatedProducts}
              onView={openViewModal}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />

            <Pagination
              startItem={startItem}
              endItem={endItem}
              totalItems={filteredProducts.length}
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          </>
        )}
      </section>
    </section>
  );
}

function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        icon={Boxes}
        title="Productos totales"
        value={stats.total}
        note="Artículos registrados dentro del catálogo."
        tone="primary"
      />

      <SummaryCard
        icon={CheckCircle2}
        title="Activos"
        value={stats.activos}
        note="Productos visibles y con stock suficiente."
        tone="success"
      />

      <SummaryCard
        icon={AlertTriangle}
        title="Stock bajo"
        value={stats.bajo}
        note="Productos con existencia reducida."
        tone="warning"
      />

      <SummaryCard
        icon={Archive}
        title="Agotados"
        value={stats.agotados}
        note="Productos sin existencia actual."
        tone="error"
      />

      <SummaryCard
        icon={Eye}
        title="Ocultos"
        value={stats.ocultos}
        note="No visibles en la página pública."
        tone="slate"
      />
    </div>
  );
}

function Toolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  filteredProducts,
  isExportingPDF,
  onExportExcel,
  onExportPDF,
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, código o categoría. Usa comas para varios..."
          className="w-full xl:max-w-md"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onExportExcel}
            disabled={filteredProducts.length === 0}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </button>

          <button
            type="button"
            onClick={onExportPDF}
            disabled={filteredProducts.length === 0 || isExportingPDF}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill
          label="Todos"
          active={statusFilter === "todos"}
          onClick={() => setStatusFilter("todos")}
        />

        <FilterPill
          label="Activos"
          active={statusFilter === "activo"}
          onClick={() => setStatusFilter("activo")}
        />

        <FilterPill
          label="Stock bajo"
          active={statusFilter === "stock_bajo"}
          onClick={() => setStatusFilter("stock_bajo")}
        />

        <FilterPill
          label="Agotados"
          active={statusFilter === "agotado"}
          onClick={() => setStatusFilter("agotado")}
        />

        <FilterPill
          label="Ocultos"
          active={statusFilter === "oculto"}
          onClick={() => setStatusFilter("oculto")}
        />
      </div>
    </div>
  );
}

function ProductsTable({ products, onView, onEdit, onDelete }) {
  return (
    <div className="hidden xl:block">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-surface-soft">
            <tr>
              {[
                "Producto",
                "Código",
                "Categoría",
                "Stock",
                "Compra",
                "Venta",
                "Estado",
                "Acciones",
              ].map((header) => (
                <th
                  key={header}
                  className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted ${
                    header === "Acciones" ? "text-right" : ""
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {products.map((item) => (
              <ProductTableRow
                key={item.id}
                item={item}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductTableRow({ item, onView, onEdit, onDelete }) {
  const status = getInventoryStatus(item);
  const StatusIcon = status.icon;

  return (
    <tr className="border-t border-border transition hover:bg-surface-soft/70">
      <td className="px-6 py-5">
        <ProductIdentity item={item} />
      </td>

      <td className="px-6 py-5">
        <Badge icon={Barcode}>{item.codigo}</Badge>
      </td>

      <td className="px-6 py-5">
        <Badge icon={Tag}>{getCategoryLabel(item.categoria)}</Badge>
      </td>

      <td className="px-6 py-5">
        <Badge icon={Warehouse}>{item.cantidad} pzas</Badge>
      </td>

      <td className="px-6 py-5 text-sm font-medium text-text-primary">
        {formatMoney(item.precio_compra)}
      </td>

      <td className="px-6 py-5 text-sm font-bold text-text-primary">
        {formatMoney(item.precio)}
      </td>

      <td className="px-6 py-5">
        <StatusBadge icon={StatusIcon} className={status.className}>
          {status.label}
        </StatusBadge>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center justify-end gap-2">
          <ActionIconButton
            icon={Eye}
            label="Ver producto"
            tone="default"
            onClick={() => onView(item)}
          />

          <ActionIconButton
            icon={Pencil}
            label="Editar producto"
            tone="default"
            onClick={() => onEdit(item)}
          />

          <ActionIconButton
            icon={Trash2}
            label="Eliminar producto"
            tone="default"
            onClick={() => onDelete(item)}
          />
        </div>
      </td>
    </tr>
  );
}

function ProductsMobileList({ products, onView, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
      {products.map((item) => (
        <ProductMobileCard
          key={item.id}
          item={item}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function ProductMobileCard({ item, onView, onEdit, onDelete }) {
  const status = getInventoryStatus(item);
  const StatusIcon = status.icon;

  return (
    <article className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <ProductIdentity item={item} compact />

        <StatusBadge icon={StatusIcon} className={status.className}>
          {status.label}
        </StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo label="Categoría" value={getCategoryLabel(item.categoria)} />
        <MiniInfo label="Stock" value={`${item.cantidad} piezas`} />
        <MiniInfo label="Compra" value={formatMoney(item.precio_compra)} />
        <MiniInfo label="Precio" value={formatMoney(item.precio)} strong />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MobileAction icon={Eye} label="Ver" onClick={() => onView(item)} />
        <MobileAction
          icon={Pencil}
          label="Editar"
          onClick={() => onEdit(item)}
        />
        <MobileAction
          icon={Trash2}
          label="Eliminar"
          onClick={() => onDelete(item)}
        />
      </div>
    </article>
  );
}

function ProductIdentity({ item, compact = false }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary-100 bg-primary-50 text-primary-700">
        {item.imagen ? (
          <img
            src={item.imagen}
            alt={item.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary">{item.nombre}</p>

        <p
          className={`mt-1 text-xs text-text-muted ${
            compact ? "" : "truncate w-48"
          }`}
        >
          {compact
            ? item.codigo
            : item.descripcion || "Producto registrado en catálogo"}
        </p>
      </div>
    </div>
  );
}

function ProductFormModal({
  open,
  mode,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
  selectedProduct,
  onRemoveImage,
  uploadingImage,
  localImagePreview,
  authUser,
  userLabels,
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const status = selectedProduct ? getInventoryStatus(selectedProduct) : null;
  const StatusIcon = status?.icon;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isCreate
          ? "Crear producto"
          : isEdit
            ? "Editar producto"
            : "Detalle del producto"
      }
      subtitle={
        isCreate
          ? "Completa la información del producto. El código se genera automáticamente."
          : isEdit
            ? "Actualiza la información del producto."
            : "Consulta toda la información registrada."
      }
      width="max-w-4xl"
    >
      <form onSubmit={onSubmit} className="space-y-6 p-5 md:p-6">
        {!isCreate && selectedProduct ? (
          <ProductAuditHeader
            selectedProduct={selectedProduct}
            status={status}
            StatusIcon={StatusIcon}
            creatorLabel={getProductCreatorLabel(
              selectedProduct,
              authUser,
              userLabels,
            )}
          />
        ) : null}

        <ProductFormFields
          form={form}
          isView={isView}
          onChange={onChange}
          onRemoveImage={onRemoveImage}
          uploadingImage={uploadingImage}
          localImagePreview={localImagePreview}
        />

        {!isView ? (
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Package className="h-4 w-4" />
              )}

              {isCreate ? "Guardar producto" : "Actualizar producto"}
            </button>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

function ProductAuditHeader({
  selectedProduct,
  status,
  StatusIcon,
  creatorLabel,
}) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-[24px] border border-border bg-surface-soft p-4 lg:col-span-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface">
            {selectedProduct.imagen ? (
              <img
                src={selectedProduct.imagen}
                alt={selectedProduct.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="h-7 w-7 text-text-muted" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-bold text-text-primary">
                {selectedProduct.nombre}
              </h4>

              {status ? (
                <StatusBadge icon={StatusIcon} className={status.className}>
                  {status.label}
                </StatusBadge>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-text-secondary">
              Código: {selectedProduct.codigo || "Sin código"}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MiniInfo
                label="Visible en web"
                value={selectedProduct.habilitado ? "Sí" : "No"}
              />

              <MiniInfo
                label="Disponibilidad"
                value={
                  selectedProduct.disponibilidad
                    ? "Disponible"
                    : "No disponible"
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-border bg-surface-soft p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          Auditoría
        </p>

        <div className="mt-4 space-y-3">
          <MiniInfo
            label="Creado el"
            value={formatDate(selectedProduct.created_at)}
          />
          <MiniInfo
            label="Actualizado el"
            value={formatDate(selectedProduct.updated_at)}
          />
          <MiniInfo
            label="Ultima persona que lo modifico"
            value={creatorLabel || "Usuario no disponible"}
          />
        </div>
      </div>
    </section>
  );
}

function ProductFormFields({
  form,
  isView,
  onChange,
  onRemoveImage,
  uploadingImage,
  localImagePreview,
}) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Nombre">
        <input
          name="nombre"
          value={form.nombre}
          onChange={onChange}
          disabled={isView}
          placeholder="Ej. Detergente en polvo Arcoiris"
          className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70"
        />
      </Field>

      <Field label="Código">
        <input
          name="codigo"
          value={form.codigo}
          readOnly
          disabled
          placeholder="Se genera automáticamente"
          className="h-12 w-full rounded-2xl border border-border bg-surface-soft px-4 text-sm text-text-secondary outline-none"
        />
      </Field>

      <Field label="Descripción" className="md:col-span-2">
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={onChange}
          disabled={isView}
          rows={4}
          placeholder="Describe el producto de forma breve..."
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none disabled:opacity-70"
        />
      </Field>

      <Field label="Categoría">
        <select
          name="categoria"
          value={form.categoria}
          onChange={onChange}
          disabled={isView}
          className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70"
        >
          <option value="">Selecciona una categoría</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Unidad">
        <select
          name="unidad"
          value={form.unidad}
          onChange={onChange}
          disabled={isView}
          className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70"
        >
          <option value="">Selecciona una unidad</option>
          {UNIT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      {[
        ["Precio compra", "precio_compra", "0.00"],
        ["Utilidad", "precio_utilidad", "0.00"],
        ["Precio venta", "precio", "0.00"],
        ["Cantidad", "cantidad", "0"],
        ["Cantidad por caja", "cantidad_caja", "0"],
      ].map(([label, name, placeholder]) => (
        <Field key={name} label={label}>
          <input
            type="number"
            step="0.01"
            min="0"
            name={name}
            value={form[name]}
            onChange={onChange}
            disabled={isView}
            placeholder={placeholder}
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none disabled:opacity-70"
          />
        </Field>
      ))}

      <ImageField
        form={form}
        isView={isView}
        onChange={onChange}
        onRemoveImage={onRemoveImage}
        uploadingImage={uploadingImage}
        localImagePreview={localImagePreview}
      />

      <CheckField
        name="habilitado"
        checked={form.habilitado}
        onChange={onChange}
        disabled={isView}
        title="Visible en web"
        description="Si está apagado, no se muestra en tu página pública."
      />

      <CheckField
        name="disponibilidad"
        checked={form.disponibilidad}
        onChange={onChange}
        disabled={isView}
        title="Disponible para venta"
        description="Marca si el producto está disponible comercialmente."
      />
    </section>
  );
}

function ImageField({
  form,
  isView,
  onChange,
  onRemoveImage,
  uploadingImage,
  localImagePreview,
}) {
  return (
    <div className="space-y-2 md:col-span-2">
      <span className="text-sm font-semibold text-text-primary">
        Imagen del producto
      </span>

      <div className="rounded-[24px] border border-border bg-surface-soft p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface">
            {localImagePreview || form.imagen ? (
              <img
                src={localImagePreview || form.imagen}
                alt={form.nombre || "Vista previa"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-text-muted">
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">Sin imagen</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            {!isView ? (
              <>
                <input
                  type="file"
                  name="imagenFile"
                  accept="image/*"
                  onChange={onChange}
                  className="block w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary file:mr-3 file:rounded-xl file:border-0 file:bg-accent-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />

                <p className="text-xs text-text-secondary">
                  Sube una imagen del producto.
                </p>

                {form.imagen ? (
                  <button
                    type="button"
                    onClick={onRemoveImage}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-error-200 bg-error-50 px-4 text-sm font-semibold text-error-700 transition hover:bg-error-100"
                  >
                    Quitar imagen actual
                  </button>
                ) : null}

                {uploadingImage ? (
                  <p className="text-xs font-medium text-primary-600">
                    Subiendo imagen...
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-text-secondary">
                Imagen registrada del producto.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pagination({
  startItem,
  endItem,
  totalItems,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-text-secondary">
        Mostrando{" "}
        <span className="font-semibold text-text-primary">{startItem}</span>
        {" - "}
        <span className="font-semibold text-text-primary">{endItem}</span>
        {" de "}
        <span className="font-semibold text-text-primary">{totalItems}</span>
        {" productos"}
      </div>

      <div className="flex items-center gap-2 self-end md:self-auto">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <div className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface-soft px-4 text-sm font-semibold text-text-primary">
          Página {currentPage} de {totalPages}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      {children}
    </label>
  );
}

function CheckField({ name, checked, onChange, disabled, title, description }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-soft p-4">
      <input
        type="checkbox"
        name={name}
        checked={Boolean(checked)}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 rounded border-border"
      />

      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
    </label>
  );
}

function Badge({ icon: Icon, children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-secondary">
      <Icon className="h-4 w-4 text-accent-500" />
      {children}
    </div>
  );
}

function StatusBadge({ icon: Icon, className, children }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function MiniInfo({ label, value, strong = false }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>

      <p
        className={`mt-2 text-sm ${
          strong ? "font-bold" : "font-medium"
        } text-text-primary`}
      >
        {value}
      </p>
    </div>
  );
}

function MobileAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
