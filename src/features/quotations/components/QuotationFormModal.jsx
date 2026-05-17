import { useEffect, useMemo, useState } from "react";
import { Building2, Trash2, User2 } from "lucide-react";

import supabase from "../../../utils/supabase";
import {
  createQuotation,
  updateQuotation,
  searchProducts,
} from "../services/quotations.js";

import Modal from "../../../components/ui/Modal";
import FilterPill from "../../../components/ui/FilterPill";
import SearchInput from "../../../components/ui/SearchInput";
import ActionIconButton from "../../../components/ui/ActionIconButton";

import { formatMoney } from "../../../utils/formatters";
import { formatInputDate } from "../../../utils/dates";
import { cleanNumericInput } from "../../../utils/input";

import { INITIAL_QUOTATION_FORM, IVA_OPTIONS, ISR_OPTIONS } from "../quotation.constants";

import {
  buildQuotationItemsFromDetails,
  buildQuotationPayload,
  calculateLine,
  calculateQuotationTotals,
  calculateSalePriceFromUtility,
  calculateUtilityPercent,
  toBusinessInputDate,
} from "../quotation.helpers";

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
        notas: editingQuotation.notas || "",
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

    // Si el producto ya está en la lista, aumentamos la cantidad
    // y lo subimos al inicio para que sea obvio qué se acaba de tocar.
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

    // Si es un producto nuevo, se agrega arriba, no abajo.
    // Así el usuario ve inmediatamente lo que acaba de agregar.
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

      const payload = buildQuotationPayload({ form, totals });

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

            <QuoteConfigSection form={form} updateFormField={updateFormField} />

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
              rows={items}
              updateItem={updateItem}
              updateItemRaw={updateItemRaw}
              recalculateItem={recalculateItem}
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
      </div>
    </div>
  );
}

function QuoteConfigSection({ form, updateFormField }) {
  return (
    <div className="rounded-[20px] border border-border bg-background p-4 sm:rounded-[24px]">
      <h4 className="text-sm font-bold text-text-primary">
        Configuración de cotización
      </h4>

      <div className="mt-4 grid gap-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-text-primary">
            Estado
          </span>

          <select
            value={form.estado}
            onChange={(e) => updateFormField("estado", e.target.value)}
            className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
          >
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="aceptada">Aceptada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-text-primary">
            Fecha de vencimiento
          </span>

          <input
            type="date"
            value={form.fecha_vencimiento}
            onChange={(e) =>
              updateFormField("fecha_vencimiento", e.target.value)
            }
            className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
          />
        </label>

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

        <label className="space-y-2">
          <span className="text-sm font-semibold text-text-primary">Notas</span>

          <textarea
            value={form.notas}
            onChange={(e) => updateFormField("notas", e.target.value)}
            placeholder="Notas internas o comentarios para la cotización..."
            rows={4}
            className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary-400"
          />
        </label>
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

function TaxPercentInput({ label, value, options, onChange, helper }) {
  const isCustom = !options.some((item) => item.value === String(value));

  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-text-primary">{label}</span>

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
          className="h-12 min-w-0 rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary-400"
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
          className="h-12 w-24 rounded-2xl border border-border bg-surface px-3 text-right text-sm text-text-primary outline-none focus:border-primary-400"
          placeholder="0"
        />
      </div>

      {helper ? <p className="text-xs text-text-muted">{helper}</p> : null}
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
          value={formatMoney(-Number(totals.isrMonto || 0))}
        />

        <SummaryLine label="Total" value={formatMoney(totals.total)} bold />

        <div className="flex items-center justify-between rounded-xl border border-success-100 bg-success-50 px-3 py-2">
          <span className="text-success-700">Utilidad estimada</span>

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

function AddedProductsSection({
  rows,
  updateItem,
  updateItemRaw,
  recalculateItem,
  removeItem,
}) {
  return (
    <div className="min-w-0 rounded-[20px] border border-border bg-background p-4 sm:rounded-[24px]">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-text-primary">
          Productos agregados
        </h4>

        {rows.length ? (
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-muted">
            Más recientes arriba
          </span>
        ) : null}
      </div>

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
                    <td className="min-w-[220px] px-3 py-3">
                      <p className="text-sm font-semibold text-text-primary">
                        {item.nombre_producto}
                      </p>

                      <p className="text-xs text-text-muted">
                        {item.codigo || "Sin código"} · Stock:{" "}
                        {Number(item.stock_disponible || 0)}
                      </p>
                    </td>

                    <td className="px-3 py-3">
                      <NumberInput
                        value={item.cantidad}
                        onChange={(value) =>
                          updateItem(index, "cantidad", value)
                        }
                        className="w-24"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <MoneyMiniInput
                        value={item.costo_unitario}
                        onChange={(value) =>
                          updateItem(index, "costo_unitario", value)
                        }
                        className="w-28"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <PercentMiniInput
                        value={item.utilidad_porcentaje}
                        onChange={(value) =>
                          updateItemRaw(index, "utilidad_porcentaje", value)
                        }
                        onBlur={() =>
                          recalculateItem(index, "utilidad_porcentaje")
                        }
                        className="w-28"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <MoneyMiniInput
                        value={item.precio_unitario}
                        onChange={(value) =>
                          updateItemRaw(index, "precio_unitario", value)
                        }
                        onBlur={() => recalculateItem(index, "precio_unitario")}
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

          <div className="mt-4 grid gap-3 md:hidden">
            {rows.map((item, index) => (
              <div
                key={`${item.producto_id}-${index}`}
                className="rounded-2xl border border-border bg-surface p-3"
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
    </div>
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
      className={`h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary-400 ${className}`}
    />
  );
}

function MoneyMiniInput({ value, onChange, onBlur, className = "" }) {
  return (
    <div
      className={`flex h-10 items-center rounded-xl border border-border bg-surface px-3 focus-within:border-primary-400 ${className}`}
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
      className={`flex h-10 items-center rounded-xl border border-border bg-surface px-3 focus-within:border-primary-400 ${className}`}
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
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${
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
