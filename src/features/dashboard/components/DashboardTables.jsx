import EmptyState from "../../../components/ui/EmptyState";
import { formatDateTimeTijuana } from "../../../utils/dates";
import { formatMoney } from "../../../utils/formatters";
import { getPedidoFinancial, toNumber } from "../dashboard.helpers";

function SectionShell({ title, subtitle, children }) {
  return (
    <section className="rounded-[28px] border border-border bg-surface shadow-[var(--shadow-soft)]">
      <div className="border-b border-border p-5 md:p-6">
        <p className="text-xs font-black uppercase tracking-[0.26em] text-accent-600">
          {subtitle}
        </p>
        <h3 className="mt-2 text-xl font-black text-text-primary">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function TableWrap({ children }) {
  return <div className="overflow-x-auto">{children}</div>;
}

function Th({ children }) {
  return <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-text-muted">{children}</th>;
}

function Td({ children, className = "" }) {
  return <td className={`px-5 py-4 align-top text-sm text-text-primary ${className}`}>{children}</td>;
}

export function RealOrdersTable({ rows }) {
  return (
    <SectionShell title="Pedidos con ganancia real" subtitle="Ventas, FIFO y utilidad">
      {!rows.length ? (
        <EmptyState title="Sin pedidos reales" description="No hay pedidos entregados/pagados en este periodo." className="py-10" />
      ) : (
        <TableWrap>
          <table className="min-w-full table-fixed">
            <thead className="bg-surface-soft">
              <tr>
                <Th>Pedido</Th>
                <Th>Cliente</Th>
                <Th>Venta real</Th>
                <Th>Costo FIFO</Th>
                <Th>Gastos</Th>
                <Th>Ganancia neta</Th>
                <Th>Pago</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.slice(0, 8).map((row) => {
                const f = getPedidoFinancial(row);
                return (
                  <tr key={row.pedido_id || row.id} className="hover:bg-surface-soft/70">
                    <Td>
                      <p className="font-black">{row.folio || row.pedido_folio || "Sin folio"}</p>
                      <p className="mt-1 text-xs text-text-muted">{formatDateTimeTijuana(row.fecha_pago || row.updated_at || row.created_at)}</p>
                    </Td>
                    <Td>{row.cliente_nombre || "Sin cliente"}</Td>
                    <Td className="font-black">{formatMoney(f.ventaReal)}</Td>
                    <Td>{formatMoney(f.costoFifo)}</Td>
                    <Td>{formatMoney(f.gastosExtra)}</Td>
                    <Td className={f.gananciaNeta >= 0 ? "font-black text-success-700" : "font-black text-error-700"}>{formatMoney(f.gananciaNeta)}</Td>
                    <Td>
                      <p className="font-semibold">{formatMoney(f.montoPagado)}</p>
                      <p className="mt-1 max-w-[160px] truncate text-xs text-text-muted">{f.referenciaPago}</p>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}
    </SectionShell>
  );
}

export function PurchasesTable({ rows }) {
  return (
    <SectionShell title="Compras y facturas del periodo" subtitle="Inventario comprado">
      {!rows.length ? (
        <EmptyState title="Sin compras" description="No hay entradas de inventario en el periodo." className="py-10" />
      ) : (
        <TableWrap>
          <table className="min-w-full table-fixed">
            <thead className="bg-surface-soft">
              <tr>
                <Th>Referencia</Th>
                <Th>Proveedor</Th>
                <Th>Fecha</Th>
                <Th>Subtotal</Th>
                <Th>IVA</Th>
                <Th>Total</Th>
                <Th>Archivo</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.slice(0, 8).map((row) => (
                <tr key={row.id} className="hover:bg-surface-soft/70">
                  <Td>
                    <p className="font-black">{row.numero_factura || row.folio || "Sin referencia"}</p>
                    {row.numero_factura && row.folio ? <p className="text-xs text-text-muted">Folio: {row.folio}</p> : null}
                  </Td>
                  <Td>{row.proveedores?.nombre || "Sin proveedor"}</Td>
                  <Td>{row.fecha_compra || "Sin fecha"}</Td>
                  <Td>{formatMoney(row.subtotal)}</Td>
                  <Td>{formatMoney(row.iva)}</Td>
                  <Td className="font-black">{formatMoney(row.total)}</Td>
                  <Td>
                    {row.archivo_url ? (
                      <a className="font-bold text-primary-700 underline" href={row.archivo_url} target="_blank" rel="noreferrer">
                        Ver factura
                      </a>
                    ) : (
                      <span className="text-text-muted">Sin archivo</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </SectionShell>
  );
}

export function TopProductsTable({ rows }) {
  return (
    <SectionShell title="Productos con mejor ganancia" subtitle="Top vendido real">
      {!rows.length ? (
        <EmptyState title="Sin productos vendidos" description="No hay productos entregados con costo FIFO en el periodo." className="py-10" />
      ) : (
        <div className="divide-y divide-border">
          {rows.map((row, index) => (
            <div key={row.key} className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">#{index + 1} • {row.codigo || "Sin código"}</p>
                <p className="mt-1 truncate text-base font-black text-text-primary">{row.nombre}</p>
                <p className="mt-1 text-sm text-text-secondary">{toNumber(row.cantidad)} unidad(es) • Venta {formatMoney(row.venta)} • Costo {formatMoney(row.costo)}</p>
              </div>
              <p className="shrink-0 text-lg font-black text-success-700">{formatMoney(row.ganancia)}</p>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
