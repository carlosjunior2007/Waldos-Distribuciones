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
        title="Gastos"
        value={formatMoney(summary.expensesTotal)}
        note="Gastos asociados a pedidos y gastos independientes del filtro."
        tone="error"
      />

      <SummaryCard
        icon={TrendingUp}
        title="Utilidad realizada"
        value={formatMoney(summary.orderTotal)}
        note="Solo pedidos entregados y pagados. Sin fantasías contables."
        tone="success"
      />

      <SummaryCard
        icon={CircleDollarSign}
        title="Ganancia neta"
        value={formatMoney(summary.netTotal)}
        note="Utilidad realizada menos gastos registrados."
        tone="primary"
      />

      <SummaryCard
        icon={AlertTriangle}
        title="Pedidos con gastos"
        value={summary.withExpenses}
        note={`${summary.realizedOrders} realizados · ${summary.pendingOrders} pendientes`}
        tone="warning"
      />
    </div>
  );
}
