import { useMemo, useState } from "react";
import { ITEMS_PER_PAGE } from "../order.constants";

const now = new Date();

function addDays(days) {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

const BASE_ORDER = {
  id: "order-001",
  folio: "PED-2026-05-001",
  cotizacion_id: "quote-001",
  cliente_nombre: "Francisco Gutierrez Mercado",
  cliente_telefono: "664 111 2233",
  cliente_email: "francisco@email.com",
  subtotal: 9173.21,
  descuento: 0,
  iva_porcentaje: 8,
  total: 9907.07,
  estado: "parcial",
  estado_pago: "pendiente",
  metodo_pago: "Transferencia",
  fecha_emision: addDays(-2),
  entrega_inicio: addDays(1),
  entrega_fin: addDays(5),
  notas: "Cliente solicita entregas por dirección.",
  tracking_token: "TRK-WAL-26-0001",
  addresses: [
    {
      id: "addr-001",
      nombre: "Sucursal Centro",
      direccion: "Av. Revolución 1200",
      ciudad: "Tijuana",
      estado: "Baja California",
      codigo_postal: "22000",
      pais: "México",
      contacto_nombre: "María López",
      contacto_telefono: "664 555 0101",
      principal: true,
      notas: "Entregar por acceso lateral.",
    },
    {
      id: "addr-002",
      nombre: "Sucursal Otay",
      direccion: "Blvd. Industrial 450",
      ciudad: "Tijuana",
      estado: "Baja California",
      codigo_postal: "22430",
      pais: "México",
      contacto_nombre: "Carlos Méndez",
      contacto_telefono: "664 555 0102",
      principal: false,
      notas: "Recibe almacén.",
    },
  ],
  details: [
    {
      id: "detail-001",
      producto_id: "product-001",
      codigo: "WAL-30E045",
      nombre_producto: "Ácido Muriático 3.78 Galón",
      cantidad_pedida: 20,
      cantidad_entregada: 8,
      cantidad_pendiente: 12,
      precio_unitario: 100,
      costo_unitario: 70,
      importe: 2000,
      estado: "parcial",
    },
    {
      id: "detail-002",
      producto_id: "product-002",
      codigo: "WAL-6389AB",
      nombre_producto: "Aromatizante Aerosol Lysol Air Brisa Lig 10z",
      cantidad_pedida: 40,
      cantidad_entregada: 20,
      cantidad_pendiente: 20,
      precio_unitario: 120.63,
      costo_unitario: 96.5,
      importe: 4825.2,
      estado: "parcial",
    },
    {
      id: "detail-003",
      producto_id: "product-003",
      codigo: "WAL-7711AA",
      nombre_producto: "Bolsa Negra 55 Gal",
      cantidad_pedida: 10,
      cantidad_entregada: 0,
      cantidad_pendiente: 10,
      precio_unitario: 234.8,
      costo_unitario: 180,
      importe: 2348,
      estado: "pendiente",
    },
  ],
  deliveries: [
    {
      id: "delivery-001",
      folio: "ENT-2026-05-001",
      pedido_id: "order-001",
      estado: "entregada",
      fecha_entrega: addDays(-1),
      recibido_por: "María López",
      notas: "Primera entrega parcial.",
      direccion_entrega_id: "addr-001",
      details: [
        {
          pedido_detalle_id: "detail-001",
          producto_id: "product-001",
          nombre_producto: "Ácido Muriático 3.78 Galón",
          cantidad_entregada: 8,
        },
        {
          pedido_detalle_id: "detail-002",
          producto_id: "product-002",
          nombre_producto: "Aromatizante Aerosol Lysol Air Brisa Lig 10z",
          cantidad_entregada: 20,
        },
      ],
      contraRecibo: {
        folio: "CR-2026-05-001",
        estado: "pendiente",
        monto: 3212.6,
      },
    },
  ],
};

const MOCK_ORDERS = Array.from({ length: 19 }).map((_, index) => {
  const n = index + 1;
  const status = ["creado", "parcial", "entregado"][index % 3];

  return {
    ...BASE_ORDER,
    id: `order-${String(n).padStart(3, "0")}`,
    folio: `PED-2026-05-${String(n).padStart(3, "0")}`,
    cliente_nombre:
      index === 0
        ? BASE_ORDER.cliente_nombre
        : index % 2 === 0
          ? `Cliente de prueba ${n}`
          : `Empresa ejemplo ${n}`,
    cliente_email:
      index === 0 ? BASE_ORDER.cliente_email : `cliente${n}@demo.com`,
    cliente_telefono:
      index === 0
        ? BASE_ORDER.cliente_telefono
        : `664 555 ${String(1000 + n)}`,
    estado: index === 0 ? "parcial" : status,
    estado_pago: index % 4 === 0 ? "pagado" : "pendiente",
    tracking_token: `TRK-WAL-26-${String(n).padStart(4, "0")}`,
    entrega_inicio: addDays(index + 1),
    entrega_fin: addDays(index + 4),
  };
});

export function useOrdersMock() {
  const [orders] = useState(MOCK_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [modal, setModal] = useState(null);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "todos" ? true : order.estado === statusFilter;

      const matchesSearch =
        !term ||
        [order.folio, order.cliente_nombre, order.cliente_email, order.cliente_telefono]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ITEMS_PER_PAGE),
  );

  const paginatedOrders = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage, totalPages]);

  const startItem =
    filteredOrders.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      creados: orders.filter((order) => order.estado === "creado").length,
      parciales: orders.filter((order) => order.estado === "parcial").length,
      entregados: orders.filter((order) => order.estado === "entregado").length,
      pendientesPago: orders.filter((order) => order.estado_pago === "pendiente").length,
    };
  }, [orders]);

  function updateSearch(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function updateStatusFilter(value) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function openModal(type, order = null, delivery = null) {
    setSelectedOrder(order);
    setSelectedDelivery(delivery);
    setModal(type);
  }

  function closeModal() {
    setSelectedOrder(null);
    setSelectedDelivery(null);
    setModal(null);
  }

  function downloadCounterReceipt(order, delivery = null) {
    alert(
      `Aquí se descargaría el contra recibo de ${
        delivery?.folio || order?.folio || "la entrega"
      }.`,
    );
  }

  function downloadOrderPdf(order) {
    alert(`Aquí se descargaría el PDF del pedido ${order?.folio}.`);
  }

  return {
    orders,
    filteredOrders,
    paginatedOrders,
    stats,

    search,
    setSearch: updateSearch,
    statusFilter,
    setStatusFilter: updateStatusFilter,

    currentPage,
    totalPages,
    startItem,
    endItem,
    totalItems: filteredOrders.length,
    goToPreviousPage: () => setCurrentPage((prev) => Math.max(prev - 1, 1)),
    goToNextPage: () =>
      setCurrentPage((prev) => Math.min(prev + 1, totalPages)),

    selectedOrder,
    selectedDelivery,
    modal,
    openModal,
    closeModal,

    downloadCounterReceipt,
    downloadOrderPdf,
  };
}
