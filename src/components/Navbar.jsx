import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Menu, X, ArrowRight, PackageSearch } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

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
      setScrolled(window.scrollY > 32);
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
      if (window.innerWidth >= 1024) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
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
    }, 60);

    return () => clearTimeout(timeout);
  }, [location.pathname, location.hash]);

  return (
    <>
      <nav className="fixed left-0 top-0 z-50 flex w-full justify-center px-3 sm:px-4 lg:px-6">
        <div
          className={`
            mt-3 w-full max-w-7xl
            rounded-2xl px-3 py-2.5
            transition-all duration-300
            sm:mt-4 sm:rounded-3xl sm:px-4 sm:py-3
            lg:px-5
            ${
              scrolled
                ? "border border-[#0e3467]/10 bg-white/86 shadow-[0_18px_50px_rgba(14,52,103,0.12)] backdrop-blur-2xl"
                : "border border-white/45 bg-white/60 shadow-[0_14px_40px_rgba(14,52,103,0.08)] backdrop-blur-2xl"
            }
          `}
        >
          <div className="flex min-h-[48px] items-center justify-between gap-3">
            <Link
              to="/"
              className="flex min-w-0 shrink-0 items-center"
              onClick={() => setOpen(false)}
              aria-label="Ir al inicio"
            >
              <div className="flex h-10 w-[145px] items-center xs:w-[155px] sm:w-[178px] lg:w-[190px]">
                <img
                  src="/Logo.png"
                  alt="Waldo Distribuciones"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </Link>

            {/* Desktop links: aparecen hasta lg para no romper tablets */}
            <div className="hidden min-w-0 flex-1 items-center justify-center gap-5 text-[13px] font-bold text-[#0e3467]/80 lg:flex xl:gap-7 xl:text-sm">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={linkClass}
                  onClick={handleHashClick(link.href)}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop actions */}
            <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-3">
              <Link
                to="/tracking"
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-2xl border border-[#0e3467]/12 bg-white/70
                  px-3.5 py-2.5 text-[13px] font-black text-[#0e3467]
                  shadow-sm backdrop-blur-xl
                  transition-all duration-300
                  hover:-translate-y-[2px] hover:bg-white
                  active:translate-y-0 active:scale-[0.98]
                  xl:px-4 xl:text-sm
                "
              >
                <PackageSearch size={16} />
                <span>Rastrear</span>
              </Link>

              <Link
                to="/catalogo"
                className="
                  group inline-flex items-center justify-center gap-2
                  rounded-2xl bg-[#c70f25]
                  px-4 py-2.5 text-[13px] font-black text-white
                  shadow-[0_14px_30px_rgba(199,15,37,0.22)]
                  transition-all duration-300
                  hover:-translate-y-[2px] hover:bg-[#a90d20]
                  active:translate-y-0 active:scale-[0.98]
                  xl:px-5 xl:text-sm
                "
              >
                Ver catálogo
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>

            {/* Mobile / tablet button */}
            <button
              type="button"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              aria-controls="mobile-navbar-menu"
              onClick={() => setOpen((current) => !current)}
              className="
                inline-flex h-11 w-11 shrink-0 items-center justify-center
                rounded-2xl border border-[#0e3467]/12 bg-white/70
                text-[#0e3467] shadow-sm backdrop-blur-xl
                transition hover:bg-white active:scale-[0.96]
                lg:hidden
              "
            >
              {open ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile / tablet menu */}
      <div
        id="mobile-navbar-menu"
        className={`
          fixed inset-0 z-[60] lg:hidden
          ${open ? "pointer-events-auto" : "pointer-events-none"}
        `}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className={`
            absolute inset-0 h-full w-full bg-[#0e3467]/45 backdrop-blur-sm
            transition-opacity duration-300
            ${open ? "opacity-100" : "opacity-0"}
          `}
        />

        <aside
          className={`
            absolute right-0 top-0 flex h-[100dvh]
            w-[min(88vw,390px)] flex-col
            border-l border-white/10 bg-[#0e3467]
            shadow-2xl
            transition-transform duration-300 ease-out
            ${open ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex min-w-0 items-center gap-3"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <PackageSearch size={20} className="text-white" />
              </div>

              <div className="min-w-0">
                <span className="block truncate text-sm font-black text-white">
                  Waldo Distribuciones
                </span>
                <p className="mt-1 truncate text-xs text-white/55">
                  Suministro y distribución
                </p>
              </div>
            </Link>

            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="
                inline-flex h-10 w-10 shrink-0 items-center justify-center
                rounded-2xl border border-white/10 bg-white/8
                text-white transition hover:bg-white/14 active:scale-[0.96]
              "
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={mobileLinkClass}
                  onClick={handleHashClick(link.href)}
                >
                  {link.label}
                </a>
              ))}

              <Link
                to="/tracking"
                onClick={() => setOpen(false)}
                className={mobileLinkClass}
              >
                Rastrear pedido
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              <Link
                to="/catalogo"
                onClick={() => setOpen(false)}
                className="
                  inline-flex w-full items-center justify-center gap-2
                  rounded-2xl bg-[#c70f25] px-4 py-3.5
                  text-sm font-black text-white
                  shadow-[0_14px_30px_rgba(0,0,0,0.18)]
                  transition hover:bg-[#a90d20] active:scale-[0.98]
                "
              >
                Ver catálogo
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/tracking"
                onClick={() => setOpen(false)}
                className="
                  inline-flex w-full items-center justify-center gap-2
                  rounded-2xl border border-white/10 bg-white/8 px-4 py-3.5
                  text-sm font-black text-white
                  transition hover:bg-white/12 active:scale-[0.98]
                "
              >
                <PackageSearch size={16} />
                Rastrear pedido
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 p-4">
            <p className="text-xs leading-5 text-white/55">
              Productos para negocios, entregados con orden en Tijuana.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

const linkClass = `
  relative whitespace-nowrap transition-all duration-200
  hover:-translate-y-[1px] hover:text-[#c70f25]
  after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0
  after:rounded-full after:bg-[#c70f25] after:transition-all after:duration-300
  hover:after:w-full
`;

const mobileLinkClass = `
  block rounded-2xl px-4 py-3
  text-sm font-semibold text-white/86
  transition hover:bg-white/10 hover:text-white
`;