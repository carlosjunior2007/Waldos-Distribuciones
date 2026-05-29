import {
  Truck,
  Clock,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Building2,
  Boxes,
  Route,
  Store,
  PackageCheck,
} from "lucide-react";

export default function CoberturaSection() {
  const benefits = [
    {
      title: "Un solo proveedor",
      desc: "Reunimos varias categorías de productos para que no tengas que buscar diferentes proveedores.",
      icon: Boxes,
    },
    {
      title: "Entrega a tu negocio",
      desc: "Coordinamos entregas directas según el pedido, la ubicación y la disponibilidad.",
      icon: Truck,
    },
    {
      title: "Apoyo para sucursales",
      desc: "Podemos ayudarte a separar productos por ubicación si tu negocio tiene más de una sucursal.",
      icon: Building2,
    },
  ];

  const coveragePoints = [
    "Negocios y empresas en Tijuana.",
    "Pedidos para una o varias sucursales.",
    "Productos de limpieza, papelería, cafetería, desechables y más.",
    "Entregas coordinadas según cantidad, ruta y disponibilidad.",
  ];

  const process = [
    {
      title: "Nos compartes lo que necesitas",
      desc: "Puede ser una lista de productos, categorías o cantidades aproximadas.",
    },
    {
      title: "Revisamos opciones",
      desc: "Buscamos disponibilidad, precios y tiempos para darte una respuesta clara.",
    },
    {
      title: "Organizamos el pedido",
      desc: "Separamos los productos y, si tienes sucursales, definimos qué va para cada lugar.",
    },
    {
      title: "Coordinamos la entrega",
      desc: "Acordamos fecha, ubicación y detalles para que recibas tus productos sin complicarte.",
    },
  ];

  return (
    <section
      id="cobertura"
      className="
        relative overflow-hidden bg-transparent
        px-4 py-16
        sm:px-6 sm:py-20
        lg:px-8 lg:py-24
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
            grid gap-6
            lg:grid-cols-[0.95fr_0.85fr] lg:items-end
          "
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#c70f25]">
              Cobertura y abastecimiento
            </p>

            <h2
              className="
                mt-3 max-w-4xl text-balance
                text-[2.1rem] font-black leading-[1] tracking-[-0.045em] text-[#0e3467]
                sm:text-4xl
                lg:text-[3.25rem]
              "
            >
              Llevamos tus suministros hasta donde tu negocio los necesita.
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-7 text-slate-600 lg:justify-self-end">
            Waldo Distribuciones está en Tijuana y ayuda a negocios, empresas y
            sucursales a mantenerse abastecidos con productos de uso diario, sin
            tener que tratar con muchos proveedores.
          </p>
        </div>

        <div
          className="
            mt-10 grid gap-5
            lg:mt-14 lg:grid-cols-12
          "
        >
          {/* Main card */}
          <article
            className="
              relative overflow-hidden rounded-[1.8rem]
              bg-[#0e3467] p-6 text-white
              shadow-[0_24px_70px_rgba(14,52,103,0.18)]
              sm:p-7
              lg:col-span-7
            "
          >
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-28 left-8 h-72 w-72 rounded-full bg-[#c70f25]/20 blur-3xl" />

            <div className="relative z-10">
              <div
                className="
                  flex h-13 w-13 items-center justify-center rounded-2xl
                  bg-white/12 text-white ring-1 ring-white/15
                "
              >
                <MapPin size={24} />
              </div>

              <h3 className="mt-6 max-w-2xl text-2xl font-black leading-tight sm:text-3xl">
                Abastecimiento para negocios en Tijuana.
              </h3>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/76 sm:text-[15px]">
                Sabemos que muchos negocios pierden tiempo buscando productos
                con distintos proveedores, comparando precios, revisando
                disponibilidad y coordinando entregas. Nuestro trabajo es
                simplificar eso: buscamos, organizamos y entregamos los
                productos que tu negocio necesita para operar todos los días.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {coveragePoints.map((point) => (
                  <div
                    key={point}
                    className="
                      flex items-start gap-3 rounded-2xl
                      border border-white/10 bg-white/8 p-4
                    "
                  >
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-white"
                    />
                    <p className="text-sm leading-6 text-white/78">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Right card */}
          <aside
            className="
              rounded-[1.8rem] border border-[#0e3467]/10 bg-white
              p-6 shadow-[0_18px_50px_rgba(14,52,103,0.10)]
              sm:p-7
              lg:col-span-5
            "
          >
            <div
              className="
                flex h-13 w-13 items-center justify-center rounded-2xl
                bg-[#c70f25]/8 text-[#c70f25]
              "
            >
              <Route size={24} />
            </div>

            <h3 className="mt-6 text-2xl font-black leading-tight text-[#0e3467]">
              Entregas flexibles para una o varias ubicaciones.
            </h3>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Si tu negocio tiene una sucursal o varias, podemos ayudarte a
              coordinar qué productos deben llegar a cada ubicación. Así reduces
              vueltas, llamadas y compras separadas.
            </p>

            <div className="mt-6 space-y-3">
              <MiniPoint
                icon={Store}
                title="Para negocios"
                desc="Oficinas, comercios, restaurantes, tiendas, clínicas y más."
              />

              <MiniPoint
                icon={PackageCheck}
                title="Por pedido"
                desc="Cada entrega se revisa según productos, cantidad y ruta."
              />

              <MiniPoint
                icon={Clock}
                title="Con seguimiento"
                desc="Te confirmamos detalles antes de programar la entrega."
              />
            </div>
          </aside>
        </div>

        {/* Benefits */}
        <div
          className="
            mt-5 grid gap-5
            md:grid-cols-3
          "
        >
          {benefits.map((item) => (
            <BenefitCard key={item.title} {...item} />
          ))}
        </div>

        {/* Process */}
        <div
          className="
            mt-12 rounded-[1.8rem] border border-[#0e3467]/10 bg-white
            p-5 shadow-[0_18px_50px_rgba(14,52,103,0.09)]
            sm:p-7
            lg:mt-14
          "
        >
          <div
            className="
              flex flex-col gap-4
              lg:flex-row lg:items-end lg:justify-between
            "
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#c70f25]">
                Cómo coordinamos
              </p>

              <h3 className="mt-3 max-w-2xl text-2xl font-black tracking-[-0.03em] text-[#0e3467] sm:text-3xl">
                Un proceso claro para recibir tus productos.
              </h3>
            </div>

            <p className="max-w-lg text-sm leading-7 text-slate-600">
              La entrega se define según el tipo de pedido, la ubicación y la
              disponibilidad. Sin promesas raras, sin letra chiquita con complejo
              de villano.
            </p>
          </div>

          <div
            className="
              mt-7 grid gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            {process.map((item, index) => (
              <ProcessCard
                key={item.title}
                number={String(index + 1).padStart(2, "0")}
                {...item}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="
            mt-12 flex flex-col items-start justify-between gap-4
            rounded-[1.8rem] bg-[#c70f25] p-6 text-white
            shadow-[0_24px_60px_rgba(199,15,37,0.20)]
            sm:flex-row sm:items-center
            lg:p-7
          "
        >
          <div>
            <h3 className="text-2xl font-black leading-tight">
              ¿Tienes una o varias sucursales?
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/78">
              Mándanos lo que necesitas y te ayudamos a organizar productos,
              cantidades y entregas por ubicación.
            </p>
          </div>

          <a
            href="#contacto"
            className="
              group inline-flex shrink-0 items-center justify-center gap-2
              rounded-2xl bg-white px-6 py-3.5
              text-sm font-black text-[#c70f25]
              shadow-[0_14px_30px_rgba(0,0,0,0.14)]
              transition-all duration-300
              hover:-translate-y-1 hover:bg-white/92
              active:translate-y-0 active:scale-[0.98]
            "
          >
            Solicitar cotización
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>
    </section>
  );
}

function MiniPoint({ icon: Icon, title, desc }) {
  return (
    <div
      className="
        flex items-start gap-3 rounded-2xl
        border border-[#0e3467]/8 bg-white/65 p-4
      "
    >
      <div
        className="
          flex h-10 w-10 shrink-0 items-center justify-center
          rounded-xl bg-white text-[#0e3467]
          shadow-[0_8px_20px_rgba(14,52,103,0.06)]
        "
      >
        <Icon size={18} />
      </div>

      <div>
        <h4 className="font-black text-[#0e3467]">{title}</h4>
        <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
      </div>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, desc }) {
  return (
    <article
      className="
        rounded-[1.5rem] border border-[#0e3467]/10 bg-white
        p-5 shadow-[0_14px_38px_rgba(14,52,103,0.08)]
      "
    >
      <div
        className="
          flex h-11 w-11 items-center justify-center rounded-2xl
          bg-[#0e3467]/7 text-[#0e3467]
        "
      >
        <Icon size={21} />
      </div>

      <h3 className="mt-5 text-lg font-black text-[#0e3467]">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </article>
  );
}

function ProcessCard({ number, title, desc }) {
  return (
    <article
      className="
        rounded-[1.4rem] border border-[#0e3467]/8 bg-white/65
        p-5 transition-all duration-300
        hover:-translate-y-1 hover:bg-white
        hover:shadow-[0_16px_42px_rgba(14,52,103,0.10)]
      "
    >
      <div
        className="
          flex h-11 w-11 items-center justify-center rounded-2xl
          bg-white text-sm font-black text-[#c70f25]
          shadow-[0_8px_20px_rgba(14,52,103,0.06)]
        "
      >
        {number}
      </div>

      <h4 className="mt-5 font-black text-[#0e3467]">{title}</h4>

      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </article>
  );
}