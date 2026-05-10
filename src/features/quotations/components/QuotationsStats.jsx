import {
  CheckCircle2,
  FileText,
  Send,
  FileCheck2,
} from "lucide-react";

import SummaryCard from "../../../components/ui/SummaryCard";
import { formatMoney } from "../../../utils/formatters";

export default function QuotationsStats({ summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={FileText}
        title="Cotizaciones del mes"
        value={summary.total || 0}
        note={`Total cotizado: ${formatMoney(summary.totalCotizado || 0)}`}
        tone="primary"
      />

      <SummaryCard
        icon={Send}
        title="Enviadas"
        value={summary.enviadas || 0}
        note="Cotizaciones esperando respuesta."
        tone="info"
      />

      <SummaryCard
        icon={CheckCircle2}
        title="Aceptadas"
        value={summary.aceptadas || 0}
        note="Listas para convertirse en pedido."
        tone="success"
      />

      <SummaryCard
        icon={FileCheck2}
        title="Convertidas"
        value={summary.convertidas || 0}
        note="Cotizaciones que ya pasaron a pedido."
        tone="success"
      />
    </div>
  );
}