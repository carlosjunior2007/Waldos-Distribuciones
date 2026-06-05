import EmptyState from "../../../components/ui/EmptyState";

import { useDashboard } from "../hooks/useDashboard";

import DashboardHeader from "../components/DashboardHeader";
import FinancialOverview from "../components/FinancialOverview";
import OperationsOverview from "../components/OperationsOverview";
import RecentActivity from "../components/RecentActivity";
import SimpleBarChart from "../components/SimpleBarChart";
import ComparisonChart from "../components/ComparisonChart";
import MovementDetailModal from "../components/MovementDetailModal";
import DashboardMessageModal from "../components/DashboardMessageModal";
import { PurchasesTable, RealOrdersTable, TopProductsTable } from "../components/DashboardTables";

export default function DashboardHome() {
  const dashboard = useDashboard();

  if (dashboard.loading) {
    return (
      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <EmptyState loading title="Cargando dashboard real..." />
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
          filters={dashboard.filters}
          setFilters={dashboard.setFilters}
          periodLabel={dashboard.periodLabel}
          onExportExcel={dashboard.handleExportExcel}
          onRefresh={dashboard.retryLoad}
        />

        <FinancialOverview resumen={dashboard.resumen} />

        <OperationsOverview resumen={dashboard.resumen} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ComparisonChart
            title="Venta, FIFO, gastos y ganancia"
            subtitle="Tendencia real por periodo"
            data={dashboard.periodData}
          />

          <SimpleBarChart
            title="Compras de mercancía"
            subtitle="Facturas y entradas"
            data={dashboard.periodData}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <RealOrdersTable rows={dashboard.filteredData.pedidoGanancias} />
            <PurchasesTable rows={dashboard.filteredData.inventarioEntradas} />
          </div>

          <div className="space-y-6">
            <TopProductsTable rows={dashboard.topProducts} />
            <RecentActivity
              items={dashboard.recentActivity}
              onSelect={dashboard.setSelectedMovement}
            />
          </div>
        </div>
      </section>

      <MovementDetailModal
        item={dashboard.selectedMovement}
        onClose={() => dashboard.setSelectedMovement(null)}
      />
    </>
  );
}
