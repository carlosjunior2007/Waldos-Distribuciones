import { Plus } from "lucide-react";

import PageHeader from "../../../components/ui/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import EmptyState from "../../../components/ui/EmptyState";
import ConfirmDeleteModal from "../../../components/ui/ConfirmDeleteModal";

import { useReceipts } from "../hooks/useReceipts";

import ReceiptModal from "../components/ReceiptModal";
import ReceiptsTable from "../components/ReceiptsTable";
import ReceiptsPagination from "../components/ReceiptsPagination";

export default function ReceiptsPage() {
  const receipts = useReceipts();

  return (
    <section className="space-y-6">
      <ReceiptModal
        open={receipts.modalOpen}
        editingReceipt={receipts.editingReceipt}
        onClose={receipts.closeModal}
        onSaved={receipts.loadData}
      />

      <ConfirmDeleteModal
        open={Boolean(receipts.receiptToDelete)}
        title="Eliminar contra recibo"
        message="¿Seguro que quieres eliminar este contra recibo?"
        itemName={receipts.receiptToDelete?.folio || "Contra recibo"}
        loading={receipts.deleting}
        onClose={() => receipts.setReceiptToDelete(null)}
        onConfirm={receipts.removeReceipt}
        confirmText="Eliminar"
      />

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Documentos"
          title="Contra recibos"
          description="Crea contra recibos manuales o desde una cotización. También puedes agregar productos extra."
          actions={
            <button
              type="button"
              onClick={receipts.openCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              <Plus className="h-4 w-4" />
              Nuevo contra recibo
            </button>
          }
        />

        <div className="border-b border-border p-5 md:p-6">
          <SearchInput
            value={receipts.searchInput}
            onChange={receipts.setSearchInput}
            placeholder="Buscar por folio, cliente o RFC..."
            className="max-w-xl"
          />
        </div>

        {receipts.loading ? (
          <EmptyState loading title="Cargando contra recibos..." />
        ) : !receipts.rows.length ? (
          <EmptyState
            title="No hay contra recibos"
            description="Crea el primero desde el botón rojo."
            className="border-t border-border"
          />
        ) : (
          <ReceiptsTable
            rows={receipts.rows}
            onDownload={receipts.downloadReceipt}
            onEdit={receipts.openEditModal}
            onDelete={receipts.setReceiptToDelete}
          />
        )}

        <ReceiptsPagination
          page={receipts.page}
          totalPages={receipts.totalPages}
          onPageChange={receipts.setPage}
        />
      </section>
    </section>
  );
}