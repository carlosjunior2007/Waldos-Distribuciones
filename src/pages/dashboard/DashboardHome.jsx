import { useEffect, useMemo, useState } from "react";
import supabase from "../../utils/supabase";

import {
  CircleDollarSign,
  ReceiptText,
  Package,
  Wallet,
  TrendingUp,
  Receipt,
  Package2,
  WalletCards,
  BarChart3,
  CalendarDays,
} from "lucide-react";

import SummaryCard from "../../components/ui/SummaryCard";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import FilterPill from "../../components/ui/FilterPill";

import { formatMoney } from "../../utils/formatters";
import { formatDateTimeTijuana } from "../../utils/dates";
import {
  normalizeQuotationStatus,
  isCompletedQuotation,
} from "../../utils/status";
import { getToneClass } from "../../utils/styles";

const DASHBOARD_QUERIES = {
  cotizaciones: `
    id,
    folio,
    cliente_nombre,
    subtotal,
    descuento,
    total,
    gastos,
    ganancia,
    estado,
    notas,
    fecha_vencimiento,
    fecha_completado,
    created_at,
    updated_at
  `,
  gastos: `
    id,
    concepto,
    descripcion,
    monto,
    tipo,
    fecha,
    created_at,
    cotizacion_id
  `,
  productos: `
    id,
    nombre,
    descripcion,
    precio,
    precio_compra,
    precio_utilidad,
    disponibilidad,
    habilitado,
    cantidad,
    cantidad_caja,
    categoria,
    unidad,
    codigo,
    created_at,
    updated_at
  `,
};

const RANGE_OPTIONS = [
  { value: "month", label: "Mes actual" },
  { value: "week", label: "Semana actual" },
  { value: "year", label: "Año actual" },
  { value: "all", label: "Todo" },
];

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isBetween(dateValue, start, end) {
  const date = toDate(dateValue);
  if (!date) return false;
  if (!start && !end) return true;
  return date >= start && date <= end;
}

function getRangeDates(range) {
  const now = new Date();

  if (range === "all") return { start: null, end: null };

  if (range === "week") {
    const start = new Date(now);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (range === "year") {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    return { start, end };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

function getMonthKey(value) {
  const date = toDate(value);
  if (!date) return "Sin fecha";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthKey) {
  if (monthKey === "Sin fecha") return monthKey;

  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  return date.toLocaleDateString("es-MX", {
    month: "short",
    year: "numeric",
  });
}

function getWeekKey(value) {
  const date = toDate(value);
  if (!date) return "Sin fecha";

  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date - firstDay) / 86400000);
  const week = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);

  return `${date.getFullYear()}-S${String(week).padStart(2, "0")}`;
}

function getMovementMeta(type) {
  if (type === "cotizacion") {
    return {
      icon: Receipt,
      className: getToneClass("info"),
    };
  }

  if (type === "gasto") {
    return {
      icon: WalletCards,
      className: getToneClass("warning"),
    };
  }

  return {
    icon: Package2,
    className: getToneClass("primary"),
  };
}

function buildQuotationMovement(item) {
  return {
    id: `cot-${item.id}`,
    entityId: item.id,
    title: `Cotización ${item.folio || item.id?.slice(0, 8) || "sin folio"}`,
    description: `${item.cliente_nombre || "Cliente sin nombre"} • Estado: ${
      item.estado || "sin estado"
    } • Total: ${formatMoney(item.total)}`,
    date: item.updated_at || item.created_at,
    type: "cotizacion",
    ...item,
  };
}

function buildExpenseMovement(item) {
  return {
    id: `gas-${item.id}`,
    entityId: item.id,
    title: `Gasto: ${item.concepto || "Sin concepto"}`,
    description: `${item.tipo || "Sin tipo"} • ${formatMoney(item.monto)}${
      item.descripcion ? ` • ${item.descripcion}` : ""
    }`,
    date: item.fecha || item.created_at,
    type: "gasto",
    ...item,
  };
}

function buildProductMovement(item) {
  return {
    id: `pro-${item.id}`,
    entityId: item.id,
    title: `Producto: ${item.nombre || "Sin nombre"}`,
    description: `${item.codigo || "Sin código"} • ${
      item.categoria || "Sin categoría"
    } • Precio: ${formatMoney(item.precio)}`,
    date: item.updated_at || item.created_at,
    type: "producto",
    ...item,
  };
}

function getLatestMovements(rows, builder, limit = 3) {
  return rows
    .map(builder)
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

function DetailRow({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-text-primary">
        {value || "Sin información"}
      </p>
    </div>
  );
}

function MovementDetailModal({ item, onClose }) {
  if (!item) return null;

  const { icon: Icon, className } = getMovementMeta(item.type);

  const detailsByType = {
    cotizacion: [
      ["Folio", item.folio],
      ["Cliente", item.cliente_nombre],
      ["Estado", item.estado],
      ["Subtotal", formatMoney(item.subtotal)],
      ["Descuento", formatMoney(item.descuento)],
      ["Gastos", formatMoney(item.gastos)],
      ["Ganancia", formatMoney(item.ganancia)],
      ["Total", formatMoney(item.total)],
    ],
    gasto: [
      ["Concepto", item.concepto],
      ["Descripción", item.descripcion],
      ["Monto", formatMoney(item.monto)],
      ["Tipo", item.tipo],
      ["Fecha", formatDateTimeTijuana(item.fecha)],
      ["Cotización relacionada", item.cotizacion_id],
    ],
    producto: [
      ["Nombre", item.nombre],
      ["Código", item.codigo],
      ["Categoría", item.categoria],
      ["Unidad", item.unidad],
      ["Precio venta", formatMoney(item.precio)],
      ["Precio compra", formatMoney(item.precio_compra)],
      ["Utilidad", formatMoney(item.precio_utilidad)],
      ["Cantidad", String(item.cantidad ?? 0)],
      ["Cantidad por caja", String(item.cantidad_caja ?? 0)],
      ["Disponible", item.disponibilidad ? "Sí" : "No"],
      ["Habilitado", item.habilitado ? "Sí" : "No"],
      ["Descripción", item.descripcion],
    ],
  };

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title={item.title}
      subtitle={`${item.type} • ${formatDateTimeTijuana(item.date)}`}
      width="max-w-2xl"
      zIndex="z-50"
    >
      <div className="p-4 sm:p-5">
        <div className="mb-5 flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${className}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <p className="min-w-0 break-words text-sm leading-relaxed text-text-secondary">
            {item.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(detailsByType[item.type] || []).map(([label, value]) => (
            <DetailRow key={label} label={label} value={value} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

function SummaryBox({ label, value, note }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>

      <p className="mt-1 text-sm text-text-secondary">{note}</p>
    </div>
  );
}

function RecentActivityItem({ item, onClick }) {
  const { icon: Icon, className } = getMovementMeta(item.type);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-surface-soft p-4 text-left transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/40"
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${className}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">{item.title}</p>

          <p className="mt-1 text-sm text-text-secondary">
            {item.description}
          </p>

          <p className="mt-2 text-xs text-text-muted">
            {formatDateTimeTijuana(item.date)}
          </p>
        </div>
      </div>
    </button>
  );
}

function SimpleBarChart({ title, subtitle, data, valueFormatter = (v) => v }) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);

  return (
    <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-secondary">{subtitle}</p>
          <h3 className="mt-1 text-xl font-bold text-text-primary">{title}</h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <BarChart3 className="h-5 w-5" />
        </div>
      </div>

      {!data.length ? (
        <EmptyState
          title="Sin datos para graficar"
          description="Cuando existan registros en este rango, aparecerán aquí."
          className="rounded-2xl border border-border bg-surface-soft py-10"
        />
      ) : (
        <div className="space-y-4">
          {data.map((item) => {
            const width = `${Math.max((Number(item.value || 0) / max) * 100, 4)}%`;

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-text-primary">
                    {item.label}
                  </span>
                  <span className="text-text-secondary">
                    {valueFormatter(item.value)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-surface-soft">
                  <div
                    className="h-full rounded-full bg-primary-600"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ComparisonChart({ title, subtitle, data }) {
  const max = Math.max(
    ...data.flatMap((item) => [
      Number(item.ganancias || 0),
      Number(item.gastos || 0),
    ]),
    1,
  );

  return (
    <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6 xl:col-span-2">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-secondary">{subtitle}</p>
          <h3 className="mt-1 text-xl font-bold text-text-primary">{title}</h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success-50 text-success-700">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>

      {!data.length ? (
        <EmptyState
          title="Sin datos financieros"
          description="Todavía no hay ganancias o gastos para comparar."
          className="rounded-2xl border border-border bg-surface-soft py-10"
        />
      ) : (
        <div className="space-y-5">
          {data.map((item) => {
            const gananciasWidth = `${Math.max(
              (Number(item.ganancias || 0) / max) * 100,
              item.ganancias ? 4 : 0,
            )}%`;

            const gastosWidth = `${Math.max(
              (Number(item.gastos || 0) / max) * 100,
              item.gastos ? 4 : 0,
            )}%`;

            return (
              <div key={item.label} className="rounded-2xl bg-surface-soft p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-text-primary">
                    {item.label}
                  </p>

                  <p className="text-sm font-semibold text-text-secondary">
                    Neto: {formatMoney(item.neto)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-success-700">Ganancias</span>
                      <span>{formatMoney(item.ganancias)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-success-500"
                        style={{ width: gananciasWidth }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-warning-700">Gastos</span>
                      <span>{formatMoney(item.gastos)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-warning-500"
                        style={{ width: gastosWidth }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function groupByPeriod({ cotizaciones, gastos, range }) {
  const useWeekly = range === "week";
  const keyGetter = useWeekly ? getWeekKey : getMonthKey;
  const labelGetter = useWeekly ? (key) => key : getMonthLabel;

  const map = new Map();

  function ensure(key) {
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: labelGetter(key),
        cotizaciones: 0,
        ganancias: 0,
        gastos: 0,
        neto: 0,
      });
    }

    return map.get(key);
  }

  cotizaciones.forEach((item) => {
    const key = keyGetter(item.created_at);
    const bucket = ensure(key);

    bucket.cotizaciones += 1;

    if (isCompletedQuotation(item.estado)) {
      bucket.ganancias += Number(item.ganancia || 0);
    }
  });

  gastos.forEach((item) => {
    const key = keyGetter(item.fecha || item.created_at);
    const bucket = ensure(key);

    bucket.gastos += Number(item.monto || 0);
  });

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      neto: item.ganancias - item.gastos,
    }))
    .sort((a, b) => String(a.key).localeCompare(String(b.key)));
}

export default function DashboardHome() {
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
        const [cotizacionesRes, gastosRes, productosRes] = await Promise.all([
          supabase.from("cotizaciones").select(DASHBOARD_QUERIES.cotizaciones),
          supabase.from("gastos").select(DASHBOARD_QUERIES.gastos),
          supabase.from("productos").select(DASHBOARD_QUERIES.productos),
        ]);

        if (cotizacionesRes.error) throw cotizacionesRes.error;
        if (gastosRes.error) throw gastosRes.error;
        if (productosRes.error) throw productosRes.error;

        if (!mounted) return;

        setCotizaciones(cotizacionesRes.data || []);
        setGastos(gastosRes.data || []);
        setProductos(productosRes.data || []);
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
    const cotizacionesCompletadas = filteredData.cotizaciones.filter((item) =>
      isCompletedQuotation(item.estado),
    );

    const ventaTotalCompletada = cotizacionesCompletadas.reduce(
      (acc, item) => acc + Number(item.total || 0),
      0,
    );

    const gananciaBrutaReal = cotizacionesCompletadas.reduce(
      (acc, item) => acc + Number(item.ganancia || 0),
      0,
    );

    const gastoTotal = filteredData.gastos.reduce(
      (acc, item) => acc + Number(item.monto || 0),
      0,
    );

    const estados = filteredData.cotizaciones.reduce(
      (acc, item) => {
        const estado = normalizeQuotationStatus(item.estado);
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      },
      {
        pendiente: 0,
        completada: 0,
        cancelada: 0,
        otro: 0,
      },
    );

    const productosActivos = productos.filter(
      (item) => item.disponibilidad === true && item.habilitado === true,
    ).length;

    return {
      ventaTotalCompletada,
      gananciaBrutaReal,
      gastoTotal,
      gananciaNetaReal: gananciaBrutaReal - gastoTotal,
      totalCotizaciones: filteredData.cotizaciones.length,
      pendientes: estados.pendiente || 0,
      completadas: estados.completada || 0,
      canceladas: estados.cancelada || 0,
      otros: estados.otro || 0,
      productosActivos,
      totalProductos: productos.length,
      productosNuevos: filteredData.productos.length,
    };
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

  if (loading) {
    return (
      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <EmptyState loading title="Cargando resumen real..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[28px] border border-danger-200 bg-danger-50 p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm font-semibold text-danger-700">
          No se pudo cargar el dashboard
        </p>

        <p className="mt-2 text-sm text-danger-600">{error}</p>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-6">
        <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent-600">
                Resumen real
              </p>

              <h2 className="mt-1 text-2xl font-bold text-text-primary">
                Estado del negocio
              </h2>

              <p className="mt-2 text-sm text-text-secondary">
                Filtra por periodo para ver ventas, ganancias, gastos,
                cotizaciones y productos sin hacer cuentas a mano como si fuera
                castigo medieval.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((item) => (
                <FilterPill
                  key={item.value}
                  label={item.label}
                  active={range === item.value}
                  onClick={() => setRange(item.value)}
                />
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <SummaryCard key={item.title} {...item} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6 xl:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-secondary">
                  Resumen del periodo
                </p>

                <h3 className="mt-1 text-xl font-bold text-text-primary">
                  Operación general
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <SummaryBox
                label="Pendientes"
                value={resumen.pendientes}
                note="Cotizaciones en espera de seguimiento."
              />

              <SummaryBox
                label="Completadas"
                value={resumen.completadas}
                note="Cotizaciones cerradas con compra confirmada."
              />

              <SummaryBox
                label="Canceladas / vencidas"
                value={resumen.canceladas}
                note="Cotizaciones que no avanzaron."
              />

              <SummaryBox
                label="Productos nuevos"
                value={resumen.productosNuevos}
                note={
                  range === "all"
                    ? "Total de productos registrados."
                    : "Productos creados dentro del periodo."
                }
              />
            </div>
          </section>

          <aside className="rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
            <p className="text-sm font-semibold text-text-secondary">
              Actividad reciente
            </p>

            <h3 className="mt-1 text-xl font-bold text-text-primary">
              Últimos movimientos
            </h3>

            <div className="mt-5 space-y-3">
              {recentActivity.length === 0 ? (
                <EmptyState
                  title="Sin movimientos"
                  description="No hay registros recientes en este periodo."
                  className="rounded-2xl border border-border bg-surface-soft py-10"
                />
              ) : (
                recentActivity.map((item) => (
                  <RecentActivityItem
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedMovement(item)}
                  />
                ))
              )}
            </div>
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ComparisonChart
            title="Ganancias vs gastos"
            subtitle="Comparación financiera"
            data={financeChartData}
          />

          <SimpleBarChart
            title="Cotizaciones"
            subtitle="Cantidad por periodo"
            data={quotationChartData}
            valueFormatter={(value) => `${value} cotizaciones`}
          />
        </div>
      </section>

      <MovementDetailModal
        item={selectedMovement}
        onClose={() => setSelectedMovement(null)}
      />
    </>
  );
}