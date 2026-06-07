import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelInventoryEntry,
  createInventoryEntry,
  deleteInventoryEntry,
  fetchInventoryEntries,
  fetchInventoryFormCatalogs,
  fetchInventoryMovements,
  fetchInventorySummary,
} from "../services/inventory.service";

const STOCK_PAGE_SIZE = 20;

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function useInventory() {
  const [summary, setSummary] = useState([]);
  const [entries, setEntries] = useState([]);
  const [movements, setMovements] = useState([]);
  const [providers, setProviders] = useState([]);

  const [stockSearch, setStockSearch] = useState("");
  const [stockFilters, setStockFilters] = useState({ dateFrom: "", dateTo: "" });
  const [stockPage, setStockPage] = useState(0);
  const [stockCount, setStockCount] = useState(0);
  const [stockHasMore, setStockHasMore] = useState(false);
  const [stockLoadingMore, setStockLoadingMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    return (summary || []).reduce(
      (acc, item) => {
        const quantity = toNumber(item.cantidad_disponible);

        // costo_stock = lo que realmente costó el inventario disponible.
        // valor_venta_potencial = lo que entraría si se vende todo al precio actual.
        // ganancia_potencial = valor de venta - costo del stock.
        const stockCost = toNumber(item.costo_stock ?? item.valor_estimado);
        const saleValue = toNumber(item.valor_venta_potencial);
        const potentialProfit = toNumber(item.ganancia_potencial);

        acc.totalUnits += quantity;
        acc.stockCost += stockCost;
        acc.saleValue += saleValue;
        acc.potentialProfit += potentialProfit;
        acc.activeLots += toNumber(item.lotes_activos);

        return acc;
      },
      {
        productsWithStock: stockCount || 0,
        activeLots: 0,
        totalUnits: 0,
        stockCost: 0,
        saleValue: 0,
        potentialProfit: 0,
      },
    );
  }, [summary, stockCount]);

  const loadStock = useCallback(
    async ({ search = stockSearch, filters = stockFilters, reset = true } = {}) => {
      const nextPage = reset ? 0 : stockPage + 1;

      if (!reset) setStockLoadingMore(true);

      const result = await fetchInventorySummary({
        search,
        page: nextPage,
        pageSize: STOCK_PAGE_SIZE,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });

      setSummary((prev) => (reset ? result.data : [...prev, ...result.data]));
      setStockSearch(search);
      setStockFilters(filters);
      setStockPage(nextPage);
      setStockCount(result.count || 0);
      setStockHasMore((nextPage + 1) * STOCK_PAGE_SIZE < (result.count || 0));
      setStockLoadingMore(false);

      return result;
    },
    [stockFilters, stockPage, stockSearch],
  );

  const loadInventory = useCallback(
    async ({ search = stockSearch, filters = stockFilters } = {}) => {
      setLoading(true);
      setError("");

      try {
        const [entriesData, movementsData, catalogs] = await Promise.all([
          fetchInventoryEntries(filters),
          fetchInventoryMovements({ dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
          fetchInventoryFormCatalogs(),
        ]);

        setEntries(entriesData);
        setMovements(movementsData);
        setProviders(catalogs.providers || []);

        await loadStock({ search, filters, reset: true });
      } catch (err) {
        setError(err.message || "No se pudo cargar el inventario.");
      } finally {
        setLoading(false);
      }
    },
    [loadStock, stockFilters, stockSearch],
  );

  const searchStock = useCallback(
    async (search, filters = stockFilters) => {
      setError("");
      try {
        await loadStock({ search, filters, reset: true });
      } catch (err) {
        setError(err.message || "No se pudo buscar inventario.");
      }
    },
    [loadStock, stockFilters],
  );

  const loadMoreStock = useCallback(async () => {
    if (!stockHasMore || stockLoadingMore) return;

    setError("");
    try {
      await loadStock({ search: stockSearch, filters: stockFilters, reset: false });
    } catch (err) {
      setError(err.message || "No se pudo cargar más inventario.");
      setStockLoadingMore(false);
    }
  }, [loadStock, stockFilters, stockHasMore, stockLoadingMore, stockSearch]);

  const saveEntry = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");

      try {
        const result = await createInventoryEntry(payload);
        await loadInventory({ search: stockSearch, filters: stockFilters });
        return result;
      } catch (err) {
        setError(err.message || "No se pudo guardar la entrada.");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [loadInventory, stockFilters, stockSearch],
  );

  const cancelEntry = useCallback(
    async (entryId) => {
      setSaving(true);
      setError("");

      try {
        await cancelInventoryEntry(entryId);
        await loadInventory({ search: stockSearch, filters: stockFilters });
      } catch (err) {
        setError(err.message || "No se pudo cancelar la entrada.");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [loadInventory, stockFilters, stockSearch],
  );

  const deleteEntry = useCallback(
    async (entryId) => {
      setSaving(true);
      setError("");

      try {
        await deleteInventoryEntry(entryId);
        await loadInventory({ search: stockSearch, filters: stockFilters });
      } catch (err) {
        setError(err.message || "No se pudo borrar la entrada.");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [loadInventory, stockFilters, stockSearch],
  );

  useEffect(() => {
    loadInventory({ search: "" });
    // Solo al montar. Si metemos dependencias aquí, React arma una fiesta innecesaria.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    summary,
    entries,
    movements,
    providers,
    totals,
    loading,
    saving,
    error,
    stockSearch,
    stockFilters,
    stockCount,
    stockHasMore,
    stockLoadingMore,
    loadInventory,
    searchStock,
    loadMoreStock,
    saveEntry,
    cancelEntry,
    deleteEntry,
  };
}
