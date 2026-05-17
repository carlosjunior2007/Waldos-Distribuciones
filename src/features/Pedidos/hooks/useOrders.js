import { useEffect, useMemo, useState } from "react";
import { ITEMS_PER_PAGE } from "../order.constants";
import {
  cancelOrder,
  restoreOrder,
  deactivateRecurringOrderRule,
  createDelivery,
  deleteDelivery,
  createOrder,
  fetchOrderClients,
  fetchOrderProducts,
  fetchOrders,
  saveRecurringOrderRule,
  updateDelivery,
  updateOrder,
  updateOrderInvoiceDraft,
  stampOrderInvoiceSandbox,
  downloadInvoiceDocumentSandbox,
  cancelInvoiceSandbox,
  deleteLocalInvoiceRecord,
  sendInvoiceEmailSandbox,
} from "../services/pedidos.service";
import { calculateDerivedOrderStatus, calculateOrderProfit, isOrderProfitRealized } from "../order.helpers";
import { generateDeliveryReceiptPDF, generateOrderPDF } from "../services/orderDocuments.service";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [operationLabel, setOperationLabel] = useState("");
  const [operationFeedback, setOperationFeedback] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  async function loadCatalogs() {
    const [nextClients, nextProducts] = await Promise.all([
      fetchOrderClients(),
      fetchOrderProducts(),
    ]);
    setClients(nextClients);
    setProducts(nextProducts);
  }

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await fetchOrders();
      setOrders(data);
      setSelectedOrder((current) => {
        if (!current) return current;
        return data.find((item) => item.id === current.id) || current;
      });
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadCatalogs(), loadOrders()]);
  }

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!operationFeedback) return undefined;

    const timer = window.setTimeout(() => {
      setOperationFeedback(null);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [operationFeedback]);

  async function runOperation(label, callback, successMessage) {
    try {
      setSaving(true);
      setOperationLabel(label);
      const result = await callback();

      if (successMessage) {
        setOperationFeedback({ type: "success", message: successMessage });
      }

      return result;
    } finally {
      setSaving(false);
      setOperationLabel("");
    }
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  function openModal(nextModal, order = null, delivery = null) {
    setSelectedOrder(order);
    setSelectedDelivery(delivery);
    setModal(nextModal);
  }

  function closeModal() {
    setModal(null);
    setSelectedOrder(null);
    setSelectedDelivery(null);
  }

  async function saveOrder(payload) {
    const isEdit = Boolean(payload.id);

    try {
      await runOperation(
        isEdit ? "Guardando cambios del pedido..." : "Creando pedido...",
        async () => {
          const saved = isEdit
            ? await updateOrder(payload.id, payload)
            : await createOrder(payload);

          await loadOrders();
          setSelectedOrder(saved);
          closeModal();
        },
        isEdit ? "Pedido actualizado." : "Pedido creado.",
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar el pedido.");
    }
  }

  async function saveDelivery(payload) {
    const isEdit = Boolean(payload.delivery?.id);

    try {
      await runOperation(
        isEdit ? "Actualizando entrega..." : "Creando entrega...",
        async () => {
          const updated = isEdit
            ? await updateDelivery(payload)
            : await createDelivery(payload);

          await loadOrders();
          setSelectedOrder(updated);
          closeModal();
        },
        isEdit ? "Entrega actualizada." : "Entrega creada.",
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar la entrega.");
    }
  }

  async function removeDelivery(order, delivery) {
    if (!order?.id || !delivery?.id) return;
    const ok = window.confirm(`¿Eliminar la entrega ${delivery.folio}? Se regresarán las cantidades al pedido.`);
    if (!ok) return;

    try {
      await runOperation(
        "Eliminando entrega y regresando cantidades...",
        async () => {
          const updated = await deleteDelivery({ orderId: order.id, delivery });
          await loadOrders();
          setSelectedOrder(updated);
          setModal("deliveries");
        },
        "Entrega eliminada y cantidades actualizadas.",
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo eliminar la entrega.");
    }
  }

  async function saveRecurring(payload) {
    try {
      await runOperation(
        "Guardando recurrencia...",
        async () => {
          await saveRecurringOrderRule(payload);
          await loadOrders();
          closeModal();
        },
        "Recurrencia guardada.",
      );
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "No se pudo guardar la recurrencia. Revisa que existan las tablas pedido_recurrencias y pedido_recurrencia_productos.",
      );
    }
  }

  async function deactivateRecurring(order) {
    if (!order?.id) return;
    const ok = window.confirm(`¿Desprogramar recurrencia del pedido ${order.folio}?`);
    if (!ok) return;

    try {
      await runOperation(
        "Desprogramando recurrencia...",
        async () => {
          await deactivateRecurringOrderRule(order.id);
          await loadOrders();
        },
        "Recurrencia desprogramada.",
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo desprogramar la recurrencia.");
    }
  }


  async function saveInvoiceDraft(payload) {
    try {
      const updated = await runOperation(
        "Guardando datos fiscales...",
        async () => {
          const saved = await updateOrderInvoiceDraft({
            orderId: payload.order?.id,
            clientId: payload.order?.cliente_id,
            values: payload.values,
          });
          await loadCatalogs();
          await loadOrders();
          setSelectedOrder(saved);
          setModal("invoice");
          return saved;
        },
        "Datos fiscales actualizados.",
      );

      return updated;
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron guardar los datos fiscales.");
      throw error;
    }
  }



  async function stampInvoiceSandbox(payload) {
    try {
      const result = await runOperation(
        "Timbrando factura en Facturama sandbox...",
        async () => {
          const stamped = await stampOrderInvoiceSandbox({
            orderId: payload.order?.id,
            invoiceData: payload.invoiceData,
          });
          await loadOrders();
          setModal("invoice");
          return stamped;
        },
        "Factura timbrada en sandbox.",
      );

      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }


  async function downloadInvoicePdf(order) {
    try {
      await runOperation(
        "Descargando PDF de Facturama...",
        async () => {
          await downloadInvoiceDocumentSandbox({ orderId: order?.id, format: "pdf" });
        },
        "PDF descargado.",
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function downloadInvoiceXml(order) {
    try {
      await runOperation(
        "Descargando XML de Facturama...",
        async () => {
          await downloadInvoiceDocumentSandbox({ orderId: order?.id, format: "xml" });
        },
        "XML descargado.",
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }


  async function sendInvoiceEmail(payload) {
    try {
      const result = await runOperation(
        "Enviando factura por correo...",
        async () => {
          const response = await sendInvoiceEmailSandbox({
            orderId: payload.order?.id,
            email: payload.email,
          });
          await loadOrders();
          setModal("invoice");
          return response;
        },
        "Factura enviada por correo.",
      );

      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function cancelInvoiceSandboxAction(payload) {
    try {
      const result = await runOperation(
        "Cancelando CFDI en Facturama sandbox...",
        async () => {
          const response = await cancelInvoiceSandbox({
            orderId: payload.order?.id,
            reason: payload.reason,
            replacementUuid: payload.replacementUuid,
          });
          await loadOrders();
          setModal("invoice");
          return response;
        },
        "CFDI cancelado en sandbox.",
      );

      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function deleteLocalInvoice({ order, invoice }) {
    try {
      const updated = await runOperation(
        "Eliminando solo la factura seleccionada del historial...",
        async () => {
          const saved = await deleteLocalInvoiceRecord({ orderId: order?.id, invoiceId: invoice?.id });
          await loadOrders();
          setSelectedOrder(saved);
          setModal("invoice");
          return saved;
        },
        "Factura eliminada del historial.",
      );

      return updated;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function cancelSelectedOrder(order) {
    if (!order?.id) return;
    const ok = window.confirm(`¿Cancelar el pedido ${order.folio}?`);
    if (!ok) return;

    try {
      await runOperation(
        "Cancelando pedido...",
        async () => {
          await cancelOrder(order.id);
          await loadOrders();
        },
        "Pedido cancelado.",
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo cancelar el pedido.");
    }
  }

  async function restoreSelectedOrder(order) {
    if (!order?.id) return;
    const ok = window.confirm(`¿Descancelar el pedido ${order.folio}?`);
    if (!ok) return;

    try {
      await runOperation(
        "Reactivando pedido...",
        async () => {
          await restoreOrder(order.id);
          await loadOrders();
        },
        "Pedido reactivado.",
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo descancelar el pedido.");
    }
  }

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const status = calculateDerivedOrderStatus(order);
      const matchesStatus = statusFilter === "todos" || status === statusFilter;
      const matchesSearch =
        !term ||
        [
          order.folio,
          order.tracking_token,
          order.cliente_nombre,
          order.cliente_email,
          order.cliente_telefono,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(Math.ceil(totalItems / ITEMS_PER_PAGE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += 1;
        acc.monto += Number(order.total || 0);
        const profit = calculateOrderProfit(order.details);
        const status = calculateDerivedOrderStatus(order);
        if (isOrderProfitRealized(order)) {
          acc.costo += profit.cost;
          acc.ganancia += profit.profit;
        }
        if (status === "creado" || status === "borrador") acc.creados += 1;
        if (status === "parcial") acc.parciales += 1;
        if (status === "entregado") acc.entregados += 1;
        if (String(order.estado_pago || "").toLowerCase() !== "pagado") acc.pendientesPago += 1;
        return acc;
      },
      { total: 0, creados: 0, parciales: 0, entregados: 0, pendientesPago: 0, monto: 0, costo: 0, ganancia: 0 },
    );
  }, [orders]);

  function downloadOrderPdf(order) {
    if (!order) return;
    generateOrderPDF(order);
  }

  function downloadCounterReceipt(order, delivery = null) {
    if (!order) return;
    generateDeliveryReceiptPDF(order, delivery);
  }

  return {
    orders,
    clients,
    products,
    loading,
    saving,
    operationLabel,
    operationFeedback,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    startItem: totalItems ? startIndex + 1 : 0,
    endItem: Math.min(startIndex + ITEMS_PER_PAGE, totalItems),
    filteredOrders,
    paginatedOrders,
    stats,
    modal,
    selectedOrder,
    selectedDelivery,
    openModal,
    closeModal,
    saveOrder,
    saveDelivery,
    removeDelivery,
    saveRecurring,
    saveInvoiceDraft,
    stampInvoiceSandbox,
    downloadInvoicePdf,
    downloadInvoiceXml,
    sendInvoiceEmail,
    cancelInvoiceSandbox: cancelInvoiceSandboxAction,
    deleteLocalInvoice,
    deactivateRecurring,
    cancelSelectedOrder,
    restoreSelectedOrder,
    refreshAll,
    downloadOrderPdf,
    downloadCounterReceipt,
    goToPreviousPage: () => setCurrentPage((page) => Math.max(page - 1, 1)),
    goToNextPage: () => setCurrentPage((page) => Math.min(page + 1, totalPages)),
  };
}
