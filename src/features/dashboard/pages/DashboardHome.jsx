import EmptyState from "../../../components/ui/EmptyState";

import { useDashboard } from "../hooks/useDashboard";

import DashboardHeader from "../components/DashboardHeader";
import DashboardStats from "../components/DashboardStats";
import DashboardSummaryPanel from "../components/DashboardSummaryPanel";
import RecentActivity from "../components/RecentActivity";
import SimpleBarChart from "../components/SimpleBarChart";
import ComparisonChart from "../components/ComparisonChart";
import MovementDetailModal from "../components/MovementDetailModal";
import DashboardMessageModal from "../components/DashboardMessageModal";

export default function DashboardHome() {
  const dashboard = useDashboard();

  if (dashboard.loading) {
    return (
      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <EmptyState loading title="Cargando resumen real..." />
      </section>
    );
  }

  return (
    <>
      <DashboardMessageModal
        open={Boolean(dashboard.error)}
        title="No se pudo cargar el dashboard"
        message={dashboard.error}
        tone="error"
        confirmText="Cerrar"
        retryText="Reintentar"
        onClose={dashboard.clearError}
        onRetry={dashboard.retryLoad}
      />

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