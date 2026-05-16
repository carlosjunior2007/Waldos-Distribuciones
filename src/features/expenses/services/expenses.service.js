import supabase from "../../../utils/supabase";

const ORDER_SELECT = `
  id,
  folio,
  cliente_nombre,
  cliente_telefono,
  cliente_email,
  subtotal,
  descuento,
  total,
  iva_porcentaje,
  estado,
  estado_pago,
  metodo_pago,
  fecha_emision,
  fecha_inicio,
  fecha_fin,
  notas,
  created_at,
  pedido_detalles (
    id,
    pedido_id,
    producto_id,
    codigo,
    nombre_producto,
    cantidad_pedida,
    cantidad_entregada,
    cantidad_pendiente,
    precio_unitario,
    costo_unitario,
    importe,
    estado
  ),
  entregas (
    id,
    pedido_id,
    estado,
    fecha_entrega,
    entrega_detalles (
      id,
      entrega_id,
      pedido_detalle_id,
      producto_id,
      cantidad_entregada
    )
  )
`;

export async function fetchExpensesData() {
  const [orderResult, expenseResult] = await Promise.all([
    supabase
      .from("pedidos")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false }),

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
        pedido_id,
        created_at,
        tipo
      `,
      )
      .order("fecha", { ascending: false }),
  ]);

  if (orderResult.error) throw orderResult.error;
  if (expenseResult.error) throw expenseResult.error;

  return {
    orderRows: Array.isArray(orderResult.data) ? orderResult.data : [],
    expenseRows: Array.isArray(expenseResult.data) ? expenseResult.data : [],
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
