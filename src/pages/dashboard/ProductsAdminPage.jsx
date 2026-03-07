import {
  Package,
  Search,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Boxes,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Barcode,
  Tag,
  Warehouse,
} from "lucide-react";

const PRODUCTS = [
  {
    id: 1,
    nombre: "Detergente en polvo Arcoiris",
    codigo: "DET-001",
    categoria: "Limpieza",
    stock: 120,
    costo: "$210.00",
    precio: "$320.00",
    estado: "activo",
  },
  {
    id: 2,
    nombre: "Cloro industrial 1L",
    codigo: "CLI-014",
    categoria: "Limpieza",
    stock: 36,
    costo: "$18.00",
    precio: "$28.00",
    estado: "activo",
  },
  {
    id: 3,
    nombre: "Jabón líquido manos 500ml",
    codigo: "JAB-031",
    categoria: "Higiene",
    stock: 8,
    costo: "$24.00",
    precio: "$39.00",
    estado: "stock_bajo",
  },
  {
    id: 4,
    nombre: "Servilletas paquete 500",
    codigo: "SER-020",
    categoria: "Desechables",
    stock: 0,
    costo: "$48.00",
    precio: "$72.00",
    estado: "agotado",
  },
  {
    id: 5,
    nombre: "Bolsa camiseta mediana",
    codigo: "BOL-008",
    categoria: "Desechables",
    stock: 84,
    costo: "$56.00",
    precio: "$84.00",
    estado: "activo",
  },
];

function ProductStatus(status) {
  if (status === "activo") {
    return {
      label: "Activo",
      icon: CheckCircle2,
      className: "border-success-100 bg-success-50 text-success-700",
    };
  }

  if (status === "stock_bajo") {
    return {
      label: "Stock bajo",
      icon: AlertTriangle,
      className: "border-warning-100 bg-warning-50 text-warning-700",
    };
  }

  return {
    label: "Agotado",
    icon: Archive,
    className: "border-error-100 bg-error-50 text-error-700",
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

export default function ProductsAdminPage() {
  return (
    <section className="space-y-6">
      {/* summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Boxes}
          title="Productos totales"
          value="248"
          note="Artículos registrados dentro del catálogo."
          tone="primary"
        />

        <SummaryCard
          icon={CheckCircle2}
          title="Activos"
          value="219"
          note="Productos disponibles para cotizar y vender."
          tone="success"
        />

        <SummaryCard
          icon={AlertTriangle}
          title="Stock bajo"
          value="17"
          note="Productos que requieren atención próximamente."
          tone="warning"
        />

        <SummaryCard
          icon={Archive}
          title="Agotados"
          value="12"
          note="Artículos sin existencia actual."
          tone="error"
        />
      </div>

      {/* main panel */}
      <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
        {/* header */}
        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent-600">
              Gestión comercial
            </p>
            <h3 className="mt-1 text-xl font-bold text-text-primary md:text-2xl">
              Productos
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
              Administra el catálogo, consulta el stock disponible y mantén
              control visual sobre el estado de cada producto.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            <Plus className="h-4 w-4" />
            Crear producto
          </button>
        </div>

        {/* controls */}
        <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
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
            <FilterPill label="Activos" />
            <FilterPill label="Stock bajo" />
            <FilterPill label="Agotados" />
            <FilterPill label="Limpieza" />
            <FilterPill label="Desechables" />
            <FilterPill label="Higiene" />
          </div>
        </div>

        {/* desktop table */}
        <div className="hidden xl:block">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-surface-soft">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Código
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Costo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {PRODUCTS.map((item) => {
                  const status = ProductStatus(item.estado);
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-border transition hover:bg-surface-soft/70"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-700">
                            <Package className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {item.nombre}
                            </p>
                            <p className="mt-1 text-xs text-text-muted">
                              Producto registrado en catálogo
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-soft px-3 py-2 text-sm font-medium text-text-primary">
                          <Barcode className="h-4 w-4 text-primary-500" />
                          {item.codigo}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-secondary">
                          <Tag className="h-4 w-4 text-accent-500" />
                          {item.categoria}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary">
                          <Warehouse className="h-4 w-4 text-primary-500" />
                          {item.stock} pzas
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm font-medium text-text-primary">
                        {item.costo}
                      </td>

                      <td className="px-6 py-5 text-sm font-bold text-text-primary">
                        {item.precio}
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
          {PRODUCTS.map((item) => {
            const status = ProductStatus(item.estado);
            const StatusIcon = status.icon;

            return (
              <article
                key={item.id}
                className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-700">
                      <Package className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {item.nombre}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {item.codigo}
                      </p>
                    </div>
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
                      Categoría
                    </p>
                    <p className="mt-2 text-sm font-medium text-text-primary">
                      {item.categoria}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Stock
                    </p>
                    <p className="mt-2 text-sm font-medium text-text-primary">
                      {item.stock} piezas
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Costo
                    </p>
                    <p className="mt-2 text-sm font-medium text-text-primary">
                      {item.costo}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-soft p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Precio
                    </p>
                    <p className="mt-2 text-sm font-bold text-text-primary">
                      {item.precio}
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