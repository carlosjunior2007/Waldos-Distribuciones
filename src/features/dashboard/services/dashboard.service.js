import supabase from "../../../utils/supabase";
import { DASHBOARD_QUERIES } from "../dashboard.constants";

export async function fetchDashboardData() {
  const [
    cotizacionesRes,
    pedidosRes,
    pedidoDetallesRes,
    gastosRes,
    productosRes,
  ] = await Promise.all([
    supabase.from("cotizaciones").select(DASHBOARD_QUERIES.cotizaciones),
    supabase.from("pedidos").select(DASHBOARD_QUERIES.pedidos),
    supabase.from("pedido_detalles").select(DASHBOARD_QUERIES.pedido_detalles),
    supabase.from("gastos").select(DASHBOARD_QUERIES.gastos),
    supabase.from("productos").select(DASHBOARD_QUERIES.productos),
  ]);

  if (cotizacionesRes.error) throw cotizacionesRes.error;
  if (pedidosRes.error) throw pedidosRes.error;
  if (pedidoDetallesRes.error) throw pedidoDetallesRes.error;
  if (gastosRes.error) throw gastosRes.error;
  if (productosRes.error) throw productosRes.error;

  return {
    cotizaciones: cotizacionesRes.data || [],
    pedidos: pedidosRes.data || [],
    pedidoDetalles: pedidoDetallesRes.data || [],
    gastos: gastosRes.data || [],
    productos: productosRes.data || [],
  };
}