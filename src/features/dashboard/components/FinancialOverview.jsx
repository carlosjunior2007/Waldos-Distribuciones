import { ArrowDownToLine, ArrowUpRight, Banknote, Boxes, CircleDollarSign, CreditCard, PackageCheck, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { formatMoney } from "../../../utils/formatters";

function MoneyCard({ label, value, note, icon: Icon, tone = "primary", strong = false }) {
  const toneClasses = {
    success: "bg-success-50 text-success-700 border-success-100",
    error: "bg-error-50 text-error-700 border-error-100",
    warning: "bg-warning-50 text-warning-800 border-warning-100",
    info: "bg-info-50 text-info-700 border-info-100",
    primary: "bg-primary-50 text-primary-700 border-primary-100",
  };

  return (
    <article className={`rounded-[26px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] ${strong ? "md:col-span-2" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-text-muted">
            {label}
          </p>
          <p className={`mt-3 font-black text-text-primary ${strong ? "text-4xl" : "text-3xl"}`}>
            {value}
          </p>
          <p className="mt-2 text-sm leading-5 text-text-secondary">{note}</p>
        </div>

        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

export default function FinancialOverview({ resumen }) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MoneyCard
        strong
        label="Ganancia neta real"
        value={formatMoney(resumen.gananciaNetaReal)}
        note={`Después de costo FIFO y gastos. Margen: ${resumen.margenReal.toFixed(1)}%.`}
        icon={TrendingUp}
        tone={resumen.gananciaNetaReal >= 0 ? "success" : "error"}
      />

      <MoneyCard
        label="Vendido real s/IVA"
        value={formatMoney(resumen.ventaReal)}
        note="Pedidos entregados y pagados dentro del periodo."
        icon={ReceiptText}
        tone="info"
      />

      <MoneyCard
        label="Costo real FIFO"
        value={formatMoney(resumen.costoFifo)}
        note="Costo de mercancía realmente consumida por entregas."
        icon={Boxes}
        tone="warning"
      />

      <MoneyCard
        label="Gastos del periodo"
        value={formatMoney(resumen.gastoTotal)}
        note="Gastos registrados, incluyendo los asociados a pedidos."
        icon={WalletCards}
        tone="error"
      />

      <MoneyCard
        label="Compras inventario"
        value={formatMoney(resumen.comprasTotal)}
        note={`${resumen.totalCompras} compra(s) con factura o referencia.`}
        icon={ArrowDownToLine}
        tone="primary"
      />

      <MoneyCard
        label="Valor FIFO disponible"
        value={formatMoney(resumen.valorFifoDisponible)}
        note={`${resumen.stockDisponible} unidades disponibles en lotes.`}
        icon={PackageCheck}
        tone="info"
      />

      <MoneyCard
        label="Cobrado registrado"
        value={formatMoney(resumen.montoPagado)}
        note={`${resumen.pagosConMonto || 0} pedido(s) con monto de pago capturado.`}
        icon={Banknote}
        tone="success"
      />

      <MoneyCard
        label="Pendiente de cobro"
        value={formatMoney(resumen.valorPendienteCobro)}
        note={`${resumen.pagosPendientes} pedido(s) pendientes de pago.`}
        icon={CreditCard}
        tone="warning"
      />

      <MoneyCard
        label="Ganancia bruta real"
        value={formatMoney(resumen.gananciaReal)}
        note="Venta real menos costo FIFO, antes de gastos."
        icon={ArrowUpRight}
        tone="success"
      />
    </section>
  );
}
