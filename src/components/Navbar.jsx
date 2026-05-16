import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, X, ArrowRight, PackageSearch } from "lucide-react";

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
      { type: "route", to: "/tracking", label: "Rastrear pedido" },
    ],
    [],
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const scrollToHash = (hash) => {
    const element = document.querySelector(hash);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    window.history.replaceState(null, "", hash);
  };

  const handleHashClick = (hash) => (event) => {
    event.preventDefault();
    setOpen(false);

    if (location.pathname !== "/") {
      navigate(`/${hash}`);
      return;
    }

    scrollToHash(hash);
  };

  useEffect(() => {
    if (location.pathname !== "/") return;
    if (!location.hash) return;

    const timeout = setTimeout(() => {
      scrollToHash(location.hash);
    }, 0);

    return () => clearTimeout(timeout);
  }, [location.pathname, location.hash]);

  return (
    <>
      <nav className="fixed left-0 top-0 z-50 flex w-full justify-center">
        <div
          className={`
            mt-6 w-[95%] max-w-7xl
            rounded-2xl px-4 py-3 sm:px-6
            transition-all duration-300
            ${
              scrolled
                ? "border border-white/10 bg-zinc-950/60 shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl"
                : "border border-white/20 bg-white/18 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl"
            }
          `}
        >
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="flex shrink-0 items-center"
              onClick={() => setOpen(false)}
            >
              <div className="flex h-10 w-[170px] items-center sm:w-[190px]">
                <img
                  src="/Logo.png"
                  alt="Waldo Distribuciones"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </Link>

            <div className="hidden items-center gap-7 text-sm font-medium text-white/90 md:flex">
              {links.map((link) =>
                link.type === "route" ? (
                  <Link key={link.label} to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className={linkClass}
                    onClick={handleHashClick(link.href)}
                  >
                    {link.label}
                  </a>
                ),
              )}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/tracking"
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-xl border border-white/15 bg-white/10
                  px-4 py-2 text-sm font-semibold text-white
                  transition-all duration-200
                  hover:-translate-y-[2px] hover:bg-white/15
                  active:translate-y-0 active:scale-[0.98]
                "
              >
                <PackageSearch size={16} />
                Tracking
              </Link>

              <Link
                to="/catalogo"
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-xl bg-accent-500 px-5 py-2
                  text-sm font-semibold text-white
                  transition-all duration-200
                  hover:-translate-y-[2px] hover:bg-accent-600
                  hover:shadow-lg hover:shadow-black/30
                  active:translate-y-0 active:scale-[0.98]
                "
              >
                Ver catálogo <ArrowRight size={16} />
              </Link>
            </div>

            <button
              type="button"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="
                inline-flex h-10 w-10 items-center justify-center
                rounded-xl border border-white/20 bg-white/10
                text-white transition hover:bg-white/15 md:hidden
              "
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`
          fixed inset-0 z-[60] md:hidden
          ${open ? "pointer-events-auto" : "pointer-events-none"}
        `}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`
            absolute inset-0 bg-black/55 backdrop-blur-sm
            transition-opacity duration-300
            ${open ? "opacity-100" : "opacity-0"}
          `}
        />

        <aside
          ref={drawerRef}
          className={`
            absolute right-0 top-0 flex h-[100dvh]
            w-[78%] max-w-[360px] flex-col
            border-l border-white/10 bg-zinc-950/95
            shadow-2xl backdrop-blur-xl
            transition-transform duration-300
            ${open ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <span className="text-sm font-semibold text-white/90">Menú</span>

            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="
                inline-flex h-10 w-10 items-center justify-center
                rounded-xl border border-white/10 bg-white/5
                text-white/90 transition hover:bg-white/10
              "
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-1 p-3">
            {links.map((link) =>
              link.type === "route" ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className={mobileLinkClass}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className={mobileLinkClass}
                  onClick={handleHashClick(link.href)}
                >
                  {link.label}
                </a>
              ),
            )}

            <Link
              to="/tracking"
              onClick={() => setOpen(false)}
              className="
                mt-2 inline-flex w-full items-center justify-center gap-2
                rounded-xl border border-white/10 bg-white/5
                px-4 py-3 text-sm font-semibold text-white
                transition hover:bg-white/10
              "
            >
              <PackageSearch size={16} />
              Rastrear pedido
            </Link>

            <Link
              to="/catalogo"
              onClick={() => setOpen(false)}
              className="
                mt-2 inline-flex w-full items-center justify-center gap-2
                rounded-xl bg-primary-500 px-4 py-3
                text-sm font-semibold text-white transition
                hover:bg-primary-600
              "
            >
              Ver catálogo <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-auto border-t border-white/10 p-4">
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
  transition hover:bg-white/10 hover:text-white
`;