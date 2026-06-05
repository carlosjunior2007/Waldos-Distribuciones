import supabase from "../../../utils/supabase";
import { consumeInventoryForDelivery, revertInventoryForDelivery } from "../../Inventario/services/inventory.service";

const ORDER_SELECT = `
  *,
  clientes:cliente_id (
    id,
    nombre,
    numero,
    correo,
    rfc,
    razon_social,
    regimen_fiscal,
    uso_cfdi,
    direccion,
    ciudad,
    estado,
    codigo_postal,
    factura_payment_form,
    factura_payment_method,
    factura_currency,
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
    updated_at,
    productos:producto_id (
      id,
      nombre,
      codigo,
      producto_proveedores (
        id,
        producto_id,
        proveedor_id,
        sku_proveedor,
        precio_compra,
        moneda,
        tiempo_entrega_dias,
        es_principal,
        notas,
        activo,
        proveedores (
          id,
          nombre,
          razon_social,
          rfc,
          telefono,
          correo,
          contacto_nombre,
          activo
        )
      )
    )
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
  ),
  cotizaciones:cotizacion_id (
    id,
    folio,
    estado,
    total,
    created_at,
    fecha_vencimiento
  ),
  facturas (
    id,
    pedido_id,
    facturama_id,
    uuid,
    serie,
    folio,
    status,
    subtotal,
    total,
    cancel_reason,
    replacement_uuid,
    created_at,
    timbrada_at,
    cancelada_at,
    deleted_local,
    deleted_local_at,
    deleted_local_reason
  )
`;

function getErrorText(error) {
  if (!error) return "Error desconocido.";
  if (typeof error === "string") return error;
  return error.message || error.details || error.hint || JSON.stringify(error);
}

function buildAppError(error, fallback = "Ocurrió un error.") {
  const raw = getErrorText(error);
  const message = makeFriendlyErrorMessage(raw, fallback);
  const nextError = new Error(message);
  nextError.originalError = error;
  return nextError;
}

function makeFriendlyErrorMessage(rawMessage = "", fallback = "Ocurrió un error.") {
  const message = String(rawMessage || "").trim();
  const lower = message.toLowerCase();

  if (!message) return fallback;
  if (lower.includes("inventario insuficiente")) return message;
  if (lower.includes("violates row-level security") || lower.includes("permission denied")) {
    return "No tienes permisos para hacer esta operación. Revisa las políticas RLS o inicia sesión de nuevo.";
  }
  if (lower.includes("duplicate key")) {
    return "Ya existe un registro con esos datos. Revisa folio, factura o clave duplicada.";
  }
  if (lower.includes("foreign key")) {
    return "Hay un dato relacionado que no existe o fue eliminado. Actualiza la página y vuelve a intentar.";
  }
  if (lower.includes("not-null") || lower.includes("null value")) {
    return "Falta llenar un dato obligatorio. Revisa los campos marcados antes de guardar.";
  }
  if (lower.includes("check constraint")) {
    return "Un dato no cumple las reglas del sistema. Revisa cantidades, estados y valores negativos.";
  }

  return message || fallback;
}



function collectOrderProductIds(orders = []) {
  return Array.from(new Set((orders || [])
    .flatMap((order) => order.pedido_detalles || [])
    .map((detail) => detail.producto_id)
    .filter(Boolean)));
}

function collectOrderDeliveryIds(orders = []) {
  return Array.from(new Set((orders || [])
    .flatMap((order) => order.entregas || [])
    .map((delivery) => delivery.id)
    .filter(Boolean)));
}

async function hydrateInventoryContext(orders = []) {
  if (!orders.length) return orders;

  const productIds = collectOrderProductIds(orders);
  const deliveryIds = collectOrderDeliveryIds(orders);

  let lots = [];
  let consumptions = [];

  if (productIds.length) {
    const { data, error } = await supabase
      .from("inventario_lotes")
      .select(`
        id,
        producto_id,
        entrada_id,
        cantidad_inicial,
        cantidad_disponible,
        costo_unitario,
        fecha_compra,
        entrada:entrada_id (
          id,
          folio,
          numero_factura,
          fecha_compra,
          archivo_url,
          proveedor:proveedor_id (
            id,
            nombre,
            codigo
          )
        )
      `)
      .in("producto_id", productIds)
      .gt("cantidad_disponible", 0)
      .order("fecha_compra", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw buildAppError(error, "No se pudieron cargar los lotes de inventario.");
    lots = data || [];
  }

  if (deliveryIds.length) {
    const { data, error } = await supabase
      .from("inventario_consumos_entrega")
      .select(`
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
        lote:lote_id (
          id,
          costo_unitario,
          fecha_compra
        ),
        entrada:entrada_id (
          id,
          folio,
          numero_factura,
          fecha_compra,
          archivo_url,
          proveedor:proveedor_id (
            id,
            nombre,
            codigo
          )
        )
      `)
      .in("entrega_id", deliveryIds);

    if (error) throw buildAppError(error, "No se pudo cargar la relación entre entregas e inventario.");
    consumptions = data || [];
  }

  const lotsByProductId = lots.reduce((acc, lot) => {
    if (!lot.producto_id) return acc;
    acc[lot.producto_id] = [...(acc[lot.producto_id] || []), lot];
    return acc;
  }, {});

  const consumptionsByDeliveryDetailId = consumptions.reduce((acc, item) => {
    if (!item.entrega_detalle_id) return acc;
    acc[item.entrega_detalle_id] = [...(acc[item.entrega_detalle_id] || []), item];
    return acc;
  }, {});

  return orders.map((order) => ({
    ...order,
    _inventoryLotsByProductId: lotsByProductId,
    _inventoryConsumptionsByDeliveryDetailId: consumptionsByDeliveryDetailId,
  }));
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from("pedidos")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw buildAppError(error, "No se pudieron cargar los pedidos.");

  const hydrated = await hydrateInventoryContext(data || []);
  return normalizeOrders(hydrated);
}

export async function fetchOrderById(orderId) {
  const { data, error } = await supabase
    .from("pedidos")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .single();

  if (error) throw buildAppError(error, "No se pudo cargar el pedido.");

  const [hydrated] = await hydrateInventoryContext(data ? [data] : []);
  return normalizeOrder(hydrated);
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
      regimen_fiscal,
      uso_cfdi,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      factura_payment_form,
      factura_payment_method,
      factura_currency,
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

  if (error) throw buildAppError(error);

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
    .select("id,nombre,descripcion,precio,precio_compra,cantidad_caja,codigo,iva_porcentaje,habilitado,clave_sat,clave_unidad_sat,unidad,tax_object")
    .order("nombre", { ascending: true });

  if (error) throw buildAppError(error);

  return (data || []).filter((product) => product.habilitado !== false);
}

export async function createOrder({ order, details }) {
  const cleanDetails = sanitizeDetails(details);
  if (!cleanDetails.length) throw new Error("Agrega al menos un producto al pedido.");

  const totals = calculateTotals(cleanDetails, order.iva_porcentaje, order.isr_porcentaje);
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
      iva_monto: totals.iva_monto,
      isr_porcentaje: totals.isr_porcentaje,
      isr_monto: totals.isr_monto,
      total: totals.total,
      estado: order.fecha_inicio || order.fecha_fin ? "creado" : "borrador",
      estado_pago: order.estado_pago || "pendiente",
      metodo_pago: order.metodo_pago || null,
      pago_referencia: order.pago_referencia || null,
      pago_monto: Number(order.pago_monto || 0),
      pago_fecha: order.pago_fecha || null,
      pago_notas: order.pago_notas || null,
      fecha_emision: order.fecha_emision || new Date().toISOString(),
      fecha_inicio: order.fecha_inicio || null,
      fecha_fin: order.fecha_fin || null,
      entrega_inicio: order.fecha_inicio || null,
      entrega_fin: order.fecha_fin || null,
      notas: order.notas || null,
    })
    .select()
    .single();

  if (orderError) throw buildAppError(orderError);

  await insertOrderDetails(createdOrder.id, cleanDetails);
  await createTrackingIfPossible(createdOrder.id);

  return fetchOrderById(createdOrder.id);
}

export async function updateOrder(orderId, { order, details }) {
  const cleanDetails = sanitizeDetails(details);
  if (!cleanDetails.length) throw new Error("Agrega al menos un producto al pedido.");

  const totals = calculateTotals(cleanDetails, order.iva_porcentaje, order.isr_porcentaje);
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
      iva_monto: totals.iva_monto,
      isr_porcentaje: totals.isr_porcentaje,
      isr_monto: totals.isr_monto,
      total: totals.total,
      estado: derivedStatus,
      estado_pago: order.estado_pago || "pendiente",
      metodo_pago: order.metodo_pago || null,
      pago_referencia: order.pago_referencia || null,
      pago_monto: Number(order.pago_monto || 0),
      pago_fecha: order.pago_fecha || null,
      pago_notas: order.pago_notas || null,
      fecha_inicio: order.fecha_inicio || null,
      fecha_fin: order.fecha_fin || null,
      entrega_inicio: order.fecha_inicio || null,
      entrega_fin: order.fecha_fin || null,
      notas: order.notas || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (orderError) throw buildAppError(orderError);

  await syncOrderDetails(orderId, cleanDetails);
  await updateOrderStatus(orderId);

  return fetchOrderById(orderId);
}


export async function updateOrderInvoiceDraft({ orderId, clientId, values }) {
  if (!orderId) throw new Error("Pedido inválido.");
  if (!values) throw new Error("No hay datos fiscales para guardar.");

  if (clientId) {
    const { error: clientError } = await supabase
      .from("clientes")
      .update({
        rfc: values.receiverRfc || null,
        razon_social: values.receiverName || null,
        regimen_fiscal: values.receiverFiscalRegime || null,
        uso_cfdi: values.receiverCfdiUse || null,
        codigo_postal: values.receiverTaxZipCode || null,
        correo: values.receiverEmail || null,
        factura_payment_form: values.paymentForm || null,
        factura_payment_method: values.paymentMethod || null,
        factura_currency: values.currency || "MXN",
      })
      .eq("id", clientId);

    if (clientError) throw clientError;
  }

  const orderPayload = {
    cliente_email: values.receiverEmail || null,
    payment_form: values.paymentForm || null,
    payment_method: values.paymentMethod || null,
    currency: values.currency || "MXN",
    serie_factura: values.serie || null,
    folio_factura: values.folio || null,
    updated_at: new Date().toISOString(),
  };

  const { error: orderError } = await supabase
    .from("pedidos")
    .update(orderPayload)
    .eq("id", orderId);

  if (orderError) throw buildAppError(orderError);

  return fetchOrderById(orderId);
}

export async function cancelOrder(orderId) {
  if (!orderId) throw new Error("Pedido inválido.");

  const { data: order, error: orderError } = await supabase
    .from("pedidos")
    .select("id, estado")
    .eq("id", orderId)
    .single();

  if (orderError) throw buildAppError(orderError);
  if (!order) throw new Error("No se encontró el pedido.");

  if (String(order.estado || "").toLowerCase() === "cancelado") {
    return fetchOrderById(orderId);
  }

  const { data: deliveries, error: deliveriesError } = await supabase
    .from("entregas")
    .select("id, estado")
    .eq("pedido_id", orderId)
    .neq("estado", "cancelada");

  if (deliveriesError) throw buildAppError(deliveriesError);

  const activeDeliveries = deliveries || [];

  for (const delivery of activeDeliveries) {
    const currentRows = await fetchDeliveryDetailRows(delivery.id);

    if (deliveryCountsAsDelivered(delivery.estado)) {
      await revertDeliveryFromOrderDetails(currentRows);
      await revertInventoryForDelivery(delivery.id);
    }

    const { error: deliveryUpdateError } = await supabase
      .from("entregas")
      .update({ estado: "cancelada", updated_at: new Date().toISOString() })
      .eq("id", delivery.id);

    if (deliveryUpdateError) throw buildAppError(deliveryUpdateError);
  }

  const { error } = await supabase
    .from("pedidos")
    .update({ estado: "cancelado", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw buildAppError(error);
  return fetchOrderById(orderId);
}

export async function restoreOrder(orderId) {
  const { data: order, error: orderError } = await supabase
    .from("pedidos")
    .select("id, fecha_inicio, fecha_fin, entrega_inicio, entrega_fin")
    .eq("id", orderId)
    .single();

  if (orderError) throw buildAppError(orderError);

  const { data: details, error: detailsError } = await supabase
    .from("pedido_detalles")
    .select("cantidad_pedida,cantidad_entregada")
    .eq("pedido_id", orderId);

  if (detailsError) throw buildAppError(detailsError);

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

  if (error) throw buildAppError(error);

  return fetchOrderById(orderId);
}


export async function deleteCancelledOrder(orderId) {
  if (!orderId) throw new Error("Pedido inválido.");

  const { data: order, error: orderError } = await supabase
    .from("pedidos")
    .select("id, folio, estado, cotizacion_id, cotizaciones:cotizacion_id ( id )")
    .eq("id", orderId)
    .single();

  if (orderError) throw buildAppError(orderError);
  if (!order) throw new Error("No se encontró el pedido.");

  if (String(order.estado || "").toLowerCase() !== "cancelado") {
    throw new Error("Solo puedes eliminar pedidos cancelados.");
  }

  const quote = Array.isArray(order.cotizaciones)
    ? order.cotizaciones[0] || null
    : order.cotizaciones || null;

  if (order.cotizacion_id && quote?.id) {
    throw new Error("No se puede eliminar este pedido porque todavía está enlazado a una cotización existente. Conserva el registro para no romper el historial.");
  }

  const { data: deliveries, error: deliveriesError } = await supabase
    .from("entregas")
    .select("id")
    .eq("pedido_id", orderId);

  if (deliveriesError) throw deliveriesError;

  const deliveryIds = (deliveries || [])
    .map((delivery) => delivery.id)
    .filter(Boolean);

  if (deliveryIds.length) {
    for (const deliveryId of deliveryIds) {
      await revertInventoryForDelivery(deliveryId);
    }

    const { error: deliveryDetailsError } = await supabase
      .from("entrega_detalles")
      .delete()
      .in("entrega_id", deliveryIds);

    if (deliveryDetailsError) throw deliveryDetailsError;
  }

  const { error: deliveriesDeleteError } = await supabase
    .from("entregas")
    .delete()
    .eq("pedido_id", orderId);

  if (deliveriesDeleteError) throw deliveriesDeleteError;

  const { data: recurrences, error: recurrencesError } = await supabase
    .from("pedido_recurrencias")
    .select("id")
    .eq("pedido_id", orderId);

  if (recurrencesError) throw recurrencesError;

  const recurrenceIds = (recurrences || [])
    .map((recurrence) => recurrence.id)
    .filter(Boolean);

  if (recurrenceIds.length) {
    const { error: recurrenceProductsError } = await supabase
      .from("pedido_recurrencia_productos")
      .delete()
      .in("recurrencia_id", recurrenceIds);

    if (recurrenceProductsError) throw recurrenceProductsError;
  }

  const { error: recurrencesDeleteError } = await supabase
    .from("pedido_recurrencias")
    .delete()
    .eq("pedido_id", orderId);

  if (recurrencesDeleteError) throw recurrencesDeleteError;

  const relatedDeletes = [
    supabase.from("facturas").delete().eq("pedido_id", orderId),
    supabase.from("pedido_tracking").delete().eq("pedido_id", orderId),
    supabase.from("pedido_detalles").delete().eq("pedido_id", orderId),
  ];

  for (const request of relatedDeletes) {
    const { error } = await request;
    if (error) throw buildAppError(error);
  }

  const { error: deleteOrderError } = await supabase
    .from("pedidos")
    .delete()
    .eq("id", orderId);

  if (deleteOrderError) throw deleteOrderError;

  return true;
}

function isPickupDelivery(delivery = {}) {
  return delivery.tipo_entrega === "recogido";
}

function getDeliveryNotes(delivery = {}) {
  if (delivery.notas) return delivery.notas;
  return isPickupDelivery(delivery) ? "Recogido por el cliente" : null;
}

async function validateStockBeforeDeliveryConsumption(rows = [], stockAlreadyConsumedRows = []) {
  const requiredByProductId = rows.reduce((acc, row) => {
    if (!row.producto_id) return acc;
    acc[row.producto_id] = Number(acc[row.producto_id] || 0) + Number(row.cantidad_entregada || 0);
    return acc;
  }, {});

  const productIds = Object.keys(requiredByProductId);
  if (!productIds.length) return true;

  const { data: lots, error } = await supabase
    .from("inventario_lotes")
    .select("producto_id,cantidad_disponible,productos:producto_id(nombre,codigo)")
    .in("producto_id", productIds)
    .gt("cantidad_disponible", 0);

  if (error) throw buildAppError(error, "No se pudo revisar el stock disponible.");

  const availableByProductId = (lots || []).reduce((acc, lot) => {
    acc[lot.producto_id] = Number(acc[lot.producto_id] || 0) + Number(lot.cantidad_disponible || 0);
    return acc;
  }, {});

  // Cuando se edita una entrega que ya estaba entregada, ese stock ya fue descontado.
  // Para validar sin romper el proceso, lo sumamos temporalmente como disponible lógico.
  for (const row of stockAlreadyConsumedRows || []) {
    if (!row.producto_id) continue;
    availableByProductId[row.producto_id] = Number(availableByProductId[row.producto_id] || 0) + Number(row.cantidad_entregada || 0);
  }

  const checkedProductIds = new Set();
  for (const row of rows) {
    if (!row.producto_id || checkedProductIds.has(row.producto_id)) continue;
    checkedProductIds.add(row.producto_id);

    const needed = Number(requiredByProductId[row.producto_id] || 0);
    const available = Number(availableByProductId[row.producto_id] || 0);
    if (needed > available) {
      const lot = (lots || []).find((item) => item.producto_id === row.producto_id);
      const name = row.nombre_producto || lot?.productos?.nombre || row.producto_id;
      const code = row.codigo || lot?.productos?.codigo || "sin código";
      throw new Error(`No se puede marcar como entregado porque falta inventario para ${name} (${code}). Necesitas ${needed}, pero solo hay ${available}. Primero agrega una entrada de inventario o reduce la cantidad entregada.`);
    }
  }

  return true;
}

export async function createDelivery({ order, delivery, products }) {
  if (!order?.id) throw new Error("Pedido inválido.");
  if (!isPickupDelivery(delivery) && !delivery.cliente_direccion_id) throw new Error("Selecciona una dirección del cliente o la opción de recogido.");
  if (!delivery.fecha_entrega) throw new Error("Selecciona fecha y hora de entrega.");

  const rows = buildDeliveryRows(products);
  if (!rows.length) throw new Error("Captura al menos una cantidad a entregar.");

  const overLimit = rows.find((item) => item.cantidad_entregada > item.pendiente);
  if (overLimit) throw new Error("Hay cantidades mayores a lo pendiente.");

  await validateDeliveryRowsAvailability({ orderId: order.id, rows });

  const willBeCounted = deliveryCountsAsDelivered(delivery.estado || "pendiente");
  if (willBeCounted) {
    // Validamos ANTES de crear la entrega. Si no hay stock, no queda una entrega fantasma como "entregada".
    await validateStockBeforeDeliveryConsumption(rows);
  }

  const { data: createdDelivery, error: deliveryError } = await supabase
    .from("entregas")
    .insert({
      folio: delivery.folio || generateFolio("ENT"),
      pedido_id: order.id,
      estado: delivery.estado || "pendiente",
      fecha_entrega: delivery.fecha_entrega,
      recibido_por: delivery.recibido_por || null,
      notas: getDeliveryNotes(delivery),
      cliente_direccion_id: isPickupDelivery(delivery) ? null : delivery.cliente_direccion_id,
    })
    .select()
    .single();

  if (deliveryError) throw buildAppError(deliveryError);

  try {
    await insertDeliveryDetails(createdDelivery.id, rows);

    if (deliveryCountsAsDelivered(createdDelivery.estado)) {
      await consumeInventoryForDelivery(createdDelivery.id);
      await applyDeliveryToOrderDetails(rows);
    }

    await updateOrderStatus(order.id);

    return fetchOrderById(order.id);
  } catch (error) {
    await cleanupDeliveryAfterInventoryError(createdDelivery.id);
    throw error;
  }
}

export async function updateDelivery({ order, delivery, products }) {
  if (!order?.id) throw new Error("Pedido inválido.");
  if (!delivery?.id) throw new Error("Entrega inválida.");
  if (!isPickupDelivery(delivery) && !delivery.cliente_direccion_id) throw new Error("Selecciona una dirección del cliente o la opción de recogido.");
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

  if (willBeCounted) {
    // Validamos ANTES de cambiar el estado de la entrega.
    // Si no hay stock, la entrega se queda como estaba y el usuario ve un error claro.
    await validateStockBeforeDeliveryConsumption(rows, wasCounted ? currentRows : []);
  }

  if (wasCounted) {
    await revertDeliveryFromOrderDetails(currentRows);
    await revertInventoryForDelivery(delivery.id);
  }

  const { error: deliveryError } = await supabase
    .from("entregas")
    .update({
      estado: delivery.estado || "pendiente",
      fecha_entrega: delivery.fecha_entrega,
      recibido_por: delivery.recibido_por || null,
      notas: getDeliveryNotes(delivery),
      cliente_direccion_id: isPickupDelivery(delivery) ? null : delivery.cliente_direccion_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", delivery.id);

  if (deliveryError) throw buildAppError(deliveryError);

  const { error: deleteDetailsError } = await supabase
    .from("entrega_detalles")
    .delete()
    .eq("entrega_id", delivery.id);

  if (deleteDetailsError) throw buildAppError(deleteDetailsError);

  await insertDeliveryDetails(delivery.id, rows);

  if (willBeCounted) {
    await consumeInventoryForDelivery(delivery.id);
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
    await revertInventoryForDelivery(delivery.id);
  }

  const { error: detailError } = await supabase
    .from("entrega_detalles")
    .delete()
    .eq("entrega_id", delivery.id);

  if (detailError) throw buildAppError(detailError);

  const { error: deliveryError } = await supabase
    .from("entregas")
    .delete()
    .eq("id", delivery.id);

  if (deliveryError) throw buildAppError(deliveryError);

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
    if (error) throw buildAppError(error);
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

  if (error) throw buildAppError(error);
  return true;
}

async function insertOrderDetails(orderId, details) {
  const payload = details.map((item) => buildDetailPayload(orderId, item));
  const { error } = await supabase.from("pedido_detalles").insert(payload);
  if (error) throw buildAppError(error);
}

async function syncOrderDetails(orderId, details) {
  const { data: currentDetails, error } = await supabase
    .from("pedido_detalles")
    .select("*")
    .eq("pedido_id", orderId);

  if (error) throw buildAppError(error);

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
      if (updateError) throw buildAppError(updateError);
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
      nombre_producto: item.nombre_producto || item.nombre || "Producto",
      codigo: item.codigo || "",
    }));
}

async function validateDeliveryRowsAvailability({ orderId, rows, deliveryId = null }) {
  const { data: details, error: detailsError } = await supabase
    .from("pedido_detalles")
    .select("id,cantidad_pedida")
    .eq("pedido_id", orderId);

  if (detailsError) throw buildAppError(detailsError);

  let deliveryDetailsQuery = supabase
    .from("entrega_detalles")
    .select("pedido_detalle_id,cantidad_entregada,entregas!inner(id,estado,pedido_id)")
    .eq("entregas.pedido_id", orderId)
    .neq("entregas.estado", "cancelada");

  if (deliveryId) {
    deliveryDetailsQuery = deliveryDetailsQuery.neq("entrega_id", deliveryId);
  }

  const { data: deliveryRows, error: deliveryRowsError } = await deliveryDetailsQuery;
  if (deliveryRowsError) throw buildAppError(deliveryRowsError);

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


async function cleanupDeliveryAfterInventoryError(deliveryId) {
  if (!deliveryId) return;

  try {
    await revertInventoryForDelivery(deliveryId);
  } catch (error) {
    console.warn("No había inventario que revertir o no se pudo revertir:", error.message || error);
  }

  const { error: detailsError } = await supabase
    .from("entrega_detalles")
    .delete()
    .eq("entrega_id", deliveryId);

  if (detailsError) {
    console.warn("No se pudieron borrar los detalles de la entrega fallida:", detailsError.message || detailsError);
  }

  const { error: deliveryError } = await supabase
    .from("entregas")
    .delete()
    .eq("id", deliveryId);

  if (deliveryError) {
    console.warn("No se pudo borrar la entrega fallida:", deliveryError.message || deliveryError);
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

  if (error) throw buildAppError(error);
}

async function fetchDeliveryDetailRows(deliveryId) {
  const { data, error } = await supabase
    .from("entrega_detalles")
    .select("id,entrega_id,pedido_detalle_id,producto_id,cantidad_entregada")
    .eq("entrega_id", deliveryId);

  if (error) throw buildAppError(error);
  return data || [];
}

async function fetchDeliveryHeader(deliveryId) {
  const { data, error } = await supabase
    .from("entregas")
    .select("id,estado")
    .eq("id", deliveryId)
    .maybeSingle();

  if (error) throw buildAppError(error);
  return data;
}

async function revertDeliveryFromOrderDetails(rows) {
  for (const item of rows || []) {
    const { data: detail, error } = await supabase
      .from("pedido_detalles")
      .select("*")
      .eq("id", item.pedido_detalle_id)
      .single();

    if (error) throw buildAppError(error);

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

    if (updateError) throw buildAppError(updateError);
  }
}

async function applyDeliveryToOrderDetails(rows) {
  for (const item of rows) {
    const { data: detail, error } = await supabase
      .from("pedido_detalles")
      .select("*")
      .eq("id", item.pedido_detalle_id)
      .single();

    if (error) throw buildAppError(error);

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

    if (updateError) throw buildAppError(updateError);
  }
}

async function updateOrderStatus(orderId) {
  const { data: details, error } = await supabase
    .from("pedido_detalles")
    .select("cantidad_pedida,cantidad_entregada")
    .eq("pedido_id", orderId);

  if (error) throw buildAppError(error);

  const estado = deriveOrderStatusFromDetails(details || []);
  const { error: updateError } = await supabase
    .from("pedidos")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (updateError) throw buildAppError(updateError);
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

function calculateTotals(details, iva = 8, isr = 0) {
  const subtotal = details.reduce((acc, item) => {
    return acc + Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0);
  }, 0);
  const iva_porcentaje = Math.floor(Number(iva || 0));
  const isr_porcentaje = Number(isr || 0);
  const iva_monto = subtotal * (iva_porcentaje / 100);
  const isr_monto = subtotal * (isr_porcentaje / 100);
  const total = Math.max(subtotal + iva_monto - isr_monto, 0);
  return { subtotal, iva_porcentaje, iva_monto, isr_porcentaje, isr_monto, total };
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

function normalizeProductSuppliers(rows = []) {
  return (rows || [])
    .filter((row) => row.activo !== false)
    .map((row) => ({
      id: row.id,
      producto_id: row.producto_id,
      proveedor_id: row.proveedor_id,
      sku_proveedor: row.sku_proveedor || "",
      precio_compra: row.precio_compra ?? "",
      moneda: row.moneda || "MXN",
      tiempo_entrega_dias: row.tiempo_entrega_dias ?? "",
      es_principal: Boolean(row.es_principal),
      notas: row.notas || "",
      proveedor: row.proveedores || null,
      nombre: row.proveedores?.nombre || "Proveedor",
      correo: row.proveedores?.correo || "",
      telefono: row.proveedores?.telefono || "",
      contacto_nombre: row.proveedores?.contacto_nombre || "",
      rfc: row.proveedores?.rfc || "",
    }))
    .sort((a, b) => Number(b.es_principal) - Number(a.es_principal));
}

function getConsumptionUnitCost(consumption = {}, fallback = 0) {
  return Number(
    consumption.costo_unitario ??
      consumption.lote?.costo_unitario ??
      fallback ??
      0,
  );
}

function getRealInventoryByPedidoDetalleId(order = {}, rawDetails = []) {
  const result = {};

  (order.entregas || []).forEach((delivery) => {
    if (!deliveryCountsAsDelivered(delivery.estado)) return;

    (delivery.entrega_detalles || []).forEach((row) => {
      const detailId = row.pedido_detalle_id;
      if (!detailId) return;

      const orderDetail = rawDetails.find((item) => item.id === detailId);
      const fallbackCost = Number(orderDetail?.costo_unitario || 0);
      const consumptions = order._inventoryConsumptionsByDeliveryDetailId?.[row.id] || [];

      if (consumptions.length) {
        consumptions.forEach((consumption) => {
          const quantity = Number(consumption.cantidad || 0);
          const costUnit = getConsumptionUnitCost(consumption, fallbackCost);
          result[detailId] = result[detailId] || { quantity: 0, cost: 0 };
          result[detailId].quantity += quantity;
          result[detailId].cost += quantity * costUnit;
        });
        return;
      }

      const quantity = Number(row.cantidad_entregada || 0);
      result[detailId] = result[detailId] || { quantity: 0, cost: 0 };
      result[detailId].quantity += quantity;
      result[detailId].cost += quantity * fallbackCost;
    });
  });

  return result;
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

  const quote = Array.isArray(order.cotizaciones)
    ? order.cotizaciones[0] || null
    : order.cotizaciones || null;

  const rawDetails = (order.pedido_detalles || [])
    .map((item) => ({
      ...item,
      importe: Number(item.importe || 0) || Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0),
      lotes_disponibles: order._inventoryLotsByProductId?.[item.producto_id] || [],
    }))
    .sort((a, b) => String(a.nombre_producto || "").localeCompare(String(b.nombre_producto || "")));

  const deliveredByDetailId = getDeliveredQuantitiesFromCompletedDeliveries(order.entregas || []);
  const reservedByDetailId = getReservedQuantitiesFromActiveDeliveries(order.entregas || []);
  const realInventoryByDetailId = getRealInventoryByPedidoDetalleId(order, rawDetails);

  const details = rawDetails.map((item) => {
    const ordered = Math.floor(Number(item.cantidad_pedida || 0));
    const delivered = Math.min(Math.floor(Number(deliveredByDetailId[item.id] || 0)), ordered);
    const reserved = Math.min(Math.floor(Number(reservedByDetailId[item.id] || 0)), ordered);
    const pending = Math.max(ordered - delivered, 0);
    const available = Math.max(ordered - reserved, 0);

    return {
      ...item,
      proveedores_asociados: normalizeProductSuppliers(item.productos?.producto_proveedores),
      producto: item.productos || null,
      cantidad_pedida: ordered,
      cantidad_entregada: delivered,
      cantidad_reservada: reserved,
      cantidad_pendiente: pending,
      cantidad_disponible: available,
      cantidad_consumida_fifo: Number(realInventoryByDetailId[item.id]?.quantity || delivered),
      costo_real_fifo: Number(realInventoryByDetailId[item.id]?.cost ?? (delivered * Number(item.costo_unitario || 0))),
      venta_entregada: delivered * Number(item.precio_unitario || 0),
      ganancia_real: (delivered * Number(item.precio_unitario || 0)) - Number(realInventoryByDetailId[item.id]?.cost ?? (delivered * Number(item.costo_unitario || 0))),
      estado: getDetailStatus(ordered, delivered),
    };
  });

  const deliveries = (order.entregas || [])
    .map((delivery) => {
      const address = (client.cliente_direcciones || []).find((item) => item.id === delivery.cliente_direccion_id) || null;
      const isPickup = !delivery.cliente_direccion_id;

      return {
      ...delivery,
      address,
      is_pickup: isPickup,
      tipo_entrega_label: isPickup ? "Recogido por el cliente" : "Entrega a domicilio",
      details: (delivery.entrega_detalles || []).map((row) => {
        const orderDetail = rawDetails.find((item) => item.id === row.pedido_detalle_id);
        return {
          ...row,
          nombre_producto: orderDetail?.nombre_producto || "Producto",
          codigo: orderDetail?.codigo || "",
          consumos_inventario: order._inventoryConsumptionsByDeliveryDetailId?.[row.id] || [],
        };
      }),
    };
    })
    .sort((a, b) => new Date(b.fecha_entrega || b.created_at || 0) - new Date(a.fecha_entrega || a.created_at || 0));

  return {
    ...order,
    cliente_nombre: order.cliente_nombre || client.nombre || "Cliente sin nombre",
    cliente_telefono: order.cliente_telefono || client.numero || "",
    cliente_email: order.cliente_email || client.correo || "",
    cliente_rfc: client.rfc || order.cliente_rfc || "",
    cliente_razon_social: client.razon_social || order.cliente_razon_social || order.cliente_nombre || "",
    cliente_regimen_fiscal: client.regimen_fiscal || order.cliente_regimen_fiscal || "",
    cliente_uso_cfdi: client.uso_cfdi || order.cliente_uso_cfdi || "",
    cliente_codigo_postal: client.codigo_postal || order.cliente_codigo_postal || "",
    cliente_direccion_fiscal: client.direccion || order.cliente_direccion_fiscal || "",
    cliente_direcciones: (client.cliente_direcciones || [])
      .filter((address) => address.activo !== false)
      .sort((a, b) => Number(b.es_principal) - Number(a.es_principal)),
    tracking_token: tracking?.token || order.tracking_token || "",
    active_recurrence: activeRecurrence,
    is_recurrent: Boolean(activeRecurrence),
    quotation: quote,
    facturas: (order.facturas || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
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



function getFacturamaErrorMessage(data, fallback = "Operación rechazada por Facturama.") {
  const facturamaData = data?.facturamaData || data;

  if (typeof facturamaData === "string") return facturamaData;
  if (facturamaData?.Message) return facturamaData.Message;
  if (facturamaData?.message) return facturamaData.message;

  if (facturamaData?.ModelState) {
    return Object.entries(facturamaData.ModelState)
      .flatMap(([field, messages]) => {
        if (Array.isArray(messages)) return messages.map((message) => `${field}: ${message}`);
        return [`${field}: ${messages}`];
      })
      .join("\n");
  }

  return data?.message || fallback;
}

function buildFacturamaError(data, fallback) {
  const err = new Error(getFacturamaErrorMessage(data, fallback));
  err.status = data?.status || null;
  err.facturamaData = data?.facturamaData || null;
  err.payloadSent = data?.payloadSent || null;
  return err;
}

export async function stampOrderInvoiceSandbox({ orderId, invoiceData }) {
  if (!orderId) throw new Error("Pedido inválido.");
  if (!invoiceData) throw new Error("No hay datos de factura para timbrar.");

  const { data, error } = await supabase.functions.invoke("facturama-stamp-order-sandbox", {
    body: {
      orderId,
      invoiceData,
    },
  });

  if (error) {
    const err = new Error(error.message || "No se pudo llamar la función de Facturama.");
    err.originalError = error;
    throw err;
  }

  if (!data) {
    throw new Error("La función de Facturama no regresó datos.");
  }

  if (data.ok !== true) {
    throw buildFacturamaError(data, "Facturama rechazó el timbrado sandbox.");
  }

  return data;
}

export async function downloadInvoiceDocumentSandbox({ orderId, format }) {
  if (!orderId) throw new Error("Pedido inválido.");
  if (!["pdf", "xml"].includes(format)) throw new Error("Formato inválido.");

  const { data, error } = await supabase.functions.invoke("facturama-download-document-sandbox", {
    body: { orderId, format },
  });

  if (error) throw new Error(error.message || `No se pudo descargar ${format.toUpperCase()}.`);
  if (!data?.ok) throw new Error(data?.message || `No se pudo descargar ${format.toUpperCase()}.`);

  downloadBase64File({
    base64: data.base64,
    filename: data.filename || `factura-${orderId}.${format}`,
    mimeType: data.mimeType || (format === "pdf" ? "application/pdf" : "application/xml"),
  });

  return data;
}


export async function sendInvoiceEmailSandbox({ orderId, email }) {
  if (!orderId) throw new Error("Pedido inválido.");
  if (!email || !String(email).includes("@")) throw new Error("Correo inválido.");

  const { data, error } = await supabase.functions.invoke("facturama-send-invoice-email-sandbox", {
    body: { orderId, email },
  });

  if (error) throw new Error(error.message || "No se pudo enviar la factura por correo.");

  if (!data?.ok) {
    throw buildFacturamaError(data, "No se pudo enviar la factura por correo.");
  }

  return data;
}

export async function cancelInvoiceSandbox({ orderId, reason = "02", replacementUuid = "" }) {
  if (!orderId) throw new Error("Pedido inválido.");

  const { data, error } = await supabase.functions.invoke("facturama-cancel-invoice-sandbox", {
    body: { orderId, reason, replacementUuid },
  });

  if (error) throw new Error(error.message || "No se pudo cancelar el CFDI.");

  if (!data?.ok) {
    throw buildFacturamaError(data, "No se pudo cancelar el CFDI.");
  }

  return data;
}

export async function deleteLocalInvoiceRecord({ orderId, invoiceId }) {
  if (!orderId) throw new Error("Pedido inválido.");
  if (!invoiceId) throw new Error("Factura inválida. No se puede borrar sin ID específico.");

  const { data: order, error: orderError } = await supabase
    .from("pedidos")
    .select("id,factura_status,facturama_id,factura_uuid")
    .eq("id", orderId)
    .single();

  if (orderError) throw buildAppError(orderError);

  const status = String(order?.factura_status || "").toLowerCase();
  const hasActiveInvoice = Boolean(order?.facturama_id || order?.factura_uuid) && status !== "cancelada";

  if (hasActiveInvoice) {
    throw new Error("Primero cancela el CFDI activo antes de borrar registros locales del historial.");
  }

  const { data: invoice, error: invoiceReadError } = await supabase
    .from("facturas")
    .select("id,pedido_id,status,uuid,facturama_id")
    .eq("id", invoiceId)
    .eq("pedido_id", orderId)
    .single();

  if (invoiceReadError) throw invoiceReadError;

  if (String(invoice?.status || "").toLowerCase() !== "cancelada") {
    throw new Error("Solo puedes borrar del historial facturas canceladas.");
  }

  const { error: invoiceDeleteError } = await supabase
    .from("facturas")
    .delete()
    .eq("id", invoiceId)
    .eq("pedido_id", orderId);

  if (invoiceDeleteError) throw invoiceDeleteError;

  // Si el pedido conserva en sus campos resumen la misma factura eliminada,
  // se limpian esos datos para que no vuelva a aparecer en la relación CFDI.
  const sameSummaryInvoice =
    (invoice?.uuid && invoice.uuid === order?.factura_uuid) ||
    (invoice?.facturama_id && invoice.facturama_id === order?.facturama_id);

  if (sameSummaryInvoice) {
    const { error: orderUpdateError } = await supabase
      .from("pedidos")
      .update({
        facturama_id: null,
        factura_uuid: null,
        factura_status: null,
        factura_pdf_url: null,
        factura_xml_url: null,
        factura_cancel_reason: null,
        factura_replacement_uuid: null,
        factura_timbrada_at: null,
        factura_cancelada_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (orderUpdateError) throw orderUpdateError;
  }

  return fetchOrderById(orderId);
}

function downloadBase64File({ base64, filename, mimeType }) {
  if (!base64) throw new Error("La descarga no regresó contenido.");

  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let index = 0; index < byteCharacters.length; index += 1) {
    byteNumbers[index] = byteCharacters.charCodeAt(index);
  }

  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

