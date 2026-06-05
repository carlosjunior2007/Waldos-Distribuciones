import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  Package,
  Pencil,
  ReceiptText,
  Truck,
} from "lucide-react";

import {
  calculateDerivedOrderStatus,
  calculateLineProfit,
  calculateOrderProfit,
  calculateOrderProgress,
  formatDate,
  formatMoney,
  getAddressLabel,
  getOrderStatusMeta,
  getPaymentStatusMeta,
  isOrderProfitRealized,
} from "../order.helpers";

import OrderProgressBar from "../components/OrderProgressBar";
import OrderStatusBadge from "../components/OrderStatusBadge";

export default function PedidoDetallePage({
  order,
  onBack,
  onEdit,
  onScheduleDelivery,
  onViewDeliveries,
  onDownloadCounterReceipt,
  onDownloadPdf,
  onOpenInvoice,
}) {
  if (!order) return null;

  const status = getOrderStatusMeta(calculateDerivedOrderStatus(order));
  const payment = getPaymentStatusMeta(order.estado_pago);
  const progress = calculateOrderProgress(order.details || []);
  const profit = calculateOrderProfit(order.details || []);
  const showProfit = isOrderProfitRealized(order);

  return (
    <section className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-black text-text-primary transition hover:bg-surface-soft"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a pedidos
        </button>

        <header className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-sm">
          <div className="grid gap-6 border-b border-border px-5 py-6 md:px-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-accent-600">
                Detalle del pedido
              </p>
              <h1 className="mt-2 truncate text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                {order.folio}
              </h1>
              <p className="mt-2 truncate text-sm font-semibold text-text-secondary">
                {order.cliente_nombre} · {order.quotation ? `Cotización ${order.quotation.folio}` : "Sin cotización asociada"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <OrderStatusBadge meta={status} />
                <OrderStatusBadge meta={payment} />
                <InvoiceStatusPill order={order} />
                {order.tracking_token ? <SoftTag>Tracking {order.tracking_token}</SoftTag> : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <ActionButton onClick={() => onEdit?.(order)} icon={Pencil} label="Editar" />
              <ActionButton onClick={() => onDownloadPdf?.(order)} icon={Download} label="PDF" />
              <ActionButton onClick={() => onOpenInvoice?.(order)} icon={ReceiptText} label="Factura" />
              <ActionButton onClick={() => onScheduleDelivery?.(order)} icon={Truck} label="Programar entrega" primary />
            </div>
          </div>

          <div className="grid gap-0 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            <HeroMetric label="Total" value={formatMoney(order.total)} helper={`IVA ${Number(order.iva_porcentaje || 0)}%`} />
            <HeroMetric label="Ganancia" value={formatMoney(profit.profit)} helper={`${profit.margin.toFixed(1)}% · ${showProfit ? "realizada" : "estimada"}`} tone={profit.profit >= 0 ? "success" : "error"} />
            <HeroMetric label="Entregado" value={`${progress.delivered}/${progress.total}`} helper={`${progress.pending} unidades pendientes`} />
            <HeroMetric label="Entregas" value={order.deliveries?.length || 0} helper="Registros de entrega" />
          </div>
        </header>

        <main className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="grid gap-6">
            <Panel>
              <SectionTitle eyebrow="Productos" title="Productos del pedido" icon={Package} />

              <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                <div className="hidden grid-cols-[minmax(0,1.3fr)_repeat(5,minmax(90px,0.5fr))] gap-4 border-b border-border bg-surface-soft px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-text-muted lg:grid">
                  <span>Producto</span>
                  <span>Pedida</span>
                  <span>Entregada</span>
                  <span>Pendiente</span>
                  <span>Importe</span>
                  <span>Ganancia</span>
                </div>

                <div className="divide-y divide-border">
                  {(order.details || []).map((item) => (
                    <ProductRow key={item.id || `${item.producto_id}-${item.codigo}`} item={item} />
                  ))}

                  {(order.details || []).length === 0 ? (
                    <EmptyBox>Este pedido no tiene productos registrados.</EmptyBox>
                  ) : null}
                </div>
              </div>
            </Panel>

            <Panel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SectionTitle eyebrow="Entregas" title="Seguimiento de entregas" icon={Truck} />
                <div className="flex flex-wrap gap-2">
                  <ActionButton onClick={() => onViewDeliveries?.(order)} icon={FileText} label="Ver entregas" compact />
                  <ActionButton onClick={() => onDownloadCounterReceipt?.(order)} icon={Download} label="Contra recibo" compact />
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {(order.deliveries || []).map((delivery) => (
                  <DeliveryRow key={delivery.id || delivery.folio} delivery={delivery} />
                ))}

                {(order.deliveries || []).length === 0 ? (
                  <EmptyBox>Todavía no hay entregas registradas para este pedido.</EmptyBox>
                ) : null}
              </div>
            </Panel>
          </section>

          <aside className="grid content-start gap-5">
            <Panel compact>
              <SectionTitle eyebrow="Cliente" title={order.cliente_nombre} />
              <div className="mt-4 grid gap-3 text-sm">
                <InfoLine label="Correo" value={order.cliente_email || "Sin correo"} />
                <InfoLine label="Teléfono" value={order.cliente_telefono || "Sin teléfono"} />
                <InfoLine label="Tracking" value={order.tracking_token || "Sin tracking"} />
              </div>
            </Panel>

            <Panel compact>
              <SectionTitle eyebrow="Progreso" title="Entrega" />
              <div className="mt-4">
                <OrderProgressBar details={order.details || []} />
              </div>
            </Panel>

            <Panel compact>
              <SectionTitle eyebrow="Totales" title="Resumen" />
              <div className="mt-5 grid gap-3">
                <MoneyRow label="Subtotal" value={formatMoney(profit.subtotal)} />
                <MoneyRow label="Costo" value={formatMoney(profit.cost)} />
                <MoneyRow label="Ganancia" value={formatMoney(profit.profit)} tone={profit.profit >= 0 ? "success" : "error"} strong />
                <MoneyRow label="Margen" value={`${profit.margin.toFixed(1)}%`} />
                <MoneyRow label={`IVA ${Number(order.iva_porcentaje || 0)}%`} value={formatMoney(order.iva_monto)} />
                <div className="mt-2 border-t border-border pt-4">
                  <MoneyRow label="Total" value={formatMoney(order.total)} strong big />
                </div>
              </div>
            </Panel>

            <Panel compact>
              <SectionTitle eyebrow="Fechas" title="Periodo" />
              <div className="mt-4 grid gap-3">
                <DateInfo label="Inicio" value={formatDate(order.entrega_inicio)} />
                <DateInfo label="Fin" value={formatDate(order.entrega_fin)} />
              </div>
            </Panel>

            <Panel compact>
              <SectionTitle eyebrow="Cotización" title="Asociada" />
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-soft px-4 py-3 text-sm font-semibold text-text-secondary">
                {order.quotation ? (
                  <div className="grid gap-2">
                    <InfoLine label="Folio" value={order.quotation.folio} />
                    <InfoLine label="Cliente" value={order.quotation.cliente_nombre || order.cliente_nombre} />
                    <InfoLine label="Total" value={formatMoney(order.quotation.total)} />
                  </div>
                ) : (
                  "Este pedido no está asociado a una cotización."
                )}
              </div>
            </Panel>
          </aside>
        </main>
      </div>
    </section>
  );
}

function ActionButton({ onClick, icon: Icon, label, primary = false, compact = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-black transition ${
        compact ? "h-10 px-4" : "h-11 px-4"
      } ${
        primary
          ? "bg-primary-600 text-white hover:bg-primary-700"
          : "border border-border bg-surface text-text-primary hover:bg-surface-soft"
      }`}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {label}
    </button>
  );
}

function HeroMetric({ label, value, helper, tone }) {
  const toneClass = tone === "success" ? "text-success-700" : tone === "error" ? "text-error-700" : "text-text-primary";

  return (
    <article className="bg-surface px-5 py-5 md:px-7">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-black tracking-tight ${toneClass}`}>{value}</p>
      {helper ? <p className="mt-1 text-sm font-semibold text-text-secondary">{helper}</p> : null}
    </article>
  );
}

function Panel({ children, compact = false }) {
  return (
    <article className={`rounded-[24px] border border-border bg-surface shadow-sm ${compact ? "p-5" : "p-5 md:p-6"}`}>
      {children}
    </article>
  );
}

function SectionTitle({ eyebrow, title, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">{eyebrow}</p>
        <h2 className="mt-1 truncate text-xl font-black tracking-tight text-text-primary">{title}</h2>
      </div>
      {Icon ? <Icon className="h-5 w-5 shrink-0 text-text-muted" /> : null}
    </div>
  );
}

function ProductRow({ item }) {
  const profit = calculateLineProfit(item);

  return (
    <div className="grid gap-3 bg-surface px-4 py-4 transition hover:bg-surface-soft/60 lg:grid-cols-[minmax(0,1.3fr)_repeat(5,minmax(90px,0.5fr))] lg:items-center">
      <div className="min-w-0">
        <p className="truncate font-black text-text-primary">{item.nombre_producto}</p>
        <p className="mt-1 text-xs font-semibold text-text-muted">{item.codigo || "Sin código"}</p>
      </div>

      <MiniMetric label="Pedida" value={Number(item.cantidad_pedida || 0)} />
      <MiniMetric label="Entregada" value={Number(item.cantidad_entregada || 0)} />
      <MiniMetric label="Pendiente" value={Number(item.cantidad_pendiente || 0)} />
      <MiniMetric label="Importe" value={formatMoney(item.importe)} strong />
      <MiniMetric label="Ganancia" value={formatMoney(profit.profit)} strong tone={profit.profit >= 0 ? "success" : "error"} />
    </div>
  );
}

function MiniMetric({ label, value, strong = false, tone }) {
  const toneClass = tone === "success" ? "text-success-700" : tone === "error" ? "text-error-700" : "text-text-primary";

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-muted lg:hidden">{label}</p>
      <p className={`mt-0.5 truncate ${strong ? "font-black" : "font-bold"} ${toneClass}`}>{value}</p>
    </div>
  );
}

function DeliveryRow({ delivery }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-soft p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="truncate font-black text-text-primary">{delivery.folio || "Entrega"}</p>
          <p className="mt-1 text-sm font-semibold text-text-secondary">
            {formatDate(delivery.fecha_entrega)} · {delivery.is_pickup ? "Recogido por el cliente" : getAddressLabel(delivery.address)}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
          {delivery.estado || "pendiente"}
        </span>
      </div>
    </div>
  );
}

function MoneyRow({ label, value, strong = false, big = false, tone }) {
  const toneClass = tone === "success" ? "text-success-700" : tone === "error" ? "text-error-700" : "text-text-primary";

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-semibold text-text-secondary">{label}</span>
      <span className={`${strong ? "font-black" : "font-bold"} ${big ? "text-2xl" : "text-base"} ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-text-muted">{label}</span>
      <span className="max-w-[65%] text-right font-black text-text-primary break-words">{value}</span>
    </div>
  );
}

function DateInfo({ label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-soft px-4 py-3">
      <CalendarDays className="h-4 w-4 text-accent-500" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">{label}</p>
        <p className="mt-1 font-black text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function EmptyBox({ children }) {
  return (
    <div className="bg-surface px-4 py-6 text-sm font-semibold text-text-muted">
      {children}
    </div>
  );
}

function SoftTag({ children }) {
  return (
    <span className="inline-flex rounded-full bg-surface-soft px-3 py-1 text-xs font-black text-text-secondary">
      {children}
    </span>
  );
}

function InvoiceStatusPill({ order }) {
  const status = String(order?.factura_status || "").toLowerCase();

  if (status === "cancelada") {
    return <span className="inline-flex rounded-full border border-error-100 bg-error-50 px-3 py-1.5 text-xs font-semibold text-error-700">CFDI cancelado</span>;
  }

  if (status === "timbrada" && (order?.factura_uuid || order?.facturama_id)) {
    return <span className="inline-flex rounded-full border border-success-100 bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-700">Timbrado</span>;
  }

  if (status === "error") {
    return <span className="inline-flex rounded-full border border-warning-100 bg-warning-50 px-3 py-1.5 text-xs font-semibold text-warning-700">Error factura</span>;
  }

  return <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">No timbrado</span>;
}
