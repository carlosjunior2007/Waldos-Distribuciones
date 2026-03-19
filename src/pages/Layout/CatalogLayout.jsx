import {
  Outlet,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function CatalogLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const inputRef = useRef(null);

  const isCatalogRoot = location.pathname === "/catalogo";
  const currentQ = isCatalogRoot ? searchParams.get("q") || "" : "";

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.value = currentQ;
  }, [currentQ]);

  function handleSubmit(e) {
    e.preventDefault();

    const q = inputRef.current?.value?.trim() || "";

    if (!q) {
      if (location.pathname !== "/catalogo" || location.search) {
        navigate("/catalogo", { replace: true });
      }
      return;
    }

    const target = `/catalogo?q=${encodeURIComponent(q)}`;

    if (`${location.pathname}${location.search}` !== target) {
      navigate(target, { replace: true });
    }
  }

  function handleClear() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (location.pathname !== "/catalogo" || location.search) {
      navigate("/catalogo", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary-900 text-text-on-dark">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="py-3 md:py-0 md:h-16 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div
              className="flex items-center gap-3 min-w-0 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img
                src="/camion.png"
                alt="Waldo Distribuciones"
                className="h-10 w-auto object-contain"
              />
              <div className="leading-tight min-w-0">
                <div className="font-semibold text-sm truncate">
                  Waldo Distribuciones
                </div>
                <div className="text-xs text-text-on-dark-muted truncate">
                  Catálogo
                </div>
              </div>
            </div>

            <div className="flex-1">
              <form
                onSubmit={handleSubmit}
                className="relative w-full md:max-w-[560px] md:ml-auto"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-on-dark-muted" />

                <input
                  ref={inputRef}
                  type="text"
                  defaultValue={currentQ}
                  placeholder="Busca por código, nombre o descripción"
                  className="
                    w-full h-11 rounded-md bg-white text-text-primary
                    pl-10 pr-[88px] border border-border
                    focus:outline-none focus:ring-2 focus:ring-accent-500
                  "
                />

                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-black/5 hover:text-text-primary"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-surface border-t border-border">
        <div className="mx-auto max-w-[1200px] px-4 py-6 text-sm text-text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-text-secondary font-medium">
            Waldo Distribuciones
          </span>
          <span className="text-xs">
            Catálogo interno. Precios y disponibilidad pueden cambiar.
          </span>
        </div>
      </footer>
    </div>
  );
}