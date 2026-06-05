import {
  CircleDollarSign,
  PackageCheck,
  ReceiptText,
  TrendingUp,
} from "lucide-react";

import SummaryCard from "../../../components/ui/SummaryCard";
import { formatMoney } from "../../../utils/formatters";

export default function ExpensesSummary({ summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={CircleDollarSign}
        title="Venta real s/IVA"
        value={formatMoney(summary.ventaRealSinIva)}
        note={`Cobrado: ${formatMoney(summary.montoPagado)} con impuestos/pagos registrados.`}
        tone="primary"
      />

      <SummaryCard
        icon={PackageCheck}
        title="Costo mercancía"
        value={formatMoney(summary.costoMercanciaReal)}
        note="Costo real FIFO de productos entregados. No es precio de venta, gracias al cielo."
        tone="warning"
      />

      <SummaryCard
        icon={ReceiptText}
        title="Gastos extra"
        value={formatMoney(summary.expensesTotal)}
        note="Envíos, operativos, compras manuales y gastos independientes del filtro."
        tone="error"
      />

      <SummaryCard
        icon={TrendingUp}
        title="Ganancia real neta"
        value={formatMoney(summary.netTotal)}
        note={`${summary.realizedOrders} realizados · ${summary.pendingOrders} pendientes`}
        tone="success"
      />
    </div>
  );
}
