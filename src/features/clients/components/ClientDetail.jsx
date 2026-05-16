import { useMemo, useState } from "react";

import {
  Building2,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ReceiptText,
  Star,
  Trash2,
  User2,
} from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import LabelsPanel from "./LabelsPanel";
import { formatMoney } from "../../../utils/formatters";
import { formatDateTimeTijuana } from "../../../utils/dates";
import {
  buildClientAddress,
  buildDeliveryAddress,
  calculateOrderProfit,
  calculateOrderProgress,
  getOrderDisplayStatus,
  getClientOrderTotals,
  isOrderProfitRealized,
} from "../client.helpers";

export default function ClientDetail({
  client,
  orders,
  totals,
  loadingOrders,
  onEdit,
  onDelete,
  labels,
}) {
  const deliveryAddresses = client.cliente_direcciones || [];
  const [orderPeriod, setOrderPeriod] = useState("all");

  const filteredOrders = useMemo(
    () => filterOrdersByPeriod(orders, orderPeriod),
    [orders, orderPeriod],
  );

  const filteredTotals = useMemo(
    () => getClientOrderTotals(filteredOrders),
    [filteredOrders],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-border bg-background p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar client={client} size="lg" />

            <div>
              <p className="text-sm font-semibold text-accent-600">Cliente</p>

              <h2 className="text-2xl font-bold text-text-primary">
                {client.nombre}
              </h2>

              {client.razon_social ? (
                <p className="mt-1 text-sm text-text-secondary">
                  {client.razon_social}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-error-200 bg-error-50 px-4 text-sm font-semibold text-error-700"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <InfoCard icon={FileText} label="RFC" value={client.rfc} />
          <InfoCard icon={Building2} label="Razón social" value={client.razon_social} />
          <InfoCard icon={Phone} label="Teléfono" value={client.numero} />
          <InfoCard icon={Mail} label="Correo" value={client.correo} />
          <InfoCard icon={MapPin} label="Dirección fiscal" value={buildClientAddress(client)} />
          <InfoCard
            icon={ReceiptText}
            label="Uso CFDI / Régimen"
            value={[client.uso_cfdi, client.regimen_fiscal].filter(Boolean).join(" · ")}
          />
        </div>

        {client.notas ? (
          <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Notas
            </p>

            <p className="mt-2 text-sm text-text-secondary">{client.notas}</p>
          </div>
        ) : null}
      </div>

      <section className="rounded-[24px] border border-border bg-background p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent-600">Entregas</p>
            <h3 className="mt-1 text-xl font-bold text-text-primary">
              Direcciones del cliente
            </h3>
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold"
          >
            <Pencil className="h-4 w-4" />
            Editar direcciones
          </button>
        </div>

        {!deliveryAddresses.length ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-soft p-5 text-sm text-text-secondary">
            Este cliente todavía no tiene direcciones de entrega.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {deliveryAddresses.map((address) => (
              <AddressCard key={address.id} address={address} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[24px] border border-border bg-background">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent-600">Etiquetas</p>
              <h3 className="mt-1 text-xl font-bold text-text-primary">
                Etiquetas del cliente
              </h3>
            </div>

            <button
              type="button"
              onClick={labels?.openCreateModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-white"
            >
              Nueva etiqueta
            </button>
          </div>
        </div>

        <LabelsPanel
          selectedClient={client}
          labels={labels?.labels || []}
          loading={labels?.loadingLabels}
          onCreateLabel={labels?.openCreateModal}
          onEditLabel={labels?.openEditModal}
          onDeleteLabel={labels?.setLabelToDelete}
          onQuickDownload={labels?.quickDownload}
        />
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Pedidos" value={filteredTotals.count} />
        <MiniStat label="Total en pedidos" value={formatMoney(filteredTotals.total)} />
        <MiniStat
          label="Ganancia estimada"
          value={formatMoney(filteredTotals.estimatedProfit)}
          hint={`Realizada: ${formatMoney(filteredTotals.realizedProfit)}`}
        />
      </div>

      <section className="rounded-[24px] border border-border bg-background">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent-600">Pedidos</p>

              <h3 className="mt-1 text-xl font-bold text-text-primary">
                Asociados al cliente
              </h3>
            </div>

            <OrderPeriodFilter value={orderPeriod} onChange={setOrderPeriod} />
          </div>
        </div>

        {loadingOrders ? (
          <EmptyState loading title="Cargando pedidos..." />
        ) : !orders.length ? (
          <EmptyState
            title="Sin pedidos asociados"
            description="Cuando crees pedidos para este cliente, aparecerán aquí."
          />
        ) : !filteredOrders.length ? (
          <EmptyState
            title="Sin pedidos en este filtro"
            description="Este cliente tiene pedidos, pero ninguno cae en el periodo seleccionado."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-surface-soft">
                <tr>
                  {["Pedido", "Estado", "Pago", "Total", "Ganancia", "Progreso", "Fecha"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}


const ORDER_PERIODS = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
  { value: "all", label: "Todo" },
];

function OrderPeriodFilter({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-1">
      {ORDER_PERIODS.map((period) => {
        const active = value === period.value;

        return (
          <button
            key={period.value}
            type="button"
            onClick={() => onChange(period.value)}
            className={`h-9 rounded-xl px-3 text-sm font-semibold transition ${
              active
                ? "bg-accent-500 text-white shadow-sm"
                : "text-text-secondary hover:bg-background hover:text-text-primary"
            }`}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}

function filterOrdersByPeriod(orders = [], period = "all") {
  if (period === "all") return orders;

  const now = new Date();

  return orders.filter((order) => {
    const orderDate = getOrderDate(order);
    if (!orderDate) return false;

    if (period === "week") return isSameWeek(orderDate, now);
    if (period === "month") return isSameMonth(orderDate, now);
    if (period === "year") return isSameYear(orderDate, now);

    return true;
  });
}

function getOrderDate(order = {}) {
  const rawDate = order.fecha_emision || order.created_at || order.updated_at;
  if (!rawDate) return null;

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameWeek(date, reference) {
  const start = getStartOfWeek(reference);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
}

function getStartOfWeek(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  return start;
}

function isSameMonth(date, reference) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function isSameYear(date, reference) {
  return date.getFullYear() === reference.getFullYear();
}

function AddressCard({ address }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-text-secondary">
            <MapPin className="h-4 w-4" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-text-primary">{address.nombre}</p>

              {address.es_principal ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-1 text-xs font-semibold text-accent-700">
                  <Star className="h-3 w-3" />
                  Principal
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm text-text-secondary">
              {buildDeliveryAddress(address) || "Sin dirección"}
            </p>

            {[address.contacto_nombre, address.contacto_telefono]
              .filter(Boolean)
              .length ? (
              <p className="mt-2 text-xs font-medium text-text-muted">
                {[address.contacto_nombre, address.contacto_telefono]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}

            {address.notas ? (
              <p className="mt-2 text-xs text-text-muted">{address.notas}</p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function Avatar({ client, size = "md" }) {
  const box =
    size === "lg" ? "h-20 w-20 rounded-[24px]" : "h-12 w-12 rounded-2xl";

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center overflow-hidden border border-border bg-white`}
    >
      {client.logo ? (
        <img
          src={client.logo}
          alt={client.nombre}
          className="h-full w-full object-contain"
        />
      ) : (
        <User2
          className={
            size === "lg"
              ? "h-8 w-8 text-text-muted"
              : "h-5 w-5 text-text-muted"
          }
        />
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4" />

        <p className="text-xs font-semibold uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-text-primary">
        {value || "Sin información"}
      </p>
    </div>
  );
}

function OrderRow({ order }) {
  const profit = calculateOrderProfit(order);
  const progress = calculateOrderProgress(order);
  const status = getOrderDisplayStatus(order);
  const realized = isOrderProfitRealized(order);

  return (
    <tr className="border-t border-border">
      <td className="px-5 py-4 text-sm font-semibold text-text-primary">
        <div>{order.folio}</div>
        <div className="mt-1 text-xs font-medium text-text-muted">
          {order.metodo_pago || "Sin método"}
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-text-secondary">
        <StatusPill value={status} />
      </td>

      <td className="px-5 py-4 text-sm text-text-secondary">
        <StatusPill value={order.estado_pago || "pendiente"} />
      </td>

      <td className="px-5 py-4 text-sm font-semibold text-text-primary">
        {formatMoney(order.total)}
      </td>

      <td className="px-5 py-4 text-sm">
        <div className="font-semibold text-success-700">
          {formatMoney(profit.profit)}
        </div>
        <div className="mt-1 text-xs text-text-muted">
          {profit.margin.toFixed(1)}% utilidad
        </div>
        <div className="mt-1 text-xs text-text-muted">
          {realized ? "Realizada" : "Estimada"}
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-text-secondary">
        <div className="font-semibold text-text-primary">
          {progress.delivered}/{progress.total} unidades
        </div>
        <div className="mt-1 text-xs text-text-muted">
          Pendiente: {progress.pending}
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-text-secondary">
        {formatDateTimeTijuana(order.fecha_emision || order.created_at)}
      </td>
    </tr>
  );
}

function StatusPill({ value }) {
  const label = String(value || "pendiente");
  const normalized = label.toLowerCase();

  const className =
    normalized === "pagado" || normalized === "entregado"
      ? "bg-success-50 text-success-700 border-success-200"
      : normalized === "cancelado"
        ? "bg-error-50 text-error-700 border-error-200"
        : "bg-surface text-text-secondary border-border";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}

function MiniStat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs font-medium text-text-muted">{hint}</p> : null}
    </div>
  );
}
