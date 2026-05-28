import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CircleDollarSign,
  Clock3,
  ReceiptText,
  Truck,
  Wallet,
} from "lucide-react";

import { formatMoney } from "../../../utils/formatters";

import { fetchDashboardData } from "../services/dashboard.service";
import {
  buildExpenseMovement,
  buildProductMovement,
  buildQuotationMovement,
  buildOrderMovement,
  calculateDashboardSummary,
  getLatestMovements,
  getRangeDates,
  groupByPeriod,
  isBetween,
} from "../dashboard.helpers";

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [range, setRange] = useState("month");
  const [reloadKey, setReloadKey] = useState(0);

  const [cotizaciones, setCotizaciones] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoDetalles, setPedidoDetalles] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [productos, setProductos] = useState([]);

  const [selectedMovement, setSelectedMovement] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchDashboardData();

        if (!mounted) return;

        setCotizaciones(data.cotizaciones);
        setPedidos(data.pedidos);
        setPedidoDetalles(data.pedidoDetalles);
        setEntregas(data.entregas);
        setGastos(data.gastos);
        setProductos(data.productos);
      } catch (err) {
        console.error("Error cargando dashboard:", err);

        if (mounted) {
          setError(err.message || "No se pudo cargar el dashboard.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const rangeDates = useMemo(() => getRangeDates(range), [range]);

  const filteredData = useMemo(() => {
    const { start, end } = rangeDates;

    const filteredCotizaciones = cotizaciones.filter((item) =>
      isBetween(item.created_at, start, end),
    );

    const filteredPedidos = pedidos.filter((item) =>
      isBetween(item.created_at, start, end),
    );

    const filteredEntregas = entregas.filter((item) =>
      isBetween(item.fecha_entrega || item.created_at, start, end),
    );

    const filteredGastos = gastos.filter((item) =>
      isBetween(item.fecha || item.created_at, start, end),
    );

    const filteredProductos =
      range === "all"
        ? productos
        : productos.filter((item) => isBetween(item.created_at, start, end));

    return {
      cotizaciones: filteredCotizaciones,
      pedidos: filteredPedidos,
      entregas: filteredEntregas,
      gastos: filteredGastos,
      productos: filteredProductos,
    };
  }, [cotizaciones, pedidos, entregas, gastos, productos, range, rangeDates]);

  const resumen = useMemo(() => {
    return calculateDashboardSummary({
      filteredData,
      productos,
      pedidoDetalles,
    });
  }, [filteredData, productos, pedidoDetalles]);

  const stats = useMemo(
    () => [
      {
        title: "Ganancia neta",
        value: formatMoney(resumen.gananciaNetaReal),
        note: "Solo pedidos entregados y pagados, menos gastos",
        icon: CircleDollarSign,
        tone: resumen.gananciaNetaReal >= 0 ? "success" : "error",
      },
      {
        title: "Ventas realizadas",
        value: formatMoney(resumen.ventaTotalCompletada),
        note: "Pedidos entregados y pagados",
        icon: ReceiptText,
        tone: "info",
      },
      {
        title: "Pedidos pendientes",
        value: String(resumen.pedidosPendientes),
        note: `${resumen.unidadesPendientes} unidades por entregar`,
        icon: Clock3,
        tone: "warning",
      },
      {
        title: "Entregas pendientes",
        value: String(resumen.entregasPendientes),
        note: "Programadas, pendientes o en ruta",
        icon: Truck,
        tone: "warning",
      },
      {
        title: "Pagos pendientes",
        value: String(resumen.pagosPendientes),
        note: `${formatMoney(resumen.valorPendienteCobro)} por cobrar`,
        icon: AlertCircle,
        tone: "error",
      },
      {
        title: "Gastos",
        value: formatMoney(resumen.gastoTotal),
        note: "Gastos registrados dentro del rango",
        icon: Wallet,
        tone: "primary",
      },
    ],
    [resumen],
  );

  const recentActivity = useMemo(() => {
    return [
      ...getLatestMovements(filteredData.pedidos, buildOrderMovement),
      ...getLatestMovements(filteredData.cotizaciones, buildQuotationMovement),
      ...getLatestMovements(filteredData.gastos, buildExpenseMovement),
      ...getLatestMovements(filteredData.productos, buildProductMovement),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredData]);

  const periodData = useMemo(
    () =>
      groupByPeriod({
        cotizaciones: filteredData.cotizaciones,
        pedidos: filteredData.pedidos,
        pedidoDetalles,
        gastos: filteredData.gastos,
        range,
      }),
    [filteredData, pedidoDetalles, range],
  );

  const quotationChartData = useMemo(
    () =>
      periodData.map((item) => ({
        label: item.label,
        value: item.cotizaciones,
      })),
    [periodData],
  );

  const financeChartData = useMemo(
    () =>
      periodData.map((item) => ({
        label: item.label,
        ganancias: item.ganancias,
        gastos: item.gastos,
        neto: item.neto,
      })),
    [periodData],
  );

  function clearError() {
    setError("");
  }

  function retryLoad() {
    setReloadKey((prev) => prev + 1);
  }

  return {
    loading,
    error,
    clearError,
    retryLoad,

    range,
    setRange,

    resumen,
    stats,
    recentActivity,
    quotationChartData,
    financeChartData,

    selectedMovement,
    setSelectedMovement,
  };
}
