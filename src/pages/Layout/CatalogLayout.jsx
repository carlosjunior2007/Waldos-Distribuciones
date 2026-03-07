import { Outlet, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export default function CatalogLayout() {
  const navigate = useNavigate();

  // Si estás en /catalogo, busca ahí; si estás en /catalogo/:id, también manda a /catalogo?q=
  const onSearch = (value) => {
    const q = value.trim();
    navigate(`/catalogo${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  };

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

            {/* Search global */}
            <div className="flex-1">
              <div className="relative w-full md:max-w-[560px] md:ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-on-dark-muted" />
                <input
                  placeholder="Busca por código, nombre o descripción"
                  className="
                    w-full h-11 rounded-md bg-white text-text-primary
                    pl-10 pr-3 border border-border
                    focus:outline-none focus:ring-2 focus:ring-accent-500
                  "
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch(e.target.value);
                  }}
                />
              </div>
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