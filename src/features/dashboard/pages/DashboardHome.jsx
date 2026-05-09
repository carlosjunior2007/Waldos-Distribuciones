import EmptyState from "../../../components/ui/EmptyState";

import { useDashboard } from "../hooks/useDashboard";

import DashboardHeader from "../components/DashboardHeader";
import DashboardStats from "../components/DashboardStats";
import DashboardSummaryPanel from "../components/DashboardSummaryPanel";
import RecentActivity from "../components/RecentActivity";
import SimpleBarChart from "../components/SimpleBarChart";
import ComparisonChart from "../components/ComparisonChart";
import MovementDetailModal from "../components/MovementDetailModal";

export default function DashboardHome() {
  const dashboard = useDashboard();

  if (dashboard.loading) {
    return (
      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <EmptyState loading title="Cargando resumen real..." />
      </section>
    );
  }

  if (dashboard.error) {
    return (
      <section className="rounded-[28px] border border-danger-200 bg-danger-50 p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm font-semibold text-danger-700">
          No se pudo cargar el dashboard
        </p>

        <p className="mt-2 text-sm text-danger-600">{dashboard.error}</p>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-6">
        <DashboardHeader
          range={dashboard.range}
          setRange={dashboard.setRange}
        />

        <DashboardStats stats={dashboard.stats} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <DashboardSummaryPanel
            resumen={dashboard.resumen}
            range={dashboard.range}
          />

          <RecentActivity
            items={dashboard.recentActivity}
            onSelect={dashboard.setSelectedMovement}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ComparisonChart
            title="Ganancias vs gastos"
            subtitle="Comparación financiera"
            data={dashboard.financeChartData}
          />

          <SimpleBarChart
            title="Cotizaciones"
            subtitle="Cantidad por periodo"
            data={dashboard.quotationChartData}
            valueFormatter={(value) => `${value} cotizaciones`}
          />
        </div>
      </section>

      <MovementDetailModal
        item={dashboard.selectedMovement}
        onClose={() => dashboard.setSelectedMovement(null)}
      />
    </>
  );
}