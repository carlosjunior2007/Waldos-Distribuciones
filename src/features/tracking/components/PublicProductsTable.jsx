import { money, numberMX } from "../tracking.helpers";

export default function PublicProductsTable({ products = [] }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <h3 className="text-lg font-black text-slate-950">Productos del pedido</h3>
        <p className="mt-1 text-sm text-slate-500">Cantidades solicitadas, entregadas y pendientes.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-5 py-4 text-left">Código</th>
              <th className="px-5 py-4 text-left">Producto</th>
              <th className="px-5 py-4 text-right">Pedido</th>
              <th className="px-5 py-4 text-right">Entregado</th>
              <th className="px-5 py-4 text-right">Pendiente</th>
              <th className="px-5 py-4 text-right">Precio</th>
              <th className="px-5 py-4 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((item) => (
              <tr key={item.id} className="text-slate-800">
                <td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-slate-500">{item.codigo || "-"}</td>
                <td className="min-w-[240px] px-5 py-4 font-bold text-slate-950">{item.nombre_producto}</td>
                <td className="px-5 py-4 text-right font-bold">{numberMX(item.cantidad_pedida)}</td>
                <td className="px-5 py-4 text-right font-bold text-emerald-700">{numberMX(item.cantidad_entregada_publica)}</td>
                <td className="px-5 py-4 text-right font-bold text-amber-700">{numberMX(item.cantidad_pendiente_publica)}</td>
                <td className="px-5 py-4 text-right">{money(item.precio_unitario)}</td>
                <td className="px-5 py-4 text-right font-black text-slate-950">{money(item.importe || Number(item.precio_unitario || 0) * Number(item.cantidad_pedida || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
