import {
  Search,
  SlidersHorizontal,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CheckCircle2,
  XCircle,
  TimerReset,
  FileText,
} from "lucide-react";

const QUOTATIONS = [
  {
    id: 1,
    folio: "COT-2026-001",
    cliente: "Distribuidora El Roble",
    fecha: "06 Mar 2026",
    vence: "21 Mar 2026",
    total: "$12,450.00",
    ganancia: "$2,180.00",
    estado: "pendiente",
  },
  {
    id: 2,
    folio: "COT-2026-002",
    cliente: "Papelería Central",
    fecha: "05 Mar 2026",
    vence: "20 Mar 2026",
    total: "$8,920.00",
    ganancia: "$1,430.00",
    estado: "en_proceso",
  },
  {
    id: 3,
    folio: "COT-2026-003",
    cliente: "Comercial Las Torres",
    fecha: "01 Mar 2026",
    vence: "16 Mar 2026",
    total: "$18,300.00",
    ganancia: "$3,920.00",
    estado: "completado",
  },
  {
    id: 4,
    folio: "COT-2026-004",
    cliente: "Abarrotes San Miguel",
    fecha: "14 Feb 2026",
    vence: "29 Feb 2026",
    total: "$6,780.00",
    ganancia: "$0.00",
    estado: "cancelado",
  },
  {
    id: 5,
    folio: "COT-2026-005",
    cliente: "Farmacia del Valle",
    fecha: "03 Mar 2026",
    vence: "18 Mar 2026",
    total: "$9,640.00",
    ganancia: "$1,760.00",
    estado: "pendiente",
  },
];

function getStatusStyles(status) {
  if (status === "pendiente") {
    return {
      label: "Pendiente",
      icon: Clock3,
      className:
        "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  if (status === "en_proceso") {
    return {
      label: "En proceso",
      icon: TimerReset,
      className:
        "border-info-100 bg-info-50 text-info-700",
    };
  }

  if (status === "completado") {
    return {
      label: "Completado",
      icon: CheckCircle2,
      className:
        "border-success-100 bg-success-50 text-success-700",
    };
  }

  return {
    label: "Cancelado",
    icon: XCircle,
    className:
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

export default function QuotationsPage() {
  return (
    <section className="space-y-6">
      {/* top summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Cotizaciones totales
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                126
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-700">
              <FileText className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-sm text-text-muted">
            Historial acumulado de cotizaciones registradas.
          </p>
        </article>

        <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Pendientes
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                18
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-warning-100 bg-warning-50 text-warning-700">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-sm text-text-muted">
            Esperando seguimiento o respuesta del cliente.
          </p>
        </article>

        <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                En proceso
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                9
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-info-100 bg-info-50 text-info-700">
              <TimerReset className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-sm text-text-muted">
            Cotizaciones con seguimiento activo o negociación.
          </p>
        </article>

        <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Completadas
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                64
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-success-100 bg-success-50 text-success-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-sm text-text-muted">
            Cotizaciones cerradas con compra confirmada.
          </p>
        </article>
      </div>

      {/* main panel */}
      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        {/* top bar */}
        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent-600">
              Gestión comercial
            </p>
            <h3 className="mt-1 text-xl font-bold text-text-primary md:text-2xl">
              Cotizaciones
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Revisa el historial, el estado, la fecha de vencimiento y el
              rendimiento de cada cotización.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            <Plus className="h-4 w-4" />
            Nueva cotización
          </button>
        </div>

        {/* controls */}
        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar por folio o cliente..."
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
            <FilterPill label="Todas" active />
            <FilterPill label="Pendientes" />
            <FilterPill label="En proceso" />
            <FilterPill label="Completadas" />
            <FilterPill label="Canceladas" />
            <FilterPill label="Por vencer" />
          </div>
        </div>

        {/* desktop table */}
        <div className="hidden xl:block">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-surface-soft">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Folio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Fechas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Ganancia
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {QUOTATIONS.map((item) => {
                  const status = getStatusStyles(item.estado);
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-border transition hover:bg-surface-soft/70"
                    >
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {item.folio}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            Cotización registrada
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-text-primary">
                          {item.cliente}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-1 flex items-start gap-4">
                          <div className="inline-flex items-center gap-1 text-sm text-text-secondary">
                            <CalendarDays className="h-4 w-4 text-primary-500" />
                            <span>Creada: {item.fecha}</span>
                          </div>
                          <div className="inline-flex items-center gap-1 text-sm text-text-secondary">
                            <Clock3 className="h-4 w-4 text-accent-500" />
                            <span>Vence: {item.vence}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-semibold text-text-primary">
                          {item.total}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-success-100 bg-success-50 px-3 py-2 text-sm font-semibold text-success-700">
                          <CircleDollarSign className="h-4 w-4" />
                          {item.ganancia}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700"
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
          {QUOTATIONS.map((item) => {
            const status = getStatusStyles(item.estado);
            const StatusIcon = status.icon;

            return (
              <article
                key={item.id}
                className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {item.folio}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {item.cliente}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${status.className}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      Vence
                    </p>
                    <p className="mt-2 text-sm font-medium text-text-primary">
                      {item.vence}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Total
                    </p>
                    <p className="mt-2 text-sm font-bold text-text-primary">
                      {item.total}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Ganancia
                    </p>
                    <p className="mt-2 text-sm font-bold text-success-700">
                      {item.ganancia}
                    </p>
                  </div>
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