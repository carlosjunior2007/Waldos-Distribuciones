import { ClipboardList, Clock3, PackageCheck, TrendingUp, Truck, WalletCards } from "lucide-react";
import SummaryCard from "../../../components/ui/SummaryCard";
import { formatMoney } from "../order.helpers";

export default function OrdersStats({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      <SummaryCard icon={ClipboardList} title="Pedidos totales" value={stats.total} note="Todos los pedidos registrados." tone="primary" />
      <SummaryCard icon={Clock3} title="Creados" value={stats.creados} note="Sin entregas completas." tone="info" />
      <SummaryCard icon={Truck} title="Parciales" value={stats.parciales} note="Tienen entrega parcial." tone="warning" />
      <SummaryCard icon={PackageCheck} title="Entregados" value={stats.entregados} note="Sin pendientes por entregar." tone="success" />
      <SummaryCard icon={WalletCards} title="Pago pendiente" value={stats.pendientesPago} note="Falta registrar pago." tone="slate" />
      <SummaryCard icon={TrendingUp} title="Ganancia realizada" value={formatMoney(stats.ganancia)} note="Solo pedidos entregados y pagados." tone="success" />
    </div>
  );
}
