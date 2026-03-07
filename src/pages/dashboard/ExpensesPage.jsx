import {
  Wallet,
  Search,
  SlidersHorizontal,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Receipt,
  Truck,
  Package,
  CircleDollarSign,
  CalendarDays,
  Building2,
  AlertTriangle,
  BadgeDollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  BanknoteArrowUp,
  BanknoteArrowDown,
} from "lucide-react";

const MOVEMENTS = [
  {
    id: 1,
    concepto: "Compra de detergente Arcoiris",
    tipo: "gasto_compra",
    tercero: "Proveedor del Norte",
    fecha: "06 Mar 2026",
    monto: "$4,250.00",
    referencia: "MOV-2026-001",
    estado: "registrado",
    naturaleza: "gasto",
  },
  {
    id: 2,
    concepto: "Flete de mercancía",
    tipo: "gasto_envio",
    tercero: "Transportes Frontera",
    fecha: "05 Mar 2026",
    monto: "$980.00",
    referencia: "MOV-2026-002",
    estado: "registrado",
    naturaleza: "gasto",
  },
  {
    id: 3,
    concepto: "Ganancia por cotización COT-2026-003",
    tipo: "ganancia_cotizacion",
    tercero: "Comercial Las Torres",
    fecha: "04 Mar 2026",
    monto: "$3,920.00",
    referencia: "MOV-2026-003",
    estado: "registrado",
    naturaleza: "ganancia",
  },
  {
    id: 4,
    concepto: "Gasto no clasificado",
    tipo: "gasto_extra",
    tercero: "Caja chica",
    fecha: "03 Mar 2026",
    monto: "$320.00",
    referencia: "MOV-2026-004",
    estado: "pendiente",
    naturaleza: "gasto",
  },
  {
    id: 5,
    concepto: "Ganancia por cotización COT-2026-005",
    tipo: "ganancia_cotizacion",
    tercero: "Farmacia del Valle",
    fecha: "02 Mar 2026",
    monto: "$1,760.00",
    referencia: "MOV-2026-005",
    estado: "registrado",
    naturaleza: "ganancia",
  },
];

function getMovementType(type) {
  if (type === "gasto_compra") {
    return {
      label: "Gasto de compra",
      icon: Package,
      className: "border-primary-100 bg-primary-50 text-primary-700",
    };
  }

  if (type === "gasto_envio") {
    return {
      label: "Gasto de envío",
      icon: Truck,
      className: "border-info-100 bg-info-50 text-info-700",
    };
  }

  if (type === "gasto_operativo") {
    return {
      label: "Gasto operativo",
      icon: Wallet,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  if (type === "ganancia_cotizacion") {
    return {
      label: "Ganancia de cotización",
      icon: TrendingUp,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  return {
    label: "Gasto extra",
    icon: Receipt,
    className: "border-accent-100 bg-accent-50 text-accent-700",
  };
}

function getMovementStatus(status) {
  if (status === "registrado") {
    return {
      label: "Registrado",
      icon: BadgeDollarSign,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  return {
    label: "Pendiente",
    icon: AlertTriangle,
    className: "border-warning-100 bg-warning-50 text-warning-700",
  };
}

function getNatureStyles(nature) {
  if (nature === "ganancia") {
    return {
      label: "Ganancia",
      icon: BanknoteArrowUp,
      className: "border-success-100 bg-success-50 text-success-700",
      amountClass:
        "border-success-100 bg-success-50 text-success-700",
    };
  }

  return {
    label: "Gasto",
    icon: BanknoteArrowDown,
    className: "border-error-100 bg-error-50 text-error-700",
    amountClass:
      "border-error-100 bg-error-50 text-error-700",
  };
}

function FilterPill({ label, active = false }) {
  return (
    <button
      type="button"
      className={[
        "inline-flex items-center rounded-full border px-3 py-2 text-sm font-semibold transition",
        active
          ? "border-accent-500 bg-accent-500 text-white"
          : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-soft hover:text-text-primary",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function SummaryCard({ icon: Icon, title, value, note, tone = "primary" }) {
  const toneStyles =
    tone === "success"
      ? "border-success-100 bg-success-50 text-success-700"
      : tone === "warning"
        ? "border-warning-100 bg-warning-50 text-warning-700"
        : tone === "error"
          ? "border-error-100 bg-error-50 text-error-700"
          : "border-primary-100 bg-primary-50 text-primary-700";

  return (
    <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneStyles}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-sm text-text-muted">{note}</p>
    </article>
  );
}

export default function ExpensesPage() {
  return (
    <section className="space-y-6">
      {/* summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={TrendingDown}
          title="Gastos totales"
          value="$28,450.00"
          note="Egresos acumulados registrados en el sistema."
          tone="error"
        />

        <SummaryCard
          icon={TrendingUp}
          title="Ganancias totales"
          value="$46,920.00"
          note="Ingresos o utilidades asociadas a cotizaciones completadas."
          tone="success"
        />

        <SummaryCard
          icon={CircleDollarSign}
          title="Utilidad neta"
          value="$18,470.00"
          note="Resultado estimado entre ganancias y gastos."
          tone="primary"
        />

        <SummaryCard
          icon={AlertTriangle}
          title="Pendientes"
          value="3"
          note="Movimientos aún por revisar o clasificar."
          tone="warning"
        />
      </div>

      {/* main panel */}
      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        {/* header */}
        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent-600">
              Gestión financiera
            </p>
            <h3 className="mt-1 text-xl font-bold text-text-primary md:text-2xl">
              Gastos y ganancias
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
              Visualiza egresos, ganancias y movimientos económicos para tener
              un panorama más claro del rendimiento real del negocio.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            <Plus className="h-4 w-4" />
            Registrar movimiento
          </button>
        </div>

        {/* controls */}
        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar por concepto, cliente, proveedor o referencia..."
                className="h-12 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill label="Todos" active />
            <FilterPill label="Ganancias" />
            <FilterPill label="Gastos" />
            <FilterPill label="Compras" />
            <FilterPill label="Envíos" />
            <FilterPill label="Pendientes" />
          </div>
        </div>

        {/* desktop table */}
<div className="hidden xl:block">
  <div className="overflow-x-auto">
    <table className="min-w-full table-fixed">
      <thead className="bg-surface-soft">
        <tr>
          <th className="w-[24%] px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Concepto
          </th>
          <th className="w-[12%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Referencia
          </th>
          <th className="w-[16%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Tipo
          </th>
          <th className="w-[11%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Naturaleza
          </th>
          <th className="w-[15%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Tercero
          </th>
          <th className="w-[11%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Fecha
          </th>
          <th className="w-[11%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Estado
          </th>
          <th className="w-[12%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Monto
          </th>
          <th className="w-[10%] px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Acciones
          </th>
        </tr>
      </thead>

      <tbody>
        {MOVEMENTS.map((item) => {
          const movementType = getMovementType(item.tipo);
          const TypeIcon = movementType.icon;

          const movementStatus = getMovementStatus(item.estado);
          const StatusIcon = movementStatus.icon;

          const nature = getNatureStyles(item.naturaleza);
          const NatureIcon = nature.icon;

          return (
            <tr
              key={item.id}
              className="border-t border-border align-top transition hover:bg-surface-soft/70"
            >
              {/* concepto */}
              <td className="px-6 py-5">
                <div className="pr-3">
                  <p className="line-clamp-2 text-sm font-semibold leading-6 text-text-primary">
                    {item.concepto}
                  </p>
                </div>
              </td>

              {/* referencia */}
              <td className="px-4 py-5">
                <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-border bg-surface-soft px-3 py-2 text-sm font-medium text-text-primary">
                  <FileText className="h-4 w-4 shrink-0 text-primary-500" />
                  <span className="truncate">{item.referencia}</span>
                </div>
              </td>

              {/* tipo */}
              <td className="px-4 py-5">
                <span
                  className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${movementType.className}`}
                >
                  <TypeIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{movementType.label}</span>
                </span>
              </td>

              {/* naturaleza */}
              <td className="px-4 py-5">
                <span
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${nature.className}`}
                >
                  <NatureIcon className="h-3.5 w-3.5 shrink-0" />
                  {nature.label}
                </span>
              </td>

              {/* tercero */}
              <td className="px-4 py-5">
                <div className="flex items-start gap-2 pr-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                  <span className="line-clamp-2 text-sm leading-5 text-text-primary">
                    {item.tercero}
                  </span>
                </div>
              </td>

              {/* fecha */}
              <td className="px-4 py-5">
                <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary-500" />
                  <span className="whitespace-nowrap">{item.fecha}</span>
                </div>
              </td>

              {/* estado */}
              <td className="px-4 py-5">
                <span
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${movementStatus.className}`}
                >
                  <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                  {movementStatus.label}
                </span>
              </td>

              {/* monto */}
              <td className="px-4 py-5">
                <div
                  className={`inline-flex whitespace-nowrap items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${nature.amountClass}`}
                >
                  <CircleDollarSign className="h-4 w-4 shrink-0" />
                  {item.monto}
                </div>
              </td>

              {/* acciones */}
              <td className="px-4 py-5">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>

        {/* mobile cards */}
        <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
          {MOVEMENTS.map((item) => {
            const movementType = getMovementType(item.tipo);
            const TypeIcon = movementType.icon;

            const movementStatus = getMovementStatus(item.estado);
            const StatusIcon = movementStatus.icon;

            const nature = getNatureStyles(item.naturaleza);
            const NatureIcon = nature.icon;

            return (
              <article
                key={item.id}
                className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {item.concepto}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {item.referencia}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${nature.className}`}
                    >
                      <NatureIcon className="h-3.5 w-3.5" />
                      {nature.label}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${movementStatus.className}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {movementStatus.label}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Tercero
                    </p>
                    <p className="mt-2 text-sm font-medium text-text-primary">
                      {item.tercero}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Fecha
                    </p>
                    <p className="mt-2 text-sm font-medium text-text-primary">
                      {item.fecha}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Tipo
                    </p>
                    <p className="mt-2 text-sm font-medium text-text-primary">
                      {movementType.label}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Monto
                    </p>
                    <p
                      className={`mt-2 text-sm font-bold ${
                        item.naturaleza === "ganancia"
                          ? "text-success-700"
                          : "text-error-700"
                      }`}
                    >
                      {item.monto}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${movementType.className}`}
                  >
                    <TypeIcon className="h-3.5 w-3.5" />
                    {movementType.label}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}