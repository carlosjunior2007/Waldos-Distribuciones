import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, PackagePlus, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { searchInventoryProducts } from "../services/inventory.service";
import QuickProductModal from "../../products/components/QuickProductModal";
import { createProduct as createCatalogProduct, getCurrentUserId } from "../../products/services/products.service";
import { generateUUID } from "../../products/product.helpers";
import { generarCodigoProducto } from "../../../utils/CodeGenerator";

const emptyLine = {
  producto_id: "",
  producto_nombre: "",
  producto_codigo: "",
  cantidad: "",
  costo_unitario: "",
  notas: "",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function sanitizeDecimalInput(value, decimals = 4) {
  const raw = String(value ?? "").replace(/,/g, ".");
  let cleaned = raw.replace(/[^0-9.]/g, "");

  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }

  const [integerPart, decimalPart] = cleaned.split(".");
  if (decimalPart === undefined) return integerPart;

  return `${integerPart}.${decimalPart.slice(0, decimals)}`;
}

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const inputClass = "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50";

function getInitialForm() {
  return {
    proveedor_id: "",
    numero_factura: "",
    fecha_compra: today(),
    archivo_url: "",
    archivo_nombre: "",
    archivo_tipo: "",
    archivo_file: null,
    iva: "",
    total: "",
    notas: "",
    products: [],
  };
}

export function InventoryEntryModal({ open, saving = false, providers = [], onClose, onSave }) {
  const [form, setForm] = useState(getInitialForm);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productPage, setProductPage] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [productLoading, setProductLoading] = useState(false);
  const [quickProductOpen, setQuickProductOpen] = useState(false);
  const [quickError, setQuickError] = useState("");

  const subtotal = useMemo(() => {
    return form.products.reduce((acc, item) => {
      return acc + toNumber(item.cantidad) * toNumber(item.costo_unitario);
    }, 0);
  }, [form.products]);

  const total = useMemo(() => {
    return subtotal + toNumber(form.iva);
  }, [form.iva, subtotal]);

  const hasMoreProducts = (productPage + 1) * 12 < productCount;

  const loadProductResults = useCallback(async ({ search, page = 0, append = false }) => {
    const term = String(search || "").trim();

    if (term.length < 2) {
      setProductResults([]);
      setProductCount(0);
      setProductPage(0);
      return;
    }

    setProductLoading(true);

    try {
      const result = await searchInventoryProducts({ search: term, page, pageSize: 12 });
      setProductResults((prev) => (append ? [...prev, ...result.data] : result.data));
      setProductCount(result.count || 0);
      setProductPage(page);
    } catch (error) {
      setProductResults([]);
      setProductCount(0);
    } finally {
      setProductLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const timeout = window.setTimeout(() => {
      loadProductResults({ search: productSearch, page: 0, append: false });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [loadProductResults, open, productSearch]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateLine(index, field, value) {
    setForm((prev) => {
      const products = [...prev.products];
      products[index] = { ...products[index], [field]: value };
      return { ...prev, products };
    });
  }

  function updateDecimalLine(index, field, value) {
    updateLine(index, field, sanitizeDecimalInput(value, 4));
  }

  function updateDecimalField(field, value) {
    updateField(field, sanitizeDecimalInput(value, 4));
  }

  function increaseQuantity(index) {
    const current = toNumber(form.products[index]?.cantidad);
    updateLine(index, "cantidad", String(current + 1));
  }

  function decreaseQuantity(index) {
    const current = toNumber(form.products[index]?.cantidad);
    updateLine(index, "cantidad", String(Math.max(0, current - 1)));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      archivo_file: file,
      archivo_nombre: file?.name || "",
      archivo_tipo: file?.type || "",
      archivo_url: file ? "" : prev.archivo_url,
    }));
  }

  function addProduct(product) {
    setForm((prev) => {
      const existingIndex = prev.products.findIndex((item) => item.producto_id === product.id);

      if (existingIndex >= 0) {
        const products = [...prev.products];
        const current = products[existingIndex];
        const updatedProduct = {
          ...current,
          cantidad: String(toNumber(current.cantidad) + 1),
        };

        products.splice(existingIndex, 1);

        return {
          ...prev,
          products: [updatedProduct, ...products],
        };
      }

      const newProduct = {
        ...emptyLine,
        producto_id: product.id,
        producto_nombre: product.nombre,
        producto_codigo: product.codigo || "",
        cantidad: "1",
        costo_unitario: product.precio_compra || "",
      };

      return {
        ...prev,
        products: [newProduct, ...prev.products],
      };
    });
  }

  function removeLine(index) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleQuickCreateProduct(values = {}) {
    const nombre = String(values.nombre || "").trim();
    const precio = Number(values.precio || 0);

    if (!nombre) {
      setQuickError("Escribe el nombre del producto antes de guardarlo.");
      return;
    }

    if (!Number.isFinite(precio) || precio < 0) {
      setQuickError("Escribe un precio de venta válido.");
      return;
    }

    setProductLoading(true);
    setQuickError("");

    try {
      const productId = generateUUID();
      const userId = await getCurrentUserId();
      const codigo = generarCodigoProducto(productId);
      const now = new Date().toISOString();

      await createCatalogProduct({
        id: productId,
        nombre,
        descripcion: values.descripcion?.trim() || nombre,
        precio,
        precio_compra: Number(values.precio_compra || 0),
        cantidad_caja: Number(values.cantidad_caja || 1),
        habilitado: true,
        categoria: values.categoria || "otros",
        unidad: values.unidad || "pieza",
        codigo,
        clave_sat: values.clave_sat?.trim() || null,
        clave_unidad_sat: values.clave_unidad_sat?.trim() || null,
        iva_porcentaje: Number(values.iva_porcentaje || 8),
        modified_by: userId,
        created_by: userId,
        updated_at: now,
        created_at: now,
      });

      const createdProduct = {
        id: productId,
        nombre,
        descripcion: values.descripcion?.trim() || nombre,
        precio,
        precio_compra: Number(values.precio_compra || 0),
        cantidad_caja: Number(values.cantidad_caja || 1),
        categoria: values.categoria || "otros",
        unidad: values.unidad || "pieza",
        codigo,
        clave_sat: values.clave_sat?.trim() || null,
        clave_unidad_sat: values.clave_unidad_sat?.trim() || null,
        iva_porcentaje: Number(values.iva_porcentaje || 8),
        habilitado: true,
      };

      addProduct(createdProduct);
      setProductResults((current) => [createdProduct, ...current.filter((item) => item.id !== productId)]);
      setQuickProductOpen(false);
    } catch (error) {
      console.error("Error creando producto desde inventario:", error);
      setQuickError(error.message || "No se pudo crear el producto. Revisa la información e intenta de nuevo.");
    } finally {
      setProductLoading(false);
    }
  }

  async function handleLoadMoreProducts() {
    if (!hasMoreProducts || productLoading) return;
    await loadProductResults({
      search: productSearch,
      page: productPage + 1,
      append: true,
    });
  }

  async function submit(event) {
    event.preventDefault();

    await onSave({
      ...form,
      subtotal,
      total,
    });

    setForm(getInitialForm());
    setProductSearch("");
    setProductResults([]);
    setProductPage(0);
    setProductCount(0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <QuickProductModal
        open={quickProductOpen}
        saving={productLoading}
        eyebrow="Crear sin salir de inventario"
        title="Nuevo producto"
        description="Se guardará en catálogo, se agregará a esta entrada y no perderás la compra capturada."
        submitLabel="Crear y agregar"
        onClose={() => {
          setQuickError("");
          setQuickProductOpen(false);
        }}
        onSubmit={handleQuickCreateProduct}
      />
      <SmallErrorModal message={quickError} onClose={() => setQuickError("")} />
      <form
        onSubmit={submit}
        className="flex max-h-[94vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-8 py-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-600">
              Nueva entrada
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Registrar compra de inventario
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              El folio interno lo genera el sistema automáticamente al guardar.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 px-8 py-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-6">
              <Panel
                icon={FileText}
                title="Datos de la factura o compra"
                description="Captura los datos principales. El folio interno no se escribe a mano, porque para eso existe el sistema, sorprendentemente."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Proveedor">
                    <select
                      value={form.proveedor_id}
                      onChange={(event) => updateField("proveedor_id", event.target.value)}
                      className={inputClass}
                    >
                      <option value="">Sin proveedor</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.nombre}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Factura / referencia">
                    <input
                      value={form.numero_factura}
                      onChange={(event) => updateField("numero_factura", event.target.value)}
                      placeholder="Ej. FAC-2026-001"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Fecha de compra">
                    <input
                      type="date"
                      value={form.fecha_compra}
                      onChange={(event) => updateField("fecha_compra", event.target.value)}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="PDF / archivo">
                    <label className="flex h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50">
                      <span className="min-w-0 truncate">
                        {form.archivo_nombre || "Subir PDF o imagen"}
                      </span>
                      <Upload size={17} className="shrink-0 text-slate-400" />
                      <input
                        type="file"
                        accept="application/pdf,image/*,.xml"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </Field>
                </div>
              </Panel>

              <Panel
                icon={PackagePlus}
                title="Agregar productos"
                description="Busca productos existentes y agrégalos a esta compra. No se carga todo el catálogo de golpe. Bendito sea el rendimiento."
              >
                <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-slate-800">
                        Buscar producto
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuickProductOpen(true)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100"
                      >
                        <Plus size={15} /> Nuevo producto
                      </button>
                    </div>
                    <label className="block">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={productSearch}
                          onChange={(event) => setProductSearch(event.target.value)}
                          placeholder="Escribe nombre, código o descripción..."
                          className={`${inputClass} pl-11`}
                        />
                      </div>
                    </label>

                    <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto pr-1">
                      {productSearch.trim().length < 2 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                          Escribe al menos 2 letras para buscar.
                        </div>
                      ) : productLoading && !productResults.length ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                          Buscando productos...
                        </div>
                      ) : productResults.length ? (
                        <>
                          {productResults.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => addProduct(product)}
                              className="flex w-full items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-red-200 hover:bg-red-50"
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-black text-slate-950">
                                  {product.nombre}
                                </span>
                                <span className="mt-1 block text-xs font-semibold text-slate-500">
                                  {product.codigo || "Sin código"}
                                </span>
                              </span>
                              <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                Agregar
                              </span>
                            </button>
                          ))}

                          {hasMoreProducts ? (
                            <button
                              type="button"
                              onClick={handleLoadMoreProducts}
                              disabled={productLoading}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                            >
                              {productLoading ? "Cargando..." : "Cargar más resultados"}
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                          No encontré productos con esa búsqueda.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-950">Productos en esta entrada</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Ajusta cantidades y costos. Cada línea crea un lote FIFO.
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                        {form.products.length} productos
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {!form.products.length ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                          Todavía no agregas productos.
                        </div>
                      ) : (
                        form.products.map((item, index) => {
                          const lineTotal = toNumber(item.cantidad) * toNumber(item.costo_unitario);

                          return (
                            <article
                              key={`${item.producto_id}-${index}`}
                              className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 font-black leading-snug text-slate-950">
                                    {item.producto_nombre}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold text-slate-500">
                                    {item.producto_codigo || "Sin código"}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeLine(index)}
                                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                  aria-label="Eliminar producto"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                  <Field label="Cantidad">
                                    <div className="flex h-12 overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-red-300 focus-within:ring-4 focus-within:ring-red-50">
                                      <button
                                        type="button"
                                        onClick={() => decreaseQuantity(index)}
                                        className="w-12 shrink-0 border-r border-slate-200 text-lg font-black text-slate-500 transition hover:bg-slate-50"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        pattern="^[0-9]+([.,][0-9]{0,4})?$"
                                        placeholder="0.0000"
                                        value={item.cantidad}
                                        onChange={(event) => updateDecimalLine(index, "cantidad", event.target.value)}
                                        className="min-w-0 flex-1 border-0 bg-white px-3 text-center text-sm font-black outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => increaseQuantity(index)}
                                        className="w-12 shrink-0 border-l border-slate-200 text-lg font-black text-slate-500 transition hover:bg-slate-50"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </Field>
                                </div>

                                <Field label="Costo unitario">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="^[0-9]+([.,][0-9]{0,4})?$"
                                    placeholder="0.0000"
                                    value={item.costo_unitario}
                                    onChange={(event) => updateDecimalLine(index, "costo_unitario", event.target.value)}
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-right text-sm font-black outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                                  />
                                </Field>

                                <Field label="Importe">
                                  <div className="flex h-12 w-full items-center justify-end rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-950">
                                    {money.format(lineTotal)}
                                  </div>
                                </Field>
                              </div>
                            </article>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel title="Notas internas" description="Opcional, para aclaraciones de la compra.">
                <textarea
                  value={form.notas}
                  onChange={(event) => updateField("notas", event.target.value)}
                  placeholder="Notas de esta entrada..."
                  className="min-h-[90px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                />
              </Panel>
            </section>

            <aside className="h-fit rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Resumen
              </p>

              <div className="mt-5 space-y-4">
                <SummaryRow label="Folio interno" value="Se genera al guardar" />
                <SummaryRow label="Archivo" value={form.archivo_nombre || "Sin archivo"} />
                <SummaryRow label="Productos" value={form.products.length} />
                <SummaryRow label="Subtotal" value={money.format(subtotal)} />

                <Field label="IVA / impuestos">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="^[0-9]+([.,][0-9]{0,4})?$"
                    placeholder="0.0000"
                    value={form.iva}
                    onChange={(event) => updateDecimalField("iva", event.target.value)}
                    className={`${inputClass} text-right font-black`}
                  />
                </Field>

                <div className="border-t border-slate-200 pt-4">
                  <SummaryRow label="Total" value={money.format(total)} strong />
                </div>
              </div>
            </aside>
          </div>
        </main>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-8 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving || !form.products.length}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            <Plus size={17} />
            {saving ? "Guardando..." : "Guardar entrada"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function SmallErrorModal({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <h3 className="text-lg font-black text-slate-950">No se pudo crear el producto</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50">
            Entendido
          </button>
        </div>
      </section>
    </div>
  );
}

function Panel({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <Icon size={19} />
          </div>
        ) : null}
        <div>
          <h3 className="font-black text-slate-950">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "text-xl font-black text-slate-950" : "font-black text-slate-950"}>
        {value}
      </span>
    </div>
  );
}
