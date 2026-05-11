import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import supabase from "../utils/supabase.js";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

import ImageZoomAmazon from "../components/ImageZoomAmazon";
import ProductCard from "../components/ProductCard";

function formatMXN(value) {
  const n = Number(value || 0);
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const SIMILARES_STEP = 6;

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [producto, setProducto] = useState(null);
  const [similares, setSimilares] = useState([]);
  const [visibleSimilares, setVisibleSimilares] = useState(SIMILARES_STEP);
  const [loading, setLoading] = useState(true);
  const [loadingSimilares, setLoadingSimilares] = useState(false);

  useEffect(() => {
    async function fetchProducto() {
      setLoading(true);

      const { data, error } = await supabase
        .from("productos")
        .select(
          `
  id,
  nombre,
  descripcion,
  precio,
  imagen,
  categoria,
  codigo,
  unidad,
  cantidad_caja,
  habilitado,
  created_at
`,
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setProducto(null);
      } else {
        setProducto(data || null);
      }

      setLoading(false);
    }

    fetchProducto();
  }, [id]);

  useEffect(() => {
    async function fetchSimilares() {
      if (!producto?.categoria) {
        setSimilares([]);
        return;
      }

      setLoadingSimilares(true);
      setVisibleSimilares(SIMILARES_STEP);

      try {
        const baseQuery = supabase
          .from("productos")
          .select("id", { count: "exact" })
          .eq("habilitado", true)
          .eq("categoria", producto.categoria)
          .neq("id", producto.id);

        const { count, error: countError } = await baseQuery.range(0, 0);

        if (countError) {
          throw countError;
        }

        const totalDisponibles = count || 0;

        if (totalDisponibles === 0) {
          setSimilares([]);
          return;
        }

        const LIMIT = 40;

        const maxOffset = Math.max(0, totalDisponibles - LIMIT);

        const randomOffset =
          maxOffset > 0 ? Math.floor(Math.random() * (maxOffset + 1)) : 0;

        const { data, error } = await supabase
          .from("productos")
          .select(
            `
    id,
    nombre,
    descripcion,
    precio,
    imagen,
    categoria,
    codigo,
    unidad,
    cantidad_caja,
    habilitado,
    created_at
  `,
          )
          .eq("habilitado", true)
          .eq("categoria", producto.categoria)
          .neq("id", producto.id)
          .range(randomOffset, randomOffset + LIMIT - 1);

        if (error) {
          throw error;
        }

        const productosNormalizados = (data || []).map((item) => {
          const stock = Number(item.stock ?? 0);

          return {
            ...item,
            cantidad: stock,
            disponibilidad: item.habilitado === true && stock > 0,
          };
        });

        const productosUnicos = Array.from(
          new Map(
            productosNormalizados.map((item) => [item.id, item]),
          ).values(),
        );

        const mezclados = productosUnicos.sort(() => Math.random() - 0.5);

        setSimilares(mezclados);
      } catch (err) {
        console.error("Error cargando similares:", err);
        setSimilares([]);
      } finally {
        setLoadingSimilares(false);
      }
    }

    fetchSimilares();
  }, [producto?.id, producto?.categoria]);

  const volverAlCatalogo = () => {
    if (location.state?.from) {
      navigate(location.state.from, { replace: true });
      return;
    }

    navigate("/catalogo", { replace: true });
  };

  const meta = useMemo(() => {
    if (!producto) return null;

    return {
      precio: formatMXN(producto.precio),
      codigo: String(producto.codigo || "—").trim(),
      categoria: String(producto.categoria || ""),
      unidad: String(producto.unidad || ""),
      caja: Number(producto.cantidad_caja ?? 0),
    };
  }, [producto]);

  const visibles = similares.slice(0, visibleSimilares);
  const faltanPorMostrar = similares.length > visibleSimilares;
  const categoriaPath = meta?.categoria
    ? `/catalogo?cats=${encodeURIComponent(meta.categoria)}`
    : "/catalogo";

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
          Cargando producto...
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
          No se encontró el producto.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={volverAlCatalogo}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#081f3a] transition hover:bg-slate-50 sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>Volver al catálogo</span>
        </button>

        <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-semibold text-[#081f3a] sm:w-auto sm:border-0 sm:bg-transparent sm:px-0">
          Disponible
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        </span>
      </div>

      <div className="grid grid-cols-12 items-start gap-6">
        <div className="col-span-12 lg:col-span-7">
          <ImageZoomAmazon
            src={producto.imagen}
            alt={producto.nombre}
            zoom={2.8}
            heightClass="h-[420px] md:h-[560px]"
          />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="rounded-[20px] border border-slate-200 bg-white p-5">
            <h1 className="text-2xl font-bold leading-tight text-slate-900">
              {producto.nombre}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[#081f3a]">
                Código: <span className="font-semibold">{meta.codigo}</span>
              </span>

              {meta.categoria ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                  {meta.categoria}
                </span>
              ) : null}

              {meta.unidad || meta.caja ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                  {meta.unidad ? `Unidad: ${meta.unidad}` : "Unidad"}
                  {meta.caja ? ` · Caja: ${meta.caja}` : ""}
                </span>
              ) : null}
            </div>

            <div className="mt-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Descripción
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {producto.descripcion || "Sin descripción por ahora."}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(meta.codigo)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#081f3a] transition hover:bg-slate-50"
              >
                Copiar código
              </button>

              <button
                type="button"
                onClick={volverAlCatalogo}
                className="h-10 rounded-xl bg-[#081f3a] px-4 text-sm font-semibold text-white transition hover:bg-[#123765]"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10 rounded-[24px] border border-slate-200 bg-white p-5">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#081f3a]">
              Misma categoría
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Productos similares
            </h2>

            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Otros productos relacionados con{" "}
              <span className="font-semibold text-slate-700">
                {meta.categoria || "esta categoría"}
              </span>
              .
            </p>
          </div>

          {meta.categoria ? (
            <button
              type="button"
              onClick={() => navigate(categoriaPath)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#081f3a] transition hover:bg-slate-50"
            >
              Ver categoría completa
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {loadingSimilares ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-[22px] border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        ) : similares.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((item) => (
                <ProductCard
                  key={item.id}
                  producto={item}
                  from={categoriaPath}
                />
              ))}
            </div>

            {faltanPorMostrar ? (
              <div className="mt-6 flex justify-center border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleSimilares((current) => current + SIMILARES_STEP)
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-[#081f3a] transition hover:bg-slate-50"
                >
                  Cargar más productos
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No hay productos similares por ahora.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Cuando existan más productos en esta categoría aparecerán aquí.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
