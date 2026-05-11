import { Package } from "lucide-react";

import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";

import { useOrdersMock } from "../hooks/useOrdersMock";

import OrdersStats from "../components/OrdersStats";
import OrdersToolbar from "../components/OrdersToolbar";
import OrdersTable from "../components/OrdersTable";
import OrdersMobileList from "../components/OrdersMobileList";
import OrdersPagination from "../components/OrdersPagination";
import OrderDetailsModal from "../components/OrderDetailsModal";
import OrderFormModal from "../components/OrderFormModal";
import DeliveryFormModal from "../components/DeliveryFormModal";
import DeliveriesModal from "../components/DeliveriesModal";
import DeliveryAddressModal from "../components/DeliveryAddressModal";

export default function PedidosPage() {
  const orders = useOrdersMock();

  return (
    <section className="space-y-6">
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
        onClose={orders.closeModal}
      />

      <DeliveryFormModal
        open={orders.modal === "delivery"}
        order={orders.selectedOrder}
        onClose={orders.closeModal}
      />

      <DeliveriesModal
        open={orders.modal === "deliveries"}
        order={orders.selectedOrder}
        onClose={orders.closeModal}
        onScheduleDelivery={(order) => orders.openModal("delivery", order)}
        onDownloadCounterReceipt={orders.downloadCounterReceipt}
      />

      <DeliveryAddressModal
        open={orders.modal === "addresses"}
        order={orders.selectedOrder}
        onClose={orders.closeModal}
      />

      <OrdersStats stats={orders.stats} />

      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <PageHeader
          eyebrow="Gestión operativa"
          title="Pedidos"
          description="Administra pedidos, entregas parciales, direcciones, contra recibos y seguimiento interno."
        />

        <OrdersToolbar
          search={orders.search}
          setSearch={orders.setSearch}
          statusFilter={orders.statusFilter}
          setStatusFilter={orders.setStatusFilter}
          onCreateManualOrder={() => orders.openModal("form")}
        />

        {orders.filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay pedidos para mostrar"
            description="Cambia los filtros o crea un pedido manual."
            className="min-h-[260px]"
          />
        ) : (
          <>
            <OrdersTable
              orders={orders.paginatedOrders}
              onView={(order) => orders.openModal("details", order)}
              onEdit={(order) => orders.openModal("form", order)}
              onScheduleDelivery={(order) => orders.openModal("delivery", order)}
              onViewDeliveries={(order) => orders.openModal("deliveries", order)}
              onDownloadCounterReceipt={orders.downloadCounterReceipt}
              onDownloadPdf={orders.downloadOrderPdf}
            />

            <OrdersMobileList
              orders={orders.paginatedOrders}
              onView={(order) => orders.openModal("details", order)}
              onEdit={(order) => orders.openModal("form", order)}
              onScheduleDelivery={(order) => orders.openModal("delivery", order)}
              onViewDeliveries={(order) => orders.openModal("deliveries", order)}
              onDownloadCounterReceipt={orders.downloadCounterReceipt}
              onDownloadPdf={orders.downloadOrderPdf}
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
        )}
      </section>
    </section>
  );
}
