import { Package } from "lucide-react";

import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";

import { useOrders } from "../hooks/useOrders";

import OrdersStats from "../components/OrdersStats";
import OrdersToolbar from "../components/OrdersToolbar";
import OrdersTable from "../components/OrdersTable";
import OrdersMobileList from "../components/OrdersMobileList";
import OrdersPagination from "../components/OrdersPagination";
import OrderDetailsModal from "../components/OrderDetailsModal";
import OrderFormModal from "../components/OrderFormModal";
import DeliveryFormModal from "../components/DeliveryFormModal";
import DeliveriesModal from "../components/DeliveriesModal";
import RecurringOrderModal from "../components/RecurringOrderModal";
import OperationOverlay from "../components/OperationOverlay";
import InvoicePreviewModal from "../components/InvoicePreviewModal";

export default function PedidosPage() {
  const orders = useOrders();

  return (
    <section className="space-y-6">
      <OperationOverlay
        loadingLabel={orders.operationLabel}
        feedback={orders.operationFeedback}
      />
      <OrderDetailsModal
        open={orders.modal === "details"}
        order={orders.selectedOrder}
        onClose={orders.closeModal}
        onEdit={(order) => orders.openModal("form", order)}
        onScheduleDelivery={(order) => orders.openModal("delivery", order)}
        onViewDeliveries={(order) => orders.openModal("deliveries", order)}
        onDownloadCounterReceipt={orders.downloadCounterReceipt}
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
      />

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
            <OrdersTable
              orders={orders.paginatedOrders}
              onView={(order) => orders.openModal("details", order)}
              onEdit={(order) => orders.openModal("form", order)}
              onScheduleDelivery={(order) => orders.openModal("delivery", order)}
              onScheduleRecurringOrder={(order) => orders.openModal("recurring", order)}
              onDeactivateRecurringOrder={orders.deactivateRecurring}
              onViewDeliveries={(order) => orders.openModal("deliveries", order)}
              onDownloadCounterReceipt={orders.downloadCounterReceipt}
              onDownloadPdf={orders.downloadOrderPdf}
              onOpenInvoice={(order) => orders.openModal("invoice", order)}
              onCancel={orders.cancelSelectedOrder}
              onRestore={orders.restoreSelectedOrder}
            />

            <OrdersMobileList
              orders={orders.paginatedOrders}
              onView={(order) => orders.openModal("details", order)}
              onEdit={(order) => orders.openModal("form", order)}
              onScheduleDelivery={(order) => orders.openModal("delivery", order)}
              onScheduleRecurringOrder={(order) => orders.openModal("recurring", order)}
              onDeactivateRecurringOrder={orders.deactivateRecurring}
              onViewDeliveries={(order) => orders.openModal("deliveries", order)}
              onDownloadCounterReceipt={orders.downloadCounterReceipt}
              onDownloadPdf={orders.downloadOrderPdf}
              onOpenInvoice={(order) => orders.openModal("invoice", order)}
              onCancel={orders.cancelSelectedOrder}
              onRestore={orders.restoreSelectedOrder}
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
    </section>
  );
}
