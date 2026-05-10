import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";

import supabase from "../utils/supabase";
import ProductCard from "../components/ProductCard";

const CATEGORIAS_UI = [
  { key: "limpieza", label: "Limpieza" },
  { key: "lavanderia", label: "Lavandería" },
  { key: "higiene_personal", label: "Higiene" },
  { key: "cocina", label: "Cocina" },
  { key: "desechables", label: "Desechables" },
  { key: "papeleria", label: "Papelería" },
  { key: "mascotas", label: "Mascotas" },
  { key: "alimentos", label: "Alimentos" },
  { key: "bebidas", label: "Bebidas" },
  { key: "otros", label: "Otros" },
];

const DEFAULT_PAGE_SIZE = 21;

function normalizeProduct(producto) {
  const stock = Number(producto.stock ?? 0);

  return {
    ...producto,
    cantidad: stock,
    disponibilidad: producto.habilitado === true && stock > 0,
  };
}

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const busqueda = searchParams.get("q") || "";
  const pageSize = Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE;
  const page = Number(searchParams.get("page")) || 1;

  const selectedCats = useMemo(() => {
    return (searchParams.get("cats") || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }, [searchParams]);

  const hasActiveCategories = selectedCats.length > 0;

  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);

      const { data, error } = await supabase
        .from("productos")
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          imagen,
          stock,
          categoria,
          codigo,
          unidad,
          cantidad_caja,
          habilitado,
          clave_sat,
          clave_unidad_sat,
          iva_porcentaje,
          created_at
        `)
        .eq("habilitado", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando productos:", error);
        setProductos([]);
      } else {
        setProductos((data || []).map(normalizeProduct));
      }

      setLoading(false);
    }

    fetchProductos();
  }, []);

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, String(value));
    });

    if ((params.get("page") || "1") === "1") params.delete("page");
    if ((params.get("pageSize") || String(DEFAULT_PAGE_SIZE)) === String(DEFAULT_PAGE_SIZE)) {
      params.delete("pageSize");
    }

    setSearchParams(params, { replace: true });
  }

  function toggleCategory(categoryKey) {
    const next = new Set(selectedCats);

    if (next.has(categoryKey)) next.delete(categoryKey);
    else next.add(categoryKey);

    updateParams({
      cats: Array.from(next).join(","),
      page: "",
    });
  }

  function limpiarFiltros() {
    setSearchParams({}, { replace: true });
    setShowFilters(false);
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return productos
      .filter((producto) => {
        if (!hasActiveCategories) return true;
        return selectedCats.includes(String(producto.categoria || "").toLowerCase());
      })
      .filter((producto) => {
        if (!q) return true;

        const nombre = String(producto.nombre || "").toLowerCase();
        const codigo = String(producto.codigo || "").toLowerCase();
        const descripcion = String(producto.descripcion || "").toLowerCase();

        return nombre.includes(q) || codigo.includes(q) || descripcion.includes(q);
      });
  }, [productos, busqueda, selectedCats, hasActiveCategories]);

  const total = productos.length;
  const totalFiltrados = filtrados.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltrados / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, pageSafe, pageSize]);

  const fromPath = useMemo(() => {
    const params = new URLSearchParams();

    if (busqueda.trim()) params.set("q", busqueda.trim());
    if (selectedCats.length) params.set("cats", selectedCats.join(","));
    if (pageSafe > 1) params.set("page", String(pageSafe));

    const query = params.toString();
    return query ? `/catalogo?${query}` : "/catalogo";
  }, [busqueda, selectedCats, pageSafe]);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-7">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            {loading ? (
              "Cargando productos..."
            ) : (
              <>
                <span className="font-semibold text-slate-900">{totalFiltrados}</span>{" "}
                productos encontrados
                <span className="text-slate-400"> de {total}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(hasActiveCategories || busqueda) && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-sm font-semibold text-[#081f3a] hover:text-blue-700"
              >
                Limpiar filtros
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#081f3a]" />
              Filtros
            </button>
          </div>
        </div>

        {(hasActiveCategories || busqueda) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {busqueda && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                Búsqueda: {busqueda}
              </span>
            )}

            {selectedCats.map((cat) => {
              const category = CATEGORIAS_UI.find((item) => item.key === cat);

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#081f3a]"
                >
                  {category?.label || cat}
                  <X className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-12 gap-5">
          <aside
            className={[
              "col-span-12 md:col-span-3",
              "md:block",
              showFilters ? "block" : "hidden",
            ].join(" ")}
          >
            <div className="sticky top-24 rounded-[22px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4">
                <h3 className="text-sm font-bold text-slate-900">Filtros</h3>
                <p className="text-xs text-slate-500">Categorías del catálogo</p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-1">
                {CATEGORIAS_UI.map((categoria) => {
                  const active = selectedCats.includes(categoria.key);

                  return (
                    <button
                      key={categoria.key}
                      type="button"
                      onClick={() => toggleCategory(categoria.key)}
                      className={[
                        "rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition",
                        active
                          ? "border-blue-200 bg-blue-50 text-[#081f3a]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-blue-50",
                      ].join(" ")}
                    >
                      {categoria.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="col-span-12 md:col-span-9">
            <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Productos</h3>
                  <p className="text-sm text-slate-500">
                    Mostrando{" "}
                    <span className="font-semibold text-slate-900">{pageItems.length}</span>{" "}
                    de{" "}
                    <span className="font-semibold text-slate-900">{totalFiltrados}</span>
                  </p>
                </div>

                <Pagination pageSafe={pageSafe} totalPages={totalPages} updateParams={updateParams} />
              </div>

              <div className="p-4 md:p-5">
                {loading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-64 animate-pulse rounded-[20px] border border-slate-200 bg-slate-100"
                      />
                    ))}
                  </div>
                ) : totalFiltrados === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                    <p className="text-lg font-bold text-slate-900">Sin resultados</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Cambia la búsqueda o selecciona otras categorías.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {pageItems.map((producto) => (
                        <ProductCard key={producto.id} producto={producto} from={fromPath} />
                      ))}
                    </div>

                    <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                      <Pagination pageSafe={pageSafe} totalPages={totalPages} updateParams={updateParams} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Pagination({ pageSafe, totalPages, updateParams }) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm font-medium text-slate-500 sm:inline">
        Página <span className="font-bold text-slate-900">{pageSafe}</span> de{" "}
        <span className="font-bold text-slate-900">{totalPages}</span>
      </span>

      <button
        type="button"
        disabled={pageSafe <= 1}
        onClick={() => updateParams({ page: Math.max(1, pageSafe - 1) })}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
      >
        <ChevronLeft className="inline h-4 w-4" /> Anterior
      </button>

      <button
        type="button"
        disabled={pageSafe >= totalPages}
        onClick={() => updateParams({ page: Math.min(totalPages, pageSafe + 1) })}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
      >
        Siguiente <ChevronRight className="inline h-4 w-4" />
      </button>
    </div>
  );
}