import { Link, useLocation } from "react-router-dom";

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <section className="min-h-screen bg-background px-6 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 shadow-lg">
          {/* Decor sutil */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary-100 blur-2xl opacity-70" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent-100 blur-2xl opacity-70" />

          {/* Content */}
          <div className="relative text-center">
            <p className="text-7xl font-extrabold text-primary-100 select-none leading-none">
              404
            </p>

            <h1 className="mt-3 text-2xl md:text-3xl font-extrabold text-text-primary">
              Página no encontrada
            </h1>

            <p className="mt-3 text-text-secondary">
              La ruta no existe o fue movida. Revisa el enlace o vuelve al inicio.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-4 py-2">
              <span className="text-xs font-semibold text-text-muted">Ruta:</span>
              <code className="text-xs font-bold text-text-primary">{pathname}</code>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 transition shadow-md"
              >
                Volver al inicio
              </Link>

              <Link
                to="/catalogo"
                className="px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-accent-500 hover:bg-accent-600 transition shadow-md"
              >
                Ver catálogo
              </Link>

              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 rounded-2xl text-sm font-semibold border border-border bg-surface hover:bg-surface-soft transition"
              >
                Regresar
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          Si llegaste aquí desde un link, probablemente cambió la ruta.
        </p>
      </div>
    </section>
  );
}