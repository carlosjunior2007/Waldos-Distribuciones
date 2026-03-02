import { Link } from "react-router-dom";
import {
  Truck,
  Clock,
  ShieldCheck,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";

export default function CoberturaSection() {
  const highlights = [
    {
      title: "Coordinación de envíos",
      desc: "Se define la opción de entrega según el pedido y la ruta disponible.",
      icon: Truck,
    },
    {
      title: "Atención y seguimiento",
      desc: "Cotización clara y seguimiento para compras recurrentes.",
      icon: ShieldCheck,
    },
    {
      title: "Horarios de atención",
      desc: "Atención en horarios comerciales y programación por disponibilidad.",
      icon: Clock,
    },
  ];

  const process = [
    {
      title: "Revisión del pedido",
      desc: "Tipo de producto, volumen y urgencia.",
    },
    {
      title: "Definición logística",
      desc: "Ruta, costo y tiempo estimado según el caso.",
    },
    {
      title: "Programación",
      desc: "Confirmación previa antes de agendar la entrega.",
    },
  ];

  return (
    <section id="cobertura" className="px-4 sm:px-6 py-16">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-wide text-text-on-light-muted">
            Entregas
          </p>

          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-text-on-light">
            Coordinación de entregas
          </h2>

          <p className="mt-4 text-text-on-light-secondary">
            La entrega se organiza por pedido. Se revisan opciones y tiempos estimados
            según disponibilidad y logística.
          </p>
        </div>

        {/* Content */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Proceso (más ligero visualmente) */}
          <div className="lg:col-span-6 rounded-2xl bg-surface border border-border shadow-soft p-6">
            <h3 className="text-lg font-semibold text-text-on-light">
              Proceso de atención
            </h3>
            <p className="mt-1 text-sm text-text-on-light-muted">
              Flujo estándar para confirmar pedido y logística.
            </p>

            <div className="mt-6 space-y-4">
              {process.map((p, idx) => (
                <div
                  key={p.title}
                  className="
                    flex items-start gap-3
                    rounded-xl
                    border border-border
                    bg-surface-soft
                    p-4
                  "
                >
                  <div className="mt-0.5 text-primary-600 flex-shrink-0">
                    <CheckCircle2 size={18} strokeWidth={2} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-text-on-light">
                      {String(idx + 1).padStart(2, "0")}. {p.title}
                    </p>
                    <p className="mt-1 text-sm text-text-on-light-secondary">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-text-on-light-muted">
              Nota: tiempos y costos se ajustan al tipo de pedido y a la ruta disponible.
            </p>
          </div>

          {/* Right: Highlights (mismo peso que izquierda) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="rounded-2xl bg-surface border border-border shadow-soft p-6"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="
                      h-12 w-12 rounded-xl
                      bg-primary-50 border border-primary-200
                      flex items-center justify-center
                      text-primary-600
                      flex-shrink-0
                    "
                  >
                    <h.icon size={22} strokeWidth={2} />
                  </div>

                  <div>
                    <h4 className="font-semibold text-text-on-light">
                      {h.title}
                    </h4>
                    <p className="mt-1 text-sm text-text-on-light-secondary">
                      {h.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Banda simple (sin otra “card gigante”) */}
            <div className="rounded-2xl border border-border bg-surface-soft p-6">
              <h3 className="text-base font-semibold text-text-on-light">
                Cotizaciones y pedidos recurrentes
              </h3>
              <p className="mt-2 text-sm text-text-on-light-secondary">
                Para compras frecuentes, se puede proponer una frecuencia de reposición.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}