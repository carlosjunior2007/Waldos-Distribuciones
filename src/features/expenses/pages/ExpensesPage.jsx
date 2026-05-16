import { Plus, RefreshCcw } from "lucide-react";

import PageHeader from "../../../components/ui/PageHeader";
import ConfirmDeleteModal from "../../../components/ui/ConfirmDeleteModal";

import { useExpenses } from "../hooks/useExpenses";

import ExpenseModal from "../components/ExpenseModal";
import ExpenseDetailModal from "../components/ExpenseDetailModal";
import ExpensesSummary from "../components/ExpensesSummary";
import ExpensesToolbar from "../components/ExpensesToolbar";
import ExpensesChart from "../components/ExpensesChart";
import ExpensesTable from "../components/ExpensesTable";
import ExpensesMobileCards from "../components/ExpensesMobileCards";
import ExpensesPagination from "../components/ExpensesPagination";

export default function ExpensesPage() {
  const expenses = useExpenses();

  return (
    <section className="space-y-6">
      <ExpenseModal
        open={expenses.modalOpen}
        onClose={expenses.closeExpenseModal}
        onSaved={() => expenses.loadData(true)}
        options={expenses.orderRows}
        selectedOrderId={expenses.selectedOrderId}
        editingExpense={expenses.editingExpense}
      />

      <ExpenseDetailModal
        open={Boolean(expenses.selectedDetail)}
        item={expenses.selectedDetail}
        onClose={() => expenses.setSelectedDetail(null)}
        onEditExpense={expenses.openEditExpense}
        onDeleteExpense={expenses.setSelectedDeleteExpense}
      />

      <ConfirmDeleteModal
        open={Boolean(expenses.selectedDeleteExpense)}
        title="Confirmar eliminación"
        message="Vas a eliminar este gasto."
        itemName={expenses.selectedDeleteExpense?.concepto || "Sin concepto"}
        loading={expenses.deletingExpenseId === expenses.selectedDeleteExpense?.id}
        onClose={() => expenses.setSelectedDeleteExpense(null)}
        onConfirm={() => expenses.removeExpense(expenses.selectedDeleteExpense?.id)}
        confirmText="Eliminar"
      />

      <ExpensesSummary summary={expenses.summary} />

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Gestión financiera"
          title="Ganancias por pedido"
          description="Aquí ves ganancias realizadas por pedidos entregados y pagados, menos gastos asociados."
          actions={
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => expenses.loadData(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${expenses.refreshing ? "animate-spin" : ""}`}
                />
                Actualizar
              </button>

              <button
                type="button"
                onClick={() => expenses.openNewExpense("")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Registrar gasto
              </button>
            </div>
          }
        />

        <ExpensesToolbar expenses={expenses} />

        <ExpensesChart
          chartData={expenses.chartData}
          chartStrokeColor={expenses.chartStrokeColor}
        />

        <ExpensesTable
          rows={expenses.paginatedRows}
          loading={expenses.loading}
          onDetail={expenses.setSelectedDetail}
          onEditExpense={expenses.openEditExpense}
          onNewExpense={expenses.openNewExpense}
          onDeleteExpense={expenses.setSelectedDeleteExpense}
        />

        <ExpensesMobileCards
          rows={expenses.paginatedRows}
          loading={expenses.loading}
          deletingExpenseId={expenses.deletingExpenseId}
          onDetail={expenses.setSelectedDetail}
          onEditExpense={expenses.openEditExpense}
          onNewExpense={expenses.openNewExpense}
          onDeleteExpense={expenses.setSelectedDeleteExpense}
        />

        <ExpensesPagination
          page={expenses.page}
          totalPages={expenses.totalPages}
          totalItems={expenses.unifiedRows.length}
          pageSize={expenses.pageSize}
          onPageChange={expenses.setPage}
        />
      </section>
    </section>
  );
}