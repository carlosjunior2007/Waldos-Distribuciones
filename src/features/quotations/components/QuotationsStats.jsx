import { CheckCircle2, Clock3, FileText, TimerReset } from "lucide-react";

import SummaryCard from "../../../components/ui/SummaryCard";
import { formatMoney } from "../../../utils/formatters";

export default function QuotationsStats({ summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={FileText}
        title="Cotizaciones del mes"
        value={summary.total}
        note="Total del mes seleccionado."
        tone="primary"
      />

      <SummaryCard
        icon={Clock3}
        title="Pendientes"
        value={summary.pendientes}
        note="A la espera de respuesta."
        tone="warning"
      />

      <SummaryCard
        icon={TimerReset}
        title="En proceso"
        value={summary.enProceso}
        note="Con seguimiento activo."
        tone="info"
      />

      <SummaryCard
        icon={CheckCircle2}
        title="Ganancia real"
        value={formatMoney(summary.totalGananciaReal)}
        note="Solo cotizaciones completadas."
        tone="success"
      />
    </div>
  );
}