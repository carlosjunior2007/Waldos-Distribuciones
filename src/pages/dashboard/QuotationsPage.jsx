import { useEffect, useMemo, useState } from "react";
import {
  SlidersHorizontal,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CheckCircle2,
  XCircle,
  TimerReset,
  FileText,
  ChevronLeft,
  ChevronRight,
  User2,
  Building2,
} from "lucide-react";

import supabase from "../../utils/supabase";

import {
  fetchQuotations,
  fetchQuotationSummary,
  fetchQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  searchProducts,
  getCurrentMonthValue,
} from "../../services/quotations";

import { generateQuotationPDF } from "../../utils/quotationPdf";

import SummaryCard from "../../components/ui/SummaryCard";
import FilterPill from "../../components/ui/FilterPill";
import SearchInput from "../../components/ui/SearchInput";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import ActionIconButton from "../../components/ui/ActionIconButton";
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal";

import { formatMoney } from "../../utils/formatters";
import {
  parseBusinessDate,
  formatDateTimeTijuana,
  formatInputDate,
} from "../../utils/dates";
import { cleanNumericInput } from "../../utils/input";

function fromInputDate(value) {
  return value || null;
}

function toBusinessInputDate(value) {
  return formatInputDate(parseBusinessDate(value));
}

function getStatusStyles(status) {
  if (status === "pendiente") {
    return {
      label: "Pendiente",
      icon: Clock3,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  if (status === "en_proceso") {
    return {
      label: "En proceso",
      icon: TimerReset,
      className: "border-info-100 bg-info-50 text-info-700",
    };
  }

  if (status === "completado") {
    return {
      label: "Completado",
      icon: CheckCircle2,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  if (status === "vencido") {
    return {
      label: "Vencido",
      icon: XCircle,
      className: "border-error-100 bg-error-50 text-error-700",
    };
  }

  return {
    label: "Cancelado",
    icon: XCircle,
    className: "border-error-100 bg-error-50 text-error-700",
  };
}

function buildLastMonthsOptions(total = 12) {
  const result = [];
  const today = new Date();

  for (let i = 0; i < total; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);

    result.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      }),
    });
  }

  return result;
}

const INITIAL_FORM = {
  cliente_id: "",
  cliente_nombre: "",
  cliente_telefono: "",
  cliente_email: "",
  cliente_rfc: "",
  cliente_razon_social: "",
  estado: "pendiente",
  descuento: "",
  gastos: "",
  fecha_vencimiento: "",
  iva_porcentaje: "16",
  isr_porcentaje: "0",
  retencion_iva_porcentaje: "0",
};

const IVA_OPTIONS = [
  { value: "0", label: "Sin IVA 0%" },
  { value: "8", label: "IVA frontera 8%" },
  { value: "16", label: "IVA general 16%" },
];

const ISR_OPTIONS = [
  { value: "0", label: "Sin ISR 0%" },
  { value: "1.25", label: "ISR retenido 1.25%" },
  { value: "10", label: "ISR retenido 10%" },
];

const RETENCION_IVA_OPTIONS = [
  { value: "0", label: "Sin retención 0%" },
  { value: "4", label: "Retención IVA 4%" },
  { value: "10.6667", label: "Retención IVA 2/3" },
];

export default function QuotationsPage() {
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

  function handleCreate() {
    setEditingQuotation(null);
    setModalOpen(true);
  }

  async function handleEdit(id) {
    try {
      const quotation = await fetchQuotationById(id);
      setEditingQuotation(quotation);
      setModalOpen(true);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo cargar la cotización.");
    }
  }

  async function handleDelete() {
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

  async function handleDownloadPdf(id) {
    try {
      const quotation = await fetchQuotationById(id);
      generateQuotationPDF(quotation);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo generar el PDF.");
    }
  }

  return (
    <section className="space-y-6">
      <QuotationFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingQuotation(null);
        }}
        onSaved={loadData}
        editingQuotation={editingQuotation}
        currentMonth={month}
      />

      <ConfirmDeleteModal
        open={Boolean(quotationToDelete)}
        title="Eliminar cotización"
        message="¿Seguro que quieres eliminar esta cotización?"
        itemName={quotationToDelete?.folio || "Cotización"}
        loading={deleting}
        onClose={() => setQuotationToDelete(null)}
        onConfirm={handleDelete}
        confirmText="Eliminar cotización"
      />

      <StatsGrid summary={summary} />

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Gestión comercial"
          title="Cotizaciones"
          description="Busca, filtra, edita, elimina, asocia clientes y genera PDF profesional."
          actions={
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              <Plus className="h-4 w-4" />
              Nueva cotización
            </button>
          }
        />

        <Toolbar
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          month={month}
          setMonth={setMonth}
          setPage={setPage}
          monthOptions={monthOptions}
          status={status}
          setStatus={setStatus}
        />

        {loading ? (
          <EmptyState
            loading
            title="Cargando cotizaciones..."
            className="min-h-[260px]"
          />
        ) : (
          <>
            <QuotationsTable
              rows={rows}
              onDownloadPdf={handleDownloadPdf}
              onEdit={handleEdit}
              onDelete={setQuotationToDelete}
            />

            <QuotationsMobileList
              rows={rows}
              onDownloadPdf={handleDownloadPdf}
              onEdit={handleEdit}
              onDelete={setQuotationToDelete}
            />

            {!rows.length ? (
              <EmptyState
                title="No hay cotizaciones para este filtro"
                description="Prueba cambiando el mes, el estado o la búsqueda."
                className="border-t border-border"
              />
            ) : null}
          </>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>
    </section>
  );
}

function StatsGrid({ summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={FileText}
        title="Cotizaciones del mes"
        value={summary.total}
        note="Total del mes seleccionado."
        tone="primary"
      />

      <SummaryCard
        icon={Clock3}
        title="Pendientes"
        value={summary.pendientes}
        note="A la espera de respuesta."
        tone="warning"
      />

      <SummaryCard
        icon={TimerReset}
        title="En proceso"
        value={summary.enProceso}
        note="Con seguimiento activo."
        tone="info"
      />

      <SummaryCard
        icon={CheckCircle2}
        title="Ganancia real"
        value={formatMoney(summary.totalGananciaReal)}
        note="Solo cotizaciones completadas."
        tone="success"
      />
    </div>
  );
}

function Toolbar({
  searchInput,
  setSearchInput,
  month,
  setMonth,
  setPage,
  monthOptions,
  status,
  setStatus,
}) {
  const filters = [
    ["todas", "Todas"],
    ["pendiente", "Pendientes"],
    ["en_proceso", "En proceso"],
    ["completado", "Completadas"],
    ["cancelado", "Canceladas"],
    ["vencido", "Vencidas"],
  ];

  return (
    <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Buscar por folio o cliente..."
          className="w-full xl:max-w-md"
        />

        <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary">
          <SlidersHorizontal className="h-4 w-4" />

          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPage(1);
            }}
            className="bg-transparent outline-none"
          >
            {monthOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <FilterPill
            key={value}
            label={label}
            active={status === value}
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function QuotationFormModal({
  open,
  onClose,
  onSaved,
  editingQuotation,
  currentMonth,
}) {
  const [loading, setLoading] = useState(false);

  const [clientMode, setClientMode] = useState("manual");
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState([]);

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (editingQuotation) {
      const hasClient = Boolean(editingQuotation.cliente_id);

      setClientMode(hasClient ? "existing" : "manual");

      setForm({
        cliente_id: editingQuotation.cliente_id || "",
        cliente_nombre: editingQuotation.cliente_nombre || "",
        cliente_telefono: editingQuotation.cliente_telefono || "",
        cliente_email: editingQuotation.cliente_email || "",
        cliente_rfc:
          editingQuotation.cliente_rfc || editingQuotation.clientes?.rfc || "",
        cliente_razon_social:
          editingQuotation.cliente_razon_social ||
          editingQuotation.clientes?.razon_social ||
          "",
        estado: editingQuotation.estado || "pendiente",
        descuento:
          editingQuotation.descuento !== null &&
          editingQuotation.descuento !== undefined
            ? String(editingQuotation.descuento)
            : "",
        gastos:
          editingQuotation.gastos !== null &&
          editingQuotation.gastos !== undefined
            ? String(editingQuotation.gastos)
            : "",
        fecha_vencimiento: toBusinessInputDate(
          editingQuotation.fecha_vencimiento,
        ),
        iva_porcentaje:
          editingQuotation.iva_porcentaje !== null &&
          editingQuotation.iva_porcentaje !== undefined
            ? String(editingQuotation.iva_porcentaje)
            : "16",
        isr_porcentaje:
          editingQuotation.isr_porcentaje !== null &&
          editingQuotation.isr_porcentaje !== undefined
            ? String(editingQuotation.isr_porcentaje)
            : "0",
        retencion_iva_porcentaje:
          editingQuotation.retencion_iva_porcentaje !== null &&
          editingQuotation.retencion_iva_porcentaje !== undefined
            ? String(editingQuotation.retencion_iva_porcentaje)
            : "0",
      });

      setItems(
        (editingQuotation.detalles || []).map((item) => ({
          producto_id: item.producto_id,
          nombre_producto: item.nombre_producto,
          codigo: item.codigo || "",
          unidad: item.unidad || "",
          cantidad: Number(item.cantidad ?? 1),
          stock_disponible:
            Number(item.producto?.cantidad || 0) + Number(item.cantidad || 0),
          precio_unitario: Number(item.precio_unitario ?? 0),
          costo_unitario: Number(item.costo_unitario ?? 0),
          importe: Number(item.importe || 0),
          ganancia_linea: Number(item.ganancia_linea || 0),
        })),
      );
    } else {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);

      setClientMode("manual");
      setForm({
        ...INITIAL_FORM,
        fecha_vencimiento: formatInputDate(defaultDate),
      });

      setItems([]);
    }

    setClientQuery("");
    setClientResults([]);
    setProductQuery("");
    setProductResults([]);
  }, [open, editingQuotation]);

  useEffect(() => {
    if (!open || clientMode !== "existing") return;

    const timer = setTimeout(async () => {
      try {
        let query = supabase
          .from("clientes")
          .select(
            `
            id,
            nombre,
            razon_social,
            rfc,
            numero,
            correo,
            direccion,
            ciudad,
            estado,
            codigo_postal,
            pais
          `,
          )
          .order("nombre", { ascending: true })
          .limit(8);

        if (clientQuery.trim()) {
          query = query.or(
            `nombre.ilike.%${clientQuery}%,razon_social.ilike.%${clientQuery}%,rfc.ilike.%${clientQuery}%,correo.ilike.%${clientQuery}%`,
          );
        }

        const { data, error } = await query;
        if (error) throw error;

        setClientResults(data || []);
      } catch (error) {
        console.error(error);
        setClientResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, clientMode, clientQuery]);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      try {
        const rows = await searchProducts(productQuery);
        setProductResults(rows);
      } catch (error) {
        console.error(error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productQuery, open]);

  const totals = useMemo(() => {
    const rows = items.map((item) => {
      const cantidad = Number(item.cantidad || 0);
      const precio = Number(item.precio_unitario || 0);
      const costo = Number(item.costo_unitario || 0);

      const importe = cantidad * precio;
      const gananciaLinea = cantidad * (precio - costo);

      return {
        ...item,
        importe,
        ganancia_linea: gananciaLinea,
      };
    });

    const subtotal = rows.reduce(
      (acc, item) => acc + Number(item.importe || 0),
      0,
    );

    const descuento = Number(form.descuento || 0);
    const base = Math.max(subtotal - descuento, 0);

    const ivaMonto = base * (Number(form.iva_porcentaje || 0) / 100);
    const isrMonto = base * (Number(form.isr_porcentaje || 0) / 100);
    const retencionIvaMonto =
      base * (Number(form.retencion_iva_porcentaje || 0) / 100);

    const totalImpuestos = ivaMonto;
    const totalRetenciones = isrMonto + retencionIvaMonto;
    const total = base + totalImpuestos - totalRetenciones;

    const ganancia = rows.reduce(
      (acc, item) => acc + Number(item.ganancia_linea || 0),
      0,
    );

    return {
      rows,
      subtotal,
      descuento,
      base,
      ivaMonto,
      isrMonto,
      retencionIvaMonto,
      totalImpuestos,
      totalRetenciones,
      ganancia,
      total,
    };
  }, [
    items,
    form.descuento,
    form.iva_porcentaje,
    form.isr_porcentaje,
    form.retencion_iva_porcentaje,
  ]);

  function updateFormField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function applyClient(client) {
    setForm((prev) => ({
      ...prev,
      cliente_id: client.id,
      cliente_nombre: client.nombre || "",
      cliente_telefono: client.numero || "",
      cliente_email: client.correo || "",
      cliente_rfc: client.rfc || "",
      cliente_razon_social: client.razon_social || "",
    }));
  }

  function clearAssociatedClient() {
    setForm((prev) => ({
      ...prev,
      cliente_id: "",
      cliente_nombre: "",
      cliente_telefono: "",
      cliente_email: "",
      cliente_rfc: "",
      cliente_razon_social: "",
    }));
  }

  function addProduct(product) {
    const stockDisponible = Number(product.cantidad || 0);

    if (stockDisponible <= 0) {
      alert("Este producto no tiene stock disponible.");
      return;
    }

    const existingIndex = items.findIndex(
      (item) => item.producto_id === product.id,
    );

    if (existingIndex >= 0) {
      const next = [...items];
      const current = next[existingIndex];
      const newQty = Number(current.cantidad || 0) + 1;
      const maxQty = Number(current.stock_disponible || stockDisponible);

      if (newQty > maxQty) {
        alert(`No puedes agregar más de ${maxQty} unidades disponibles.`);
        return;
      }

      next[existingIndex] = {
        ...current,
        cantidad: newQty,
        importe: newQty * Number(current.precio_unitario || 0),
        ganancia_linea:
          newQty *
          (Number(current.precio_unitario || 0) -
            Number(current.costo_unitario || 0)),
      };

      setItems(next);
      return;
    }

    const precio = Number(product.precio || 0);
    const costo = Number(product.precio_compra || 0);

    setItems((prev) => [
      ...prev,
      {
        producto_id: product.id,
        nombre_producto: product.nombre,
        codigo: product.codigo || "",
        unidad: product.unidad || "",
        cantidad: "1",
        stock_disponible: stockDisponible,
        precio_unitario: precio,
        costo_unitario: costo,
        importe: precio,
        ganancia_linea: precio - costo,
      },
    ]);
  }

  function updateItem(index, key, value) {
    const next = [...items];

    if (key === "cantidad") {
      const maxQty = Number(next[index].stock_disponible || 0);
      const requestedQty = Number(value || 0);

      if (requestedQty > maxQty) {
        alert(`Solo hay ${maxQty} unidades disponibles de este producto.`);
        next[index] = { ...next[index], [key]: String(maxQty) };
      } else {
        next[index] = { ...next[index], [key]: value };
      }
    } else {
      next[index] = { ...next[index], [key]: value };
    }

    const cantidad = Number(next[index].cantidad || 0);
    const precio = Number(next[index].precio_unitario || 0);
    const costo = Number(next[index].costo_unitario || 0);

    next[index].importe = cantidad * precio;
    next[index].ganancia_linea = cantidad * (precio - costo);

    setItems(next);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.cliente_nombre.trim()) {
      alert("El nombre del cliente es obligatorio.");
      return;
    }

    if (!items.length) {
      alert("Agrega al menos un producto.");
      return;
    }

    try {
      setLoading(true);

      const cleanItems = totals.rows.map((item) => ({
        producto_id: item.producto_id,
        cantidad: Number(item.cantidad || 0),
        precio_unitario: Number(item.precio_unitario || 0),
        costo_unitario: Number(item.costo_unitario || 0),
        importe: Number(item.importe || 0),
        ganancia_linea: Number(item.ganancia_linea || 0),
      }));

      const payload = {
        header: {
          ...form,
          cliente_id: form.cliente_id || null,
          cliente_nombre: form.cliente_nombre.trim(),
          cliente_telefono: form.cliente_telefono.trim() || null,
          cliente_email: form.cliente_email.trim() || null,
          cliente_rfc: form.cliente_rfc.trim().toUpperCase() || null,
          cliente_razon_social: form.cliente_razon_social.trim() || null,
          descuento: Number(form.descuento || 0),
          gastos: Number(form.gastos || 0),
          iva_porcentaje: Number(form.iva_porcentaje || 0),
          iva_monto: totals.ivaMonto,
          isr_porcentaje: Number(form.isr_porcentaje || 0),
          isr_monto: totals.isrMonto,
          retencion_iva_porcentaje: Number(form.retencion_iva_porcentaje || 0),
          retencion_iva_monto: totals.retencionIvaMonto,
          total_impuestos: totals.totalImpuestos,
          total_retenciones: totals.totalRetenciones,
          subtotal: totals.subtotal,
          total: totals.total,
          ganancia: totals.ganancia,
          fecha_vencimiento: fromInputDate(form.fecha_vencimiento),
        },
        items: cleanItems,
      };

      if (editingQuotation?.id) {
        await updateQuotation(editingQuotation.id, payload);
      } else {
        await createQuotation({
          ...payload,
          month: currentMonth,
        });
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar la cotización.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingQuotation ? "Editar cotización" : "Nueva cotización"}
      subtitle={editingQuotation?.folio || "Captura de cotización"}
      width="max-w-7xl"
      zIndex="z-[80]"
    >
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-col overflow-x-hidden"
      >
        <div className="grid gap-4 p-4 pb-6 sm:gap-6 sm:p-5 lg:grid-cols-12">
          <div className="min-w-0 space-y-4 lg:col-span-4">
            <ClientFormSection
              form={form}
              updateFormField={updateFormField}
              clientMode={clientMode}
              setClientMode={setClientMode}
              clientQuery={clientQuery}
              setClientQuery={setClientQuery}
              clientResults={clientResults}
              applyClient={applyClient}
              clearAssociatedClient={clearAssociatedClient}
            />

            <TaxSection form={form} updateFormField={updateFormField} />

            <SummarySection
              form={form}
              totals={totals}
              loading={loading}
              className="hidden lg:block"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
            <ProductSearchSection
              productQuery={productQuery}
              setProductQuery={setProductQuery}
              productResults={productResults}
              addProduct={addProduct}
            />

            <AddedProductsSection
              rows={totals.rows}
              updateItem={updateItem}
              removeItem={removeItem}
            />
          </div>
        </div>

        <SummarySection
          form={form}
          totals={totals}
          loading={loading}
          className="mx-4 mb-4 lg:hidden"
        />
      </form>
    </Modal>
  );
}

function ClientFormSection({
  form,
  updateFormField,
  clientMode,
  setClientMode,
  clientQuery,
  setClientQuery,
  clientResults,
  applyClient,
  clearAssociatedClient,
}) {
  return (
    <div className="rounded-[20px] border border-border bg-background p-4 sm:rounded-[24px]">
      <h4 className="text-sm font-bold text-text-primary">Datos del cliente</h4>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterPill
          label="Manual"
          active={clientMode === "manual"}
          onClick={() => {
            setClientMode("manual");
            clearAssociatedClient();
          }}
        />

        <FilterPill
          label="Cliente existente"
          active={clientMode === "existing"}
          onClick={() => setClientMode("existing")}
        />
      </div>

      {clientMode === "existing" ? (
        <div className="mt-4 space-y-3">
          <SearchInput
            value={clientQuery}
            onChange={setClientQuery}
            placeholder="Buscar cliente por nombre, RFC o correo..."
          />

          {form.cliente_id ? (
            <div className="rounded-2xl border border-success-100 bg-success-50 p-3 text-sm text-success-700">
              Cliente asociado:{" "}
              <span className="font-bold">{form.cliente_nombre}</span>
            </div>
          ) : null}

          <div className="max-h-48 space-y-2 overflow-y-auto">
            {clientResults.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => applyClient(client)}
                className="w-full rounded-2xl border border-border bg-surface p-3 text-left transition hover:border-primary-200 hover:bg-surface-soft"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                    {client.rfc ? (
                      <Building2 className="h-4 w-4 text-text-muted" />
                    ) : (
                      <User2 className="h-4 w-4 text-text-muted" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {client.nombre}
                    </p>

                    <p className="mt-1 truncate text-xs text-text-muted">
                      {client.razon_social || "Sin razón social"} ·{" "}
                      {client.rfc || "Sin RFC"}
                    </p>

                    <p className="mt-1 truncate text-xs text-text-muted">
                      {client.correo || "Sin correo"}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {!clientResults.length ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                No hay clientes para mostrar.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <input
          type="text"
          placeholder="Nombre del cliente"
          value={form.cliente_nombre}
          onChange={(e) => updateFormField("cliente_nombre", e.target.value)}
          className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
        />

        <input
          type="text"
          placeholder="Razón social"
          value={form.cliente_razon_social}
          onChange={(e) =>
            updateFormField("cliente_razon_social", e.target.value)
          }
          className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
        />

        <input
          type="text"
          placeholder="RFC"
          value={form.cliente_rfc}
          onChange={(e) => updateFormField("cliente_rfc", e.target.value)}
          className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
        />

        <input
          type="text"
          placeholder="Teléfono"
          value={form.cliente_telefono}
          onChange={(e) => updateFormField("cliente_telefono", e.target.value)}
          className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
        />

        <input
          type="email"
          placeholder="Email"
          value={form.cliente_email}
          onChange={(e) => updateFormField("cliente_email", e.target.value)}
          className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
        />

        <select
          value={form.estado}
          onChange={(e) => updateFormField("estado", e.target.value)}
          className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
        >
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En proceso</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <input
          type="date"
          value={form.fecha_vencimiento}
          onChange={(e) => updateFormField("fecha_vencimiento", e.target.value)}
          className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
        />
      </div>
    </div>
  );
}

function TaxSection({ form, updateFormField }) {
  return (
    <div className="rounded-[20px] border border-border bg-background p-4 sm:rounded-[24px]">
      <h4 className="text-sm font-bold text-text-primary">
        Impuestos y retenciones
      </h4>

      <div className="mt-4 grid gap-3">
        <MoneyInput
          label="Descuento"
          value={form.descuento}
          onChange={(value) => updateFormField("descuento", value)}
        />

        <MoneyInput
          label="Gastos internos"
          value={form.gastos}
          onChange={(value) => updateFormField("gastos", value)}
        />

        <SelectPercentInput
          label="IVA"
          value={form.iva_porcentaje}
          options={IVA_OPTIONS}
          onChange={(value) => updateFormField("iva_porcentaje", value)}
        />

        <SelectPercentInput
          label="ISR retenido"
          value={form.isr_porcentaje}
          options={ISR_OPTIONS}
          onChange={(value) => updateFormField("isr_porcentaje", value)}
        />

        <SelectPercentInput
          label="IVA retenido"
          value={form.retencion_iva_porcentaje}
          options={RETENCION_IVA_OPTIONS}
          onChange={(value) =>
            updateFormField("retencion_iva_porcentaje", value)
          }
        />
      </div>
    </div>
  );
}

function MoneyInput({ label, value, onChange }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-text-primary">{label}</span>

      <div className="flex h-12 items-center rounded-2xl border border-border bg-surface px-4">
        <span className="mr-2 text-sm font-semibold text-text-muted">$</span>

        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) =>
            onChange(cleanNumericInput(e.target.value, { allowDecimal: true }))
          }
          className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none"
        />
      </div>
    </label>
  );
}

function SelectPercentInput({ label, value, options, onChange }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-text-primary">{label}</span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummarySection({ form, totals, loading, className = "" }) {
  return (
    <div
      className={`w-full min-w-0 rounded-[20px] border border-border bg-background p-4 sm:rounded-[24px] ${className}`}
    >
      <h4 className="text-sm font-bold text-text-primary">Resumen</h4>

      <div className="mt-4 w-full min-w-0 space-y-2 text-sm">
        <SummaryLine label="Subtotal" value={formatMoney(totals.subtotal)} />
        <SummaryLine label="Descuento" value={formatMoney(totals.descuento)} />
        <SummaryLine label="Base" value={formatMoney(totals.base)} />

        <SummaryLine
          label={`IVA ${form.iva_porcentaje || 0}%`}
          value={formatMoney(totals.ivaMonto)}
        />

        <SummaryLine
          label={`ISR retenido ${form.isr_porcentaje || 0}%`}
          value={`-${formatMoney(totals.isrMonto)}`}
        />

        <SummaryLine
          label={`IVA retenido ${form.retencion_iva_porcentaje || 0}%`}
          value={`-${formatMoney(totals.retencionIvaMonto)}`}
        />

        <SummaryLine label="Total" value={formatMoney(totals.total)} bold />

        <div className="flex items-center justify-between rounded-xl border border-success-100 bg-success-50 px-3 py-2">
          <span className="text-success-700">
            {form.estado === "completado"
              ? "Ganancia real"
              : "Ganancia estimada"}
          </span>

          <span className="font-bold text-success-700">
            {formatMoney(totals.ganancia)}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex h-12 w-full max-w-full items-center justify-center rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Guardar cotización"}
      </button>
    </div>
  );
}

function SummaryLine({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-secondary">{label}</span>

      <span
        className={`text-right ${
          bold ? "font-bold" : "font-semibold"
        } text-text-primary`}
      >
        {value}
      </span>
    </div>
  );
}

function ProductSearchSection({
  productQuery,
  setProductQuery,
  productResults,
  addProduct,
}) {
  return (
    <div className="min-w-0 rounded-[20px] border border-border bg-background p-4 sm:rounded-[24px]">
      <h4 className="text-sm font-bold text-text-primary">Buscar productos</h4>

      <SearchInput
        value={productQuery}
        onChange={setProductQuery}
        placeholder="Buscar por nombre o código..."
        className="mt-4 bg-surface"
      />

      <div className="mt-4 max-h-56 space-y-2 overflow-y-auto md:max-h-72">
        {productResults.length ? (
          productResults.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addProduct(product)}
              className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-surface p-3 text-left transition hover:border-primary-200 hover:bg-surface-soft sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-text-primary">
                  {product.nombre}
                </p>

                <p className="text-sm text-text-secondary">
                  {product.codigo || "Sin código"} · {product.unidad || "-"}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="font-semibold text-text-primary">
                  {formatMoney(product.precio || 0)}
                </p>

                <p className="text-xs text-text-muted">
                  costo: {formatMoney(product.precio_compra || 0)}
                </p>

                <p
                  className={`text-xs font-semibold ${
                    Number(product.cantidad || 0) <= 5
                      ? "text-error-700"
                      : "text-success-700"
                  }`}
                >
                  stock: {Number(product.cantidad || 0)} {product.unidad || "pzas"}
                </p>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
            No hay productos para mostrar.
          </div>
        )}
      </div>
    </div>
  );
}

function AddedProductsSection({ rows, updateItem, removeItem }) {
  return (
    <div className="min-w-0 rounded-[20px] border border-border bg-background p-4 sm:rounded-[24px]">
      <h4 className="text-sm font-bold text-text-primary">
        Productos agregados
      </h4>

      {!rows.length ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
          Todavía no agregas productos.
        </div>
      ) : (
        <>
          <div className="mt-4 hidden max-w-full overflow-x-auto md:block">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Producto",
                    "Cantidad",
                    "Precio",
                    "Importe",
                    "Ganancia",
                    "Acción",
                  ].map((header) => (
                    <th
                      key={header}
                      className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted ${
                        header === "Acción" ? "text-right" : ""
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((item, index) => (
                  <AddedProductRow
                    key={`${item.producto_id}-${index}`}
                    item={item}
                    index={index}
                    updateItem={updateItem}
                    removeItem={removeItem}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-3 md:hidden">
            {rows.map((item, index) => (
              <AddedProductCard
                key={`${item.producto_id}-${index}`}
                item={item}
                index={index}
                updateItem={updateItem}
                removeItem={removeItem}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AddedProductRow({ item, index, updateItem, removeItem }) {
  return (
    <tr className="border-b border-border">
      <td className="px-3 py-3">
        <p className="font-semibold text-text-primary">
          {item.nombre_producto}
        </p>
        <p className="text-xs text-text-muted">
          {item.codigo || "Sin código"} · {item.unidad || "-"}
        </p>
        <p className="text-xs font-semibold text-text-secondary">
          Disponible: {Number(item.stock_disponible || 0)}
        </p>
      </td>

      <td className="px-3 py-3">
        <NumberCell
          value={item.cantidad}
          allowDecimal={false}
          onChange={(value) => updateItem(index, "cantidad", value)}
        />
      </td>

      <td className="px-3 py-3">
        <NumberCell
          value={item.precio_unitario}
          allowDecimal
          onChange={(value) => updateItem(index, "precio_unitario", value)}
          className="w-28"
        />
      </td>

      <td className="px-3 py-3 text-sm font-semibold text-text-primary">
        {formatMoney(item.importe)}
      </td>

      <td className="px-3 py-3 text-sm font-semibold text-success-700">
        {formatMoney(item.ganancia_linea)}
      </td>

      <td className="px-3 py-3 text-right">
        <ActionIconButton
          icon={Trash2}
          label="Quitar producto"
          tone="error"
          onClick={() => removeItem(index)}
        />
      </td>
    </tr>
  );
}

function AddedProductCard({ item, index, updateItem, removeItem }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-text-primary">
            {item.nombre_producto}
          </p>

          <p className="text-xs text-text-muted">
            {item.codigo || "Sin código"} · {item.unidad || "-"}
          </p>
        </div>

        <ActionIconButton
          icon={Trash2}
          label="Quitar producto"
          tone="error"
          onClick={() => removeItem(index)}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Cantidad">
          <NumberCell
            value={item.cantidad}
            allowDecimal={false}
            onChange={(value) => updateItem(index, "cantidad", value)}
            className="w-full"
          />
        </Field>

        <Field label="Precio">
          <NumberCell
            value={item.precio_unitario}
            allowDecimal
            onChange={(value) => updateItem(index, "precio_unitario", value)}
            className="w-full"
          />
        </Field>
      </div>

      <div className="mt-4 space-y-2 rounded-xl bg-background p-3 text-sm">
        <SummaryLine label="Importe" value={formatMoney(item.importe)} />
        <SummaryLine
          label="Ganancia"
          value={formatMoney(item.ganancia_linea)}
        />
      </div>
    </div>
  );
}

function NumberCell({
  value,
  onChange,
  allowDecimal = true,
  className = "w-24",
}) {
  return (
    <input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={value}
      onChange={(e) =>
        onChange(
          cleanNumericInput(e.target.value, {
            allowDecimal,
          }),
        )
      }
      className={`h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary-400 ${className}`}
    />
  );
}

function QuotationsTable({ rows, onDownloadPdf, onEdit, onDelete }) {
  return (
    <div className="hidden xl:block">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-surface-soft">
            <tr>
              {[
                "Folio",
                "Cliente",
                "Fechas",
                "Estado",
                "Total",
                "Ganancia",
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
            {rows.map((item) => (
              <QuotationRow
                key={item.id}
                item={item}
                onDownloadPdf={onDownloadPdf}
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

function QuotationRow({ item, onDownloadPdf, onEdit, onDelete }) {
  const statusMeta = getStatusStyles(item.estado);
  const StatusIcon = statusMeta.icon;

  return (
    <tr className="border-t border-border transition hover:bg-surface-soft/70">
      <td className="px-6 py-5">
        <p className="text-sm font-semibold text-text-primary">{item.folio}</p>
        <p className="mt-1 text-xs text-text-muted">Cotización registrada</p>
      </td>

      <td className="px-6 py-5">
        <p className="text-sm font-medium text-text-primary">
          {item.cliente_nombre}
        </p>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-start gap-4">
          <DateBadge
            icon={CalendarDays}
            label={`Creada: ${formatDateTimeTijuana(item.created_at)}`}
          />

          <DateBadge
            icon={Clock3}
            label={`Vence: ${formatDateTimeTijuana(item.fecha_vencimiento)}`}
            accent
          />
        </div>
      </td>

      <td className="px-6 py-5">
        <StatusBadge icon={StatusIcon} className={statusMeta.className}>
          {statusMeta.label}
        </StatusBadge>
      </td>

      <td className="px-6 py-5">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {formatMoney(item.total)}
          </p>

          <p className="mt-1 text-xs text-text-muted">
            Subtotal: {formatMoney(item.subtotal || 0)}
          </p>

          {Number(item.iva_monto || 0) > 0 ? (
            <p className="mt-1 text-xs text-text-muted">
              IVA: {formatMoney(item.iva_monto)}
            </p>
          ) : null}

          {Number(item.total_retenciones || 0) > 0 ? (
            <p className="mt-1 text-xs text-text-muted">
              Ret.: -{formatMoney(item.total_retenciones)}
            </p>
          ) : null}
        </div>
      </td>

      <td className="px-6 py-5">
        <AmountBadge>{formatMoney(item.ganancia || 0)}</AmountBadge>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center justify-end gap-2">
          <ActionIconButton
            icon={Eye}
            label="Descargar PDF"
            tone="default"
            onClick={() => onDownloadPdf(item.id)}
          />

          <ActionIconButton
            icon={Pencil}
            label="Editar"
            tone="default"
            onClick={() => onEdit(item.id)}
          />

          <ActionIconButton
            icon={Trash2}
            label="Eliminar"
            tone="default"
            onClick={() => onDelete(item)}
          />
        </div>
      </td>
    </tr>
  );
}

function QuotationsMobileList({ rows, onDownloadPdf, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
      {rows.map((item) => (
        <QuotationMobileCard
          key={item.id}
          item={item}
          onDownloadPdf={onDownloadPdf}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function QuotationMobileCard({ item, onDownloadPdf, onEdit, onDelete }) {
  const statusMeta = getStatusStyles(item.estado);
  const StatusIcon = statusMeta.icon;

  return (
    <article className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {item.folio}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {item.cliente_nombre}
          </p>
        </div>

        <StatusBadge icon={StatusIcon} className={statusMeta.className}>
          {statusMeta.label}
        </StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo
          label="Fecha"
          value={formatDateTimeTijuana(item.created_at)}
        />
        <MiniInfo
          label="Vence"
          value={formatDateTimeTijuana(item.fecha_vencimiento)}
        />
        <MiniInfo label="Subtotal" value={formatMoney(item.subtotal || 0)} />
        <MiniInfo label="IVA" value={formatMoney(item.iva_monto || 0)} />
        <MiniInfo
          label="Retenciones"
          value={`-${formatMoney(item.total_retenciones || 0)}`}
        />
        <MiniInfo label="Total" value={formatMoney(item.total)} strong />
        <MiniInfo
          label="Ganancia"
          value={formatMoney(item.ganancia || 0)}
          valueClass="text-success-700"
          strong
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MobileAction
          icon={Eye}
          label="PDF"
          onClick={() => onDownloadPdf(item.id)}
        />

        <MobileAction
          icon={Pencil}
          label="Editar"
          onClick={() => onEdit(item.id)}
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

function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-between border-t border-border p-5">
      <p className="text-sm text-text-secondary">
        Página {page} de {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange((prev) => Math.max(1, prev - 1))}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-text-primary disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange((prev) => Math.min(totalPages, prev + 1))}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-text-primary disabled:opacity-50"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
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

function AmountBadge({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-success-100 bg-success-50 px-3 py-2 text-sm font-semibold text-success-700">
      <CircleDollarSign className="h-4 w-4" />
      {children}
    </div>
  );
}

function DateBadge({ icon: Icon, label, accent = false }) {
  return (
    <div className="inline-flex items-center gap-1 text-sm text-text-secondary">
      <Icon
        className={`h-4 w-4 ${accent ? "text-accent-500" : "text-primary-500"}`}
      />
      <span>{label}</span>
    </div>
  );
}

function MiniInfo({
  label,
  value,
  strong = false,
  valueClass = "text-text-primary",
}) {
  return (
    <div className="rounded-2xl bg-surface-soft p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>

      <p
        className={`mt-2 text-sm ${
          strong ? "font-bold" : "font-medium"
        } ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </label>
      {children}
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
