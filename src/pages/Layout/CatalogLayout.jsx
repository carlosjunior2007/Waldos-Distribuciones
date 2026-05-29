import {
  Outlet,
  useNavigate,
  useSearchParams,
  useLocation,
  Link,
} from "react-router-dom";
import { Search, X, PackageSearch, Home } from "lucide-react";
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
    <div className="min-h-screen bg-[#f5f8fc] text-[#0e3467]">
      <header
        className="
          sticky top-0 z-40 w-full
          border-b border-white/10 bg-[#081f3a]
          px-4 py-4
          shadow-[0_14px_34px_rgba(8,31,58,0.22)]
          sm:px-5
          lg:px-8
        "
      >
        <div className="mx-auto w-full max-w-7xl">
          <div
            className="
              flex flex-col gap-4
              lg:grid lg:grid-cols-[auto_1fr_auto]
              lg:items-center lg:gap-6
            "
          >
            {/* Marca */}
            <div className="flex min-w-0 items-center justify-between gap-4">
              <Link
                to="/catalogo"
                className="flex min-w-0 items-center gap-3"
              >
                <img
                  src="/camion.png"
                  alt="Waldo Distribuciones"
                  className="
                    h-12 w-[76px] shrink-0 object-contain
                    sm:h-14 sm:w-[88px]
                  "
                />

                <div className="min-w-0">
                  <h1
                    className="
                      text-lg font-black leading-tight text-white
                      sm:text-xl
                      lg:whitespace-nowrap
                    "
                  >
                    Waldo Distribuciones
                  </h1>

                  <p className="mt-0.5 text-sm font-medium text-slate-300">
                    Catálogo
                  </p>
                </div>
              </Link>

              <Link
                to="/"
                className="
                  inline-flex h-10 w-10 shrink-0 items-center justify-center
                  rounded-2xl border border-white/10 bg-white/8
                  text-white transition
                  hover:bg-white/12 active:scale-[0.97]
                  lg:hidden
                "
                aria-label="Volver al inicio"
              >
                <Home size={18} />
              </Link>
            </div>

            {/* Buscador */}
            <form
              onSubmit={handleSubmit}
              className="
                flex h-13 min-w-0 items-center gap-3
                rounded-2xl bg-white px-4
                shadow-[0_12px_28px_rgba(0,0,0,0.14)]
                ring-1 ring-white/10
                lg:h-12
              "
            >
              <Search className="h-5 w-5 shrink-0 text-slate-400" />

              <input
                ref={inputRef}
                type="text"
                defaultValue={currentQ}
                placeholder="Buscar producto..."
                className="
                  min-w-0 flex-1 bg-transparent
                  text-sm text-slate-700 outline-none
                  placeholder:text-slate-400
                "
              />

              {currentQ ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="
                    shrink-0 rounded-lg p-1
                    text-slate-400 transition
                    hover:bg-slate-100 hover:text-slate-700
                  "
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </form>

            {/* Acciones */}
            <div
              className="
                grid grid-cols-1 gap-3
                sm:grid-cols-[1fr_auto]
                lg:flex lg:items-center
              "
            >
              <Link
                to="/tracking"
                className="
                  inline-flex h-12 items-center justify-center gap-2
                  rounded-2xl bg-[#c70f25] px-5
                  text-sm font-black text-white
                  shadow-[0_12px_28px_rgba(199,15,37,0.24)]
                  transition
                  hover:-translate-y-[1px] hover:bg-[#a90d20]
                  active:translate-y-0 active:scale-[0.98]
                  lg:whitespace-nowrap
                "
              >
                <PackageSearch className="h-5 w-5" />
                Rastrear pedido
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main
        className="
          min-h-[calc(100vh-160px)]
          px-3 py-5
          sm:px-4 sm:py-6
          lg:px-8
        "
      >
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>

      <footer
        className="
          border-t border-[#0e3467]/10 bg-white/70
          px-4 py-7 backdrop-blur-xl
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            mx-auto flex max-w-7xl flex-col gap-5
            text-center
            md:flex-row md:items-center md:justify-between md:text-left
          "
        >
          <div>
            <p className="text-sm font-black text-[#0e3467]">
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
                className="
                  font-black text-[#0e3467]
                  transition hover:text-[#c70f25]
                "
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