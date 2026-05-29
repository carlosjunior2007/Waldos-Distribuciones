import { Link } from "react-router-dom";
import {
  ArrowRight,
  Coffee,
  FileText,
  PawPrint,
  SprayCan,
  Trash2,
  Shirt,
  Droplets,
  CookingPot,
  Apple,
} from "lucide-react";

export default function CategoriasSection() {
  const categories = [
    {
      title: "Limpieza",
      desc: "Productos para mantener limpios negocios, oficinas, baños, pisos y áreas de trabajo.",
      href: "/catalogo?cats=limpieza",
      icon: SprayCan,
      type: "image",
      size: "hero",
      image:
        "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=1400&q=80",
    },
    {
      title: "Lavandería",
      desc: "Detergentes, suavizantes y productos para lavar, cuidar y dejar la ropa con buen aroma.",
      href: "/catalogo?cats=lavanderia",
      icon: Shirt,
      type: "solid",
      size: "heroSide",
      tone: "blue",
    },
    {
      title: "Higiene",
      desc: "Papel, jabón, gel antibacterial y productos básicos para el cuidado diario.",
      href: "/catalogo?cats=higiene_personal",
      icon: Droplets,
      type: "image",
      size: "third",
      image:
        "https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=1000&q=80",
    },
    {
      title: "Cocina",
      desc: "Productos para preparar, servir y mantener limpia el área de cocina.",
      href: "/catalogo?cats=cocina",
      icon: CookingPot,
      type: "solid",
      size: "third",
      tone: "red",
    },
    {
      title: "Desechables",
      desc: "Vasos, platos, servilletas, bolsas y artículos prácticos para uso diario.",
      href: "/catalogo?cats=desechables",
      icon: Trash2,
      type: "image",
      size: "third",
      image:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1100&q=80",
    },
    {
      title: "Papelería",
      desc: "Artículos de oficina, libretas, hojas y materiales para trabajar mejor.",
      href: "/catalogo?cats=papeleria",
      icon: FileText,
      type: "image",
      size: "quarter",
      image:
        "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1000&q=80",
    },
    {
      title: "Mascotas",
      desc: "Productos para negocios que venden, cuidan o atienden mascotas.",
      href: "/catalogo?cats=mascotas",
      icon: PawPrint,
      type: "image",
      size: "quarter",
      image:
        "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=1000&q=80",
    },
    {
      title: "Alimentos",
      desc: "Productos de consumo para oficinas, tiendas, cafeterías y negocios.",
      href: "/catalogo?cats=alimentos",
      icon: Apple,
      type: "solid",
      size: "quarter",
      tone: "blue",
    },
    {
      title: "Bebidas",
      desc: "Agua, café, refrescos y bebidas para clientes, empleados o eventos.",
      href: "/catalogo?cats=bebidas",
      icon: Coffee,
      type: "image",
      size: "quarter",
      image:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80",
    },
  ];

  return (
    <section
      id="categorias"
      className="
        relative overflow-hidden bg-transparent
        px-4 py-14
        sm:px-6 sm:py-16
        lg:px-8 lg:py-20
      "
    >

      <div
        className="
          pointer-events-none absolute inset-0 opacity-0
          [background-image:linear-gradient(to_right,#0e34670d_1px,transparent_1px),linear-gradient(to_bottom,#0e34670d_1px,transparent_1px)]
          [background-size:44px_44px]
          sm:[background-size:52px_52px]
        "
      />

      <div className="relative mx-auto max-w-7xl">
        <div
          className="
            mb-8 grid gap-5
            lg:mb-10 lg:grid-cols-[1fr_0.72fr] lg:items-start
          "
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#c70f25]">
              Explora el catálogo
            </p>

            <h2
              className="
                mt-3 max-w-3xl text-balance
                text-[2.1rem] font-black leading-[1] tracking-[-0.045em] text-[#0e3467]
                sm:text-4xl
                lg:text-[3.25rem]
              "
            >
              Todo lo que tu negocio necesita.
            </h2>
          </div>

          <p
            className="
              max-w-lg text-sm leading-7 text-slate-600
              lg:justify-self-end lg:pt-8
            "
          >
            Elige una categoría y encuentra rápido productos para limpieza,
            lavandería, cocina, oficina, mascotas, alimentos, bebidas y más.
          </p>
        </div>

        <div
          className="
            grid grid-cols-1 gap-4
            sm:grid-cols-2
            lg:grid-cols-12 lg:gap-5
          "
        >
          {categories.map((category) => (
            <CategoryCard key={category.title} {...category} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  title,
  desc,
  href,
  icon: Icon,
  type,
  size,
  image,
  tone,
}) {
  const sizeClass = getSizeClass(size);

  if (type === "image") {
    return (
      <Link
        to={href}
        className={`
          group relative overflow-hidden rounded-[1.35rem]
          border border-white/65 bg-[#0e3467]
          shadow-[0_14px_38px_rgba(14,52,103,0.11)]
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(14,52,103,0.18)]
          ${sizeClass}
        `}
      >
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="
            absolute inset-0 h-full w-full object-cover
            transition duration-700
            group-hover:scale-105
          "
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#0e3467]/94 via-[#0e3467]/52 to-[#0e3467]/12" />
        <div className="absolute inset-0 bg-[#0e3467]/8 transition duration-300 group-hover:bg-[#0e3467]/0" />

        <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-6">
          <div
            className="
              mb-4 flex h-11 w-11 items-center justify-center rounded-2xl
              bg-white/14 text-white backdrop-blur-md
              ring-1 ring-white/20
            "
          >
            <Icon size={20} />
          </div>

          <h3 className="text-xl font-black leading-tight text-white">
            {title}
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-white/86">
            {desc}
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm font-black text-white/95">
            Ver productos
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </div>
        </div>
      </Link>
    );
  }

  const solidClass =
    tone === "blue" ? "bg-[#0e3467] text-white" : "bg-[#c70f25] text-white";

  return (
    <Link
      to={href}
      className={`
        group relative overflow-hidden rounded-[1.35rem]
        ${solidClass}
        p-5 shadow-[0_14px_38px_rgba(14,52,103,0.11)]
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(14,52,103,0.18)]
        ${sizeClass}
      `}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div
          className="
            flex h-11 w-11 items-center justify-center rounded-2xl
            bg-white/14 text-white ring-1 ring-white/15
          "
        >
          <Icon size={21} />
        </div>

        <div className="pt-6">
          <h3 className="text-xl font-black leading-tight">{title}</h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-white/84">
            {desc}
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm font-black text-white/95">
            Ver productos
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function getSizeClass(size) {
  const sizes = {
    hero: "min-h-[280px] sm:col-span-2 lg:col-span-8 lg:min-h-[295px]",
    heroSide: "min-h-[240px] sm:col-span-2 lg:col-span-4 lg:min-h-[295px]",
    third: "min-h-[235px] sm:col-span-1 lg:col-span-4 lg:min-h-[245px]",
    quarter: "min-h-[220px] sm:col-span-1 lg:col-span-3 lg:min-h-[235px]",
  };

  return sizes[size] || sizes.quarter;
}
