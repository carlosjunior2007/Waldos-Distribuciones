import { Boxes, CheckCircle2, Eye } from "lucide-react";
import SummaryCard from "../../../components/ui/SummaryCard";

export default function ProductsStats({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SummaryCard icon={Boxes} title="Productos totales" value={stats.total} note="Artículos registrados dentro del catálogo." tone="primary" />
      <SummaryCard icon={CheckCircle2} title="Activos" value={stats.activos} note="Productos visibles y con stock suficiente." tone="success" />
      <SummaryCard icon={Eye} title="Ocultos" value={stats.ocultos} note="No visibles en la página pública." tone="slate" />
    </div>
  );
}