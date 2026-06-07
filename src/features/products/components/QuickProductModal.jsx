import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Package, Save, Search } from "lucide-react";

import { CATEGORY_OPTIONS, UNIT_OPTIONS } from "../product.constants";
import {
  searchSatProductCodes,
  searchSatUnitCodes,
} from "../services/facturamaCatalogs.service";

const inputClass =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent-300 focus:ring-4 focus:ring-accent-50 disabled:opacity-70";

const defaultValues = {
  nombre: "",
  descripcion: "",
  precio: "",
  precio_compra: "",
  cantidad_caja: "1",
  categoria: "otros",
  unidad: "pieza",
  iva_porcentaje: "8",
  clave_sat: "",
  clave_unidad_sat: "H87",
};

export default function QuickProductModal({
  open,
  saving = false,
  title = "Nuevo producto",
  eyebrow = "Crear sin salir",
  description = "Se guardará en catálogo y podrás seguir trabajando donde estabas.",
  submitLabel = "Crear producto",
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(defaultValues);

  useEffect(() => {
    if (!open) return;
    setValues(defaultValues);
  }, [open]);

  const selectedUnit = useMemo(() => {
    return UNIT_OPTIONS.find((option) => option.value === values.unidad) || null;
  }, [values.unidad]);

  const unitSearchText = selectedUnit
    ? `${selectedUnit.label} ${selectedUnit.clave_unidad_sat || ""}`.trim()
    : values.unidad;

  if (!open || typeof document === "undefined") return null;

  function update(field, value) {
    setValues((current) => {
      const next = { ...current, [field]: value };

      if (field === "unidad") {
        const option = UNIT_OPTIONS.find((item) => item.value === value);
        if (option?.clave_unidad_sat && !current.clave_unidad_sat) {
          next.clave_unidad_sat = option.clave_unidad_sat;
        }
      }

      return next;
    });
  }

  function handleChange(event) {
    update(event.target.name, event.target.value);
  }

  function submit(event) {
    event.preventDefault();
    onSubmit?.({
      ...values,
      descripcion: values.descripcion || values.nombre,
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex min-h-screen w-screen items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
        <form onSubmit={submit} className="flex max-h-[92vh] flex-col">
          <header className="border-b border-slate-200 px-5 py-4 md:px-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-600">{eyebrow}</p>
            <h3 className="mt-1 flex items-center gap-2 text-lg font-black text-slate-950">
              <Package className="h-5 w-5 text-accent-500" /> {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </header>

          <div className="space-y-5 overflow-y-auto p-5 md:p-6">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-black text-slate-950">Información básica</h4>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field label="Nombre" className="md:col-span-2 lg:col-span-3">
                  <input
                    className={inputClass}
                    name="nombre"
                    value={values.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Papel térmico 80 x 80"
                    autoFocus
                  />
                </Field>

                <Field label="Descripción" className="md:col-span-2 lg:col-span-3">
                  <input
                    className={inputClass}
                    name="descripcion"
                    value={values.descripcion}
                    onChange={handleChange}
                    placeholder="Opcional. Si lo dejas vacío se usa el nombre."
                  />
                </Field>

                <Field label="Precio venta">
                  <input
                    inputMode="decimal"
                    className={`${inputClass} text-right font-bold`}
                    name="precio"
                    value={values.precio}
                    onChange={(event) => update("precio", limitDecimal(event.target.value, 4))}
                    placeholder="0.0000"
                  />
                </Field>

                <Field label="Costo compra">
                  <input
                    inputMode="decimal"
                    className={`${inputClass} text-right font-bold`}
                    name="precio_compra"
                    value={values.precio_compra}
                    onChange={(event) => update("precio_compra", limitDecimal(event.target.value, 4))}
                    placeholder="0.0000"
                  />
                </Field>

                <Field label="Cantidad por caja">
                  <input
                    inputMode="decimal"
                    className={`${inputClass} text-right font-bold`}
                    name="cantidad_caja"
                    value={values.cantidad_caja}
                    onChange={(event) => update("cantidad_caja", limitDecimal(event.target.value, 4))}
                    placeholder="1"
                  />
                </Field>

                <Field label="Categoría">
                  <select className={inputClass} name="categoria" value={values.categoria} onChange={handleChange}>
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Unidad">
                  <select className={inputClass} name="unidad" value={values.unidad} onChange={handleChange}>
                    {UNIT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="IVA %">
                  <input
                    inputMode="decimal"
                    className={`${inputClass} text-right font-bold`}
                    name="iva_porcentaje"
                    value={values.iva_porcentaje}
                    onChange={(event) => update("iva_porcentaje", limitDecimal(event.target.value, 4))}
                    placeholder="8"
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-4">
                <h4 className="text-sm font-black text-slate-950">Datos fiscales SAT</h4>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Busca directo en el catálogo SAT/Facturama. También puedes pegar la clave manualmente, porque a veces la vida insiste en no ser cómoda.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Clave SAT producto/servicio">
                  <SatCatalogSearch
                    name="clave_sat"
                    value={values.clave_sat}
                    onChange={handleChange}
                    placeholder="Busca por nombre o clave, ej. limpieza"
                    searchFn={searchSatProductCodes}
                    defaultQuery={values.nombre}
                    recommendationLabel="Sugerencias basadas en el nombre del producto"
                    emptyText="Escribe el nombre del producto para ver sugerencias SAT."
                  />
                </Field>

                <Field label="Clave unidad SAT">
                  <SatCatalogSearch
                    name="clave_unidad_sat"
                    value={values.clave_unidad_sat}
                    onChange={handleChange}
                    placeholder="Busca unidad, ej. pieza, caja, litro"
                    searchFn={searchSatUnitCodes}
                    defaultQuery={unitSearchText}
                    recommendationLabel="Sugerencias basadas en la unidad seleccionada"
                    emptyText="Selecciona una unidad o busca manualmente la clave de unidad SAT."
                  />
                </Field>
              </div>
            </section>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end md:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent-500 px-5 text-sm font-black text-white transition hover:bg-accent-600 disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {saving ? "Guardando..." : submitLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function SatCatalogSearch({
  name,
  value,
  onChange,
  placeholder,
  searchFn,
  defaultQuery = "",
  recommendationLabel = "Sugerencias",
  emptyText,
}) {
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasUserTyped, setHasUserTyped] = useState(false);

  const selectedLabel = selectedItem
    ? `${selectedItem.clave} - ${selectedItem.descripcion}`
    : "";

  const inputValue = selectedItem ? selectedLabel : query;
  const cleanQuery = query.trim();
  const hasStoredValue = Boolean(value) && !selectedItem && !hasUserTyped;
  const canSearch = !selectedItem && !hasStoredValue && cleanQuery.length >= 2;
  const shouldShowDefaultHint =
    !selectedItem &&
    !hasStoredValue &&
    !hasUserTyped &&
    !value &&
    String(defaultQuery || "").trim().length >= 2;

  useEffect(() => {
    if (!value) {
      setSelectedItem(null);
      if (!hasUserTyped) setQuery("");
      return;
    }

    if (selectedItem?.clave === value) return;

    if (!hasUserTyped && !selectedItem) {
      setQuery(String(value || ""));
    }
  }, [value, selectedItem, hasUserTyped]);

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setErrorMessage("");
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const rows = await searchFn(cleanQuery);
        if (!cancelled) setResults(rows || []);
      } catch (error) {
        console.error("Error consultando catálogo fiscal:", error);
        if (!cancelled) {
          setResults([]);
          setErrorMessage(error.message || "No se pudo consultar el catálogo fiscal.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [canSearch, cleanQuery, searchFn]);

  useEffect(() => {
    if (selectedItem || hasStoredValue || hasUserTyped || value) return undefined;

    const cleanDefaultQuery = String(defaultQuery || "").trim();
    if (cleanDefaultQuery.length < 2) return undefined;

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const rows = await searchFn(cleanDefaultQuery);
        if (!cancelled) setResults(rows || []);
      } catch (error) {
        console.error("Error consultando sugerencias SAT:", error);
        if (!cancelled) {
          setResults([]);
          setErrorMessage(error.message || "No se pudo consultar el catálogo fiscal.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [defaultQuery, hasStoredValue, hasUserTyped, searchFn, selectedItem, value]);

  function emitValue(nextValue) {
    onChange({ target: { name, value: nextValue, type: "text" } });
  }

  function handleInputChange(nextValue) {
    setHasUserTyped(true);
    setSelectedItem(null);
    setQuery(nextValue);
    setResults([]);
    emitValue(nextValue.trim());
  }

  function selectItem(item) {
    setSelectedItem(item);
    setQuery("");
    setResults([]);
    setErrorMessage("");
    setLoading(false);
    emitValue(item.clave);
  }

  function clearSelection() {
    setSelectedItem(null);
    setQuery("");
    setResults([]);
    setErrorMessage("");
    setHasUserTyped(false);
    emitValue("");
  }

  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-2 focus-within:border-accent-300 focus-within:ring-4 focus-within:ring-accent-50">
        <div className="flex items-center gap-2 px-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            name={name}
            value={inputValue}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder={placeholder}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
          />
          {selectedItem ? (
            <button
              type="button"
              onClick={clearSelection}
              className="shrink-0 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
            >
              Cambiar
            </button>
          ) : null}
        </div>
      </div>

      {shouldShowDefaultHint ? (
        <p className="rounded-xl border border-accent-100 bg-accent-50 px-3 py-2 text-xs font-semibold text-accent-700">
          {recommendationLabel}: “{defaultQuery}”
        </p>
      ) : null}

      {loading ? <p className="text-xs font-semibold text-accent-600">Buscando en catálogo fiscal...</p> : null}

      {errorMessage ? (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {errorMessage}
        </p>
      ) : null}

      {!loading && !errorMessage && selectedItem ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          Clave seleccionada: {selectedItem.clave}
        </p>
      ) : null}

      {!loading && !errorMessage && !selectedItem && hasStoredValue ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          Clave guardada. Presiona el campo para buscar otra.
        </p>
      ) : null}

      {!loading && !errorMessage && !selectedItem && !hasStoredValue && cleanQuery.length < 2 ? (
        <p className="text-xs text-slate-500">{emptyText}</p>
      ) : null}

      {!loading && !errorMessage && !selectedItem && results.length ? (
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1">
          {results.map((item) => (
            <button
              key={`${item.clave}-${item.descripcion}`}
              type="button"
              onClick={() => selectItem(item)}
              className="w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
            >
              <p className="text-sm font-black text-slate-950">{item.clave}</p>
              <p className="mt-1 text-xs text-slate-500">{item.descripcion}</p>
            </button>
          ))}
        </div>
      ) : null}

      {!loading && !errorMessage && !selectedItem && canSearch && !results.length ? (
        <p className="text-xs text-slate-500">Sin resultados. Puedes ajustar la búsqueda o pegar la clave manualmente.</p>
      ) : null}
    </div>
  );
}

function limitDecimal(value, maxDecimals = 4) {
  const text = String(value ?? "").replace(",", ".");
  let cleaned = text.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");

  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }

  const [integerPart, decimalPart] = cleaned.split(".");
  if (decimalPart === undefined) return integerPart;
  return `${integerPart || "0"}.${decimalPart.slice(0, maxDecimals)}`;
}
