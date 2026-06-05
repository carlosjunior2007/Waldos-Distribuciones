import { useState } from "react";
import { Package } from "lucide-react";
import { createPortal } from "react-dom";

import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";

import { useOrders } from "../hooks/useOrders";

import OrdersStats from "../components/OrdersStats";
import OrdersToolbar from "../components/OrdersToolbar";
import OrdersCards from "../components/OrdersCards";
import OrdersPagination from "../components/OrdersPagination";
import PedidoDetallePage from "./PedidoDetallePage";
import OrderFormModal from "../components/OrderFormModal";
import DeliveryFormModal from "../components/DeliveryFormModal";
import DeliveriesModal from "../components/DeliveriesModal";
import RecurringOrderModal from "../components/RecurringOrderModal";
import OperationOverlay from "../components/OperationOverlay";
import InvoicePreviewModal from "../components/InvoicePreviewModal";

export default function PedidosPage() {
  const orders = useOrders();
  const [detailOrder, setDetailOrder] = useState(null);

  const visibleDetailOrder = detailOrder
    ? orders.orders.find((order) => order.id === detailOrder.id) || detailOrder
    : null;

  return (
    <section className="space-y-6">
      <OperationOverlay
        loadingLabel={orders.operationLabel}
        feedback={orders.operationFeedback}
      />
      <DeleteOrderModal
        dialog={orders.deleteOrderDialog}
        saving={orders.saving}
        onClose={orders.closeDeleteOrderDialog}
        onConfirm={orders.confirmDeleteCancelledOrder}
      />
      <MessageDialog
        dialog={orders.messageDialog}
        onClose={orders.closeMessageDialog}
      />

      <ConfirmActionModal
        dialog={orders.confirmDialog}
        saving={orders.saving}
        onClose={orders.closeConfirmDialog}
        onConfirm={orders.confirmGenericAction}
      />
      <OrderFormModal
        open={orders.modal === "form"}
        order={orders.selectedOrder}
        clients={orders.clients}
        products={orders.products}
        saving={orders.saving}
        onClose={orders.closeModal}
        onSave={orders.saveOrder}
      />

      <DeliveryFormModal
        open={orders.modal === "delivery"}
        order={orders.selectedOrder}
        delivery={orders.selectedDelivery}
        saving={orders.saving}
        onClose={orders.closeModal}
        onSave={orders.saveDelivery}
      />

      <DeliveriesModal
        open={orders.modal === "deliveries"}
        order={orders.selectedOrder}
        onClose={orders.closeModal}
        onScheduleDelivery={(order) => orders.openModal("delivery", order)}
        onDownloadCounterReceipt={orders.downloadCounterReceipt}
        onEditDelivery={(order, delivery) => orders.openModal("delivery", order, delivery)}
        onDeleteDelivery={orders.removeDelivery}
        busy={orders.saving}
      />

      <RecurringOrderModal
        open={orders.modal === "recurring"}
        order={orders.selectedOrder}
        saving={orders.saving}
        onClose={orders.closeModal}
        onSave={orders.saveRecurring}
      />

      <InvoicePreviewModal
        open={orders.modal === "invoice"}
        order={orders.selectedOrder}
        products={orders.products}
        saving={orders.saving}
        onClose={orders.closeModal}
        onSaveDraft={orders.saveInvoiceDraft}
        onStampInvoice={orders.stampInvoiceSandbox}
        onDownloadInvoicePdf={orders.downloadInvoicePdf}
        onDownloadInvoiceXml={orders.downloadInvoiceXml}
        onSendInvoiceEmail={orders.sendInvoiceEmail}
        onCancelInvoice={orders.cancelInvoiceSandbox}
        onDeleteLocalInvoice={orders.deleteLocalInvoice}
      />

      {visibleDetailOrder ? (
        <PedidoDetallePage
          order={visibleDetailOrder}
          onBack={() => setDetailOrder(null)}
          onEdit={(order) => orders.openModal("form", order)}
          onScheduleDelivery={(order) => orders.openModal("delivery", order)}
          onViewDeliveries={(order) => orders.openModal("deliveries", order)}
          onDownloadCounterReceipt={orders.downloadCounterReceipt}
          onDownloadPdf={orders.downloadOrderPdf}
          onOpenInvoice={(order) => orders.openModal("invoice", order)}
        />
      ) : (
        <>
          <OrdersStats stats={orders.stats} />

      {orders.loading ? (
        <section className="rounded-[28px] border border-border bg-surface p-8 text-center text-sm font-semibold text-text-secondary shadow-[var(--shadow-soft)]">
          Cargando pedidos...
        </section>
      ) : null}

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Gestión operativa"
          title="Pedidos"
          description="Administra pedidos, entregas parciales, contra recibos y seguimiento interno."
        />

        <OrdersToolbar
          search={orders.search}
          setSearch={orders.setSearch}
          statusFilter={orders.statusFilter}
          setStatusFilter={orders.setStatusFilter}
          monthFilter={orders.monthFilter}
          setMonthFilter={orders.setMonthFilter}
          monthOptions={orders.monthOptions}
          paymentFilter={orders.paymentFilter}
          setPaymentFilter={orders.setPaymentFilter}
          quotationFilter={orders.quotationFilter}
          setQuotationFilter={orders.setQuotationFilter}
          onCreateManualOrder={() => orders.openModal("form")}
        />

        {!orders.loading && orders.filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay pedidos para mostrar"
            description="Cambia los filtros o crea un pedido manual."
            className="min-h-[260px]"
          />
        ) : !orders.loading ? (
          <>
            <OrdersCards
              orders={orders.paginatedOrders}
              onView={(order) => setDetailOrder(order)}
              onEdit={(order) => orders.openModal("form", order)}
              onScheduleDelivery={(order) => orders.openModal("delivery", order)}
              onScheduleRecurringOrder={(order) => orders.openModal("recurring", order)}
              onDeactivateRecurringOrder={orders.deactivateRecurring}
              onViewDeliveries={(order) => orders.openModal("deliveries", order)}
              onDownloadCounterReceipt={orders.downloadCounterReceipt}
              onDownloadPdf={orders.downloadOrderPdf}
              onDownloadSuppliersPdf={orders.downloadOrderSuppliersPdf}
              onOpenInvoice={(order) => orders.openModal("invoice", order)}
              onCancel={orders.cancelSelectedOrder}
              onRestore={orders.restoreSelectedOrder}
              onDelete={orders.requestDeleteCancelledOrder}
            />

            <OrdersPagination
              currentPage={orders.currentPage}
              totalPages={orders.totalPages}
              startItem={orders.startItem}
              endItem={orders.endItem}
              totalItems={orders.totalItems}
              onPrevious={orders.goToPreviousPage}
              onNext={orders.goToNextPage}
            />
          </>
        ) : null}
      </section>
        </>
      )}
    </section>
  );
}



function DialogPortal({ children }) {
  if (typeof document === "undefined") return null;

  return createPortal(children, document.body);
}

function DeleteOrderModal({ dialog, saving, onClose, onConfirm }) {
  if (!dialog?.open) return null;

  const order = dialog.order;
  const blocked = Boolean(dialog.blocked);

  return (
    <DialogPortal>
      <div className="fixed inset-0 z-[99999] flex min-h-screen w-screen items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <section className="w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
          <div
            className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
              blocked ? "bg-warning-50 text-warning-700" : "bg-error-50 text-error-700"
            }`}
          >
            <Package className="h-6 w-6" />
          </div>

          <h3 className="text-lg font-black text-text-primary">
            {blocked ? "No se puede eliminar" : "Eliminar pedido cancelado"}
          </h3>

          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {blocked
              ? dialog.message
              : `¿Seguro que quieres eliminar permanentemente el pedido ${order?.folio || ""}? ${dialog.message}`}
          </p>

          {order?.cotizacion_id ? (
            <div className="mt-4 rounded-2xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm font-semibold text-warning-800">
              Este pedido está enlazado a una cotización.
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-2xl border border-border px-4 text-sm font-bold text-text-primary transition hover:bg-surface-soft disabled:opacity-60"
            >
              {blocked ? "Entendido" : "Cancelar"}
            </button>

            {!blocked ? (
              <button
                type="button"
                onClick={onConfirm}
                disabled={saving}
                className="h-11 rounded-2xl bg-error-600 px-4 text-sm font-bold text-white transition hover:bg-error-700 disabled:opacity-60"
              >
                {saving ? "Eliminando..." : "Sí, eliminar pedido"}
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </DialogPortal>
  );
}

function MessageDialog({ dialog, onClose }) {
  if (!dialog?.open) return null;

  const isWarning = dialog.tone === "warning";

  return (
    <DialogPortal>
      <div className="fixed inset-0 z-[99999] flex min-h-screen w-screen items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <section className="w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
          <div
            className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
              isWarning ? "bg-warning-50 text-warning-700" : "bg-error-50 text-error-700"
            }`}
          >
            <Package className="h-6 w-6" />
          </div>

          <h3 className="text-lg font-black text-text-primary">
            {dialog.title || "Aviso"}
          </h3>

          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {dialog.message || "Ocurrió un problema."}
          </p>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-2xl border border-border px-4 text-sm font-bold text-text-primary transition hover:bg-surface-soft"
            >
              Entendido
            </button>
          </div>
        </section>
      </div>
    </DialogPortal>
  );
}

function ConfirmActionModal({ dialog, saving, onClose, onConfirm }) {
  if (!dialog?.open) return null;

  return (
    <DialogPortal>
      <div className="fixed inset-0 z-[99999] flex min-h-screen w-screen items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <section className="w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
          <div
            className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
              dialog.danger ? "bg-error-50 text-error-700" : "bg-primary-50 text-primary-700"
            }`}
          >
            <Package className="h-6 w-6" />
          </div>

          <h3 className="text-lg font-black text-text-primary">
            {dialog.title || "Confirmar acción"}
          </h3>

          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {dialog.message || "Confirma si quieres continuar."}
          </p>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-2xl border border-border px-4 text-sm font-bold text-text-primary transition hover:bg-surface-soft disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={saving}
              className={`h-11 rounded-2xl px-4 text-sm font-bold text-white transition disabled:opacity-60 ${
                dialog.danger
                  ? "bg-error-600 hover:bg-error-700"
                  : "bg-primary-600 hover:bg-primary-700"
              }`}
            >
              {saving ? "Procesando..." : dialog.confirmLabel || "Confirmar"}
            </button>
          </div>
        </section>
      </div>
    </DialogPortal>
  );
}

