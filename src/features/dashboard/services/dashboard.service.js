import supabase from "../../../utils/supabase";
import { DASHBOARD_QUERIES } from "../dashboard.constants";

export async function fetchDashboardData() {
  const [cotizacionesRes, gastosRes, productosRes] = await Promise.all([
    supabase.from("cotizaciones").select(DASHBOARD_QUERIES.cotizaciones),
    supabase.from("gastos").select(DASHBOARD_QUERIES.gastos),
    supabase.from("productos").select(DASHBOARD_QUERIES.productos),
  ]);

  if (cotizacionesRes.error) throw cotizacionesRes.error;
  if (gastosRes.error) throw gastosRes.error;
  if (productosRes.error) throw productosRes.error;

  return {
    cotizaciones: cotizacionesRes.data || [],
    gastos: gastosRes.data || [],
    productos: productosRes.data || [],
  };
}