import {
  Building2,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ReceiptText,
  Trash2,
  User2,
} from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import { formatMoney } from "../../../utils/formatters";
import { formatDateTimeTijuana } from "../../../utils/dates";
import { buildClientAddress } from "../client.helpers";

export default function ClientDetail({
  client,
  quotations,
  totals,
  loadingQuotations,
  onEdit,
  onDelete,
}) {
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
          <InfoCard icon={MapPin} label="Dirección" value={buildClientAddress(client)} />
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

      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Cotizaciones" value={totals.count} />
        <MiniStat label="Total vendido" value={formatMoney(totals.total)} />
        <MiniStat label="Ganancia" value={formatMoney(totals.ganancia)} />
      </div>

      <section className="rounded-[24px] border border-border bg-background">
        <div className="border-b border-border p-5">
          <p className="text-sm font-semibold text-accent-600">Cotizaciones</p>

          <h3 className="mt-1 text-xl font-bold text-text-primary">
            Asociadas al cliente
          </h3>
        </div>

        {loadingQuotations ? (
          <EmptyState loading title="Cargando cotizaciones..." />
        ) : !quotations.length ? (
          <EmptyState
            title="Sin cotizaciones asociadas"
            description="Cuando guardes cliente_id en cotizaciones, aparecerán aquí."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-surface-soft">
                <tr>
                  {["Folio", "Estado", "Total", "Ganancia", "Fecha"].map(
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
                {quotations.map((quote) => (
                  <tr key={quote.id} className="border-t border-border">
                    <td className="px-5 py-4 text-sm font-semibold text-text-primary">
                      {quote.folio}
                    </td>

                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {quote.estado}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-text-primary">
                      {formatMoney(quote.total)}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-success-700">
                      {formatMoney(quote.ganancia)}
                    </td>

                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {formatDateTimeTijuana(quote.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
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

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
}