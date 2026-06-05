import { useEffect, useMemo, useState } from "react";

import { fetchDashboardData } from "../services/dashboard.service";
import {
  buildDeliveryMovement,
  buildExpenseMovement,
  buildInventoryMovement,
  buildOrderMovement,
  buildProductMovement,
  buildPurchaseMovement,
  buildQuotationMovement,
  calculateDashboardSummary,
  exportDashboardExcel,
  getLatestMovements,
  getPeriodLabel,
  getRangeDates,
  getTopProducts,
  groupByPeriod,
  isBetween,
} from "../dashboard.helpers";

const initialFilters = {
  month: new Date().toISOString().slice(0, 7),
  startDate: "",
  endDate: "",
};

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("month");
  const [filters, setFilters] = useState(initialFilters);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState({
    cotizaciones: [],
    pedidos: [],
    pedidoDetalles: [],
    entregas: [],
    gastos: [],
    productos: [],
    pedidoGanancias: [],
    pedidoProductoGanancias: [],
    pedidoInventarioFacturas: [],
    inventarioEntradas: [],
    inventarioLotes: [],
    inventarioMovimientos: [],
  });

  const [selectedMovement, setSelectedMovement] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const result = await fetchDashboardData();
        if (!mounted) return;
        setData(result);
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        if (mounted) setError(err.message || "No se pudo cargar el dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const rangeDates = useMemo(() => getRangeDates(range, filters), [range, filters]);
  const periodLabel = useMemo(
    () => getPeriodLabel(rangeDates.start, rangeDates.end, range),
    [rangeDates, range],
  );

  const filteredData = useMemo(() => {
    const { start, end } = rangeDates;

    return {
      cotizaciones: data.cotizaciones.filter((item) => isBetween(item.created_at, start, end)),
      pedidos: data.pedidos.filter((item) => isBetween(item.created_at, start, end)),
      pedidoDetalles: data.pedidoDetalles,
      entregas: data.entregas.filter((item) => isBetween(item.fecha_entrega || item.created_at, start, end)),
      gastos: data.gastos.filter((item) => isBetween(item.fecha || item.created_at, start, end)),
      productos:
        range === "all"
          ? data.productos
          : data.productos.filter((item) => isBetween(item.created_at, start, end)),
      pedidoGanancias: data.pedidoGanancias.filter((item) =>
        isBetween(item.fecha_pago || item.fecha_entrega || item.updated_at || item.created_at, start, end),
      ),
      pedidoProductoGanancias: data.pedidoProductoGanancias.filter((item) =>
        isBetween(item.fecha_pago || item.fecha_entrega || item.created_at, start, end),
      ),
      pedidoInventarioFacturas: data.pedidoInventarioFacturas.filter((item) =>
        isBetween(item.fecha_entrega || item.fecha_compra || item.created_at, start, end),
      ),
      inventarioEntradas: data.inventarioEntradas.filter((item) =>
        isBetween(item.fecha_compra || item.created_at, start, end),
      ),
      inventarioLotes: data.inventarioLotes.filter((item) =>
        range === "all" ? true : isBetween(item.fecha_compra || item.created_at, start, end),
      ),
      inventarioMovimientos: data.inventarioMovimientos.filter((item) =>
        isBetween(item.created_at, start, end),
      ),
    };
  }, [data, range, rangeDates]);

  const resumen = useMemo(() => {
    return calculateDashboardSummary({
      filteredData,
      productos: data.productos,
      pedidoDetalles: data.pedidoDetalles,
    });
  }, [filteredData, data.productos, data.pedidoDetalles]);

  const periodData = useMemo(
    () =>
      groupByPeriod({
        pedidosGanancia: filteredData.pedidoGanancias,
        gastos: filteredData.gastos,
        compras: filteredData.inventarioEntradas,
        movimientos: filteredData.inventarioMovimientos,
        range,
      }),
    [filteredData, range],
  );

  const recentActivity = useMemo(() => {
    return [
      ...getLatestMovements(filteredData.pedidoGanancias, buildOrderMovement, 4),
      ...getLatestMovements(filteredData.entregas, buildDeliveryMovement, 4),
      ...getLatestMovements(filteredData.inventarioEntradas, buildPurchaseMovement, 4),
      ...getLatestMovements(filteredData.inventarioMovimientos, buildInventoryMovement, 4),
      ...getLatestMovements(filteredData.gastos, buildExpenseMovement, 4),
      ...getLatestMovements(filteredData.cotizaciones, buildQuotationMovement, 2),
      ...getLatestMovements(filteredData.productos, buildProductMovement, 2),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 12);
  }, [filteredData]);

  const topProducts = useMemo(
    () => getTopProducts(filteredData.pedidoProductoGanancias),
    [filteredData.pedidoProductoGanancias],
  );

  function clearError() {
    setError("");
  }

  function retryLoad() {
    setReloadKey((prev) => prev + 1);
  }

  function handleExportExcel() {
    exportDashboardExcel({ resumen, periodLabel, filteredData });
  }

  return {
    loading,
    error,
    clearError,
    retryLoad,

    range,
    setRange,
    filters,
    setFilters,
    periodLabel,

    resumen,
    periodData,
    recentActivity,
    topProducts,
    filteredData,

    handleExportExcel,

    selectedMovement,
    setSelectedMovement,
  };
}
