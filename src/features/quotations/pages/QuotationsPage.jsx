import { Plus } from "lucide-react";

import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import ConfirmDeleteModal from "../../../components/ui/ConfirmDeleteModal";

import { useQuotations } from "../hooks/useQuotations";

import QuotationsStats from "../components/QuotationsStats";
import QuotationsToolbar from "../components/QuotationsToolbar";
import QuotationFormModal from "../components/QuotationFormModal";
import QuotationsTable from "../components/QuotationsTable";
import QuotationsMobileList from "../components/QuotationsMobileList";
import QuotationsPagination from "../components/QuotationsPagination";
import ConvertToOrderModal from "../components/ConvertToOrderModal";

export default function QuotationsPage() {
  const quotations = useQuotations();

  return (
    <section className="space-y-6">
      <QuotationFormModal
        open={quotations.modalOpen}
        onClose={quotations.closeModal}
        onSaved={quotations.loadData}
        editingQuotation={quotations.editingQuotation}
        currentMonth={quotations.month}
      />

      <ConvertToOrderModal
        open={quotations.convertModalOpen}
        quotation={quotations.quotationToConvert}
        loading={quotations.converting}
        onClose={quotations.closeConvertModal}
        onConfirm={quotations.confirmConvertToOrder}
      />

      <ConfirmDeleteModal
        open={Boolean(quotations.quotationToDelete)}
        title="Eliminar cotización"
        message="¿Seguro que quieres eliminar esta cotización?"
        itemName={quotations.quotationToDelete?.folio || "Cotización"}
        loading={quotations.deleting}
        onClose={() => quotations.setQuotationToDelete(null)}
        onConfirm={quotations.removeQuotation}
        confirmText="Eliminar cotización"
      />

      <QuotationsStats summary={quotations.summary} />

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Gestión comercial"
          title="Cotizaciones"
          description="Busca, filtra, edita, elimina, asocia clientes y genera PDF profesional."
          actions={
            <button
              type="button"
              onClick={quotations.openCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              <Plus className="h-4 w-4" />
              Nueva cotización
            </button>
          }
        />

        <QuotationsToolbar
          searchInput={quotations.searchInput}
          setSearchInput={quotations.setSearchInput}
          month={quotations.month}
          setMonth={quotations.setMonth}
          monthOptions={quotations.monthOptions}
          status={quotations.status}
          setStatus={quotations.setStatus}
        />

        {quotations.loading ? (
          <EmptyState
            loading
            title="Cargando cotizaciones..."
            className="min-h-[260px]"
          />
        ) : (
          <>
            <QuotationsTable
              rows={quotations.rows}
              onDownloadPdf={quotations.downloadPdf}
              onEdit={quotations.openEditModal}
              onDelete={quotations.setQuotationToDelete}
              onConvertToOrder={quotations.openConvertModal}
            />

            <QuotationsMobileList
              rows={quotations.rows}
              onDownloadPdf={quotations.downloadPdf}
              onEdit={quotations.openEditModal}
              onDelete={quotations.setQuotationToDelete}
              onConvertToOrder={quotations.openConvertModal}
            />

            {!quotations.rows.length ? (
              <EmptyState
                title="No hay cotizaciones para este filtro"
                description="Prueba cambiando el mes, el estado o la búsqueda."
                className="border-t border-border"
              />
            ) : null}
          </>
        )}

        <QuotationsPagination
          page={quotations.page}
          totalPages={quotations.totalPages}
          onPageChange={quotations.setPage}
        />
      </section>
    </section>
  );
}
