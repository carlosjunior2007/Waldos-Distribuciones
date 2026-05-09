import { useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  ReceiptText,
  Package,
  Wallet,
} from "lucide-react";

import { formatMoney } from "../../../utils/formatters";

import { fetchDashboardData } from "../services/dashboard.service";
import {
  buildExpenseMovement,
  buildProductMovement,
  buildQuotationMovement,
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

  const [cotizaciones, setCotizaciones] = useState([]);
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
  }, []);

  const rangeDates = useMemo(() => getRangeDates(range), [range]);

  const filteredData = useMemo(() => {
    const { start, end } = rangeDates;

    const filteredCotizaciones = cotizaciones.filter((item) =>
      isBetween(item.created_at, start, end),
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
      gastos: filteredGastos,
      productos: filteredProductos,
    };
  }, [cotizaciones, gastos, productos, range, rangeDates]);

  const resumen = useMemo(() => {
    return calculateDashboardSummary({ filteredData, productos });
  }, [filteredData, productos]);

  const stats = useMemo(
    () => [
      {
        title: "Ganancia neta",
        value: formatMoney(resumen.gananciaNetaReal),
        note: "Ganancia de cotizaciones completadas menos gastos del rango",
        icon: CircleDollarSign,
        tone: resumen.gananciaNetaReal >= 0 ? "success" : "error",
      },
      {
        title: "Ventas completadas",
        value: formatMoney(resumen.ventaTotalCompletada),
        note: "Total vendido en cotizaciones completadas",
        icon: ReceiptText,
        tone: "info",
      },
      {
        title: "Gastos",
        value: formatMoney(resumen.gastoTotal),
        note: "Gastos registrados dentro del rango",
        icon: Wallet,
        tone: "warning",
      },
      {
        title: "Productos",
        value: String(resumen.totalProductos),
        note: `${resumen.productosActivos} activos en catálogo`,
        icon: Package,
        tone: "primary",
      },
    ],
    [resumen],
  );

  const recentActivity = useMemo(() => {
    return [
      ...getLatestMovements(filteredData.cotizaciones, buildQuotationMovement),
      ...getLatestMovements(filteredData.gastos, buildExpenseMovement),
      ...getLatestMovements(filteredData.productos, buildProductMovement),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredData]);

  const periodData = useMemo(
    () =>
      groupByPeriod({
        cotizaciones: filteredData.cotizaciones,
        gastos: filteredData.gastos,
        range,
      }),
    [filteredData, range],
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

  return {
    loading,
    error,

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