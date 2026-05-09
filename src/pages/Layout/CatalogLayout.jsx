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
      <header className="w-full border-b border-slate-200 bg-[#081f3a] px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <a href="/catalogo">
              <img
                src="/camion.png"
                alt="Waldo Distribuciones"
                className="h-14 w-14 object-contain md:h-16 md:w-16"
              />
            </a>

            <div>
              <h1 className="text-base font-bold text-white md:text-lg">
                Waldo Distribuciones
              </h1>
              <p className="text-sm text-slate-300">Catálogo</p>
            </div>
          </div>

          <div className="w-full md:max-w-xl">
            <form
              onSubmit={handleSubmit}
              className="flex h-12 items-center gap-3 rounded-xl bg-white px-4 shadow-sm"
            >
              <Search className="h-5 w-5 shrink-0 text-slate-400" />

              <input
                ref={inputRef}
                type="text"
                defaultValue={currentQ}
                placeholder="Busca por código, nombre o descripción"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />

              {currentQ ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="shrink-0 text-slate-400 transition hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-slate-50 px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Waldo Distribuciones
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Catálogo digital de productos.
            </p>
          </div>

          <div className="text-sm text-slate-500 md:text-right">
            <p>
              © {new Date().getFullYear()} Waldo Distribuciones. Todos los
              derechos reservados.
            </p>

            <p className="mt-1">
              Sitio desarrollado por{" "}
              <a
                href="https://jumalancers.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                Jumalancers
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
