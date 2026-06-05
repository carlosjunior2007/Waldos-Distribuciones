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
  pago_referencia,
  pago_monto,
  pago_fecha,
  pago_notas,
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

const INVENTORY_CONSUMPTION_SELECT = `
  id,
  entrega_id,
  entrega_detalle_id,
  pedido_id,
  pedido_detalle_id,
  producto_id,
  lote_id,
  entrada_id,
  cantidad,
  created_at,
  inventario_lotes (
    id,
    costo_unitario,
    fecha_compra
  ),
  inventario_entradas (
    id,
    folio,
    numero_factura,
    fecha_compra
  )
`;

export async function fetchExpensesData() {
  const [orderResult, expenseResult, consumptionResult] = await Promise.all([
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

    supabase
      .from("inventario_consumos_entrega")
      .select(INVENTORY_CONSUMPTION_SELECT)
      .order("created_at", { ascending: false }),
  ]);

  if (orderResult.error) throw orderResult.error;
  if (expenseResult.error) throw expenseResult.error;
  if (consumptionResult.error) throw consumptionResult.error;

  return {
    orderRows: Array.isArray(orderResult.data) ? orderResult.data : [],
    expenseRows: Array.isArray(expenseResult.data) ? expenseResult.data : [],
    inventoryConsumptionRows: Array.isArray(consumptionResult.data)
      ? consumptionResult.data
      : [],
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
