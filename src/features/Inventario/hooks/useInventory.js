import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelInventoryEntry,
  createInventoryEntry,
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
        const value = toNumber(item.valor_estimado);

        acc.totalUnits += quantity;
        acc.totalValue += value;
        acc.activeLots += toNumber(item.lotes_activos);

        return acc;
      },
      {
        productsWithStock: stockCount || 0,
        activeLots: 0,
        totalUnits: 0,
        totalValue: 0,
      },
    );
  }, [summary, stockCount]);

  const loadStock = useCallback(
    async ({ search = stockSearch, reset = true } = {}) => {
      const nextPage = reset ? 0 : stockPage + 1;

      if (!reset) setStockLoadingMore(true);

      const result = await fetchInventorySummary({
        search,
        page: nextPage,
        pageSize: STOCK_PAGE_SIZE,
      });

      setSummary((prev) => (reset ? result.data : [...prev, ...result.data]));
      setStockSearch(search);
      setStockPage(nextPage);
      setStockCount(result.count || 0);
      setStockHasMore((nextPage + 1) * STOCK_PAGE_SIZE < (result.count || 0));
      setStockLoadingMore(false);

      return result;
    },
    [stockPage, stockSearch],
  );

  const loadInventory = useCallback(
    async ({ search = stockSearch } = {}) => {
      setLoading(true);
      setError("");

      try {
        const [entriesData, movementsData, catalogs] = await Promise.all([
          fetchInventoryEntries(),
          fetchInventoryMovements(),
          fetchInventoryFormCatalogs(),
        ]);

        setEntries(entriesData);
        setMovements(movementsData);
        setProviders(catalogs.providers || []);

        await loadStock({ search, reset: true });
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar el inventario.");
      } finally {
        setLoading(false);
      }
    },
    [loadStock, stockSearch],
  );

  const searchStock = useCallback(
    async (search) => {
      setError("");
      try {
        await loadStock({ search, reset: true });
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo buscar inventario.");
      }
    },
    [loadStock],
  );

  const loadMoreStock = useCallback(async () => {
    if (!stockHasMore || stockLoadingMore) return;

    setError("");
    try {
      await loadStock({ search: stockSearch, reset: false });
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo cargar más inventario.");
      setStockLoadingMore(false);
    }
  }, [loadStock, stockHasMore, stockLoadingMore, stockSearch]);

  const saveEntry = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");

      try {
        const result = await createInventoryEntry(payload);
        await loadInventory({ search: stockSearch });
        return result;
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo guardar la entrada.");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [loadInventory, stockSearch],
  );

  const cancelEntry = useCallback(
    async (entryId) => {
      setSaving(true);
      setError("");

      try {
        await cancelInventoryEntry(entryId);
        await loadInventory({ search: stockSearch });
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cancelar la entrada.");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [loadInventory, stockSearch],
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
    stockCount,
    stockHasMore,
    stockLoadingMore,
    loadInventory,
    searchStock,
    loadMoreStock,
    saveEntry,
    cancelEntry,
  };
}
