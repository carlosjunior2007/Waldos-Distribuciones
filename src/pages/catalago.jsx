import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import supabase from "../utils/supabase";
import ProductCard from "../components/ProductCard";
import { SlidersHorizontal } from "lucide-react";

const CATEGORIAS_UI = [
  { key: "todas", label: "Todas" },
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

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const busqueda = searchParams.get("q") || "";
  const catUI = searchParams.get("cat") || "todas";
  const pageSize = Number(searchParams.get("pageSize")) || 20;
  const page = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("productos")
        .select(
          "id,nombre,descripcion,precio,imagen,disponibilidad,cantidad,categoria,codigo,created_at",
        )
        .eq("habilitado", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setProductos([]);
      } else {
        setProductos(data || []);
      }

      setLoading(false);
    };

    fetchProductos();
  }, []);

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === false
      ) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    // limpiar valores default
    if (!params.get("q")) params.delete("q");
    if ((params.get("cat") || "todas") === "todas") params.delete("cat");
    if ((params.get("page") || "1") === "1") params.delete("page");
    if ((params.get("pageSize") || "20") === "20") params.delete("pageSize");

    setSearchParams(params, { replace: true });
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return (productos || [])
      .filter((p) => {
        if (catUI === "todas") return true;
        return (p.categoria || "").toLowerCase() === catUI;
      })
      .filter((p) => {
        if (!q) return true;

        const nombre = (p.nombre || "").toLowerCase();
        const codigo = (p.codigo || "").toLowerCase();
        const desc = (p.descripcion || "").toLowerCase();

        return nombre.includes(q) || codigo.includes(q) || desc.includes(q);
      });
  }, [productos, busqueda, catUI]);

  const total = productos?.length || 0;
  const totalFiltrados = filtrados?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltrados / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    const end = start + pageSize;
    return filtrados.slice(start, end);
  }, [filtrados, pageSafe, pageSize]);

  const limpiarFiltros = () => {
    setSearchParams({}, { replace: true });
    setShowFilters(false);
  };

  const fromPath = useMemo(() => {
    const params = new URLSearchParams();

    if (busqueda.trim()) params.set("q", busqueda.trim());
    if (catUI !== "todas") params.set("cat", catUI);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 20) params.set("pageSize", String(pageSize));

    const query = params.toString();
    return query ? `/catalogo?${query}` : "/catalogo";
  }, [busqueda, catUI, page, pageSize]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="text-sm text-text-secondary">
              {loading ? (
                "Cargando resultados…"
              ) : (
                <>
                  Resultados:{" "}
                  <span className="font-semibold text-text-primary">
                    {totalFiltrados}
                  </span>{" "}
                  (de {total})
                </>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="
                  sm:hidden
                  h-9 px-3
                  rounded-md
                  border border-border
                  bg-surface
                  text-sm font-medium
                  text-text-secondary
                  inline-flex items-center gap-2
                "
              >
                <SlidersHorizontal className="h-4 w-4 text-primary-500" />
                Filtros
              </button>

              <div className="flex items-center gap-2 text-sm">
                <button
                  disabled={pageSafe <= 1}
                  onClick={() => updateParams({ page: Math.max(1, pageSafe - 1) })}
                  className="h-9 px-3 rounded-md border border-border bg-surface disabled:opacity-40"
                >
                  {"<"}
                </button>

                <span className="text-text-secondary whitespace-nowrap">
                  Página{" "}
                  <span className="font-semibold text-text-primary">
                    {pageSafe}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-text-primary">
                    {totalPages}
                  </span>
                </span>

                <button
                  disabled={pageSafe >= totalPages}
                  onClick={() =>
                    updateParams({ page: Math.min(totalPages, pageSafe + 1) })
                  }
                  className="h-9 px-3 rounded-md border border-border bg-surface disabled:opacity-40"
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <aside
              className={[
                "col-span-12 md:col-span-3",
                "md:block",
                showFilters ? "block" : "hidden",
              ].join(" ")}
            >
              <div className="bg-surface border border-border rounded-md shadow-soft">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary-500" />
                    <h3 className="font-semibold text-text-primary text-sm">
                      Filtros
                    </h3>
                  </div>

                  <button
                    onClick={limpiarFiltros}
                    className="text-xs text-accent-600 hover:text-accent-700 font-medium"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="p-4">
                  <p className="text-xs text-text-muted mb-2">Categorías</p>

                  <div className="space-y-2">
                    {CATEGORIAS_UI.map((c) => {
                      const active = catUI === c.key;
                      return (
                        <button
                          key={c.key}
                          onClick={() => {
                            updateParams({
                              cat: c.key === "todas" ? "" : c.key,
                              page: "",
                            });
                            setShowFilters(false);
                          }}
                          className={[
                            "w-full text-left px-3 py-2 rounded-md border text-sm transition",
                            active
                              ? "bg-primary-50 border-primary-200 text-primary-800"
                              : "bg-surface border-border text-text-secondary hover:bg-surface-soft",
                          ].join(" ")}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>

            <section className="col-span-12 md:col-span-9">
              <div className="bg-surface border border-border rounded-md shadow-soft">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="text-sm font-semibold text-text-primary">
                    Productos
                  </div>
                  <div className="text-xs text-text-muted">
                    Mostrando{" "}
                    <span className="font-medium text-text-secondary">
                      {pageItems.length}
                    </span>{" "}
                    de{" "}
                    <span className="font-medium text-text-secondary">
                      {totalFiltrados}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {loading ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-56 rounded-md border border-border bg-surface-soft animate-pulse"
                        />
                      ))}
                    </div>
                  ) : totalFiltrados === 0 ? (
                    <div className="rounded-md border border-border bg-surface-soft p-8 text-center">
                      <p className="text-text-primary font-semibold">
                        Sin resultados
                      </p>
                      <p className="text-text-muted text-sm mt-1">
                        Cambia la búsqueda o selecciona otra categoría.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {pageItems.map((producto) => (
                          <ProductCard
                            key={producto.id}
                            producto={producto}
                            from={fromPath}
                          />
                        ))}
                      </div>

                      <div className="mt-6 flex items-center justify-center sm:justify-between gap-3 flex-col sm:flex-row border-t border-border pt-4">
                        <div className="text-sm text-text-secondary whitespace-nowrap">
                          Página{" "}
                          <span className="font-semibold text-text-primary">
                            {pageSafe}
                          </span>{" "}
                          de{" "}
                          <span className="font-semibold text-text-primary">
                            {totalPages}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <button
                            disabled={pageSafe <= 1}
                            onClick={() =>
                              updateParams({ page: Math.max(1, pageSafe - 1) })
                            }
                            className="h-9 px-3 rounded-md border border-border bg-surface disabled:opacity-40"
                          >
                            {"<"}
                          </button>

                          <button
                            disabled={pageSafe >= totalPages}
                            onClick={() =>
                              updateParams({
                                page: Math.min(totalPages, pageSafe + 1),
                              })
                            }
                            className="h-9 px-3 rounded-md border border-border bg-surface disabled:opacity-40"
                          >
                            {">"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}