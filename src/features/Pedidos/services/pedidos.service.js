import supabase from "../../../utils/supabase";

const ORDER_SELECT = `
  *,
  clientes:cliente_id (
    id,
    nombre,
    numero,
    correo,
    rfc,
    razon_social,
    direccion,
    ciudad,
    estado,
    codigo_postal,
    cliente_direcciones (
      id,
      cliente_id,
      nombre,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      pais,
      contacto_nombre,
      contacto_telefono,
      notas,
      es_principal,
      activo
    )
  ),
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
    estado,
    created_at,
    updated_at
  ),
  entregas (
    id,
    folio,
    pedido_id,
    estado,
    fecha_entrega,
    recibido_por,
    notas,
    cliente_direccion_id,
    created_at,
    entrega_detalles (
      id,
      entrega_id,
      pedido_detalle_id,
      producto_id,
      cantidad_entregada,
      created_at
    )
  ),
  pedido_tracking (
    id,
    token,
    activo,
    created_at
  ),
  pedido_recurrencias (
    id,
    pedido_id,
    cliente_id,
    frecuencia,
    dia_mes,
    dias_semana,
    cada,
    unidad,
    fecha_inicio,
    fecha_fin,
    dias_entrega,
    accion,
    activo,
    created_at
  )
`;

export async function fetchOrders() {
  const { data, error } = await supabase
    .from("pedidos")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return normalizeOrders(data || []);
}

export async function fetchOrderById(orderId) {
  const { data, error } = await supabase
    .from("pedidos")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .single();

  if (error) throw error;
  return normalizeOrder(data);
}

export async function fetchOrderClients() {
  const { data, error } = await supabase
    .from("clientes")
    .select(`
      id,
      nombre,
      numero,
      correo,
      rfc,
      razon_social,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      cliente_direcciones (
        id,
        cliente_id,
        nombre,
        direccion,
        ciudad,
        estado,
        codigo_postal,
        pais,
        contacto_nombre,
        contacto_telefono,
        notas,
        es_principal,
        activo
      )
    `)
    .order("nombre", { ascending: true });

  if (error) throw error;

  return (data || []).map((client) => ({
    ...client,
    telefono: client.numero,
    email: client.correo,
    cliente_direcciones: (client.cliente_direcciones || [])
      .filter((address) => address.activo !== false)
      .sort((a, b) => Number(b.es_principal) - Number(a.es_principal)),
  }));
}

export async function fetchOrderProducts() {
  const { data, error } = await supabase
    .from("productos")
    .select("id,nombre,descripcion,precio,precio_compra,cantidad_caja,codigo,iva_porcentaje,habilitado")
    .order("nombre", { ascending: true });

  if (error) throw error;

  return (data || []).filter((product) => product.habilitado !== false);
}

export async function createOrder({ order, details }) {
  const cleanDetails = sanitizeDetails(details);
  if (!cleanDetails.length) throw new Error("Agrega al menos un producto al pedido.");

  const totals = calculateTotals(cleanDetails, order.iva_porcentaje);
  const folio = order.folio || generateFolio("PED");

  const { data: createdOrder, error: orderError } = await supabase
    .from("pedidos")
    .insert({
      folio,
      cotizacion_id: order.cotizacion_id || null,
      cliente_id: order.cliente_id,
      cliente_nombre: order.cliente_nombre,
      cliente_telefono: order.cliente_telefono || null,
      cliente_email: order.cliente_email || null,
      subtotal: totals.subtotal,
      descuento: Number(order.descuento || 0),
      iva_porcentaje: totals.iva_porcentaje,
      total: totals.total,
      estado: order.fecha_inicio || order.fecha_fin ? "creado" : "borrador",
      estado_pago: order.estado_pago || "pendiente",
      metodo_pago: order.metodo_pago || null,
      fecha_emision: order.fecha_emision || new Date().toISOString(),
      fecha_inicio: order.fecha_inicio || null,
      fecha_fin: order.fecha_fin || null,
      entrega_inicio: order.fecha_inicio || null,
      entrega_fin: order.fecha_fin || null,
      notas: order.notas || null,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  await insertOrderDetails(createdOrder.id, cleanDetails);
  await createTrackingIfPossible(createdOrder.id);

  return fetchOrderById(createdOrder.id);
}

export async function updateOrder(orderId, { order, details }) {
  const cleanDetails = sanitizeDetails(details);
  if (!cleanDetails.length) throw new Error("Agrega al menos un producto al pedido.");

  const totals = calculateTotals(cleanDetails, order.iva_porcentaje);
  const derivedStatus = order.fecha_inicio || order.fecha_fin ? deriveOrderStatusFromDetails(cleanDetails) : "borrador";

  const { error: orderError } = await supabase
    .from("pedidos")
    .update({
      cliente_id: order.cliente_id,
      cliente_nombre: order.cliente_nombre,
      cliente_telefono: order.cliente_telefono || null,
      cliente_email: order.cliente_email || null,
      subtotal: totals.subtotal,
      descuento: Number(order.descuento || 0),
      iva_porcentaje: totals.iva_porcentaje,
      total: totals.total,
      estado: derivedStatus,
      estado_pago: order.estado_pago || "pendiente",
      metodo_pago: order.metodo_pago || null,
      fecha_inicio: order.fecha_inicio || null,
      fecha_fin: order.fecha_fin || null,
      entrega_inicio: order.fecha_inicio || null,
      entrega_fin: order.fecha_fin || null,
      notas: order.notas || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (orderError) throw orderError;

  await syncOrderDetails(orderId, cleanDetails);
  await updateOrderStatus(orderId);

  return fetchOrderById(orderId);
}

export async function cancelOrder(orderId) {
  const { error } = await supabase
    .from("pedidos")
    .update({ estado: "cancelado", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw error;
  return fetchOrderById(orderId);
}

export async function restoreOrder(orderId) {
  const { data: order, error: orderError } = await supabase
    .from("pedidos")
    .select("id, fecha_inicio, fecha_fin, entrega_inicio, entrega_fin")
    .eq("id", orderId)
    .single();

  if (orderError) throw orderError;

  const { data: details, error: detailsError } = await supabase
    .from("pedido_detalles")
    .select("cantidad_pedida,cantidad_entregada")
    .eq("pedido_id", orderId);

  if (detailsError) throw detailsError;

  const hasPeriod = Boolean(
    order?.fecha_inicio ||
      order?.fecha_fin ||
      order?.entrega_inicio ||
      order?.entrega_fin,
  );

  const nextStatus = hasPeriod
    ? deriveOrderStatusFromDetails(details || [])
    : "borrador";

  const { error } = await supabase
    .from("pedidos")
    .update({ estado: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw error;

  return fetchOrderById(orderId);
}

export async function createDelivery({ order, delivery, products }) {
  if (!order?.id) throw new Error("Pedido inválido.");
  if (!delivery.cliente_direccion_id) throw new Error("Selecciona una dirección del cliente.");
  if (!delivery.fecha_entrega) throw new Error("Selecciona fecha y hora de entrega.");

  const rows = buildDeliveryRows(products);
  if (!rows.length) throw new Error("Captura al menos una cantidad a entregar.");

  const overLimit = rows.find((item) => item.cantidad_entregada > item.pendiente);
  if (overLimit) throw new Error("Hay cantidades mayores a lo pendiente.");

  await validateDeliveryRowsAvailability({ orderId: order.id, rows });

  const { data: createdDelivery, error: deliveryError } = await supabase
    .from("entregas")
    .insert({
      folio: delivery.folio || generateFolio("ENT"),
      pedido_id: order.id,
      estado: delivery.estado || "pendiente",
      fecha_entrega: delivery.fecha_entrega,
      recibido_por: delivery.recibido_por || null,
      notas: delivery.notas || null,
      cliente_direccion_id: delivery.cliente_direccion_id,
    })
    .select()
    .single();

  if (deliveryError) throw deliveryError;

  await insertDeliveryDetails(createdDelivery.id, rows);

  if (deliveryCountsAsDelivered(createdDelivery.estado)) {
    await applyDeliveryToOrderDetails(rows);
  }

  await updateOrderStatus(order.id);

  return fetchOrderById(order.id);
}

export async function updateDelivery({ order, delivery, products }) {
  if (!order?.id) throw new Error("Pedido inválido.");
  if (!delivery?.id) throw new Error("Entrega inválida.");
  if (!delivery.cliente_direccion_id) throw new Error("Selecciona una dirección del cliente.");
  if (!delivery.fecha_entrega) throw new Error("Selecciona fecha y hora de entrega.");

  const rows = buildDeliveryRows(products);
  if (!rows.length) throw new Error("Captura al menos una cantidad a entregar.");

  const overLimit = rows.find((item) => item.cantidad_entregada > item.pendiente);
  if (overLimit) throw new Error("Hay cantidades mayores a lo disponible.");

  await validateDeliveryRowsAvailability({ orderId: order.id, rows, deliveryId: delivery.id });

  const currentRows = await fetchDeliveryDetailRows(delivery.id);
  const currentDelivery = await fetchDeliveryHeader(delivery.id);
  const wasCounted = deliveryCountsAsDelivered(currentDelivery?.estado);
  const willBeCounted = deliveryCountsAsDelivered(delivery.estado);

  if (wasCounted) {
    await revertDeliveryFromOrderDetails(currentRows);
  }

  const { error: deliveryError } = await supabase
    .from("entregas")
    .update({
      estado: delivery.estado || "pendiente",
      fecha_entrega: delivery.fecha_entrega,
      recibido_por: delivery.recibido_por || null,
      notas: delivery.notas || null,
      cliente_direccion_id: delivery.cliente_direccion_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", delivery.id);

  if (deliveryError) throw deliveryError;

  const { error: deleteDetailsError } = await supabase
    .from("entrega_detalles")
    .delete()
    .eq("entrega_id", delivery.id);

  if (deleteDetailsError) throw deleteDetailsError;

  await insertDeliveryDetails(delivery.id, rows);

  if (willBeCounted) {
    await applyDeliveryToOrderDetails(rows);
  }

  await updateOrderStatus(order.id);

  return fetchOrderById(order.id);
}

export async function deleteDelivery({ orderId, delivery }) {
  if (!orderId) throw new Error("Pedido inválido.");
  if (!delivery?.id) throw new Error("Entrega inválida.");

  const currentRows = await fetchDeliveryDetailRows(delivery.id);
  const currentDelivery = await fetchDeliveryHeader(delivery.id);

  if (deliveryCountsAsDelivered(currentDelivery?.estado || delivery.estado)) {
    await revertDeliveryFromOrderDetails(currentRows);
  }

  const { error: detailError } = await supabase
    .from("entrega_detalles")
    .delete()
    .eq("entrega_id", delivery.id);

  if (detailError) throw detailError;

  const { error: deliveryError } = await supabase
    .from("entregas")
    .delete()
    .eq("id", delivery.id);

  if (deliveryError) throw deliveryError;

  await updateOrderStatus(orderId);
  return fetchOrderById(orderId);
}

export async function saveRecurringOrderRule({ order, rule, products }) {
  if (!order?.id) throw new Error("Pedido inválido.");

  await supabase
    .from("pedido_recurrencias")
    .update({ activo: false })
    .eq("pedido_id", order.id)
    .eq("activo", true);

  const { data: recurrence, error: insertError } = await supabase
    .from("pedido_recurrencias")
    .insert({
      pedido_id: order.id,
      cliente_id: order.cliente_id,
      frecuencia: rule.frequency,
      dia_mes: rule.monthDay || null,
      dias_semana: rule.selectedWeekDays || [],
      cada: Number(rule.customEvery || 1),
      unidad: rule.customUnit || null,
      fecha_inicio: rule.startDate || null,
      fecha_fin: rule.endDate || null,
      dias_entrega: Number(rule.deliveryDays || 1),
      accion: rule.systemAction || "draft_order",
      activo: true,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  const rows = (products || [])
    .filter((item) => Number(item.cantidad || 0) > 0)
    .map((item) => ({
      recurrencia_id: recurrence.id,
      pedido_detalle_id: item.pedido_detalle_id || item.id,
      producto_id: item.producto_id,
      nombre_producto: item.nombre_producto,
      cantidad: Number(item.cantidad || 0),
      precio_unitario: Number(item.precio_unitario || 0),
    }));

  if (rows.length) {
    const { error } = await supabase.from("pedido_recurrencia_productos").insert(rows);
    if (error) throw error;
  }

  if (rule.systemAction === "reminder_only") {
    await notifyRecurringOrderReminder({ order, rule, recurrence, products: rows });
  }

  return recurrence;
}

export async function deactivateRecurringOrderRule(orderId) {
  if (!orderId) throw new Error("Pedido inválido.");

  const { error } = await supabase
    .from("pedido_recurrencias")
    .update({ activo: false })
    .eq("pedido_id", orderId)
    .eq("activo", true);

  if (error) throw error;
  return true;
}

async function insertOrderDetails(orderId, details) {
  const payload = details.map((item) => buildDetailPayload(orderId, item));
  const { error } = await supabase.from("pedido_detalles").insert(payload);
  if (error) throw error;
}

async function syncOrderDetails(orderId, details) {
  const { data: currentDetails, error } = await supabase
    .from("pedido_detalles")
    .select("*")
    .eq("pedido_id", orderId);

  if (error) throw error;

  const incomingIds = details.map((item) => item.id).filter(Boolean);
  const removable = (currentDetails || [])
    .filter((item) => !incomingIds.includes(item.id))
    .filter((item) => Number(item.cantidad_entregada || 0) <= 0)
    .map((item) => item.id);

  if (removable.length) {
    const { error: deleteError } = await supabase
      .from("pedido_detalles")
      .delete()
      .in("id", removable);
    if (deleteError) throw deleteError;
  }

  for (const item of details) {
    if (item.id) {
      const delivered = Number(item.cantidad_entregada || 0);
      const ordered = Number(item.cantidad_pedida || 0);
      const pending = Math.max(ordered - delivered, 0);
      const { error: updateError } = await supabase
        .from("pedido_detalles")
        .update({
          producto_id: item.producto_id,
          codigo: item.codigo || null,
          nombre_producto: item.nombre_producto,
          cantidad_pedida: ordered,
          cantidad_entregada: delivered,
          cantidad_pendiente: pending,
          precio_unitario: Number(item.precio_unitario || 0),
          costo_unitario: Number(item.costo_unitario || 0),
          importe: ordered * Number(item.precio_unitario || 0),
          estado: getDetailStatus(ordered, delivered),
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (updateError) throw updateError;
    } else {
      await insertOrderDetails(orderId, [item]);
    }
  }
}

function buildDeliveryRows(products = []) {
  return (products || [])
    .filter((item) => Number(item.cantidad_entregada || 0) > 0)
    .map((item) => ({
      pedido_detalle_id: item.pedido_detalle_id || item.id,
      producto_id: item.producto_id,
      cantidad_entregada: Math.floor(Number(item.cantidad_entregada || 0)),
      pendiente: Math.floor(Number(item.pendiente || item.cantidad_pendiente || 0)),
    }));
}

async function validateDeliveryRowsAvailability({ orderId, rows, deliveryId = null }) {
  const { data: details, error: detailsError } = await supabase
    .from("pedido_detalles")
    .select("id,cantidad_pedida")
    .eq("pedido_id", orderId);

  if (detailsError) throw detailsError;

  let deliveryDetailsQuery = supabase
    .from("entrega_detalles")
    .select("pedido_detalle_id,cantidad_entregada,entregas!inner(id,estado,pedido_id)")
    .eq("entregas.pedido_id", orderId)
    .neq("entregas.estado", "cancelada");

  if (deliveryId) {
    deliveryDetailsQuery = deliveryDetailsQuery.neq("entrega_id", deliveryId);
  }

  const { data: deliveryRows, error: deliveryRowsError } = await deliveryDetailsQuery;
  if (deliveryRowsError) throw deliveryRowsError;

  const reservedByDetailId = (deliveryRows || []).reduce((acc, item) => {
    const detailId = item.pedido_detalle_id;
    if (!detailId) return acc;
    acc[detailId] = Math.floor(Number(acc[detailId] || 0)) + Math.floor(Number(item.cantidad_entregada || 0));
    return acc;
  }, {});

  for (const row of rows) {
    const detail = (details || []).find((item) => item.id === row.pedido_detalle_id);
    if (!detail) throw new Error("Un producto de la entrega ya no existe en el pedido.");

    const ordered = Math.floor(Number(detail.cantidad_pedida || 0));
    const reserved = Math.floor(Number(reservedByDetailId[row.pedido_detalle_id] || 0));
    const available = Math.max(ordered - reserved, 0);

    if (Math.floor(Number(row.cantidad_entregada || 0)) > available) {
      throw new Error(`La cantidad de ${row.producto_id || "un producto"} supera lo disponible. Disponible real: ${available}.`);
    }
  }
}

async function notifyRecurringOrderReminder({ order, rule, recurrence, products }) {
  const recipients = [
    "juan.osuna@waldodistribuciones.com",
    "contacto@waldodistribuciones.com",
  ];

  try {
    const { error } = await supabase.functions.invoke("send-recurring-order-reminder", {
      body: {
        to: recipients,
        subject: `Recordatorio de pedido recurrente ${order?.folio || ""}`.trim(),
        order: {
          id: order?.id,
          folio: order?.folio,
          cliente_nombre: order?.cliente_nombre,
          tracking_token: order?.tracking_token,
        },
        rule,
        recurrence_id: recurrence?.id,
        products,
      },
    });

    if (error) {
      console.warn("No se pudo enviar el correo del recordatorio:", error.message || error);
    }
  } catch (error) {
    console.warn("No se pudo enviar el correo del recordatorio:", error.message || error);
  }
}

async function insertDeliveryDetails(deliveryId, rows) {
  const detailRows = rows.map((item) => ({
    entrega_id: deliveryId,
    pedido_detalle_id: item.pedido_detalle_id,
    producto_id: item.producto_id,
    cantidad_entregada: item.cantidad_entregada,
  }));

  const { error } = await supabase
    .from("entrega_detalles")
    .insert(detailRows);

  if (error) throw error;
}

async function fetchDeliveryDetailRows(deliveryId) {
  const { data, error } = await supabase
    .from("entrega_detalles")
    .select("id,entrega_id,pedido_detalle_id,producto_id,cantidad_entregada")
    .eq("entrega_id", deliveryId);

  if (error) throw error;
  return data || [];
}

async function fetchDeliveryHeader(deliveryId) {
  const { data, error } = await supabase
    .from("entregas")
    .select("id,estado")
    .eq("id", deliveryId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function revertDeliveryFromOrderDetails(rows) {
  for (const item of rows || []) {
    const { data: detail, error } = await supabase
      .from("pedido_detalles")
      .select("*")
      .eq("id", item.pedido_detalle_id)
      .single();

    if (error) throw error;

    const ordered = Number(detail.cantidad_pedida || 0);
    const delivered = Math.max(
      Number(detail.cantidad_entregada || 0) - Number(item.cantidad_entregada || 0),
      0,
    );
    const pending = Math.max(ordered - delivered, 0);

    const { error: updateError } = await supabase
      .from("pedido_detalles")
      .update({
        cantidad_entregada: delivered,
        cantidad_pendiente: pending,
        estado: getDetailStatus(ordered, delivered),
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.pedido_detalle_id);

    if (updateError) throw updateError;
  }
}

async function applyDeliveryToOrderDetails(rows) {
  for (const item of rows) {
    const { data: detail, error } = await supabase
      .from("pedido_detalles")
      .select("*")
      .eq("id", item.pedido_detalle_id)
      .single();

    if (error) throw error;

    const ordered = Number(detail.cantidad_pedida || 0);
    const delivered = Number(detail.cantidad_entregada || 0) + Number(item.cantidad_entregada || 0);
    const pending = Math.max(ordered - delivered, 0);

    const { error: updateError } = await supabase
      .from("pedido_detalles")
      .update({
        cantidad_entregada: delivered,
        cantidad_pendiente: pending,
        estado: getDetailStatus(ordered, delivered),
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.pedido_detalle_id);

    if (updateError) throw updateError;
  }
}

async function updateOrderStatus(orderId) {
  const { data: details, error } = await supabase
    .from("pedido_detalles")
    .select("cantidad_pedida,cantidad_entregada")
    .eq("pedido_id", orderId);

  if (error) throw error;

  const estado = deriveOrderStatusFromDetails(details || []);
  const { error: updateError } = await supabase
    .from("pedidos")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (updateError) throw updateError;
}

async function createTrackingIfPossible(orderId) {
  try {
    const { error } = await supabase.from("pedido_tracking").insert({
      pedido_id: orderId,
      token: generateTrackingToken(),
      activo: true,
    });
    if (error) console.warn("No se pudo crear tracking:", error.message);
  } catch (error) {
    console.warn("No se pudo crear tracking:", error.message);
  }
}

function sanitizeDetails(details = []) {
  return details
    .filter((item) => item.producto_id && Number(item.cantidad_pedida || 0) > 0)
    .map((item) => ({
      ...item,
      cantidad_pedida: Math.floor(Number(item.cantidad_pedida || 0)),
      cantidad_entregada: Math.floor(Number(item.cantidad_entregada || 0)),
      precio_unitario: Number(item.precio_unitario || 0),
      costo_unitario: Number(item.costo_unitario || 0),
    }));
}

function buildDetailPayload(orderId, item) {
  const ordered = Number(item.cantidad_pedida || 0);
  const delivered = Number(item.cantidad_entregada || 0);
  const pending = Math.max(ordered - delivered, 0);
  const price = Number(item.precio_unitario || 0);

  return {
    pedido_id: orderId,
    producto_id: item.producto_id,
    codigo: item.codigo || null,
    nombre_producto: item.nombre_producto,
    cantidad_pedida: ordered,
    cantidad_entregada: delivered,
    cantidad_pendiente: pending,
    precio_unitario: price,
    costo_unitario: Number(item.costo_unitario || 0),
    importe: ordered * price,
    estado: getDetailStatus(ordered, delivered),
  };
}

function calculateTotals(details, iva = 8) {
  const subtotal = details.reduce((acc, item) => {
    return acc + Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0);
  }, 0);
  const iva_porcentaje = Math.floor(Number(iva || 0));
  const total = subtotal * (1 + iva_porcentaje / 100);
  return { subtotal, iva_porcentaje, total };
}

function deriveOrderStatusFromDetails(details = []) {
  const total = details.reduce((acc, item) => acc + Number(item.cantidad_pedida || 0), 0);
  const delivered = details.reduce((acc, item) => acc + Number(item.cantidad_entregada || 0), 0);
  if (total <= 0) return "creado";
  if (delivered <= 0) return "creado";
  if (delivered >= total) return "entregado";
  return "parcial";
}

function getDetailStatus(ordered, delivered) {
  if (delivered <= 0) return "pendiente";
  if (delivered >= ordered) return "entregado";
  return "parcial";
}

function deliveryCountsAsDelivered(status) {
  return String(status || "").toLowerCase() === "entregada";
}

function deliveryCountsAsReserved(status) {
  return String(status || "").toLowerCase() !== "cancelada";
}

function getReservedQuantitiesFromActiveDeliveries(deliveries = []) {
  return (deliveries || []).reduce((acc, delivery) => {
    if (!deliveryCountsAsReserved(delivery.estado)) return acc;

    (delivery.entrega_detalles || []).forEach((row) => {
      const detailId = row.pedido_detalle_id;
      if (!detailId) return;
      acc[detailId] = Math.floor(Number(acc[detailId] || 0)) + Math.floor(Number(row.cantidad_entregada || 0));
    });

    return acc;
  }, {});
}

function getDeliveredQuantitiesFromCompletedDeliveries(deliveries = []) {
  return (deliveries || []).reduce((acc, delivery) => {
    if (!deliveryCountsAsDelivered(delivery.estado)) return acc;

    (delivery.entrega_detalles || []).forEach((row) => {
      const detailId = row.pedido_detalle_id;
      if (!detailId) return;
      acc[detailId] = Number(acc[detailId] || 0) + Number(row.cantidad_entregada || 0);
    });

    return acc;
  }, {});
}

function normalizeOrders(orders) {
  return orders.map(normalizeOrder);
}

function normalizeOrder(order) {
  if (!order) return order;
  const client = order.clientes || {};
  const tracking = Array.isArray(order.pedido_tracking)
    ? order.pedido_tracking.find((item) => item.activo) || order.pedido_tracking[0]
    : order.pedido_tracking;

  const activeRecurrence = Array.isArray(order.pedido_recurrencias)
    ? order.pedido_recurrencias.find((item) => item.activo) || null
    : order.pedido_recurrencias?.activo ? order.pedido_recurrencias : null;

  const rawDetails = (order.pedido_detalles || [])
    .map((item) => ({
      ...item,
      importe: Number(item.importe || 0) || Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0),
    }))
    .sort((a, b) => String(a.nombre_producto || "").localeCompare(String(b.nombre_producto || "")));

  const deliveredByDetailId = getDeliveredQuantitiesFromCompletedDeliveries(order.entregas || []);
  const reservedByDetailId = getReservedQuantitiesFromActiveDeliveries(order.entregas || []);

  const details = rawDetails.map((item) => {
    const ordered = Math.floor(Number(item.cantidad_pedida || 0));
    const delivered = Math.min(Math.floor(Number(deliveredByDetailId[item.id] || 0)), ordered);
    const reserved = Math.min(Math.floor(Number(reservedByDetailId[item.id] || 0)), ordered);
    const pending = Math.max(ordered - delivered, 0);
    const available = Math.max(ordered - reserved, 0);

    return {
      ...item,
      cantidad_pedida: ordered,
      cantidad_entregada: delivered,
      cantidad_reservada: reserved,
      cantidad_pendiente: pending,
      cantidad_disponible: available,
      estado: getDetailStatus(ordered, delivered),
    };
  });

  const deliveries = (order.entregas || [])
    .map((delivery) => ({
      ...delivery,
      details: (delivery.entrega_detalles || []).map((row) => {
        const orderDetail = rawDetails.find((item) => item.id === row.pedido_detalle_id);
        return {
          ...row,
          nombre_producto: orderDetail?.nombre_producto || "Producto",
          codigo: orderDetail?.codigo || "",
        };
      }),
    }))
    .sort((a, b) => new Date(b.fecha_entrega || b.created_at || 0) - new Date(a.fecha_entrega || a.created_at || 0));

  return {
    ...order,
    cliente_nombre: order.cliente_nombre || client.nombre || "Cliente sin nombre",
    cliente_telefono: order.cliente_telefono || client.numero || "",
    cliente_email: order.cliente_email || client.correo || "",
    cliente_direcciones: (client.cliente_direcciones || [])
      .filter((address) => address.activo !== false)
      .sort((a, b) => Number(b.es_principal) - Number(a.es_principal)),
    tracking_token: tracking?.token || order.tracking_token || "",
    active_recurrence: activeRecurrence,
    is_recurrent: Boolean(activeRecurrence),
    details,
    deliveries,
    entrega_inicio: order.fecha_inicio || order.entrega_inicio,
    entrega_fin: order.fecha_fin || order.entrega_fin,
  };
}

function generateFolio(prefix) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const suffix = String(now.getTime()).slice(-5);
  return `${prefix}-${year}${month}${day}-${suffix}`;
}

function generateTrackingToken() {
  return `TRK-${cryptoRandom().slice(0, 10).toUpperCase()}`;
}

function cryptoRandom() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID().replaceAll("-", "");
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
