import supabase from "../../../utils/supabase";

export async function fetchExpensesData() {
  const [quoteResult, expenseResult, detailResult, productResult] =
    await Promise.all([
      supabase
        .from("cotizaciones")
        .select(
          `
          id,
          folio,
          cliente_nombre,
          cliente_telefono,
          cliente_email,
          subtotal,
          descuento,
          total,
          gastos,
          ganancia,
          fecha_vencimiento,
          fecha_completado,
          notas,
          created_at
        `,
        )
        .not("fecha_completado", "is", null)
        .order("fecha_completado", { ascending: false }),

      supabase
        .from("gastos")
        .select(
          `
          id,
          concepto,
          descripcion,
          monto,
          fecha,
          cotizacion_id,
          created_at,
          tipo
        `,
        )
        .order("fecha", { ascending: false }),

      supabase.from("cotizacion_detalles").select(`
        id,
        cotizacion_id,
        producto_id,
        cantidad
      `),

      supabase.from("productos").select(`
        id,
        nombre,
        precio_compra,
        precio_utilidad
      `),
    ]);

  if (quoteResult.error) throw quoteResult.error;
  if (expenseResult.error) throw expenseResult.error;
  if (detailResult.error) throw detailResult.error;
  if (productResult.error) throw productResult.error;

  return {
    quoteRows: Array.isArray(quoteResult.data) ? quoteResult.data : [],
    expenseRows: Array.isArray(expenseResult.data) ? expenseResult.data : [],
    detailRows: Array.isArray(detailResult.data) ? detailResult.data : [],
    productRows: Array.isArray(productResult.data) ? productResult.data : [],
  };
}

export async function createExpense(payload) {
  const { error } = await supabase.from("gastos").insert(payload);
  if (error) throw error;
}

export async function updateExpense(id, payload) {
  const { error } = await supabase.from("gastos").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(id) {
  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) throw error;
}