import { Link } from "react-router-dom";
import { CheckCircle2, Eye, Package, XCircle } from "lucide-react";

export default function ProductCard({ producto, from }) {
  const nombre = producto?.nombre || "Producto";
  const codigo = String(producto?.codigo || "—").trim();

  const stock = Number(producto?.cantidad ?? 0);
  const disponible = Boolean(producto?.disponibilidad ?? true) && stock > 0;

  const img = String(producto?.imagen || "").trim();
  const tieneImagen = img.length > 0;

  return (
    <Link
      to={`/catalogo/${producto.id}`}
      state={{ from }}
      className="group block h-full"
    >
      <article className="flex h-full min-h-[370px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white transition hover:border-slate-300">
        <div className="relative bg-white px-5 pt-5">
          <div className="flex h-[190px] items-center justify-center rounded-[18px] bg-slate-50 p-4">
            {tieneImagen ? (
              <img
                src={img}
                alt={nombre}
                loading="lazy"
                className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-[1.025]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
                <Package className="h-10 w-10 text-slate-300" />
              </div>
            )}
          </div>

          <div className="absolute right-7 top-7">
            {disponible ? (
              <StatusBadge
                icon={CheckCircle2}
                label="Disponible"
                className="border-[#081f3a]/15 bg-white text-[#081f3a]"
              />
            ) : (
              <StatusBadge
                icon={XCircle}
                label="Agotado"
                className="border-red-100 bg-white text-red-700"
              />
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          <h3
            className="line-clamp-2 min-h-[44px] text-[15px] font-bold leading-snug text-slate-900"
            title={nombre}
          >
            {nombre}
          </h3>

          <div className="mt-4 space-y-1.5 text-sm">
            <p className="flex justify-between gap-3 text-slate-500">
              <span>Código</span>
              <span className="truncate font-semibold text-slate-800">
                {codigo}
              </span>
            </p>

            <p className="flex justify-between gap-3 text-slate-500">
              <span>Existencia</span>
              <span className="font-semibold text-slate-800">
                {Number.isFinite(stock) ? stock : "—"}
              </span>
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs font-semibold text-slate-400">
              Detalles del producto
            </span>

            <div className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#081f3a] px-4 text-sm font-bold text-white transition group-hover:bg-[#123765]">
              <Eye className="h-4 w-4" />
              Ver
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function StatusBadge({ icon: Icon, label, className }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${className}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}