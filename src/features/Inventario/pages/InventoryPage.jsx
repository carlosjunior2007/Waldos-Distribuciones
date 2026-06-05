import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Boxes,
  ClipboardList,
  FileText,
  Layers,
  PackagePlus,
  RefreshCcw,
  Search,
  TrendingUp,
} from "lucide-react";
import { InventoryEntryModal } from "../components/InventoryEntryModal";
import { useInventory } from "../hooks/useInventory";

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const number = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 2,
});

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function InventoryPage() {
  const {
    summary,
    entries,
    movements,
    providers,
    totals,
    loading,
    saving,
    error,
    stockCount,
    stockHasMore,
    stockLoadingMore,
    loadInventory,
    searchStock,
    loadMoreStock,
    saveEntry,
    cancelEntry,
  } = useInventory();

  const [tab, setTab] = useState("stock");
  const [search, setSearch] = useState("");
  const [entryModalOpen, setEntryModalOpen] = useState(false);

  useEffect(() => {
    if (tab !== "stock") return;

    const timeout = window.setTimeout(() => {
      searchStock(search);
    }, 320);

    return () => window.clearTimeout(timeout);
  }, [search, searchStock, tab]);

  const filteredMovements = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return movements;

    return (movements || []).filter((item) => {
      return [
        item.producto?.nombre,
        item.producto?.codigo,
        item.referencia,
        item.notas,
        item.pedido?.folio,
        item.entrega?.folio,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [movements, search]);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return entries;

    return (entries || []).filter((item) => {
      return [
        item.folio,
        item.numero_factura,
        item.proveedor?.nombre,
        item.proveedor?.codigo,
        item.notas,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [entries, search]);

  async function handleSaveEntry(payload) {
    await saveEntry(payload);
    setEntryModalOpen(false);
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-600">
              Control de inventario
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Inventario FIFO
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Registra compras por factura, controla lotes y descuenta productos de los lotes más antiguos cuando se entregan pedidos.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadInventory}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50"
            >
              <RefreshCcw size={17} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => setEntryModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-red-700"
            >
              <PackagePlus size={18} />
              Nueva entrada
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Boxes} title="Productos con stock" value={number.format(totals.productsWithStock)} description="Con existencia disponible" />
        <StatCard icon={Archive} title="Unidades disponibles" value={number.format(totals.totalUnits)} description="Suma de lotes activos" />
        <StatCard icon={Layers} title="Lotes activos" value={number.format(totals.activeLots)} description="Entradas con disponibilidad" />
        <StatCard icon={TrendingUp} title="Valor estimado" value={money.format(totals.totalValue)} description="Costo del stock disponible" />
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="inline-flex w-fit rounded-2xl bg-slate-100 p-1">
              <TabButton active={tab === "stock"} onClick={() => setTab("stock")}>Existencias</TabButton>
              <TabButton active={tab === "entries"} onClick={() => setTab("entries")}>Entradas</TabButton>
              <TabButton active={tab === "movements"} onClick={() => setTab("movements")}>Movimientos</TabButton>
            </div>

            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar producto, folio, factura o movimiento..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="mx-5 mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="p-5">
          {loading ? (
            <EmptyState title="Cargando inventario..." description="Dale un segundo a la base de datos, qué sacrificio tan enorme." />
          ) : tab === "stock" ? (
            <StockView
              items={summary}
              totalCount={stockCount}
              hasMore={stockHasMore}
              loadingMore={stockLoadingMore}
              onLoadMore={loadMoreStock}
            />
          ) : tab === "entries" ? (
            <EntriesView entries={filteredEntries} onCancelEntry={cancelEntry} saving={saving} />
          ) : (
            <MovementsView movements={filteredMovements} />
          )}
        </div>
      </div>

      <InventoryEntryModal
        open={entryModalOpen}
        saving={saving}
        providers={providers}
        onClose={() => setEntryModalOpen(false)}
        onSave={handleSaveEntry}
      />
    </section>
  );
}

function StatCard({ icon: Icon, title, value, description }) {
  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon size={20} />
        </div>
      </div>
    </article>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl px-4 py-2 text-sm font-black transition",
        active ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StockView({ items, totalCount, hasMore, loadingMore, onLoadMore }) {
  if (!items.length) {
    return <EmptyState title="No hay existencias" description="Solo se muestran productos con stock disponible. Registra una entrada para empezar a ver lotes." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span>
          Mostrando <strong className="text-slate-950">{items.length}</strong> de <strong className="text-slate-950">{totalCount}</strong> productos con stock.
        </span>
        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          No se cargan productos sin existencia
        </span>
      </div>

      <div className="grid gap-3">
        {items.map((item) => {
          const available = toNumber(item.cantidad_disponible);

          return (
            <article key={item.producto_id} className="rounded-[24px] border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_140px_110px_150px_160px] xl:items-center">
                <div>
                  <p className="text-lg font-black text-slate-950">{item.nombre}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{item.codigo || "Sin código"}</p>
                </div>

                <Metric label="Disponible" value={number.format(available)} highlight />
                <Metric label="Lotes" value={number.format(toNumber(item.lotes_activos))} />
                <Metric label="Última compra" value={item.ultima_compra || "Sin compras"} />
                <Metric label="Valor" value={money.format(toNumber(item.valor_estimado))} highlight />
              </div>
            </article>
          );
        })}
      </div>

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingMore ? "Cargando..." : "Cargar más productos"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function EntriesView({ entries, onCancelEntry, saving }) {
  if (!entries.length) {
    return <EmptyState title="No hay entradas" description="Aquí aparecerán facturas o compras capturadas." />;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const active = entry.estado !== "cancelada";
        const lots = entry.lotes || [];
        const available = lots.reduce((acc, lot) => acc + toNumber(lot.cantidad_disponible), 0);
        const initial = lots.reduce((acc, lot) => acc + toNumber(lot.cantidad_inicial), 0);

        return (
          <article key={entry.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={["rounded-full px-3 py-1 text-xs font-black", active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"].join(" ")}>{active ? "Activa" : "Cancelada"}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{entry.fecha_compra}</span>
                </div>
                <h3 className="mt-3 text-lg font-black text-slate-950">{entry.folio || entry.numero_factura || "Entrada sin folio"}</h3>
                <p className="mt-1 text-sm text-slate-500">{entry.proveedor?.nombre || "Sin proveedor"} · {lots.length} productos</p>
                {entry.archivo_url ? (
                  <a
                    href={entry.archivo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver archivo
                  </a>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3 xl:justify-end">
                <Metric label="Comprado" value={number.format(initial)} />
                <Metric label="Disponible" value={number.format(available)} highlight={available > 0} />
                <Metric label="Total" value={money.format(toNumber(entry.total))} />
                {active ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onCancelEntry?.(entry.id)}
                    className="h-11 rounded-2xl border border-red-200 px-4 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MovementsView({ movements }) {
  if (!movements.length) {
    return <EmptyState title="No hay movimientos" description="Las entradas y salidas FIFO aparecerán aquí." />;
  }

  return (
    <div className="space-y-3">
      {movements.map((movement) => {
        const isIn = movement.tipo === "entrada" || movement.tipo === "reversa";
        const isOut = movement.tipo === "salida";

        return (
          <article key={movement.id} className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={["rounded-full px-3 py-1 text-xs font-black", isIn ? "bg-emerald-50 text-emerald-700" : isOut ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"].join(" ")}>{movement.tipo}</span>
                <span className="text-xs font-semibold text-slate-400">{new Date(movement.created_at).toLocaleString("es-MX")}</span>
              </div>
              <h3 className="mt-2 font-black text-slate-950">{movement.producto?.nombre || "Producto"}</h3>
              <p className="mt-1 text-sm text-slate-500">{movement.referencia || movement.notas || "Movimiento de inventario"}</p>
              {movement.pedido?.folio || movement.entrega?.folio ? (
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {movement.pedido?.folio ? `Pedido ${movement.pedido.folio}` : ""}
                  {movement.entrega?.folio ? ` · Entrega ${movement.entrega.folio}` : ""}
                </p>
              ) : null}
            </div>

            <p className={isOut ? "text-lg font-black text-red-700" : "text-lg font-black text-emerald-700"}>
              {isOut ? "-" : "+"}{number.format(toNumber(movement.cantidad))}
            </p>
          </article>
        );
      })}
    </div>
  );
}

function Metric({ label, value, highlight = false }) {
  return (
    <div className="min-w-[120px] rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={highlight ? "mt-1 font-black text-emerald-700" : "mt-1 font-black text-slate-950"}>{value}</p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      <ClipboardList className="mx-auto text-slate-400" size={34} />
      <h3 className="mt-3 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
