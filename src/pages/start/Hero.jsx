import { Link } from "react-router-dom";

export default function Hero() {
  // Warehouse / logística / inventario (más alineado a B2B)
  const bg =
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2400&q=80";

  return (
    <section className="relative min-h-screen bg-background" id="Hero">
      {/* Background */}
      <img
        src={bg}
        alt="Centro de distribución y logística"
        className="absolute inset-0 h-full w-full object-cover object-[50%_40%]"
        loading="eager"
      />

      {/* Overlay (contraste para texto) */}
      <div className="absolute inset-0 bg-linear-to-b from-primary-900/85 via-primary-900/65 to-primary-900/40" />

      {/* Contenido centrado */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-3xl text-center">
          {/* Badge */}
          <span className="inline-flex items-center justify-center rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-text-secondary shadow-sm">
            Mayorista • Surtido • Logística • B2B
          </span>

          {/* Title */}
          <h1 className="mt-6 text-3xl md:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
            Surtimos productos para distribuidores y negocios.
          </h1>

          {/* Description */}
          <p className="mt-5 text-white/85 text-base md:text-lg leading-relaxed">
            Proveemos múltiples categorías de producto para distribuidores y negocios:
            consumo, desechables, limpieza, protección, hogar y más. Catálogo claro,
            atención rápida y compras recurrentes.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/catalogo"
              className="inline-flex items-center justify-center rounded-2xl px-7 py-3 text-sm font-semibold text-white bg-accent-500 hover:bg-accent-600 transition shadow-lg shadow-black/20"
            >
              Ver catálogo
            </Link>

            <a
              href="#contacto"
              className="inline-flex items-center justify-center rounded-2xl px-7 py-3 text-sm font-semibold text-white border border-white/25 bg-white/10 hover:bg-white/15 transition"
            >
              Solicitar lista de precios
            </a>
          </div>

          {/* Micro info */}
          <p className="mt-6 text-xs text-white/70">
            Ventas al mayoreo • Atención a distribuidores • Pedidos recurrentes
          </p>
        </div>
      </div>
    </section>
  );
}