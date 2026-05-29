import { Link } from "react-router-dom";
import {
  Mail,
  MapPin,
  Clock,
  PackageSearch,
  Truck,
  ShieldCheck,
} from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  const sectionLinks = [
    { label: "Categorías", href: "#categorias" },
    { label: "Cómo trabajamos", href: "#como-trabajamos" },
    { label: "Cobertura", href: "#cobertura" },
    { label: "Contacto", href: "#contacto" },
  ];

  const pageLinks = [
    { label: "Catálogo", to: "/catalogo" },
    { label: "Rastrear pedido", to: "/tracking" },
  ];

  const highlights = [
    {
      icon: PackageSearch,
      title: "Varios productos",
      text: "Limpieza, higiene, papelería y más.",
    },
    {
      icon: Truck,
      title: "Entregas",
      text: "Pedidos organizados por ubicación.",
    },
    {
      icon: ShieldCheck,
      title: "Atención clara",
      text: "Te ayudamos a cotizar sin vueltas.",
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-transparent text-[#0e3467]">
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.78fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center">
              <div className="rounded-2xl bg-white px-4 py-2.5 shadow-[0_10px_24px_rgba(14,52,103,0.08)] ring-1 ring-[#0e3467]/8">
                <img
                  src="/Logo.png"
                  alt="Waldo Distribuciones"
                  className="h-10 w-auto object-contain"
                />
              </div>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              Suministro y distribución de productos para negocios en Tijuana.
              Reunimos varias categorías para que compres de forma más simple.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <ContactItem
                icon={Mail}
                text="contacto@waldodistribuciones.com"
              />
              <ContactItem icon={MapPin} text="Tijuana, Baja California" />
              <ContactItem icon={Clock} text="Atención en horario comercial" />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              Navegación
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-1">
              {sectionLinks.map((link) => (
                <a key={link.label} href={link.href} className={footerLinkClass}>
                  {link.label}
                </a>
              ))}

              {pageLinks.map((link) => (
                <Link key={link.label} to={link.to} className={footerLinkClass}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              Lo que hacemos
            </h3>

            <div className="mt-4 grid gap-3">
              {highlights.map((item) => (
                <HighlightItem key={item.title} {...item} />
              ))}
            </div>
          </div>
        </div>

        <div
          className="
            mt-8 flex flex-col gap-3 border-t border-[#0e3467]/10 pt-5
            text-sm text-slate-500
            sm:flex-row sm:items-center sm:justify-between
          "
        >
          <p>© {year} Waldo Distribuciones. Todos los derechos reservados.</p>

          <p>
            Sitio desarrollado por{" "}
            <a
              href="https://jumalancers.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-[#0e3467] transition hover:text-[#c70f25]"
            >
              Jumalancers
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function ContactItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <div
        className="
          flex h-8 w-8 shrink-0 items-center justify-center
          rounded-xl bg-white text-[#0e3467]
          ring-1 ring-[#0e3467]/10 shadow-[0_8px_16px_rgba(14,52,103,0.05)]
        "
      >
        <Icon size={15} />
      </div>

      <span className="leading-5">{text}</span>
    </div>
  );
}

function HighlightItem({ icon: Icon, title, text }) {
  return (
    <div
      className="
        rounded-2xl border border-[#0e3467]/10 bg-white/80
        p-3.5 shadow-[0_12px_26px_rgba(14,52,103,0.05)] backdrop-blur-xl
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            flex h-9 w-9 shrink-0 items-center justify-center
            rounded-xl bg-[#0e3467]/6 text-[#0e3467] ring-1 ring-[#0e3467]/10
          "
        >
          <Icon size={16} />
        </div>

        <div>
          <h4 className="text-sm font-black text-[#0e3467]">{title}</h4>
          <p className="mt-1 text-sm leading-5 text-slate-600">{text}</p>
        </div>
      </div>
    </div>
  );
}

const footerLinkClass = `
  w-fit text-sm font-semibold text-slate-600
  transition hover:text-[#0e3467]
`;
