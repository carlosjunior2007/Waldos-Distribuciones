import { Link } from "react-router-dom";
import {
  SprayCan,
  ShieldCheck,
  Home,
  Trash2,
  Droplets,
  Package,
  ShoppingBag,
  Handshake,
  ArrowRight,
  FileText,
} from "lucide-react";

export default function CategoriasSection() {
  const categories = [
    {
      title: "Limpieza",
      desc: "Químicos, sanitizantes y desinfectantes.",
      icon: SprayCan,
      href: "/catalogo?cat=limpieza",
    },
    {
      title: "Protección",
      desc: "Guantes, cubrebocas e higiene.",
      icon: ShieldCheck,
      href: "/catalogo?cat=proteccion",
    },
    {
      title: "Hogar",
      desc: "Productos esenciales para consumo diario.",
      icon: Home,
      href: "/catalogo?cat=hogar",
    },
    {
      title: "Desechables",
      desc: "Vasos, platos y empaques.",
      icon: Trash2,
      href: "/catalogo?cat=desechables",
    },
    {
      title: "Higiene personal",
      desc: "Papel, gel y cuidado personal.",
      icon: Droplets,
      href: "/catalogo?cat=higiene",
    },
    {
      title: "Empaque",
      desc: "Cajas, bolsas y logística.",
      icon: Package,
      href: "/catalogo?cat=empaque",
    },
  ];

  return (
    <section id="categorias" className="px-4 sm:px-6">
      <div className="mx-auto max-w-7xl pt-16 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <p className="text-sm tracking-wide uppercase text-text-on-light-muted">
            Categorías
          </p>

          <h2 className="text-3xl sm:text-4xl font-semibold text-text-on-light">
            Encuentra lo que necesitas.
          </h2>

          <p className="max-w-2xl text-text-on-light-secondary">
            Selecciona una categoría para explorar productos disponibles. Compra
            rápida, clara y directa.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => (
            <CategoryCard key={c.title} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ title, desc, icon: Icon, href }) {
  return (
    <Link
      to={href}
      className="
        group
        flex flex-col
        justify-between
        rounded-2xl
        border border-border-strong
        bg-surface
        p-6
        min-h-[190px]
        shadow-[0_10px_30px_rgba(15,23,42,0.08)]
        transition-all duration-200
        hover:shadow-[0_18px_40px_rgba(15,23,42,0.14)]
        hover:-translate-y-[4px]
      "
    >
      {/* Top section */}
      <div className="flex items-start gap-4">
        {/* Icon container (perfect square) */}
        <div
          className="
            flex-shrink-0
            h-12 w-12
            rounded-xl
            bg-primary-50
            border border-primary-200
            flex items-center justify-center
            text-primary-600
          "
        >
          <Icon size={22} strokeWidth={2} />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-text-on-light text-lg leading-tight">
            {title}
          </h3>

          <p className="mt-2 text-sm text-text-on-light-secondary leading-snug">
            {desc}
          </p>
        </div>
      </div>

      {/* Bottom link aligned */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm font-medium text-primary-600">
          Ver productos
        </span>

        <ArrowRight
          size={18}
          className="transition group-hover:translate-x-1 text-primary-600"
        />
      </div>
    </Link>
  );
}
