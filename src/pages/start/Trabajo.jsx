import { ClipboardList, PackageSearch, Truck, Repeat, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ComoTrabajamosSection() {
  const steps = [
    {
      number: "01",
      title: "Solicita tu pedido",
      desc: "Elige productos desde el catálogo o solicita lista de precios personalizada.",
      icon: ClipboardList,
    },
    {
      number: "02",
      title: "Confirmamos disponibilidad",
      desc: "Te respondemos rápido con existencias, tiempos y condiciones claras.",
      icon: PackageSearch,
    },
    {
      number: "03",
      title: "Entrega puntual",
      desc: "Coordinamos envío o entrega directa según tu ubicación.",
      icon: Truck,
    },
    {
      number: "04",
      title: "Pedidos recurrentes",
      desc: "Si compras constantemente, optimizamos tu reposición para que no te falte producto.",
      icon: Repeat,
    },
  ];

  return (
    <section id="como-trabajamos" className="px-4 sm:px-6 py-16">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-wide text-text-on-light-muted">
            Cómo trabajamos
          </p>

          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-text-on-light">
            Proceso claro. Atención rápida.
          </h2>

          <p className="mt-4 text-text-on-light-secondary">
            Hacemos que comprar productos de limpieza y desechables sea simple,
            directo y sin complicaciones.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <StepCard key={step.number} {...step} />
          ))}
        </div>

      </div>
    </section>
  );
}

function StepCard({ number, title, desc, icon: Icon }) {
  return (
    <div
      className="
        rounded-2xl
        bg-surface
        border border-border
        p-6
        shadow-soft
        transition
        hover:shadow-strong
      "
    >
      <div className="flex items-start justify-between">
        <div
          className="
            h-12 w-12 rounded-xl
            bg-primary-50 border border-primary-200
            flex items-center justify-center
            text-primary-600
          "
        >
          <Icon size={22} strokeWidth={2} />
        </div>

        <span className="text-sm font-semibold text-primary-500">
          {number}
        </span>
      </div>

      <h3 className="mt-5 font-semibold text-text-on-light text-lg">
        {title}
      </h3>

      <p className="mt-2 text-sm text-text-on-light-secondary leading-relaxed">
        {desc}
      </p>
    </div>
  );
}