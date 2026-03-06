import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import supabase from "../utils/supabase.js";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import ImageZoomAmazon from "../components/ImageZoomAmazon";

function formatMXN(value) {
  const n = Number(value || 0);
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducto = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("productos")
        .select(
          "id,nombre,descripcion,precio,imagen,disponibilidad,cantidad,categoria,codigo,unidad,cantidad_caja",
        )
        .eq("id", id)
        .single();

      if (error) console.error(error);
      setProducto(data || null);
      setLoading(false);
    };

    fetchProducto();
  }, [id]);

  const meta = useMemo(() => {
    if (!producto) return null;
    const stock = Number(producto.cantidad ?? 0);
    const disponible = (producto.disponibilidad ?? true) && stock > 0;
    return {
      precio: formatMXN(producto.precio),
      stock,
      disponible,
      codigo: (producto.codigo || "—").toString().trim(),
      categoria: (producto.categoria || "").toString(),
      unidad: (producto.unidad || "").toString(),
      caja: Number(producto.cantidad_caja ?? 0),
    };
  }, [producto]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="rounded-md border border-border bg-surface p-8">
          Cargando…
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="rounded-md border border-border bg-surface p-8">
          No se encontró el producto.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      {/* top actions */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <button
          onClick={() => navigate("/catalogo")}
          className="h-10 px-3 rounded-md border border-border bg-surface hover:bg-surface-soft text-sm font-medium text-text-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </button>

        {meta?.disponible ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-success-700">
            <CheckCircle2 className="h-5 w-5" />
            Disponible <span className="text-text-muted">({meta.stock})</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-error-700">
            <XCircle className="h-5 w-5" />
            Agotado
          </span>
        )}
      </div>

      {/* main */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Imagen + zoom amazon */}
        <div className="col-span-12 lg:col-span-7">
          <ImageZoomAmazon
            src={producto.imagen}
            alt={producto.nombre}
            zoom={2.8}
            heightClass="h-[420px] md:h-[560px]"
          />
        </div>

        {/* detalles */}
        <div className="col-span-12 lg:col-span-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h1 className="text-2xl font-bold text-text-primary leading-tight">
              {producto.nombre}
            </h1>

            {/* chips útiles */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                Código: <span className="font-semibold">{meta.codigo}</span>
              </span>

              {meta.categoria ? (
                <span className="px-3 py-1 rounded-full bg-surface-soft text-text-secondary border border-border">
                  {meta.categoria}
                </span>
              ) : null}

              {meta.unidad || meta.caja ? (
                <span className="px-3 py-1 rounded-full bg-surface-soft text-text-secondary border border-border">
                  {meta.unidad ? `Unidad: ${meta.unidad}` : "Unidad"}
                  {meta.caja ? ` · Caja: ${meta.caja}` : ""}
                </span>
              ) : null}
            </div>

            {/* precio / cantidad */}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-baseline gap-2">
                <span className="text-text-muted">Precio:</span>
                <span className="font-semibold text-text-primary">
                  {meta.precio}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-text-muted">Existencia:</span>
                <span className="font-semibold text-text-primary">
                  {meta.stock} piezas
                </span>
              </div>
            </div>

            {/* descripción */}
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-text-primary">
                Descripción
              </h2>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {producto.descripcion || "Sin descripción por ahora."}
              </p>
            </div>

            {/* acción útil */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigator.clipboard?.writeText(meta.codigo)}
                className="h-10 px-4 rounded-md border border-border bg-surface hover:bg-surface-soft text-sm font-semibold text-text-secondary"
              >
                Copiar código
              </button>
              <button
                onClick={() => navigate("/catalogo")}
                className="h-10 px-4 rounded-md bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
