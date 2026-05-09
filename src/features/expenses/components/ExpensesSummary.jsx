import {
  AlertTriangle,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import SummaryCard from "../../../components/ui/SummaryCard";
import { formatMoney } from "../../../utils/formatters";

export default function ExpensesSummary({ summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={TrendingDown}
        title="Gastos descontados"
        value={formatMoney(summary.expensesTotal)}
        note="Suma de los gastos asociados a las cotizaciones filtradas."
        tone="error"
      />

      <SummaryCard
        icon={TrendingUp}
        title="Ventas completadas"
        value={formatMoney(summary.quoteTotal)}
        note="Total de cotizaciones completadas dentro del filtro actual."
        tone="success"
      />

      <SummaryCard
        icon={CircleDollarSign}
        title="Ganancia neta"
        value={formatMoney(summary.netTotal)}
        note="Cotizaciones completadas menos gastos registrados."
        tone="primary"
      />

      <SummaryCard
        icon={AlertTriangle}
        title="Cotizaciones con gastos"
        value={summary.withExpenses}
        note="Cantidad de cotizaciones a las que ya se les cargaron gastos."
        tone="warning"
      />
    </div>
  );
}