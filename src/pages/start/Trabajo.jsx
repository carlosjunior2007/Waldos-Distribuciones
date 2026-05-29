import { useEffect, useRef } from "react";
import {
  ClipboardList,
  PackageSearch,
  Truck,
  Repeat,
  ArrowRight,
  Target,
  Eye,
  HeartHandshake,
  ShieldCheck,
  Clock,
  Users,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ComoTrabajamosSection() {
  const sectionRef = useRef(null);

  const steps = [
    {
      number: "01",
      title: "Nos dices qué necesitas",
      desc: "Puedes elegir productos del catálogo o pedirnos una lista personalizada. Te ayudamos a encontrar lo que ocupas sin vueltas.",
      icon: ClipboardList,
    },
    {
      number: "02",
      title: "Revisamos disponibilidad",
      desc: "Confirmamos productos, cantidades, tiempos de entrega y cualquier detalle importante antes de avanzar.",
      icon: PackageSearch,
    },
    {
      number: "03",
      title: "Preparamos tu pedido",
      desc: "Juntamos los productos, revisamos que todo esté correcto y dejamos el pedido listo para entrega.",
      icon: Repeat,
    },
    {
      number: "04",
      title: "Entregamos en tiempo",
      desc: "Coordinamos la entrega según tu ubicación y buscamos que recibas tu pedido de forma clara, ordenada y puntual.",
      icon: Truck,
    },
  ];

  const values = [
    {
      title: "Responsabilidad",
      desc: "Cuidamos cada pedido porque sabemos que tu negocio depende de recibir bien y a tiempo.",
      icon: ShieldCheck,
    },
    {
      title: "Rapidez",
      desc: "Respondemos de forma clara y buscamos que comprar sea más fácil, no otro problema más.",
      icon: Clock,
    },
    {
      title: "Confianza",
      desc: "Trabajamos con trato directo, información clara y seguimiento real de cada pedido.",
      icon: Users,
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const progressLine = sectionRef.current.querySelector(
        ".timeline-progress-line",
      );

      const stepCards = gsap.utils.toArray(".timeline-card");
      const stepNumbers = gsap.utils.toArray(".timeline-number");

      if (progressLine) {
        gsap.set(progressLine, {
          scaleY: 0,
          transformOrigin: "top center",
        });

        gsap.to(progressLine, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".timeline-wrapper",
            start: "top 45%",
            end: "bottom 55%",
            scrub: true,
          },
        });
      }

      stepCards.forEach((card) => {
        gsap.fromTo(
          card,
          {
            opacity: 0.55,
            y: 24,
            scale: 0.985,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 84%",
              end: "top 58%",
              scrub: true,
            },
          },
        );
      });

      stepNumbers.forEach((number) => {
        gsap.fromTo(
          number,
          {
            backgroundColor: "#ffffff",
            color: "#c70f25",
            scale: 0.94,
          },
          {
            backgroundColor: "#c70f25",
            color: "#ffffff",
            scale: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: number,
              start: "top 80%",
              end: "top 58%",
              scrub: true,
            },
          },
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="como-trabajamos"
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
          [background-image:linear-gradient(to_right,#0e34670b_1px,transparent_1px),linear-gradient(to_bottom,#0e34670b_1px,transparent_1px)]
          [background-size:52px_52px]
        "
      />

      <div className="relative mx-auto max-w-7xl">
        <div
          className="
            grid gap-6
            lg:grid-cols-[0.9fr_1fr] lg:items-end
          "
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#c70f25]">
              Cómo trabajamos
            </p>

            <h2
              className="
                mt-3 max-w-3xl text-balance
                text-[2.1rem] font-black leading-[1] tracking-[-0.045em] text-[#0e3467]
                sm:text-4xl
                lg:text-[3.25rem]
              "
            >
              Un proceso simple para recibir lo que necesitas.
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-7 text-slate-600 lg:justify-self-end">
            Te acompañamos desde la solicitud hasta la entrega. La idea es que
            comprar productos para tu negocio sea rápido, claro y sin estar
            preguntando mil veces qué sigue.
          </p>
        </div>

        {/* Timeline */}
        <div className="timeline-wrapper mt-12 lg:mt-16">
          <div className="relative">
            {/* Línea base */}
            <div
              className="
                absolute left-[34px] top-8 hidden h-[calc(100%-64px)] w-[2px]
                overflow-hidden rounded-full bg-[#c70f25]/10
                md:block
              "
            >
              {/* Línea roja que se dibuja con scroll */}
              <div
                className="
                  timeline-progress-line h-full w-full rounded-full
                  bg-gradient-to-b from-[#c70f25] via-[#c70f25] to-[#ff6b7a]
                  shadow-[0_0_18px_rgba(199,15,37,0.28)]
                "
              />
            </div>

            <div className="space-y-5 md:space-y-6">
              {steps.map((step) => (
                <TimelineStep key={step.number} {...step} />
              ))}
            </div>
          </div>
        </div>

        {/* Mission / Vision / Values */}
        <div className="mt-16 lg:mt-20">
          <div className="grid gap-5 lg:grid-cols-3">
            <InfoCard
              icon={Target}
              label="Misión"
              title="Hacer más fácil comprar suministros."
              desc="Ayudar a negocios a conseguir productos de limpieza, higiene, cafetería, papelería y más, con atención clara y entregas ordenadas."
            />

            <InfoCard
              icon={Eye}
              label="Visión"
              title="Ser un proveedor confiable para negocios."
              desc="Queremos ser una opción práctica y segura para empresas que necesitan comprar de forma constante sin perder tiempo."
            />

            <InfoCard
              icon={HeartHandshake}
              label="Valores"
              title="Trabajamos con claridad y compromiso."
              desc="Nos importa dar buen trato, responder a tiempo y cuidar que cada pedido llegue como se acordó."
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {values.map((value) => (
              <ValueCard key={value.title} {...value} />
            ))}
          </div>
        </div>

        <div
          className="
            mt-12 flex flex-col items-start justify-between gap-4
            rounded-[1.6rem] border border-[#0e3467]/10 bg-white/65
            p-5 shadow-[0_16px_42px_rgba(14,52,103,0.08)]
            sm:flex-row sm:items-center sm:p-6
          "
        >
          <div>
            <h3 className="text-xl font-black text-[#0e3467]">
              ¿Necesitas una cotización?
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Mándanos lo que necesitas y te ayudamos a armar tu pedido según
              productos, cantidades y frecuencia de compra.
            </p>
          </div>

          <a
            href="#contacto"
            className="
              group inline-flex shrink-0 items-center justify-center gap-2
              rounded-2xl bg-[#c70f25] px-6 py-3.5
              text-sm font-black text-white
              shadow-[0_14px_30px_rgba(199,15,37,0.22)]
              transition-all duration-300
              hover:-translate-y-1 hover:bg-[#a90d20]
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

function TimelineStep({ number, title, desc, icon: Icon }) {
  return (
    <div className="relative grid gap-4 md:grid-cols-[70px_1fr] md:items-stretch">
      <div className="relative z-10 flex md:justify-center">
        <div
          className="
            timeline-number
            flex h-[68px] w-[68px] items-center justify-center
            rounded-2xl border border-[#0e3467]/8 bg-white
            text-lg font-black text-[#c70f25]
            shadow-[0_18px_42px_rgba(14,52,103,0.10)]
          "
        >
          {number}
        </div>
      </div>

      <div
        className="
          timeline-card group rounded-[1.6rem] border border-[#0e3467]/8 bg-white
          p-5 shadow-[0_18px_50px_rgba(14,52,103,0.08)]
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(14,52,103,0.13)]
          sm:p-6
        "
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                  bg-white/70 text-[#0e3467]
                  ring-1 ring-[#0e3467]/8
                  transition duration-300 group-hover:bg-[#0e3467] group-hover:text-white
                "
              >
                <Icon size={20} />
              </div>

              <h3 className="text-xl font-black text-[#111827] sm:text-2xl">
                {title}
              </h3>
            </div>

            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              {desc}
            </p>
          </div>

          <div
            className="
              hidden rounded-full bg-[#c70f25]/8 px-4 py-2
              text-xs font-black uppercase tracking-[0.16em] text-[#c70f25]
              lg:block
            "
          >
            Paso {number}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, title, desc }) {
  return (
    <article
      className="
        rounded-[1.6rem] border border-[#0e3467]/10 bg-[#0e3467]
        p-6 text-white shadow-[0_18px_50px_rgba(14,52,103,0.16)]
      "
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15">
        <Icon size={22} />
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-white/62">
        {label}
      </p>

      <h3 className="mt-3 text-xl font-black leading-tight">{title}</h3>

      <p className="mt-3 text-sm leading-7 text-white/72">{desc}</p>
    </article>
  );
}

function ValueCard({ icon: Icon, title, desc }) {
  return (
    <article
      className="
        rounded-[1.4rem] border border-[#0e3467]/10 bg-white
        p-5 shadow-[0_14px_38px_rgba(14,52,103,0.08)]
      "
    >
      <div className="flex items-start gap-4">
        <div
          className="
            flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
            bg-[#c70f25]/8 text-[#c70f25]
          "
        >
          <Icon size={20} />
        </div>

        <div>
          <h4 className="font-black text-[#0e3467]">{title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
        </div>
      </div>
    </article>
  );
}