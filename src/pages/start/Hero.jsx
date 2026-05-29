import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import {
  ArrowRight,
  Coffee,
  Package,
  PawPrint,
  SprayCan,
  FileText,
  Boxes,
} from "lucide-react";

export default function Hero() {
  const sectionRef = useRef(null);

  const categories = [
    {
      title: "Limpieza",
      text: "Productos y herramientas",
      icon: SprayCan,
      color: "text-[#c70f25]",
      border: "border-[#c70f25]/22",
      desktopPosition: "lg:absolute lg:left-[11%] lg:top-[14%] xl:left-[12%]",
    },
    {
      title: "Cafetería",
      text: "Café, galletas y más",
      icon: Coffee,
      color: "text-[#c70f25]",
      border: "border-[#c70f25]/22",
      desktopPosition: "lg:absolute lg:right-[11%] lg:top-[14%] xl:right-[12%]",
    },
    {
      title: "Mascotas",
      text: "Productos para tu negocio",
      icon: PawPrint,
      color: "text-[#0e3467]",
      border: "border-[#0e3467]/16",
      desktopPosition:
        "lg:absolute lg:left-[15%] lg:bottom-[14%] xl:left-[16%]",
    },
    {
      title: "Papelería",
      text: "Artículos de oficina",
      icon: FileText,
      color: "text-[#0e3467]",
      border: "border-[#0e3467]/16",
      desktopPosition:
        "lg:absolute lg:right-[15%] lg:bottom-[14%] xl:right-[16%]",
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const q = (selector) => sectionRef.current?.querySelector(selector);
      const qa = (selector) => gsap.utils.toArray(selector, sectionRef.current);

      const title = q(".hero-title");
      const subtitle = q(".hero-subtitle");
      const ctas = q(".hero-ctas");

      const hubDesktop = q(".hub-desktop");
      const hubMobile = q(".hub-mobile");

      const cardsDesktop = qa(".hero-card-desktop");
      const cardsMobile = qa(".hero-card-mobile");

      const infinityTrack = q(".infinity-track");
      const infinityRunner = q(".infinity-runner");
      const infinityRunnerGlow = q(".infinity-runner-glow");

      const orbitDots = qa(".orbit-dot");
      const hubRings = qa(".hub-ring");

      gsap.set([title, subtitle, ctas].filter(Boolean), {
        opacity: 0,
        y: 24,
      });

      gsap.set([hubDesktop, hubMobile].filter(Boolean), {
        opacity: 0,
        scale: 0.94,
        y: 20,
      });

      gsap.set([...cardsDesktop, ...cardsMobile], {
        opacity: 0,
        y: 18,
        scale: 0.97,
      });

      gsap.set(
        [infinityTrack, infinityRunner, infinityRunnerGlow].filter(Boolean),
        {
          opacity: 0,
        },
      );

      gsap.set(orbitDots, {
        opacity: 0,
        scale: 0,
        transformOrigin: "center center",
      });

      const intro = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      intro
        .to(title, {
          opacity: 1,
          y: 0,
          duration: 0.75,
        })
        .to(
          subtitle,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          "-=0.45",
        )
        .to(
          ctas,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
          },
          "-=0.35",
        );

      if (infinityTrack) {
        intro.to(
          infinityTrack,
          {
            opacity: 1,
            duration: 0.55,
          },
          "-=0.15",
        );
      }

      if (infinityRunner && infinityRunnerGlow) {
        intro.to(
          [infinityRunnerGlow, infinityRunner],
          {
            opacity: 1,
            duration: 0.35,
          },
          "-=0.25",
        );
      }

      intro
        .to(
          [hubDesktop, hubMobile].filter(Boolean),
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
          },
          "-=0.45",
        )
        .to(
          cardsDesktop,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
          },
          "-=0.35",
        )
        .to(
          cardsMobile,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
          },
          "-=0.45",
        )
        .to(
          orbitDots,
          {
            opacity: 1,
            scale: 1,
            duration: 0.25,
            stagger: 0.05,
          },
          "-=0.2",
        );

      if (infinityRunner && infinityRunnerGlow) {
        const pathLength = infinityRunner.getTotalLength();

        const segmentLength = 230;

        gsap.set(infinityRunner, {
          attr: {
            "stroke-dasharray": `${segmentLength} ${pathLength - segmentLength}`,
            "stroke-dashoffset": 0,
          },
        });

        gsap.set(infinityRunnerGlow, {
          attr: {
            "stroke-dasharray": `${segmentLength + 38} ${
              pathLength - segmentLength - 38
            }`,
            "stroke-dashoffset": 0,
          },
        });

        gsap.to([infinityRunner, infinityRunnerGlow], {
          attr: {
            "stroke-dashoffset": -pathLength,
          },
          duration: 4,
          ease: "none",
          repeat: -1,
        });

        gsap.to(infinityRunnerGlow, {
          opacity: 0.42,
          duration: 0.9,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      gsap.to(cardsDesktop, {
        y: (i) => (i % 2 === 0 ? -4 : 4),
        duration: 3.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.12,
      });

      gsap.to(cardsMobile, {
        y: (i) => (i % 2 === 0 ? -3 : 3),
        duration: 3.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.08,
      });

      gsap.to([hubDesktop, hubMobile].filter(Boolean), {
        y: -4,
        duration: 3.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      gsap.to(hubRings, {
        rotate: (i) => (i % 2 === 0 ? 360 : -360),
        transformOrigin: "center center",
        duration: (i) => (i % 2 === 0 ? 18 : 26),
        ease: "none",
        repeat: -1,
      });

      orbitDots.forEach((dot, index) => {
        gsap.to(dot, {
          opacity: 0.24,
          scale: 0.82,
          duration: 1 + index * 0.12,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: index * 0.12,
        });
      });

      gsap.to(".hero-glow-one", {
        x: 18,
        y: -12,
        duration: 6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      gsap.to(".hero-glow-two", {
        x: -18,
        y: 12,
        duration: 7,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="Hero"
      className="
        relative overflow-hidden
        bg-transparent
        px-4 pt-24 pb-12
        sm:px-6 sm:pt-28 sm:pb-14
        lg:px-8 lg:pt-32
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

      <div className="relative z-10 mx-auto max-w-[1480px]">
        <div className="mx-auto mt-8 max-w-5xl text-center sm:mt-10 lg:mt-14">
          <h1
            className="
              hero-title mx-auto max-w-5xl text-balance
              text-[clamp(2.45rem,9vw,5.5rem)]
              font-black leading-[0.94]
              tracking-[-0.06em] text-[#0e3467]
            "
          >
            Compra lo que necesitas{" "}
            <span className="text-[#c70f25]">en un solo lugar.</span>
          </h1>

          <p
            className="
              hero-subtitle mx-auto mt-6 max-w-2xl text-pretty
              text-[15px] leading-7 text-slate-600
              sm:mt-7 sm:text-base sm:leading-8
              lg:text-lg
            "
          >
            Tenemos productos de limpieza, papelería, cafetería, desechables,
            mascotas y más. Tú pides, nosotros te entregamos.
          </p>

          <div className="hero-ctas mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <a
              href="#contacto"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-2xl bg-[#c70f25] px-7 py-4
                text-sm font-black text-white
                shadow-[0_18px_40px_rgba(199,15,37,0.24)]
                transition-all duration-300
                hover:-translate-y-1 hover:bg-[#a90d20]
                active:translate-y-0 active:scale-[0.98]
                sm:px-8
              "
            >
              Solicitar cotización
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>

            <Link
              to="/catalogo"
              className="
                inline-flex items-center justify-center gap-2
                rounded-2xl border border-[#0e3467]/15 bg-white/82 px-7 py-4
                text-sm font-black text-[#0e3467]
                shadow-sm backdrop-blur-xl
                transition-all duration-300
                hover:-translate-y-1 hover:border-[#0e3467]/25 hover:bg-white
                active:translate-y-0 active:scale-[0.98]
                sm:px-8
              "
            >
              Ver categorías
              <Package size={18} />
            </Link>
          </div>
        </div>

        <div
          className="
            relative mx-auto mt-14 w-full max-w-5xl
            sm:mt-16
            lg:mt-24 lg:h-[415px]
          "
        >
          {/* Desktop grande */}
          <div className="relative hidden h-full lg:block">
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 1000 430"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <filter
                  id="redRunnerGlow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path
                className="infinity-track"
                d="
                  M165 236
                  C190 174 282 142 390 163
                  C446 174 478 198 500 224
                  C522 198 554 174 610 163
                  C718 142 810 174 835 236
                  C858 294 802 336 704 329
                  C620 323 560 292 500 276
                  C440 292 380 323 296 329
                  C198 336 142 294 165 236
                "
                stroke="rgba(255,255,255,0.82)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                className="infinity-runner-glow"
                d="
                  M165 236
                  C190 174 282 142 390 163
                  C446 174 478 198 500 224
                  C522 198 554 174 610 163
                  C718 142 810 174 835 236
                  C858 294 802 336 704 329
                  C620 323 560 292 500 276
                  C440 292 380 323 296 329
                  C198 336 142 294 165 236
                "
                stroke="#c70f25"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.32"
                filter="url(#redRunnerGlow)"
              />

              <path
                className="infinity-runner"
                d="
                  M165 236
                  C190 174 282 142 390 163
                  C446 174 478 198 500 224
                  C522 198 554 174 610 163
                  C718 142 810 174 835 236
                  C858 294 802 336 704 329
                  C620 323 560 292 500 276
                  C440 292 380 323 296 329
                  C198 336 142 294 165 236
                "
                stroke="#c70f25"
                strokeWidth="4.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M500 224C452 207 410 195 362 187"
                stroke="#0e3467"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeDasharray="7 13"
                opacity="0.08"
              />
              <path
                d="M500 224C548 207 590 195 638 187"
                stroke="#0e3467"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeDasharray="7 13"
                opacity="0.08"
              />
              <path
                d="M492 278C448 292 405 304 360 312"
                stroke="#0e3467"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeDasharray="7 13"
                opacity="0.08"
              />
              <path
                d="M508 278C552 292 595 304 640 312"
                stroke="#0e3467"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeDasharray="7 13"
                opacity="0.08"
              />
            </svg>

            <div
              className="
                pointer-events-none absolute left-1/2 top-[50%]
                h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2
                rounded-full bg-[#0e3467]/7 blur-3xl
              "
            />

            {[
              "left-[17%] top-[37%]",
              "right-[17%] top-[37%]",
              "left-[28%] bottom-[24%]",
              "right-[28%] bottom-[24%]",
            ].map((position) => (
              <span
                key={position}
                className={`
                  orbit-dot absolute ${position}
                  h-3 w-3 rounded-full bg-[#c70f25]
                  shadow-[0_0_0_7px_rgba(199,15,37,0.08)]
                `}
              />
            ))}

            <div
              className="
                hub-desktop absolute left-1/2 top-[50%] z-20
                flex h-[214px] w-[214px] -translate-x-1/2 -translate-y-1/2
                flex-col items-center justify-center rounded-full
                border border-white/65 bg-[#0e3467]
                px-7 text-white shadow-[0_26px_65px_rgba(14,52,103,0.28)]
                backdrop-blur-xl
              "
            >
              <div className="hub-ring absolute inset-3 rounded-full border border-white/10" />
              <div className="hub-ring absolute inset-9 rounded-full border border-white/5 border-dashed" />
              <div className="hub-ring absolute inset-[52px] rounded-full border border-white/5" />

              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                  <Boxes size={23} />
                </div>

                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.28em] text-white/78">
                  WALDO HUB
                </p>

                <h2 className="mt-4 text-[18px] font-extrabold leading-[1.08] text-white xl:text-[20px]">
                  Todo en un
                  <br />
                  mismo pedido
                </h2>

                <p className="mt-3 max-w-[145px] text-[11px] leading-5 text-white/68">
                  Varias categorías, una sola compra simple.
                </p>
              </div>
            </div>

            {categories.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className={`
                    hero-card-desktop ${item.desktopPosition}
                    z-30 w-[190px] rounded-[1.45rem] border ${item.border}
                    bg-white/94 p-4 text-left
                    shadow-[0_16px_42px_rgba(14,52,103,0.1)]
                    backdrop-blur-2xl
                    transition-all duration-300
                    hover:-translate-y-2 hover:bg-white hover:shadow-[0_22px_60px_rgba(14,52,103,0.15)]
                    xl:w-[205px]
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                        flex h-10 w-10 shrink-0 items-center justify-center
                        rounded-2xl bg-slate-50 ${item.color}
                        shadow-sm
                      `}
                    >
                      <Icon size={18} />
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-[#0e3467]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Mobile + tablet */}
          <div className="lg:hidden">
            <div
              className="
                hub-mobile relative mx-auto flex
                h-[190px] w-[190px]
                flex-col items-center justify-center rounded-full
                border border-white/65 bg-[#0e3467] px-6 text-white
                shadow-[0_24px_60px_rgba(14,52,103,0.28)]
                sm:h-[215px] sm:w-[215px]
              "
            >
              <div className="hub-ring absolute h-[170px] w-[170px] rounded-full border border-white/10 sm:h-[192px] sm:w-[192px]" />
              <div className="hub-ring absolute h-[138px] w-[138px] rounded-full border border-white/6 border-dashed sm:h-[156px] sm:w-[156px]" />

              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 sm:h-12 sm:w-12">
                  <Boxes size={22} />
                </div>

                <p className="mt-3 text-[9px] font-black uppercase tracking-[0.24em] text-white/78 sm:mt-4 sm:text-[10px]">
                  WALDO HUB
                </p>

                <h2 className="mt-3 text-[18px] font-extrabold leading-[1.08] text-white sm:mt-4 sm:text-[21px]">
                  Todo en un
                  <br />
                  mismo pedido
                </h2>

                <p className="mt-3 max-w-[132px] text-[10.5px] leading-5 text-white/68 sm:max-w-[145px] sm:text-[11px]">
                  Varias categorías, una sola compra simple.
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {categories.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className={`
                      hero-card-mobile rounded-[1.35rem] border ${item.border}
                      bg-white/94 p-4 text-left
                      shadow-[0_14px_34px_rgba(14,52,103,0.1)]
                      backdrop-blur-2xl
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`
                          flex h-10 w-10 shrink-0 items-center justify-center
                          rounded-2xl bg-slate-50 ${item.color}
                          shadow-sm
                        `}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-[#0e3467]">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}