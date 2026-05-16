export function moneyMX(value) {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}

export function dateMX(value, withTime = false) {
  if (!value) return 'Sin fecha';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  });
}

export function safeText(value, fallback = '-') {
  if (typeof value === 'object' && value !== null) return fallback;
  const text = value === null || value === undefined ? '' : String(value).trim();
  return text || fallback;
}

export function normalizeTracking(value) {
  return String(value || '').trim().toUpperCase();
}

export function getTrackingToken(order) {
  const raw =
    order?.tracking_token ||
    order?.tracking_numero ||
    order?.tracking_number ||
    order?.token ||
    order?.pedido_tracking?.token ||
    order?.pedido_tracking?.tracking ||
    order?.pedido_tracking?.tracking_token ||
    order?.pedido_tracking?.tracking_number ||
    order?.tracking?.token ||
    order?.tracking?.tracking ||
    order?.tracking?.tracking_token ||
    order?.tracking?.tracking_number ||
    '';

  return safeText(raw, '-');
}

export function getOrderItems(order) {
  return order?.productos || order?.pedido_detalles || order?.detalles || [];
}

export function getOrderDeliveries(order) {
  return order?.entregas || [];
}

export function getDeliveryItems(delivery) {
  return (
    delivery?.productos ||
    delivery?.entrega_detalles ||
    delivery?.detalles ||
    delivery?.items ||
    []
  );
}

export function findOrderItemForDeliveryItem(item, order) {
  const orderItems = getOrderItems(order);
  const pedidoDetalleId = item?.pedido_detalle_id || item?.pedido_detalles?.id || item?.pedido_detalle?.id;
  const productoId = item?.producto_id || item?.producto?.id || item?.productos?.id;

  return orderItems.find((orderItem) => {
    return (
      (pedidoDetalleId && String(orderItem?.id) === String(pedidoDetalleId)) ||
      (productoId && String(orderItem?.producto_id || orderItem?.id) === String(productoId))
    );
  });
}

export function getDeliveryItemName(item, order) {
  const orderItem = findOrderItemForDeliveryItem(item, order);

  return safeText(
    item?.nombre_producto ||
      item?.descripcion ||
      item?.producto?.nombre ||
      item?.productos?.nombre ||
      item?.pedido_detalles?.nombre_producto ||
      item?.pedido_detalle?.nombre_producto ||
      orderItem?.nombre_producto ||
      orderItem?.nombre,
    'Producto',
  );
}

export function getDeliveryItemCode(item, order) {
  const orderItem = findOrderItemForDeliveryItem(item, order);

  return safeText(
    item?.codigo ||
      item?.producto?.codigo ||
      item?.productos?.codigo ||
      item?.pedido_detalles?.codigo ||
      item?.pedido_detalle?.codigo ||
      orderItem?.codigo,
    '',
  );
}

export function getDeliveryItemQuantity(item) {
  return Number(
    item?.cantidad_entregada ??
      item?.cantidad ??
      item?.unidades ??
      item?.qty ??
      0,
  );
}

export function getDeliveryUnits(delivery) {
  const explicit = delivery?.unidades ?? delivery?.total_unidades ?? delivery?.cantidad_total;
  if (explicit !== undefined && explicit !== null && explicit !== '') return Number(explicit);

  return getDeliveryItems(delivery).reduce((sum, item) => sum + getDeliveryItemQuantity(item), 0);
}

export function getDeliveryReceiver(delivery) {
  return safeText(
    delivery?.recibido_por ||
      delivery?.recibe ||
      delivery?.contacto_nombre ||
      delivery?.cliente_direcciones?.contacto_nombre ||
      delivery?.cliente_direccion?.contacto_nombre,
    'No especificado',
  );
}

export function getDeliveryAddress(delivery) {
  const address =
    delivery?.direccion ||
    delivery?.direccion_entrega ||
    delivery?.cliente_direcciones?.direccion ||
    delivery?.cliente_direccion?.direccion;

  const city = delivery?.ciudad || delivery?.cliente_direcciones?.ciudad || delivery?.cliente_direccion?.ciudad;
  const state = delivery?.estado_direccion || delivery?.cliente_direcciones?.estado || delivery?.cliente_direccion?.estado;
  const zip = delivery?.codigo_postal || delivery?.cliente_direcciones?.codigo_postal || delivery?.cliente_direccion?.codigo_postal;

  return [address, city, state, zip].filter(Boolean).join(' · ') || 'Dirección no disponible';
}

export function getOrderTotals(order) {
  const items = getOrderItems(order);

  const subtotal = Number(
    order?.subtotal ??
      items.reduce((sum, item) => {
        const qty = Number(item.cantidad_pedida ?? item.cantidad ?? 0);
        const price = Number(item.precio_unitario ?? item.precio ?? 0);
        return sum + qty * price;
      }, 0),
  );

  const ivaPorcentaje = Number(order?.iva_porcentaje ?? 8);
  const descuento = Number(order?.descuento ?? 0);
  const base = Math.max(subtotal - descuento, 0);
  const iva = Number(order?.iva_monto ?? base * (ivaPorcentaje / 100));
  const total = Number(order?.total ?? base + iva);

  return {
    subtotal,
    descuento,
    iva,
    ivaPorcentaje,
    total,
  };
}

export function getPublicProgress(order) {
  const items = getOrderItems(order);

  const total = items.reduce((sum, item) => {
    return sum + Number(item.cantidad_pedida ?? item.cantidad ?? 0);
  }, 0);

  const delivered = items.reduce((sum, item) => {
    return sum + Number(item.cantidad_entregada ?? item.entregado ?? 0);
  }, 0);

  const pending = Math.max(total - delivered, 0);
  const percentage = total > 0 ? Math.min((delivered / total) * 100, 100) : 0;

  return {
    total,
    delivered,
    pending,
    percentage,
  };
}

export function publicOrderStatusLabel(status) {
  const normalized = String(status || '').toLowerCase();

  const labels = {
    borrador: 'En preparación',
    creado: 'Pedido recibido',
    pendiente: 'Pedido recibido',
    parcial: 'Entrega parcial',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };

  return labels[normalized] || 'En proceso';
}

export function publicDeliveryStatusLabel(status) {
  const normalized = String(status || '').toLowerCase();

  const labels = {
    programada: 'Programada',
    pendiente: 'Pendiente',
    en_ruta: 'En ruta',
    entregada: 'Entregada',
    cancelada: 'Cancelada',
  };

  return labels[normalized] || 'Pendiente';
}
