import { ClipboardList, CreditCard, Package, Truck } from "lucide-react";

function OperationCard({ title, value, note, icon: Icon, tone = "primary" }) {
  const toneClasses = {
    success: "bg-success-50 text-success-700",
    warning: "bg-warning-50 text-warning-800",
    error: "bg-error-50 text-error-700",
    primary: "bg-primary-50 text-primary-700",
  };

  return (
    <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">
            {title}
          </p>
          <p className="mt-3 text-3xl font-black text-text-primary">{value}</p>
          <p className="mt-2 text-sm text-text-secondary">{note}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

export default function OperationsOverview({ resumen }) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <OperationCard
        title="Pedidos"
        value={resumen.totalPedidos}
        note={`${resumen.pedidosEntregados} entregado(s), ${resumen.pedidosPendientes} pendiente(s).`}
        icon={ClipboardList}
        tone="primary"
      />

      <OperationCard
        title="Entregas"
        value={resumen.totalEntregas}
        note={`${resumen.entregasEntregadas} entregada(s), ${resumen.entregasPendientes} pendiente(s).`}
        icon={Truck}
        tone="success"
      />

      <OperationCard
        title="Pagos"
        value={resumen.pagosPagados}
        note={`${resumen.pagosPendientes} pago(s) pendientes.`}
        icon={CreditCard}
        tone={resumen.pagosPendientes ? "warning" : "success"}
      />

      <OperationCard
        title="Movimiento FIFO"
        value={`${resumen.salidasFifo}/${resumen.entradasFifo}`}
        note="Salidas vs entradas de unidades en el periodo."
        icon={Package}
        tone="warning"
      />
    </section>
  );
}
