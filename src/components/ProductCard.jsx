import { Link } from "react-router-dom";
import { Package, CheckCircle2, XCircle } from "lucide-react";

function formatMXN(value) {
  const n = Number(value || 0);
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function ProductCard({ producto }) {
  const nombre = producto?.nombre || "Producto";
  const codigo = (producto?.codigo || "—").toString().trim();
  const precio = formatMXN(producto?.precio);

  const stock = Number(producto?.cantidad ?? 0);
  const disponible = (producto?.disponibilidad ?? true) && stock > 0;

  const img = (producto?.imagen || "").trim();
  const tieneImagen = img.length > 0;

  return (
    <Link to={`/catalogo/${producto.id}`} className="block group">
      <article
        className="
          rounded-lg
          border border-border
          bg-surface
          shadow-soft
          hover:shadow-strong
          transition
          overflow-hidden
        "
      >
        {/* Imagen grande */}
        <div className="relative bg-surface-soft">
          <div className="aspect-[4/3] w-full overflow-hidden">
            {tieneImagen ? (
              <img
                src={img}
                alt={nombre}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="h-12 w-12 rounded-xl bg-surface border border-border flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary-500" />
                </div>
              </div>
            )}
          </div>

          {/* Disponible arriba derecha */}
          <div className="absolute right-3 top-3">
            {disponible ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 text-success-700 border border-success-100 px-3 py-1 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-error-50 text-error-700 border border-error-100 px-3 py-1 text-xs font-semibold">
                <XCircle className="h-4 w-4" />
                Agotado
              </span>
            )}
          </div>
        </div>

        {/* Contenido (simple y útil) */}
        <div className="p-4">
          {/* Nombre */}
          <h3
            className="text-sm font-semibold text-text-primary leading-snug line-clamp-2"
            title={nombre}
          >
            {nombre}
          </h3>

          {/* Código producto */}
          <div className="mt-2 text-xs text-text-secondary">
            <span className="text-text-muted">Código: </span>
            <span className="font-semibold text-text-secondary">{codigo}</span>
          </div>

          {/* Cantidad */}
          <div className="mt-1 text-xs text-text-secondary">
            <span className="text-text-muted">Cantidad: </span>
            <span className="font-semibold">
              {Number.isFinite(stock) ? stock : "—"}
            </span>
          </div>

          {/* Precio + botón */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-text-muted">Precio</div>
              <div className="text-base font-bold text-primary-700 leading-none">
                {precio}
              </div>
            </div>

            <div
              className="
                h-9
                px-4
                rounded-md
                bg-primary-500
                text-white
                text-sm font-semibold
                inline-flex items-center justify-center
                transition
                group-hover:bg-primary-600
              "
            >
              Ver
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}