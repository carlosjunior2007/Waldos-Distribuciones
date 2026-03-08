import { useEffect, useMemo, useState } from "react";
import supabase from "../../utils/supabase";
import {
  CircleDollarSign,
  ReceiptText,
  Package,
  Wallet,
  TrendingUp,
  Loader2,
  X,
  Receipt,
  Package2,
  WalletCards,
} from "lucide-react";

function formatMoney(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function parseTimestampDate(value) {
  if (!value) return null;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return d;
}

function formatTimestampDateTime(value) {
  const d = parseTimestampDate(value);
  if (!d || Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function statTone(tone) {
  if (tone === "success") {
    return "bg-success-50 text-success-700 border-success-100";
  }

  if (tone === "warning") {
    return "bg-warning-50 text-warning-700 border-warning-100";
  }

  if (tone === "info") {
    return "bg-info-50 text-info-700 border-info-100";
  }

  return "bg-primary-50 text-primary-700 border-primary-100";
}

function normalizeEstado(estado) {
  const value = String(estado || "")
    .trim()
    .toLowerCase();

  if (
    ["pendiente", "pendientes", "en espera", "por revisar", "abierta"].includes(
      value,
    )
  ) {
    return "pendiente";
  }

  if (
    ["completada", "completado", "cerrada", "finalizada", "pagada"].includes(
      value,
    )
  ) {
    return "completada";
  }

  if (["cancelada", "cancelado", "vencida", "rechazada"].includes(value)) {
    return "cancelada";
  }

  return "otro";
}

function isCompletedQuotation(estado) {
  return normalizeEstado(estado) === "completada";
}

function movementIcon(type) {
  if (type === "cotizacion") return Receipt;
  if (type === "gasto") return WalletCards;
  return Package2;
}

function movementTone(type) {
  if (type === "cotizacion") {
    return "bg-info-50 text-info-700 border-info-100";
  }

  if (type === "gasto") {
    return "bg-warning-50 text-warning-700 border-warning-100";
  }

  return "bg-primary-50 text-primary-700 border-primary-100";
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-soft p-4">
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

  const Icon = movementIcon(item.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-strong)] md:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface-soft text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4 pr-12">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${movementTone(
              item.type,
            )}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold capitalize text-text-secondary">
              {item.type}
            </p>
            <h3 className="mt-1 text-xl font-bold text-text-primary">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              {item.description}
            </p>
            <p className="mt-2 text-xs text-text-muted">
              {item.type === "gasto"
                ? formatTimestampDateTime(item.date)
                : formatTimestampDateTime(item.date)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {item.type === "cotizacion" && (
            <>
              <DetailRow label="Folio" value={item.folio} />
              <DetailRow label="Cliente" value={item.cliente_nombre} />
              <DetailRow label="Estado" value={item.estado} />
              <DetailRow label="Subtotal" value={formatMoney(item.subtotal)} />
              <DetailRow
                label="Descuento"
                value={formatMoney(item.descuento)}
              />
              <DetailRow label="Gastos" value={formatMoney(item.gastos)} />
              <DetailRow label="Ganancia" value={formatMoney(item.ganancia)} />
              <DetailRow label="Total" value={formatMoney(item.total)} />
            </>
          )}

          {item.type === "gasto" && (
            <>
              <DetailRow label="Concepto" value={item.concepto} />
              <DetailRow label="Descripción" value={item.descripcion} />
              <DetailRow label="Monto" value={formatMoney(item.monto)} />
              <DetailRow label="Tipo" value={item.tipo} />
              <DetailRow
                label="Fecha"
                value={formatTimestampDateTime(item.fecha)}
              />
              <DetailRow
                label="Cotización relacionada"
                value={item.cotizacion_id}
              />
            </>
          )}

          {item.type === "producto" && (
            <>
              <DetailRow label="Nombre" value={item.nombre} />
              <DetailRow label="Código" value={item.codigo} />
              <DetailRow label="Categoría" value={item.categoria} />
              <DetailRow label="Unidad" value={item.unidad} />
              <DetailRow
                label="Precio venta"
                value={formatMoney(item.precio)}
              />
              <DetailRow
                label="Precio compra"
                value={formatMoney(item.precio_compra)}
              />
              <DetailRow
                label="Utilidad"
                value={formatMoney(item.precio_utilidad)}
              />
              <DetailRow label="Cantidad" value={String(item.cantidad ?? 0)} />
              <DetailRow
                label="Cantidad por caja"
                value={String(item.cantidad_caja ?? 0)}
              />
              <DetailRow
                label="Disponible"
                value={item.disponibilidad ? "Sí" : "No"}
              />
              <DetailRow
                label="Habilitado"
                value={item.habilitado ? "Sí" : "No"}
              />
              <DetailRow label="Descripción" value={item.descripcion} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          supabase.from("cotizaciones").select(`
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
          `),
          supabase.from("gastos").select(`
            id,
            concepto,
            descripcion,
            monto,
            tipo,
            fecha,
            created_at,
            cotizacion_id
          `),
          supabase.from("productos").select(`
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
          `),
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

  const resumen = useMemo(() => {
    const cotizacionesCompletadas = cotizaciones.filter((item) =>
      isCompletedQuotation(item.estado),
    );

    const gananciaBrutaReal = cotizacionesCompletadas.reduce(
      (acc, item) => acc + Number(item.ganancia || 0),
      0,
    );

    const gastoTotal = gastos.reduce(
      (acc, item) => acc + Number(item.monto || 0),
      0,
    );

    const gananciaNetaReal = gananciaBrutaReal - gastoTotal;

    const estados = cotizaciones.reduce(
      (acc, item) => {
        const estado = normalizeEstado(item.estado);
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      },
      { pendiente: 0, completada: 0, cancelada: 0, otro: 0 },
    );

    const productosActivos = productos.filter(
      (item) => item.disponibilidad === true && item.habilitado === true,
    ).length;

    return {
      gananciaBrutaReal,
      gananciaNetaReal,
      gastoTotal,
      totalCotizaciones: cotizaciones.length,
      pendientes: estados.pendiente || 0,
      completadas: estados.completada || 0,
      canceladas: estados.cancelada || 0,
      productosActivos,
      totalProductos: productos.length,
    };
  }, [cotizaciones, gastos, productos]);

  const stats = useMemo(
    () => [
      {
        title: "Ganancia neta",
        value: formatMoney(resumen.gananciaNetaReal),
        note: "Solo cotizaciones completadas menos gastos registrados",
        icon: CircleDollarSign,
        tone: "success",
      },
      {
        title: "Gastos",
        value: formatMoney(resumen.gastoTotal),
        note: "Compras y costos operativos registrados",
        icon: Wallet,
        tone: "warning",
      },
      {
        title: "Cotizaciones",
        value: String(resumen.totalCotizaciones),
        note: "Pendientes, completadas y canceladas",
        icon: ReceiptText,
        tone: "info",
      },
      {
        title: "Productos",
        value: String(resumen.totalProductos),
        note: "Catálogo disponible",
        icon: Package,
        tone: "primary",
      },
    ],
    [resumen],
  );

  const recentActivity = useMemo(() => {
    const movimientosCotizaciones = cotizaciones
      .map((item) => ({
        id: `cot-${item.id}`,
        entityId: item.id,
        title: `Cotización ${item.folio || item.id?.slice(0, 8) || "sin folio"}`,
        description: `${item.cliente_nombre || "Cliente sin nombre"} • Estado: ${
          item.estado || "sin estado"
        } • Total: ${formatMoney(item.total)}`,
        date: item.updated_at || item.created_at,
        type: "cotizacion",

        folio: item.folio,
        cliente_nombre: item.cliente_nombre,
        subtotal: item.subtotal,
        descuento: item.descuento,
        total: item.total,
        gastos: item.gastos,
        ganancia: item.ganancia,
        estado: item.estado,
        notas: item.notas,
        fecha_vencimiento: item.fecha_vencimiento,
        fecha_completado: item.fecha_completado,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 2);

    const movimientosGastos = gastos
      .map((item) => ({
        id: `gas-${item.id}`,
        entityId: item.id,
        title: `Gasto: ${item.concepto || "Sin concepto"}`,
        description: `${item.tipo || "Sin tipo"} • ${formatMoney(item.monto)}${
          item.descripcion ? ` • ${item.descripcion}` : ""
        }`,
        date: item.fecha,
        type: "gasto",

        concepto: item.concepto,
        descripcion: item.descripcion,
        monto: item.monto,
        tipo: item.tipo,
        fecha: item.fecha,
        created_at: item.created_at,
        cotizacion_id: item.cotizacion_id,
      }))
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 2);

    const movimientosProductos = productos
      .map((item) => ({
        id: `pro-${item.id}`,
        entityId: item.id,
        title: `Producto: ${item.nombre || "Sin nombre"}`,
        description: `${item.codigo || "Sin código"} • ${
          item.categoria || "Sin categoría"
        } • Precio: ${formatMoney(item.precio)}`,
        date: item.updated_at || item.created_at,
        type: "producto",

        nombre: item.nombre,
        descripcion: item.descripcion,
        precio: item.precio,
        precio_compra: item.precio_compra,
        precio_utilidad: item.precio_utilidad,
        disponibilidad: item.disponibilidad,
        habilitado: item.habilitado,
        cantidad: item.cantidad,
        cantidad_caja: item.cantidad_caja,
        categoria: item.categoria,
        unidad: item.unidad,
        codigo: item.codigo,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 2);

    return [
      ...movimientosCotizaciones,
      ...movimientosGastos,
      ...movimientosProductos,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [cotizaciones, gastos, productos]);

  if (loading) {
    return (
      <section className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3 text-text-secondary">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Cargando datos reales...</span>
        </div>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-strong)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">
                      {item.title}
                    </p>
                    <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                      {item.value}
                    </h3>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${statTone(
                      item.tone,
                    )}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  {item.note}
                </p>
              </article>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="xl:col-span-2 rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-secondary">
                  Resumen general
                </p>
                <h3 className="mt-1 text-xl font-bold text-text-primary">
                  Estado del negocio
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
                  Pendientes
                </p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {resumen.pendientes}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Cotizaciones en espera de seguimiento.
                </p>
              </div>

              <div className="rounded-2xl bg-surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
                  Completadas
                </p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {resumen.completadas}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Cotizaciones cerradas con compra confirmada.
                </p>
              </div>

              <div className="rounded-2xl bg-surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
                  Canceladas
                </p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {resumen.canceladas}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Vencidas o canceladas manualmente.
                </p>
              </div>

              <div className="rounded-2xl bg-surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
                  Productos activos
                </p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {resumen.productosActivos}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Productos disponibles para cotizar.
                </p>
              </div>
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
                <div className="rounded-2xl border border-border bg-surface-soft p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    Sin movimientos
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Aún no hay registros recientes en productos, gastos o
                    cotizaciones.
                  </p>
                </div>
              ) : (
                recentActivity.map((item) => {
                  const Icon = movementIcon(item.type);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedMovement(item)}
                      className="w-full rounded-2xl border border-border bg-surface-soft p-4 text-left transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/40"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${movementTone(
                            item.type,
                          )}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-primary">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-text-secondary">
                            {item.description}
                          </p>
                          <p className="mt-2 text-xs text-text-muted">
                            {item.type === "gasto"
                              ? formatTimestampDateTime(item.date)
                              : formatTimestampDateTime(item.date)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </section>

      <MovementDetailModal
        item={selectedMovement}
        onClose={() => setSelectedMovement(null)}
      />
    </>
  );
}
