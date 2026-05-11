import { ClipboardList, Clock3, PackageCheck, Truck, WalletCards } from "lucide-react";
import SummaryCard from "../../../components/ui/SummaryCard";

export default function OrdersStats({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SummaryCard icon={ClipboardList} title="Pedidos totales" value={stats.total} note="Pedidos creados desde cotizaciones." tone="primary" />
      <SummaryCard icon={Clock3} title="Creados" value={stats.creados} note="Pedidos pendientes de programar." tone="info" />
      <SummaryCard icon={Truck} title="Parciales" value={stats.parciales} note="Pedidos con entregas incompletas." tone="warning" />
      <SummaryCard icon={PackageCheck} title="Entregados" value={stats.entregados} note="Pedidos completados." tone="success" />
      <SummaryCard icon={WalletCards} title="Pago pendiente" value={stats.pendientesPago} note="Pedidos sin liquidar." tone="slate" />
    </div>
  );
}
