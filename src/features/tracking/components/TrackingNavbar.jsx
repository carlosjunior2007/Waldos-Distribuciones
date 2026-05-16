import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, LocateFixed, Menu, X } from 'lucide-react';

export default function TrackingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const links = useMemo(
    () => [
      { type: 'hash', href: '#categorias', label: 'Categorías' },
      { type: 'hash', href: '#como-trabajamos', label: 'Cómo trabajamos' },
      { type: 'hash', href: '#cobertura', label: 'Cobertura' },
      { type: 'hash', href: '#contacto', label: 'Contacto' },
    ],
    [],
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function scrollToHash(hash) {
    const target = document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', hash);
  }

  function handleHashClick(hash) {
    return (event) => {
      event.preventDefault();
      setOpen(false);

      if (location.pathname !== '/') {
        navigate(`/${hash}`);
        return;
      }

      scrollToHash(hash);
    };
  }

  return (
    <>
      <nav className="fixed left-0 top-0 z-50 flex w-full justify-center px-4">
        <div
          className={`mt-5 flex w-full max-w-7xl items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition-all duration-300 sm:px-6 ${
            scrolled
              ? 'border-slate-200/80 bg-white/95 shadow-lg shadow-slate-950/10 backdrop-blur-xl'
              : 'border-white/80 bg-white/90 shadow-xl shadow-slate-950/10 backdrop-blur-xl'
          }`}
        >
          <Link to="/" className="flex min-w-0 items-center" onClick={() => setOpen(false)}>
            <div className="flex h-11 w-[165px] shrink-0 items-center sm:w-[205px]">
              <img src="/Logo.png" alt="Waldo Distribuciones" className="max-h-full max-w-full object-contain" />
            </div>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            {links.map((link) => (
              <a key={link.label} href={link.href} className={desktopLinkClass} onClick={handleHashClick(link.href)}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="#buscar"
              onClick={handleHashClick('#buscar')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-700"
            >
              Rastrear pedido <LocateFixed size={16} />
            </a>

            <Link
              to="/catalogo"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700"
            >
              Ver catálogo <ArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      <div className={`fixed inset-0 z-[60] md:hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}>
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        />

        <aside
          className={`absolute right-0 top-0 flex h-[100dvh] w-[82%] max-w-[370px] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <img src="/Logo.png" alt="Waldo Distribuciones" className="h-10 w-auto object-contain" />
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-1 p-4">
            {links.map((link) => (
              <a key={link.label} href={link.href} className={mobileLinkClass} onClick={handleHashClick(link.href)}>
                {link.label}
              </a>
            ))}

            <a
              href="#buscar"
              onClick={handleHashClick('#buscar')}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50"
            >
              Rastrear pedido <LocateFixed size={16} />
            </a>

            <Link
              to="/catalogo"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700"
            >
              Ver catálogo <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-auto border-t border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500">Waldo Distribuciones</p>
            <p className="mt-1 text-sm font-black text-slate-900">Seguimiento de pedidos</p>
          </div>
        </aside>
      </div>
    </>
  );
}

const desktopLinkClass =
  'relative transition hover:text-slate-950 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-red-600 after:transition-all hover:after:w-full';

const mobileLinkClass =
  'block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950';
