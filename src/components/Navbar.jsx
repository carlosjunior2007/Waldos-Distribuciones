import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const drawerRef = useRef(null);

  const links = useMemo(
    () => [
      { type: "hash", href: "#categorias", label: "Categorías" },
      { type: "hash", href: "#como-trabajamos", label: "Cómo trabajamos" },
      { type: "hash", href: "#cobertura", label: "Cobertura" },
      { type: "hash", href: "#contacto", label: "Contacto" },
    ],
    [],
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cierra menú al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Cierra menú en desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Escape para cerrar
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Bloquear scroll cuando está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const scrollToHash = (hash) => {
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", hash);
  };

  const handleHashClick = (hash) => (e) => {
    e.preventDefault();
    setOpen(false);

    if (location.pathname !== "/") {
      navigate("/" + hash);
      return;
    }
    scrollToHash(hash);
  };

  // Si caes en /#algo, haz scroll al cargar o cambiar hash (home)
  useEffect(() => {
    if (location.pathname !== "/") return;
    if (!location.hash) return;
    const t = setTimeout(() => scrollToHash(location.hash), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.hash]);

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-center">
        <div
          className={`
    mt-6 w-[95%] max-w-7xl
    px-4 sm:px-6 py-3
    rounded-2xl
    transition-all duration-300
    ${
      scrolled
        ? "bg-zinc-950/60 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
        : "bg-white/18 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
    }
  `}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Logo sin cubo blanco */}
            <Link
              to="#Hero"
              className="flex items-center shrink-0"
              onClick={() => setOpen(false)}
            >
              <div className="h-10 w-[170px] sm:w-[190px] flex items-center">
                <img
                  src="/Logo.png"
                  alt="Waldo Distribuciones"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/90">
              {links.map((l) =>
                l.type === "route" ? (
                  <Link key={l.label} to={l.to} className={linkClass}>
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.label}
                    href={l.href}
                    className={linkClass}
                    onClick={handleHashClick(l.href)}
                  >
                    {l.label}
                  </a>
                ),
              )}
            </div>

            {/* Desktop CTA */}
            <Link
              to="/catalogo"
              className="
                hidden md:inline-flex items-center gap-2 justify-center
                px-5 py-2 rounded-xl
                text-sm font-semibold text-white
                bg-accent-500 hover:bg-accent-600
                transition-all duration-200
                hover:-translate-y-[2px]
                hover:shadow-lg hover:shadow-black/30
                active:translate-y-0 active:scale-[0.98]
              "
            >
              Ver catálogo <ArrowRight size={16} />
            </Link>

            {/* Mobile toggle */}
            <button
              type="button"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="
                md:hidden inline-flex items-center justify-center
                h-10 w-10 rounded-xl
                border border-white/20 bg-white/10
                text-white transition hover:bg-white/15
              "
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer real (NO ocupa espacio cuando está cerrado) */}
      <div
        className={`
          md:hidden fixed inset-0 z-[60]
          ${open ? "pointer-events-auto" : "pointer-events-none"}
        `}
        aria-hidden={!open}
      >
        {/* Overlay */}
        <div
          onClick={() => setOpen(false)}
          className={`
            absolute inset-0 bg-black/55 backdrop-blur-sm
            transition-opacity duration-300
            ${open ? "opacity-100" : "opacity-0"}
          `}
        />

        {/* Panel derecha -> izquierda */}
        <aside
          ref={drawerRef}
          className={`
            absolute right-0 top-0 h-[100dvh]
            w-[78%] max-w-[360px]
            bg-zinc-950/95 backdrop-blur-xl
            border-l border-white/10 shadow-2xl
            transition-transform duration-300
            ${open ? "translate-x-0" : "translate-x-full"}
            flex flex-col
          `}
        >
          {/* Header drawer */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <span className="text-white/90 text-sm font-semibold">Menú</span>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="
                h-10 w-10 inline-flex items-center justify-center
                rounded-xl border border-white/10 bg-white/5
                text-white/90 hover:bg-white/10 transition
              "
            >
              <X size={20} />
            </button>
          </div>

          {/* Links */}
          <div className="p-3 space-y-1">
            {links.map((l) =>
              l.type === "route" ? (
                <Link
                  key={l.label}
                  to={l.to}
                  className={mobileLinkClass}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  className={mobileLinkClass}
                  onClick={handleHashClick(l.href)}
                >
                  {l.label}
                </a>
              ),
            )}

            <Link
              to="/catalogo"
              onClick={() => setOpen(false)}
              className="
                mt-2 inline-flex w-full items-center justify-center gap-2
                px-4 py-3 rounded-xl
                text-sm font-semibold text-white
                bg-primary-500 hover:bg-primary-600
                transition
              "
            >
              Ver catálogo <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-auto p-4 border-t border-white/10">
            <p className="text-xs text-white/50">Waldo Distribuciones</p>
          </div>
        </aside>
      </div>
    </>
  );
}

const linkClass = `
  relative transition-all duration-200
  hover:text-white hover:-translate-y-[1px]
  after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0
  after:bg-white after:transition-all after:duration-300
  hover:after:w-full
`;

const mobileLinkClass = `
  block rounded-xl px-4 py-3
  text-sm font-medium text-white/90
  hover:text-white hover:bg-white/10
  transition
`;
