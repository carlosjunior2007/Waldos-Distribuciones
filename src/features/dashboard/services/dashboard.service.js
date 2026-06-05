import supabase from "../../../utils/supabase";
import { DASHBOARD_QUERIES } from "../dashboard.constants";

function throwIfError(response, label) {
  if (!response.error) return;

  const message = response.error.message || "Error desconocido";

  throw new Error(
    `No se pudo cargar ${label}. ${message}. Revisa que hayas ejecutado el SQL del dashboard y que existan las vistas/columnas necesarias.`,
  );
}

export async function fetchDashboardData() {
  const [
    cotizacionesRes,
    pedidosRes,
    pedidoDetallesRes,
    entregasRes,
    gastosRes,
    productosRes,
    pedidoGananciaRes,
    pedidoProductoGananciaRes,
    pedidoInventarioFacturasRes,
    entradasRes,
    lotesRes,
    movimientosRes,
  ] = await Promise.all([
    supabase.from("cotizaciones").select(DASHBOARD_QUERIES.cotizaciones),
    supabase.from("pedidos").select(DASHBOARD_QUERIES.pedidos),
    supabase.from("pedido_detalles").select(DASHBOARD_QUERIES.pedido_detalles),
    supabase.from("entregas").select(DASHBOARD_QUERIES.entregas),
    supabase.from("gastos").select(DASHBOARD_QUERIES.gastos),
    supabase.from("productos").select(DASHBOARD_QUERIES.productos),
    supabase.from("pedido_ganancia_real").select("*"),
    supabase.from("pedido_producto_ganancia_real").select("*"),
    supabase.from("pedido_inventario_facturas").select("*"),
    supabase.from("inventario_entradas").select(DASHBOARD_QUERIES.inventario_entradas),
    supabase.from("inventario_lotes").select(DASHBOARD_QUERIES.inventario_lotes),
    supabase.from("inventario_movimientos").select(DASHBOARD_QUERIES.inventario_movimientos),
  ]);

  throwIfError(cotizacionesRes, "cotizaciones");
  throwIfError(pedidosRes, "pedidos");
  throwIfError(pedidoDetallesRes, "detalles de pedidos");
  throwIfError(entregasRes, "entregas");
  throwIfError(gastosRes, "gastos");
  throwIfError(productosRes, "productos");
  throwIfError(pedidoGananciaRes, "ganancia real de pedidos");
  throwIfError(pedidoProductoGananciaRes, "ganancia real por producto");
  throwIfError(pedidoInventarioFacturasRes, "relación pedido-inventario-facturas");
  throwIfError(entradasRes, "compras de inventario");
  throwIfError(lotesRes, "lotes FIFO");
  throwIfError(movimientosRes, "movimientos FIFO");

  return {
    cotizaciones: cotizacionesRes.data || [],
    pedidos: pedidosRes.data || [],
    pedidoDetalles: pedidoDetallesRes.data || [],
    entregas: entregasRes.data || [],
    gastos: gastosRes.data || [],
    productos: productosRes.data || [],
    pedidoGanancias: pedidoGananciaRes.data || [],
    pedidoProductoGanancias: pedidoProductoGananciaRes.data || [],
    pedidoInventarioFacturas: pedidoInventarioFacturasRes.data || [],
    inventarioEntradas: entradasRes.data || [],
    inventarioLotes: lotesRes.data || [],
    inventarioMovimientos: movimientosRes.data || [],
  };
}
