import { useEffect, useMemo, useState } from "react";
import { ITEMS_PER_PAGE } from "../order.constants";
import {
  cancelOrder,
  restoreOrder,
  deleteCancelledOrder,
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
import { calculateDerivedOrderStatus, calculateOrderRealProfit, isOrderProfitRealized } from "../order.helpers";
import { generateDeliveryReceiptPDF, generateOrderPDF, generateOrderSuppliersPDF } from "../services/orderDocuments.service";
import { createClient } from "../../clients/services/clients.service";
import { createProduct as createCatalogProduct, getCurrentUserId } from "../../products/services/products.service";
import { generarCodigoProducto } from "../../../utils/CodeGenerator";
import { generateUUID } from "../../products/product.helpers";

function getReadableError(error) {
  if (!error) return "Error desconocido.";
  if (typeof error === "string") return error;
  return error.message || error.details || error.hint || "Intenta de nuevo.";
}

function getOrderMonthValue(order) {
  const sourceDate =
    order?.fecha_emision ||
    order?.created_at ||
    order?.entrega_inicio ||
    order?.fecha_inicio;

  if (!sourceDate) return "";

  const date = new Date(sourceDate);
  if (Number.isNaN(date.getTime())) return String(sourceDate).slice(0, 7);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthValue) {
  if (!monthValue || monthValue === "todos") return "Todos los meses";

  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  return date.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
}

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
  const [monthFilter, setMonthFilter] = useState("todos");
  const [paymentFilter, setPaymentFilter] = useState("todos");
  const [quotationFilter, setQuotationFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [deleteOrderDialog, setDeleteOrderDialog] = useState({
    open: false,
    order: null,
    blocked: false,
    message: "",
  });
  const [messageDialog, setMessageDialog] = useState({
    open: false,
    title: "",
    message: "",
    tone: "error",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: "",
    title: "",
    message: "",
    confirmLabel: "",
    danger: false,
    order: null,
    delivery: null,
  });

  async function loadCatalogs() {
    const [nextClients, nextProducts] = await Promise.all([
      fetchOrderClients(),
      fetchOrderProducts(),
    ]);
    setClients(nextClients);
    setProducts(nextProducts);
    return { clients: nextClients, products: nextProducts };
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
      showMessageDialog("No se pudieron cargar los pedidos", getReadableError(error));
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
  }, [search, statusFilter, monthFilter, paymentFilter, quotationFilter]);

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

  async function quickCreateClient(values = {}) {
    const nombre = String(values.nombre || "").trim();

    if (!nombre) {
      throw new Error("Escribe el nombre del cliente.");
    }

    const saved = await runOperation(
      "Creando cliente sin cerrar el pedido...",
      async () => {
        const created = await createClient({
          nombre,
          razon_social: values.razon_social?.trim() || null,
          rfc: values.rfc?.trim().toUpperCase() || null,
          numero: values.numero?.trim() || null,
          correo: values.correo?.trim() || null,
          direccion: values.direccion?.trim() || null,
          ciudad: values.ciudad?.trim() || null,
          estado: values.estado?.trim() || null,
          codigo_postal: values.codigo_postal?.trim() || null,
          pais: values.pais?.trim() || "México",
          notas: values.notas?.trim() || null,
        });

        const nextClients = await fetchOrderClients();
        setClients(nextClients);

        return nextClients.find((client) => client.id === created.id) || created;
      },
      "Cliente creado. Puedes seguir capturando el pedido.",
    );

    return saved;
  }

  async function quickCreateProduct(values = {}) {
    const nombre = String(values.nombre || "").trim();
    const precio = Number(values.precio || 0);

    if (!nombre) {
      throw new Error("Escribe el nombre del producto.");
    }

    if (!Number.isFinite(precio) || precio < 0) {
      throw new Error("Escribe un precio de venta válido.");
    }

    const saved = await runOperation(
      "Creando producto sin cerrar el pedido...",
      async () => {
        const productId = generateUUID();
        const userId = await getCurrentUserId();
        const codigo = generarCodigoProducto(productId);
        const now = new Date().toISOString();

        await createCatalogProduct({
          id: productId,
          nombre,
          descripcion: values.descripcion?.trim() || nombre,
          precio,
          precio_compra: Number(values.precio_compra || 0),
          cantidad_caja: Number(values.cantidad_caja || 1),
          habilitado: true,
          categoria: values.categoria || "otros",
          unidad: values.unidad || "pieza",
          codigo,
          clave_sat: values.clave_sat?.trim() || null,
          clave_unidad_sat: values.clave_unidad_sat?.trim() || null,
          iva_porcentaje: Number(values.iva_porcentaje || 8),
          modified_by: userId,
          created_by: userId,
          updated_at: now,
          created_at: now,
        });

        const nextProducts = await fetchOrderProducts();
        setProducts(nextProducts);

        return nextProducts.find((product) => product.id === productId) || {
          id: productId,
          nombre,
          descripcion: values.descripcion?.trim() || nombre,
          precio,
          precio_compra: Number(values.precio_compra || 0),
          cantidad_caja: Number(values.cantidad_caja || 1),
          codigo,
          iva_porcentaje: Number(values.iva_porcentaje || 8),
          habilitado: true,
        };
      },
      "Producto creado. Puedes seguir capturando el pedido.",
    );

    return saved;
  }

  function closeDeleteOrderDialog() {
    setDeleteOrderDialog({
      open: false,
      order: null,
      blocked: false,
      message: "",
    });
  }

  function showMessageDialog(title, message, tone = "error") {
    setMessageDialog({
      open: true,
      title,
      message,
      tone,
    });
  }

  function closeMessageDialog() {
    setMessageDialog({
      open: false,
      title: "",
      message: "",
      tone: "error",
    });
  }

  function openConfirmDialog(config) {
    setConfirmDialog({
      open: true,
      type: "",
      title: "",
      message: "",
      confirmLabel: "Confirmar",
      danger: false,
      order: null,
      delivery: null,
      ...config,
    });
  }

  function closeConfirmDialog() {
    setConfirmDialog({
      open: false,
      type: "",
      title: "",
      message: "",
      confirmLabel: "",
      danger: false,
      order: null,
      delivery: null,
    });
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
      showMessageDialog("No se pudo guardar el pedido", getReadableError(error));
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
      showMessageDialog("No se pudo guardar la entrega", getReadableError(error));
    }
  }

  function removeDelivery(order, delivery) {
    if (!order?.id || !delivery?.id) return;

    openConfirmDialog({
      type: "deleteDelivery",
      title: "Eliminar entrega",
      message: `¿Eliminar la entrega ${delivery.folio}? Se regresarán las cantidades al pedido.`,
      confirmLabel: "Sí, eliminar entrega",
      danger: true,
      order,
      delivery,
    });
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
      showMessageDialog(
        "No se pudo guardar la recurrencia",
        error.message ||
          "Revisa que existan las tablas pedido_recurrencias y pedido_recurrencia_productos.",
      );
    }
  }

  function deactivateRecurring(order) {
    if (!order?.id) return;

    openConfirmDialog({
      type: "deactivateRecurring",
      title: "Desprogramar recurrencia",
      message: `¿Desprogramar la recurrencia del pedido ${order.folio}?`,
      confirmLabel: "Sí, desprogramar",
      danger: true,
      order,
    });
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
      showMessageDialog("No se pudieron guardar los datos fiscales", getReadableError(error));
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

  function cancelSelectedOrder(order) {
    if (!order?.id) return;

    openConfirmDialog({
      type: "cancelOrder",
      title: "Cancelar pedido",
      message: `¿Cancelar el pedido ${order.folio}?`,
      confirmLabel: "Sí, cancelar pedido",
      danger: true,
      order,
    });
  }

  function restoreSelectedOrder(order) {
    if (!order?.id) return;

    openConfirmDialog({
      type: "restoreOrder",
      title: "Descancelar pedido",
      message: `¿Descancelar el pedido ${order.folio}?`,
      confirmLabel: "Sí, descancelar",
      danger: false,
      order,
    });
  }


  function requestDeleteCancelledOrder(order) {
    if (!order?.id) return;

    const quotationExists = Boolean(order.quotation?.id);

    if (order.cotizacion_id && quotationExists) {
      setDeleteOrderDialog({
        open: true,
        order,
        blocked: true,
        message:
          "No se puede eliminar este pedido porque todavía está enlazado a una cotización existente. Conserva el registro para no romper el historial.",
      });
      return;
    }

    setDeleteOrderDialog({
      open: true,
      order,
      blocked: false,
      message:
        "Esta acción borrará permanentemente el pedido y sus registros relacionados. No se puede deshacer.",
    });
  }

  async function confirmDeleteCancelledOrder() {
    const order = deleteOrderDialog.order;
    if (!order?.id || deleteOrderDialog.blocked) return;

    try {
      await runOperation(
        "Eliminando pedido cancelado...",
        async () => {
          await deleteCancelledOrder(order.id);
          await loadOrders();
          closeDeleteOrderDialog();
          closeModal();
        },
        "Pedido eliminado.",
      );
    } catch (error) {
      console.error(error);
      setDeleteOrderDialog((current) => ({
        ...current,
        open: true,
        blocked: true,
        message: error.message || "No se pudo eliminar el pedido.",
      }));
    }
  }

  async function confirmGenericAction() {
    const { type, order, delivery } = confirmDialog;
    if (!type) return;

    closeConfirmDialog();

    try {
      if (type === "deleteDelivery") {
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
        return;
      }

      if (type === "deactivateRecurring") {
        await runOperation(
          "Desprogramando recurrencia...",
          async () => {
            await deactivateRecurringOrderRule(order.id);
            await loadOrders();
          },
          "Recurrencia desprogramada.",
        );
        return;
      }

      if (type === "cancelOrder") {
        await runOperation(
          "Cancelando pedido...",
          async () => {
            await cancelOrder(order.id);
            await loadOrders();
          },
          "Pedido cancelado.",
        );
        return;
      }

      if (type === "restoreOrder") {
        await runOperation(
          "Reactivando pedido...",
          async () => {
            await restoreOrder(order.id);
            await loadOrders();
          },
          "Pedido reactivado.",
        );
      }
    } catch (error) {
      console.error(error);
      const fallback = {
        deleteDelivery: "No se pudo eliminar la entrega.",
        deactivateRecurring: "No se pudo desprogramar la recurrencia.",
        cancelOrder: "No se pudo cancelar el pedido.",
        restoreOrder: "No se pudo descancelar el pedido.",
      };

      showMessageDialog(
        "No se pudo completar la acción",
        error.message || fallback[type] || "Intenta de nuevo.",
      );
    }
  }

  const monthOptions = useMemo(() => {
    const uniqueMonths = Array.from(
      new Set(orders.map((order) => getOrderMonthValue(order)).filter(Boolean)),
    ).sort((a, b) => b.localeCompare(a));

    return [
      { value: "todos", label: "Todos los meses" },
      ...uniqueMonths.map((month) => ({
        value: month,
        label: formatMonthLabel(month),
      })),
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const status = calculateDerivedOrderStatus(order);
      const orderMonth = getOrderMonthValue(order);
      const paymentStatus = String(order.estado_pago || "").toLowerCase();
      const hasQuotation = Boolean(order.cotizacion_id || order.quotation?.id);

      const matchesStatus = statusFilter === "todos" || status === statusFilter;
      const matchesMonth = monthFilter === "todos" || orderMonth === monthFilter;
      const matchesPayment =
        paymentFilter === "todos" || paymentStatus === paymentFilter;
      const matchesQuotation =
        quotationFilter === "todos" ||
        (quotationFilter === "con_cotizacion" && hasQuotation) ||
        (quotationFilter === "sin_cotizacion" && !hasQuotation);

      const matchesSearch =
        !term ||
        [
          order.folio,
          order.tracking_token,
          order.cliente_nombre,
          order.cliente_email,
          order.cliente_telefono,
          order.quotation?.folio,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return (
        matchesStatus &&
        matchesMonth &&
        matchesPayment &&
        matchesQuotation &&
        matchesSearch
      );
    });
  }, [orders, search, statusFilter, monthFilter, paymentFilter, quotationFilter]);

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
        const realProfit = calculateOrderRealProfit(order);
        const status = calculateDerivedOrderStatus(order);
        if (isOrderProfitRealized(order)) {
          acc.costo += realProfit.realCost;
          acc.ganancia += realProfit.collectedProfit;
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

  function downloadOrderSuppliersPdf(order) {
    if (!order) return;

    try {
      generateOrderSuppliersPDF(order);
    } catch (error) {
      console.error("Error al generar PDF de proveedores:", error);
      showMessageDialog(
        "No se pudo generar el PDF de proveedores",
        error.message || "Revisa que el pedido tenga productos y proveedores asociados.",
      );
    }
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
    monthFilter,
    setMonthFilter,
    monthOptions,
    paymentFilter,
    setPaymentFilter,
    quotationFilter,
    setQuotationFilter,
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
    quickCreateClient,
    quickCreateProduct,
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
    requestDeleteCancelledOrder,
    confirmDeleteCancelledOrder,
    closeDeleteOrderDialog,
    deleteOrderDialog,
    messageDialog,
    closeMessageDialog,
    confirmDialog,
    closeConfirmDialog,
    confirmGenericAction,
    refreshAll,
    downloadOrderPdf,
    downloadOrderSuppliersPdf,
    downloadCounterReceipt,
    goToPreviousPage: () => setCurrentPage((page) => Math.max(page - 1, 1)),
    goToNextPage: () => setCurrentPage((page) => Math.min(page + 1, totalPages)),
  };
}
