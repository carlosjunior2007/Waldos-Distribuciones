import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  User2,
  ReceiptText,
  Package,
} from "lucide-react";

import Modal from "../../../components/ui/Modal";
import SearchInput from "../../../components/ui/SearchInput";
import FilterPill from "../../../components/ui/FilterPill";

import { cleanNumericInput } from "../../../utils/input";

import {
  createReceipt,
  updateReceipt,
  searchClients,
  searchQuotations,
  searchProductsForReceipt,
  fetchQuotationForReceipt,
  getTodayInputDate,
} from "../services/receipts.js";

import {
  EMPTY_RECEIPT_FORM,
  DEFAULT_CITY,
} from "../receipt.constants";

import {
  createEmptyReceiptItem,
  buildClientAddress,
  normalizeReceiptItems,
  capitalizeFirstLetter,
  capitalizeReceiptHeader,
  capitalizeReceiptItem,
} from "../receipt.helpers";

export default function ReceiptModal({ open, editingReceipt, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [clientMode, setClientMode] = useState("manual");

  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState([]);

  const [quotationQuery, setQuotationQuery] = useState("");
  const [quotationResults, setQuotationResults] = useState([]);

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);

  const [form, setForm] = useState(EMPTY_RECEIPT_FORM);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (editingReceipt) {
      setForm(capitalizeReceiptHeader({
        cliente_id: editingReceipt.cliente_id || "",
        cotizacion_id: editingReceipt.cotizacion_id || "",
        cliente_nombre: editingReceipt.cliente_nombre || "",
        cliente_rfc: editingReceipt.cliente_rfc || "",
        cliente_direccion: editingReceipt.cliente_direccion || "",
        cliente_telefono: editingReceipt.cliente_telefono || "",
        fecha: editingReceipt.fecha?.slice(0, 10) || getTodayInputDate(),
        ciudad: editingReceipt.ciudad || DEFAULT_CITY,
        estado: editingReceipt.estado || "emitido",
        notas: editingReceipt.notas || "",
      }));

      setItems(normalizeReceiptItems(editingReceipt.detalles || []).map(capitalizeReceiptItem));
      setClientMode(editingReceipt.cliente_id ? "cliente" : "manual");
    } else {
      setForm({
        ...EMPTY_RECEIPT_FORM,
        fecha: getTodayInputDate(),
      });

      setItems([createEmptyReceiptItem()]);
      setClientMode("manual");
    }

    setClientQuery("");
    setClientResults([]);
    setQuotationQuery("");
    setQuotationResults([]);
    setProductQuery("");
    setProductResults([]);
  }, [open, editingReceipt]);

  useEffect(() => {
    if (!open || clientMode !== "cliente") return;

    const timer = setTimeout(async () => {
      try {
        const rows = await searchClients(clientQuery);
        setClientResults(rows);
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
        const rows = await searchQuotations(quotationQuery);
        setQuotationResults(rows);
      } catch (error) {
        console.error(error);
        setQuotationResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, quotationQuery]);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      try {
        const rows = await searchProductsForReceipt(productQuery);
        setProductResults(rows);
      } catch (error) {
        console.error(error);
        setProductResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, productQuery]);

  function updateForm(key, value) {
    const shouldCapitalize = [
      "cliente_nombre",
      "cliente_direccion",
      "ciudad",
      "notas",
    ].includes(key);

    setForm((prev) => ({
      ...prev,
      [key]: shouldCapitalize ? capitalizeFirstLetter(value) : value,
    }));
  }

  function applyClient(client) {
    setForm((prev) => ({
      ...prev,
      cliente_id: client.id,
      cliente_nombre: capitalizeFirstLetter(client.razon_social || client.nombre || ""),
      cliente_rfc: client.rfc || "",
      cliente_telefono: client.numero || "",
      cliente_direccion: capitalizeFirstLetter(buildClientAddress(client)),
    }));
  }

  async function applyQuotation(quotation) {
    if (!quotation?.id) return;

    try {
      const data = await fetchQuotationForReceipt(quotation.id);
      const q = data?.quotation || {};
      const client = data?.client || null;
      const rows = Array.isArray(data?.rows) ? data.rows : [];

      setForm((prev) => ({
        ...prev,
        cotizacion_id: q.id || quotation.id,
        cliente_id: q.cliente_id || client?.id || "",
        cliente_nombre: capitalizeFirstLetter(
          q.cliente_razon_social ||
          client?.razon_social ||
          q.cliente_nombre ||
          "",
        ),
        cliente_rfc: q.cliente_rfc || client?.rfc || "",
        cliente_telefono: q.cliente_telefono || client?.numero || "",
        cliente_direccion: client
          ? capitalizeFirstLetter(buildClientAddress(client))
          : prev.cliente_direccion,
      }));

      setItems(
        rows.length
          ? normalizeReceiptItems(rows).map(capitalizeReceiptItem)
          : [createEmptyReceiptItem()],
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo aplicar la cotización.");
    }
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        ...createEmptyReceiptItem(),
        orden: prev.length + 1,
      },
    ]);
  }

  function addProduct(product) {
    if (!product?.id) return;

    const existingIndex = items.findIndex(
      (item) => item.producto_id === product.id,
    );

    if (existingIndex >= 0) {
      setItems((prev) => {
        const next = [...prev];
        const current = next[existingIndex];

        next[existingIndex] = {
          ...current,
          cantidad: String(Number(current.cantidad || 0) + 1),
        };

        return next;
      });

      return;
    }

    setItems((prev) => [
      ...prev,
      {
        producto_id: product.id,
        orden: prev.length + 1,
        descripcion: capitalizeFirstLetter(product.nombre || ""),
        cantidad: "1",
        unidad: capitalizeFirstLetter(product.unidad || "pieza"),
      },
    ]);
  }

  function updateItem(index, key, value) {
    const shouldCapitalize = ["descripcion", "unidad"].includes(key);

    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [key]: shouldCapitalize ? capitalizeFirstLetter(value) : value,
      };
      return next;
    });
  }

  function removeItem(index) {
    setItems((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, itemIndex) => ({
          ...item,
          orden: itemIndex + 1,
        })),
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.cliente_nombre.trim()) {
      alert("El nombre o razón social es obligatorio.");
      return;
    }

    if (!items.some((item) => String(item.descripcion || "").trim())) {
      alert("Agrega al menos un producto o concepto.");
      return;
    }

    try {
      setSaving(true);

      const cleanItems = normalizeReceiptItems(items)
        .map(capitalizeReceiptItem)
        .filter((item) => String(item.descripcion || "").trim());

      const payload = {
        header: capitalizeReceiptHeader(form),
        items: cleanItems,
      };

      const saved = editingReceipt?.id
        ? await updateReceipt(editingReceipt.id, payload)
        : await createReceipt(payload);

      await onSaved?.(saved);
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar el contra recibo.");
    } finally {
      setSaving(false);
    }
  }

  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0),
    [items],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingReceipt ? "Editar contra recibo" : "Nuevo contra recibo"}
      subtitle="Selecciona cliente, cotización o captura manualmente."
      width="max-w-7xl"
      zIndex="z-[90]"
    >
      <form onSubmit={handleSubmit} className="grid gap-5 p-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <Section title="Origen">
            <div className="flex flex-wrap gap-2">
              <FilterPill
                label="Manual"
                active={clientMode === "manual"}
                onClick={() => {
                  setClientMode("manual");
                  setForm((prev) => ({ ...prev, cliente_id: "" }));
                }}
              />

              <FilterPill
                label="Cliente existente"
                active={clientMode === "cliente"}
                onClick={() => setClientMode("cliente")}
              />
            </div>

            {clientMode === "cliente" ? (
              <div className="mt-4 space-y-3">
                <SearchInput
                  value={clientQuery}
                  onChange={setClientQuery}
                  placeholder="Buscar cliente..."
                />

                <ResultList
                  rows={clientResults}
                  empty="No hay clientes."
                  render={(client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => applyClient(client)}
                      className="w-full rounded-2xl border border-border bg-surface p-3 text-left hover:bg-surface-soft"
                    >
                      <div className="flex items-start gap-3">
                        <User2 className="mt-1 h-4 w-4 text-text-muted" />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-text-primary">
                            {client.razon_social || client.nombre}
                          </p>

                          <p className="truncate text-xs text-text-muted">
                            {client.rfc || "Sin RFC"} ·{" "}
                            {client.numero || "Sin teléfono"}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                />
              </div>
            ) : null}
          </Section>

          <Section title="Cotización relacionada">
            <SearchInput
              value={quotationQuery}
              onChange={setQuotationQuery}
              placeholder="Buscar folio o cliente..."
            />

            {form.cotizacion_id ? (
              <div className="mt-3 rounded-2xl border border-info-100 bg-info-50 p-3 text-sm font-semibold text-info-700">
                Cotización asociada seleccionada.
              </div>
            ) : null}

            <div className="mt-3">
              <ResultList
                rows={quotationResults}
                empty="No hay cotizaciones."
                render={(quotation) => (
                  <button
                    key={quotation.id}
                    type="button"
                    onClick={() => applyQuotation(quotation)}
                    className="w-full rounded-2xl border border-border bg-surface p-3 text-left hover:bg-surface-soft"
                  >
                    <div className="flex items-start gap-3">
                      <ReceiptText className="mt-1 h-4 w-4 text-text-muted" />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-text-primary">
                          {quotation.folio}
                        </p>

                        <p className="truncate text-xs text-text-muted">
                          {quotation.cliente_nombre || "Sin cliente"} ·{" "}
                          {quotation.estado}
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              />
            </div>
          </Section>

          <Section title="Agregar productos">
            <SearchInput
              value={productQuery}
              onChange={setProductQuery}
              placeholder="Buscar producto extra..."
            />

            <div className="mt-3">
              <ResultList
                rows={productResults}
                empty="No hay productos."
                render={(product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="w-full rounded-2xl border border-border bg-surface p-3 text-left hover:bg-surface-soft"
                  >
                    <div className="flex items-start gap-3">
                      <Package className="mt-1 h-4 w-4 text-text-muted" />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-text-primary">
                          {product.nombre}
                        </p>

                        <p className="truncate text-xs text-text-muted">
                          {product.codigo || "Sin código"} ·{" "}
                          {product.unidad || "pieza"}
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              />
            </div>
          </Section>
        </div>

        <div className="space-y-4 lg:col-span-8">
          <Section title="Datos para facturar">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Nombre / Razón social"
                value={form.cliente_nombre}
                onChange={(value) => updateForm("cliente_nombre", value)}
              />

              <Input
                label="RFC"
                value={form.cliente_rfc}
                onChange={(value) => updateForm("cliente_rfc", value)}
              />

              <Input
                label="Teléfono"
                value={form.cliente_telefono}
                onChange={(value) => updateForm("cliente_telefono", value)}
              />

              <Input
                label="Fecha"
                type="date"
                value={form.fecha}
                onChange={(value) => updateForm("fecha", value)}
              />

              <Input
                label="Ciudad"
                value={form.ciudad}
                onChange={(value) => updateForm("ciudad", value)}
                className="md:col-span-2"
              />

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-text-primary">
                  Dirección
                </span>

                <textarea
                  rows={3}
                  value={form.cliente_direccion}
                  onChange={(e) =>
                    updateForm("cliente_direccion", e.target.value)
                  }
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary-400"
                />
              </label>
            </div>
          </Section>

          <Section
            title={`Productos / conceptos (${items.length} renglones, ${itemCount} piezas)`}
            action={
              <button
                type="button"
                onClick={addItem}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Agregar renglón
              </button>
            }
          >
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={`${item.producto_id || "manual"}-${index}`}
                  className="grid gap-3 rounded-2xl border border-border bg-surface p-3 md:grid-cols-[1fr_120px_140px_44px]"
                >
                  <Input
                    label="Descripción"
                    value={item.descripcion}
                    onChange={(value) =>
                      updateItem(index, "descripcion", value)
                    }
                  />

                  <Input
                    label="Cantidad"
                    value={String(item.cantidad ?? "")}
                    onChange={(value) =>
                      updateItem(
                        index,
                        "cantidad",
                        cleanNumericInput(value, { allowDecimal: true }),
                      )
                    }
                  />

                  <Input
                    label="Unidad"
                    value={item.unidad}
                    onChange={(value) => updateItem(index, "unidad", value)}
                  />

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="mt-7 flex h-11 w-11 items-center justify-center rounded-xl border border-error-200 bg-error-50 text-error-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-4 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              <FileText className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar contra recibo"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="rounded-[24px] border border-border bg-background p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-text-primary">{title}</h4>
        {action}
      </div>

      {children}
    </section>
  );
}

function ResultList({ rows = [], empty, render }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
        {empty}
      </div>
    );
  }

  return <div className="max-h-52 space-y-2 overflow-y-auto">{rows.map(render)}</div>;
}

function Input({ label, value, onChange, type = "text", className = "" }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>

      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary-400"
      />
    </label>
  );
}