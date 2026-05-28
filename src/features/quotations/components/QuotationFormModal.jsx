import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Info,
  Search,
  Trash2,
  User2,
  X,
} from "lucide-react";

import supabase from "../../../utils/supabase";
import {
  createQuotation,
  updateQuotation,
  searchProducts,
} from "../services/quotations.js";

import Modal from "../../../components/ui/Modal";
import SearchInput from "../../../components/ui/SearchInput";
import ActionIconButton from "../../../components/ui/ActionIconButton";

import { formatMoney } from "../../../utils/formatters";
import { formatInputDate } from "../../../utils/dates";
import { cleanNumericInput } from "../../../utils/input";

import {
  INITIAL_QUOTATION_FORM,
  IVA_OPTIONS,
  ISR_OPTIONS,
} from "../quotation.constants";

import {
  buildQuotationItemsFromDetails,
  capitalizeFirstLetter,
  buildQuotationPayload,
  calculateLine,
  calculateQuotationTotals,
  calculateSalePriceFromUtility,
  calculateUtilityPercent,
  normalizeCapitalizedText,
  toBusinessInputDate,
} from "../quotation.helpers";

const CAPITALIZED_FORM_FIELDS = new Set(["cliente_nombre", "notas"]);

export default function QuotationFormModal({
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

  const [form, setForm] = useState(INITIAL_QUOTATION_FORM);
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("quotation");

  useEffect(() => {
    if (!open) return;

    if (editingQuotation) {
      const hasClient = Boolean(editingQuotation.cliente_id);

      setClientMode(hasClient ? "existing" : "manual");

      setForm({
        cliente_id: editingQuotation.cliente_id || "",
        cliente_nombre: capitalizeFirstLetter(
          editingQuotation.cliente_nombre || "",
        ),
        cliente_telefono: editingQuotation.cliente_telefono || "",
        cliente_email: editingQuotation.cliente_email || "",
        estado: editingQuotation.estado || "borrador",
        descuento:
          editingQuotation.descuento !== null &&
          editingQuotation.descuento !== undefined
            ? String(editingQuotation.descuento)
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
        notas: capitalizeFirstLetter(editingQuotation.notas || ""),
      });

      setItems(buildQuotationItemsFromDetails(editingQuotation.detalles || []));
    } else {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);

      setClientMode("manual");
      setForm({
        ...INITIAL_QUOTATION_FORM,
        estado: "borrador",
        fecha_vencimiento: formatInputDate(defaultDate),
      });

      setItems([]);
    }

    setActiveTab("quotation");
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
        console.error("Error buscando clientes:", error);
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
        console.error("Error buscando productos:", error);
        setProductResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productQuery, open]);

  const totals = useMemo(() => {
    return calculateQuotationTotals(items, form);
  }, [items, form.descuento, form.iva_porcentaje, form.isr_porcentaje]);

  function updateFormField(key, value) {
    const nextValue = CAPITALIZED_FORM_FIELDS.has(key)
      ? capitalizeFirstLetter(value)
      : value;

    setForm((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
  }

  function applyClient(client) {
    setForm((prev) => ({
      ...prev,
      cliente_id: client.id,
      cliente_nombre: capitalizeFirstLetter(client.nombre || ""),
      cliente_telefono: client.numero || "",
      cliente_email: client.correo || "",
    }));
  }

  function clearAssociatedClient() {
    setForm((prev) => ({
      ...prev,
      cliente_id: "",
      cliente_nombre: "",
      cliente_telefono: "",
      cliente_email: "",
    }));
  }

  function addProduct(product) {
    const existingIndex = items.findIndex(
      (item) => item.producto_id === product.id,
    );

    if (existingIndex >= 0) {
      const newItems = [...items];
      const currentItem = { ...newItems[existingIndex] };
      const currentQty = Number(currentItem.cantidad || 0);

      currentItem.cantidad = String(currentQty + 1);

      const recalculatedItem = {
        ...currentItem,
        ...calculateLine(currentItem),
      };

      newItems.splice(existingIndex, 1);
      setItems([recalculatedItem, ...newItems]);
      return;
    }

    const precio = Number(product.precio || 0);
    const costo = Number(product.precio_compra || 0);
    const utilidad = calculateUtilityPercent(costo, precio);

    const newItem = {
      producto_id: product.id,
      nombre_producto: product.nombre,
      codigo: product.codigo || "",
      unidad: product.unidad || "",
      cantidad: "1",
      precio_unitario: precio,
      costo_unitario: costo,
      utilidad_porcentaje: Number(utilidad.toFixed(2)),
    };

    setItems((prev) => [
      {
        ...newItem,
        ...calculateLine(newItem),
      },
      ...prev,
    ]);
  }

  function updateItemRaw(index, key, value) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [key]: value,
      };
      return next;
    });
  }

  function recalculateItem(index, changedKey) {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[index] };

      if (changedKey === "utilidad_porcentaje") {
        const utilidad = Number(current.utilidad_porcentaje || 0);
        const costo = Number(current.costo_unitario || 0);

        current.precio_unitario = Number(
          calculateSalePriceFromUtility(costo, utilidad).toFixed(2),
        );
      }

      if (changedKey === "precio_unitario") {
        const precio = Number(current.precio_unitario || 0);
        const costo = Number(current.costo_unitario || 0);

        current.utilidad_porcentaje = Number(
          calculateUtilityPercent(costo, precio).toFixed(2),
        );
      }

      next[index] = {
        ...current,
        ...calculateLine(current),
      };

      return next;
    });
  }

  function updateItem(index, key, value) {
    const next = [...items];
    const current = { ...next[index] };

    if (key === "cantidad") {
      current.cantidad = value;
    } else if (key === "utilidad_porcentaje") {
      const utilidad = Number(value || 0);
      const costo = Number(current.costo_unitario || 0);

      current.utilidad_porcentaje = value;
      current.precio_unitario = Number(
        calculateSalePriceFromUtility(costo, utilidad).toFixed(2),
      );
    } else if (key === "precio_unitario") {
      const precio = Number(value || 0);
      const costo = Number(current.costo_unitario || 0);

      current.precio_unitario = value;
      current.utilidad_porcentaje = Number(
        calculateUtilityPercent(costo, precio).toFixed(2),
      );
    } else if (key === "costo_unitario") {
      const costo = Number(value || 0);
      const utilidad = Number(current.utilidad_porcentaje || 0);

      current.costo_unitario = value;
      current.precio_unitario = Number(
        calculateSalePriceFromUtility(costo, utilidad).toFixed(2),
      );
    } else {
      current[key] = value;
    }

    next[index] = {
      ...current,
      ...calculateLine(current),
    };

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

      const cleanForm = {
        ...form,
        cliente_nombre: normalizeCapitalizedText(form.cliente_nombre),
        notas: normalizeCapitalizedText(form.notas),
      };

      const payload = buildQuotationPayload({ form: cleanForm, totals });

      if (editingQuotation?.id) {
        await updateQuotation(editingQuotation.id, payload);
      } else {
        await createQuotation({
          ...payload,
          month: currentMonth,
        });
      }

      await onSaved();
      onClose();
    } catch (error) {
      console.error("Error guardando cotización:", error);
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
      width="max-w-[1500px]"
      zIndex="z-[80]"
    >
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
        <BrowserTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4 sm:px-5 sm:pb-6">
          {activeTab === "quotation" ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_420px]">
              <ClientSectionCard
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

              <QuoteConfigSection
                form={form}
                updateFormField={updateFormField}
              />
            </div>
          ) : (
            <div className="space-y-5">
              <ProductSearchSection
                productQuery={productQuery}
                setProductQuery={setProductQuery}
                productResults={productResults}
                addProduct={addProduct}
              />

              <AddedProductsSection
                rows={totals.rows}
                updateItem={updateItem}
                updateItemRaw={updateItemRaw}
                recalculateItem={recalculateItem}
                removeItem={removeItem}
              />
            </div>
          )}
        </div>

        <CompactFooter form={form} totals={totals} loading={loading} />
      </form>
    </Modal>
  );
}

function BrowserTabs({ activeTab, setActiveTab }) {
  return (
    <div className="shrink-0 border-b border-border bg-background px-4 pt-3 sm:px-5">
      <div className="flex min-w-0 gap-1 overflow-visible">
        <TabButton
          active={activeTab === "quotation"}
          onClick={() => setActiveTab("quotation")}
        >
          Cotizacion
        </TabButton>

        <TabButton
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
        >
          Productos
        </TabButton>
      </div>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative -mb-px inline-flex h-11 items-center justify-center rounded-t-2xl border px-5 text-sm font-semibold transition ${
        active
          ? "border-border border-b-background bg-background text-primary-700"
          : "border-transparent bg-transparent text-text-muted hover:bg-surface-soft hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function CompactFooter({ form, totals, loading }) {
  return (
    <div className="shrink-0 border-t border-border bg-background px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-7">
          <CompactTotal label="Subtotal" value={formatMoney(totals.subtotal)} />
          <CompactTotal
            label="Descuento"
            value={formatMoney(totals.descuento)}
          />
          <CompactTotal label="Base" value={formatMoney(totals.base)} />
          <CompactTotal
            label={`IVA ${form.iva_porcentaje || 0}%`}
            value={formatMoney(totals.ivaMonto)}
          />
          <CompactTotal
            label={`ISR ${form.isr_porcentaje || 0}%`}
            value={formatMoney(-Number(totals.isrMonto || 0))}
          />
          <CompactTotal label="Total" value={formatMoney(totals.total)} bold />
          <CompactTotal
            label="Utilidad"
            value={formatMoney(totals.ganancia)}
            success
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-2xl bg-accent-500 px-5 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-60 xl:w-auto"
        >
          {loading ? "Guardando..." : "Guardar cotización"}
        </button>
      </div>
    </div>
  );
}

function CompactTotal({ label, value, bold = false, success = false }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm ${
          bold
            ? "font-bold text-primary-700"
            : "font-semibold text-text-primary"
        } ${success ? "text-success-700" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function ClientSectionCard({
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
  const hasAssociatedClient = Boolean(form.cliente_id);

  return (
    <section className="rounded-[24px] border border-border bg-background p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-base font-bold text-text-primary">
            Datos del cliente
          </h4>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Primero define si esta cotización quedará ligada a un cliente del
            sistema o si solo será una captura rápida.
          </p>
        </div>

        <ClientStatusBadge
          associated={hasAssociatedClient}
          isManual={clientMode === "manual"}
        />
      </div>

      <div className="mt-5 inline-flex rounded-2xl border border-border bg-surface-soft p-1">
        <SegmentButton
          active={clientMode === "existing"}
          onClick={() => setClientMode("existing")}
        >
          Cliente existente
        </SegmentButton>

        <SegmentButton
          active={clientMode === "manual"}
          onClick={() => {
            setClientMode("manual");
            clearAssociatedClient();
          }}
        >
          Captura manual
        </SegmentButton>
      </div>

      <div className="mt-5">
        {clientMode === "existing" ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_320px]">
            <ExistingClientPane
              clientQuery={clientQuery}
              setClientQuery={setClientQuery}
              clientResults={clientResults}
              applyClient={applyClient}
            />

            <AssociatedClientCard
              form={form}
              clearAssociatedClient={clearAssociatedClient}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <ManualClientPane form={form} updateFormField={updateFormField} />
            <ManualModeHelpCard />
          </div>
        )}
      </div>
    </section>
  );
}

function ExistingClientPane({
  clientQuery,
  setClientQuery,
  clientResults,
  applyClient,
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-text-primary">
          Buscar cliente
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Busca por nombre, RFC o correo y selecciónalo para asociarlo.
        </p>
      </div>

      <SearchInput
        value={clientQuery}
        onChange={setClientQuery}
        placeholder="Buscar cliente por nombre, RFC o correo..."
        className="bg-surface"
      />

      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {clientResults.length ? (
          clientResults.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => applyClient(client)}
              className="w-full rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-primary-200 hover:bg-surface-soft"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background">
                  {client.rfc ? (
                    <Building2 className="h-4.5 w-4.5 text-text-muted" />
                  ) : (
                    <User2 className="h-4.5 w-4.5 text-text-muted" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {client.nombre}
                    </p>
                    <span className="text-xs font-medium text-primary-600">
                      Seleccionar
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs text-text-muted">
                    {client.razon_social || "Sin razón social"}
                    {" · "}
                    {client.rfc || "Sin RFC"}
                  </p>

                  <p className="mt-1 truncate text-xs text-text-muted">
                    {client.correo || "Sin correo"}
                  </p>
                </div>
              </div>
            </button>
          ))
        ) : (
          <EmptyStateCard
            icon={Search}
            title="No hay clientes para mostrar"
            description="Escribe un nombre, RFC o correo para buscar, o registra el cliente en el módulo correspondiente."
          />
        )}
      </div>
    </div>
  );
}

function ManualClientPane({ form, updateFormField }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-text-primary">
          Captura rápida del cliente
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Úsalo cuando solo necesites generar la cotización sin registrarlo en
          este momento.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field
          label="Nombre del cliente"
          className="sm:col-span-2 xl:col-span-1"
        >
          <input
            type="text"
            placeholder="Ej. Grupo Tronco - Luis Enrique"
            value={form.cliente_nombre}
            onChange={(e) => updateFormField("cliente_nombre", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Teléfono">
          <input
            type="text"
            placeholder="Teléfono"
            value={form.cliente_telefono}
            onChange={(e) =>
              updateFormField("cliente_telefono", e.target.value)
            }
            className={inputClass}
          />
        </Field>

        <Field label="Email" className="sm:col-span-2 xl:col-span-1">
          <input
            type="email"
            placeholder="correo@empresa.com"
            value={form.cliente_email}
            onChange={(e) => updateFormField("cliente_email", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}

function AssociatedClientCard({ form, clearAssociatedClient }) {
  if (!form.cliente_id) {
    return (
      <EmptyStateCard
        icon={User2}
        title="Sin cliente asociado"
        description="Selecciona un cliente del sistema para ligar la cotización y poder convertirla después en pedido."
      />
    );
  }

  return (
    <div className="rounded-[22px] border border-success-100 bg-success-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-success-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Cliente asociado
          </div>

          <p className="mt-3 text-base font-bold text-text-primary">
            {form.cliente_nombre}
          </p>
        </div>

        <button
          type="button"
          onClick={clearAssociatedClient}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-success-200 bg-white text-success-700 transition hover:bg-success-100"
          aria-label="Quitar cliente asociado"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2 text-sm text-text-secondary">
        <InfoRow
          label="Teléfono"
          value={form.cliente_telefono || "Sin teléfono"}
        />
        <InfoRow label="Email" value={form.cliente_email || "Sin correo"} />
      </div>
    </div>
  );
}

function ManualModeHelpCard() {
  return (
    <div className="rounded-[22px] border border-warning-100 bg-warning-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-warning-700">
          <Info className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-semibold text-warning-800">
            Captura rápida
          </p>
          <p className="mt-1 text-sm leading-6 text-warning-800/90">
            La cotización se puede guardar normalmente. Si después quieres
            convertirla en pedido, primero tendrás que asociarla a un cliente
            registrado en el sistema.
          </p>
        </div>
      </div>
    </div>
  );
}

function ClientStatusBadge({ associated, isManual }) {
  if (associated) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-success-100 bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Cliente asociado
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        isManual
          ? "border-warning-100 bg-warning-50 text-warning-800"
          : "border-border bg-surface-soft text-text-muted"
      }`}
    >
      <Info className="h-3.5 w-3.5" />
      {isManual ? "Captura rápida" : "Pendiente por asociar"}
    </span>
  );
}

function SegmentButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center rounded-[14px] px-4 text-sm font-semibold transition ${
        active
          ? "bg-primary-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)]"
          : "text-text-secondary hover:bg-background hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function QuoteConfigSection({ form, updateFormField }) {
  return (
    <section className="rounded-[24px] border border-border bg-background p-5 shadow-[var(--shadow-soft)]">
      <div>
        <h4 className="text-base font-bold text-text-primary">Configuración</h4>
        <p className="mt-1 text-sm text-text-secondary">
          Ajusta estado, impuestos, descuento y notas de la cotización.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <Field label="Estado">
          <select
            value={form.estado}
            onChange={(e) => updateFormField("estado", e.target.value)}
            className={inputClass}
          >
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="aceptada">Aceptada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </Field>

        <Field label="Fecha de vencimiento">
          <input
            type="date"
            value={form.fecha_vencimiento}
            onChange={(e) =>
              updateFormField("fecha_vencimiento", e.target.value)
            }
            className={inputClass}
          />
        </Field>

        <MoneyInput
          label="Descuento"
          value={form.descuento}
          onChange={(value) => updateFormField("descuento", value)}
        />

        <SelectPercentInput
          label="IVA"
          value={form.iva_porcentaje}
          options={IVA_OPTIONS}
          onChange={(value) => updateFormField("iva_porcentaje", value)}
        />

        <TaxPercentInput
          label="ISR retenido %"
          value={form.isr_porcentaje}
          options={ISR_OPTIONS}
          onChange={(value) => updateFormField("isr_porcentaje", value)}
          helper="Se resta del total. Úsalo solo cuando aplique retención de ISR."
        />

        <Field label="Notas">
          <textarea
            value={form.notas}
            onChange={(e) => updateFormField("notas", e.target.value)}
            placeholder="Notas internas o comentarios para la cotización..."
            rows={4}
            className={`${inputClass} min-h-24 resize-none py-3`}
          />
        </Field>
      </div>
    </section>
  );
}

function MoneyInput({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div className="flex h-12 items-center rounded-2xl border border-border bg-surface px-4 focus-within:border-primary-400">
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
    </Field>
  );
}

function TaxPercentInput({ label, value, options, onChange, helper }) {
  const isCustom = !options.some((item) => item.value === String(value));

  return (
    <Field label={label} helper={helper}>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          value={isCustom ? "custom" : String(value)}
          onChange={(e) => {
            if (e.target.value === "custom") {
              onChange(value || "0");
              return;
            }
            onChange(e.target.value);
          }}
          className={inputClass}
        >
          {options.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) =>
            onChange(cleanNumericInput(e.target.value, { allowDecimal: true }))
          }
          className={`${inputClass} w-24 px-3 text-right`}
          placeholder="0"
        />
      </div>
    </Field>
  );
}

function SelectPercentInput({ label, value, options, onChange }) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function SummarySection({ form, totals, loading }) {
  return (
    <section className="rounded-[24px] border border-border bg-background p-5 shadow-[var(--shadow-soft)]">
      <div>
        <h4 className="text-base font-bold text-text-primary">Resumen</h4>
        <p className="mt-1 text-sm text-text-secondary">
          Revisa el total antes de guardar.
        </p>
      </div>

      <div className="mt-5 space-y-2 text-sm">
        <SummaryLine label="Subtotal" value={formatMoney(totals.subtotal)} />
        <SummaryLine label="Descuento" value={formatMoney(totals.descuento)} />
        <SummaryLine label="Base" value={formatMoney(totals.base)} />
        <SummaryLine
          label={`IVA ${form.iva_porcentaje || 0}%`}
          value={formatMoney(totals.ivaMonto)}
        />
        <SummaryLine
          label={`ISR retenido ${form.isr_porcentaje || 0}%`}
          value={formatMoney(-Number(totals.isrMonto || 0))}
        />
        <SummaryLine label="Total" value={formatMoney(totals.total)} bold />

        <div className="flex items-center justify-between rounded-2xl border border-success-100 bg-success-50 px-4 py-3">
          <span className="text-sm font-medium text-success-700">
            Utilidad estimada
          </span>
          <span className="text-sm font-bold text-success-700">
            {formatMoney(totals.ganancia)}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Guardar cotización"}
      </button>
    </section>
  );
}

function ProductSearchSection({
  productQuery,
  setProductQuery,
  productResults,
  addProduct,
}) {
  return (
    <section className="min-w-0 rounded-[24px] border border-border bg-background p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-base font-bold text-text-primary">
            Buscar productos
          </h4>
          <p className="mt-1 text-sm text-text-secondary">
            Haz clic sobre un producto para agregarlo a la cotización.
          </p>
        </div>
      </div>

      <SearchInput
        value={productQuery}
        onChange={setProductQuery}
        placeholder="Buscar por nombre o código..."
        className="mt-4 bg-surface"
      />

      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
        {productResults.length ? (
          productResults.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addProduct(product)}
              className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-primary-200 hover:bg-surface-soft sm:flex-row sm:items-center sm:justify-between"
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
              </div>
            </button>
          ))
        ) : (
          <EmptyStateCard
            icon={Search}
            title="No hay productos para mostrar"
            description="Busca por nombre o código para empezar a agregar productos."
          />
        )}
      </div>
    </section>
  );
}

function AddedProductsSection({
  rows,
  updateItem,
  updateItemRaw,
  recalculateItem,
  removeItem,
}) {
  return (
    <section className="min-w-0 rounded-[24px] border border-border bg-background p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-base font-bold text-text-primary">
            Productos agregados
          </h4>
          <p className="mt-1 text-sm text-text-secondary">
            Aquí ajustas cantidades, costo, utilidad y precio.
          </p>
        </div>

        {rows.length ? (
          <span className="inline-flex w-fit rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-text-muted">
            Los más recientes quedan arriba
          </span>
        ) : null}
      </div>

      {!rows.length ? (
        <div className="mt-4">
          <EmptyStateCard
            icon={Building2}
            title="Todavía no agregas productos"
            description="Selecciona un producto desde el buscador para empezar a cotizar."
          />
        </div>
      ) : (
        <>
          <div className="mt-5 hidden max-w-full xl:block">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Producto",
                    "Cantidad",
                    "Costo",
                    "Utilidad %",
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
                  <tr
                    key={`${item.producto_id}-${index}`}
                    className="border-b border-border"
                  >
                    <td className="w-[30%] px-3 py-4">
                      <p className="text-sm font-semibold text-text-primary">
                        {item.nombre_producto}
                      </p>

                      <p className="text-xs text-text-muted">
                        {item.codigo || "Sin código"} · Stock:{" "}
                        {Number(item.stock_disponible || 0)}
                      </p>
                    </td>

                    <td className="px-3 py-4">
                      <NumberInput
                        value={item.cantidad}
                        onChange={(value) =>
                          updateItem(index, "cantidad", value)
                        }
                        className="w-full"
                      />
                    </td>

                    <td className="px-3 py-4">
                      <MoneyMiniInput
                        value={item.costo_unitario}
                        onChange={(value) =>
                          updateItem(index, "costo_unitario", value)
                        }
                        className="w-full"
                      />
                    </td>

                    <td className="px-3 py-4">
                      <PercentMiniInput
                        value={item.utilidad_porcentaje}
                        onChange={(value) =>
                          updateItemRaw(index, "utilidad_porcentaje", value)
                        }
                        onBlur={() =>
                          recalculateItem(index, "utilidad_porcentaje")
                        }
                        className="w-full"
                      />
                    </td>

                    <td className="px-3 py-4">
                      <MoneyMiniInput
                        value={item.precio_unitario}
                        onChange={(value) =>
                          updateItemRaw(index, "precio_unitario", value)
                        }
                        onBlur={() => recalculateItem(index, "precio_unitario")}
                        className="w-full"
                      />
                    </td>

                    <td className="w-[11%] px-3 py-4 text-sm font-semibold text-text-primary">
                      {formatMoney(item.importe)}
                    </td>

                    <td className="w-[11%] px-3 py-4 text-sm font-semibold text-success-700">
                      {formatMoney(item.ganancia_linea)}
                    </td>

                    <td className="px-3 py-4 text-right">
                      <ActionIconButton
                        icon={Trash2}
                        label="Eliminar"
                        tone="danger"
                        onClick={() => removeItem(index)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-3 xl:hidden">
            {rows.map((item, index) => (
              <div
                key={`${item.producto_id}-${index}`}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {item.nombre_producto}
                    </p>

                    <p className="mt-1 text-xs text-text-muted">
                      {item.codigo || "Sin código"} · Stock:{" "}
                      {Number(item.stock_disponible || 0)}
                    </p>
                  </div>

                  <ActionIconButton
                    icon={Trash2}
                    label="Eliminar"
                    tone="danger"
                    onClick={() => removeItem(index)}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <FieldGroup label="Cantidad">
                    <NumberInput
                      value={item.cantidad}
                      onChange={(value) => updateItem(index, "cantidad", value)}
                    />
                  </FieldGroup>

                  <FieldGroup label="Costo">
                    <MoneyMiniInput
                      value={item.costo_unitario}
                      onChange={(value) =>
                        updateItem(index, "costo_unitario", value)
                      }
                    />
                  </FieldGroup>

                  <FieldGroup label="Utilidad %">
                    <PercentMiniInput
                      value={item.utilidad_porcentaje}
                      onChange={(value) =>
                        updateItemRaw(index, "utilidad_porcentaje", value)
                      }
                      onBlur={() =>
                        recalculateItem(index, "utilidad_porcentaje")
                      }
                    />
                  </FieldGroup>

                  <FieldGroup label="Precio">
                    <MoneyMiniInput
                      value={item.precio_unitario}
                      onChange={(value) =>
                        updateItemRaw(index, "precio_unitario", value)
                      }
                      onBlur={() => recalculateItem(index, "precio_unitario")}
                    />
                  </FieldGroup>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-background p-3">
                    <p className="text-xs text-text-muted">Importe</p>
                    <p className="font-bold text-text-primary">
                      {formatMoney(item.importe)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-success-50 p-3">
                    <p className="text-xs text-success-700">Ganancia</p>
                    <p className="font-bold text-success-700">
                      {formatMoney(item.ganancia_linea)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function NumberInput({ value, onChange, className = "" }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value ?? ""}
      onChange={(e) =>
        onChange(cleanNumericInput(e.target.value, { allowDecimal: true }))
      }
      className={`${inputClass} ${className}`}
    />
  );
}

function MoneyMiniInput({ value, onChange, onBlur, className = "" }) {
  return (
    <div
      className={`flex h-11 items-center rounded-xl border border-border bg-surface px-3 focus-within:border-primary-400 ${className}`}
    >
      <span className="mr-1 text-xs font-semibold text-text-muted">$</span>

      <input
        type="text"
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) =>
          onChange(cleanNumericInput(e.target.value, { allowDecimal: true }))
        }
        onBlur={onBlur}
        className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none"
      />
    </div>
  );
}

function PercentMiniInput({ value, onChange, onBlur, className = "" }) {
  return (
    <div
      className={`flex h-11 items-center rounded-xl border border-border bg-surface px-3 focus-within:border-primary-400 ${className}`}
    >
      <input
        type="text"
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) =>
          onChange(cleanNumericInput(e.target.value, { allowDecimal: true }))
        }
        onBlur={onBlur}
        className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none"
      />

      <span className="ml-1 text-xs font-semibold text-text-muted">%</span>
    </div>
  );
}

function Field({ label, helper, children, className = "" }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      {children}
      {helper ? <p className="text-xs text-text-muted">{helper}</p> : null}
    </label>
  );
}

function FieldGroup({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryLine({ label, value, bold = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
        bold ? "bg-primary-50" : "bg-surface"
      }`}
    >
      <span
        className={`text-sm ${
          bold ? "font-bold text-primary-700" : "text-text-secondary"
        }`}
      >
        {label}
      </span>

      <span
        className={`text-sm ${
          bold
            ? "font-bold text-primary-700"
            : "font-semibold text-text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyStateCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[22px] border border-dashed border-border bg-surface-soft px-4 py-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-background text-text-muted">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary-400";
