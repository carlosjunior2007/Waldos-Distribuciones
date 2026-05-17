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

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

export function percentMX(value) {
  const number = finiteNumber(value, 0);
  return Number.isInteger(number)
    ? String(number)
    : number.toLocaleString('es-MX', { maximumFractionDigits: 4 });
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

  const itemsSubtotal = items.reduce((sum, item) => {
    const qty = finiteNumber(item.cantidad_pedida ?? item.cantidad, 0);
    const price = finiteNumber(item.precio_unitario ?? item.precio, 0);
    return sum + qty * price;
  }, 0);

  const subtotal = finiteNumber(order?.subtotal, itemsSubtotal);
  const ivaPorcentaje = finiteNumber(order?.iva_porcentaje, 8);
  const descuento = finiteNumber(order?.descuento, 0);
  const base = Math.max(subtotal - descuento, 0);
  const iva = hasValue(order?.iva_monto)
    ? finiteNumber(order.iva_monto, 0)
    : base * (ivaPorcentaje / 100);

  const explicitIsr = hasValue(order?.isr_monto);
  let isrPorcentaje = finiteNumber(order?.isr_porcentaje, 0);
  let isr = explicitIsr ? finiteNumber(order.isr_monto, 0) : base * (isrPorcentaje / 100);

  const fallbackTotal = Math.max(base + iva - isr, 0);
  const total = hasValue(order?.total) ? finiteNumber(order.total, fallbackTotal) : fallbackTotal;

  // Si el endpoint público aún no manda isr_monto/isr_porcentaje, pero el total ya viene con ISR retenido,
  // inferimos la retención para que el desglose del PDF/tracking no oculte el impuesto.
  if (!explicitIsr && isr <= 0 && total < base + iva) {
    isr = Math.max(base + iva - total, 0);
    if (base > 0 && isrPorcentaje <= 0) {
      isrPorcentaje = (isr / base) * 100;
    }
  }

  return {
    subtotal,
    descuento,
    base,
    iva,
    ivaPorcentaje,
    isr,
    isrPorcentaje,
    total,
    hasIsr: isr > 0.004 || isrPorcentaje > 0,
    hasDiscount: descuento > 0,
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



export function normalizeInvoiceStatus(source) {
  const raw = String(
    source?.status ||
      source?.factura_status ||
      source?.invoice_status ||
      source?.cfdi_status ||
      source?.estado_factura ||
      source?.estado_cfdi ||
      source?.facturacion_status ||
      source?.estatus_factura ||
      source?.estatus_cfdi ||
      '',
  ).toLowerCase().trim();

  if (raw) return raw;

  if (source?.timbrado || source?.timbrada || source?.is_timbrado || source?.isInvoiced || source?.facturado) {
    return 'timbrada';
  }

  return '';
}

export function isActiveInvoiceStatus(status) {
  const normalized = String(status || '').toLowerCase().trim();
  return [
    'timbrada',
    'timbrado',
    'facturada',
    'facturado',
    'invoiced',
    'issued',
    'vigente',
    'active',
  ].includes(normalized);
}

export function isCanceledInvoice(invoice) {
  const status = normalizeInvoiceStatus(invoice);

  return ['cancelada', 'cancelado', 'canceled', 'cancelled', 'cancelled_cfdi'].includes(status);
}

export function isDeletedLocalInvoice(invoice) {
  return Boolean(
    invoice?.deleted_local ||
      invoice?.deletedLocal ||
      invoice?.deleted_local_at ||
      invoice?.deletedLocalAt,
  );
}

export function getInvoiceTitle(invoice, fallback = 'Factura') {
  const serie = safeText(invoice?.serie || invoice?.factura_serie || invoice?.invoice_serie || invoice?.serie_factura, '');
  const folio = safeText(invoice?.folio || invoice?.factura_folio || invoice?.invoice_folio || invoice?.folio_factura, '');
  return [serie, folio].filter(Boolean).join('-') || fallback;
}

export function getInvoiceUuid(invoice) {
  return safeText(invoice?.uuid || invoice?.factura_uuid || invoice?.invoice_uuid || invoice?.cfdi_uuid, '');
}

export function getInvoiceFacturamaId(invoice) {
  return safeText(invoice?.facturama_id || invoice?.facturamaId || invoice?.factura_facturama_id || invoice?.invoice_facturama_id, '');
}

export function getInvoiceDate(invoice) {
  return (
    invoice?.timbrada_at ||
    invoice?.factura_timbrada_at ||
    invoice?.invoice_timbrada_at ||
    invoice?.fecha_timbrado ||
    invoice?.fecha_factura ||
    invoice?.created_at ||
    invoice?.factura_fecha ||
    invoice?.fecha ||
    null
  );
}

export function getActiveInvoice(order) {
  const invoices = Array.isArray(order?.facturas) ? order.facturas : [];
  const activeFromHistory = invoices.find((invoice) => {
    if (isDeletedLocalInvoice(invoice) || isCanceledInvoice(invoice)) return false;

    return Boolean(
      invoice?.id ||
        invoice?.facturama_id ||
        invoice?.facturamaId ||
        invoice?.uuid ||
        invoice?.factura_uuid ||
        invoice?.pdf_url ||
        invoice?.xml_url ||
        isActiveInvoiceStatus(normalizeInvoiceStatus(invoice)),
    );
  });

  if (activeFromHistory) return activeFromHistory;

  const summaryStatus = normalizeInvoiceStatus(order);
  const hasSummaryInvoice = Boolean(
    order?.factura_id ||
      order?.invoice_id ||
      order?.facturama_id ||
      order?.facturamaId ||
      order?.factura_uuid ||
      order?.invoice_uuid ||
      order?.cfdi_uuid ||
      order?.factura_pdf_url ||
      order?.factura_xml_url ||
      order?.pdf_url ||
      order?.xml_url ||
      isActiveInvoiceStatus(summaryStatus),
  );

  if (hasSummaryInvoice && !['cancelada', 'cancelado', 'canceled', 'cancelled'].includes(summaryStatus)) {
    return {
      id: order?.factura_id || order?.invoice_id || null,
      pedido_id: order?.id || order?.pedido_id || null,
      facturama_id: order?.facturama_id || order?.facturamaId || order?.factura_facturama_id || null,
      uuid: order?.factura_uuid || order?.invoice_uuid || order?.cfdi_uuid || null,
      serie: order?.factura_serie || order?.serie_factura || order?.invoice_serie || null,
      folio: order?.factura_folio || order?.folio_factura || order?.invoice_folio || order?.folio || null,
      status: summaryStatus || 'timbrada',
      pdf_url: order?.factura_pdf_url || order?.pdf_url || null,
      xml_url: order?.factura_xml_url || order?.xml_url || null,
      created_at: order?.factura_fecha || order?.factura_timbrada_at || order?.fecha_factura || null,
      timbrada_at: order?.factura_timbrada_at || order?.factura_fecha || order?.fecha_timbrado || order?.fecha_factura || null,
    };
  }

  return null;
}

export function getInvoiceDocumentUrl(order, invoice, format) {
  const normalizedFormat = String(format || '').toLowerCase();
  if (!['pdf', 'xml'].includes(normalizedFormat)) return '';

  const direct =
    invoice?.[`${normalizedFormat}_url`] ||
    invoice?.[`factura_${normalizedFormat}_url`] ||
    invoice?.[`invoice_${normalizedFormat}_url`] ||
    invoice?.documents?.[normalizedFormat] ||
    order?.[`factura_${normalizedFormat}_url`] ||
    order?.[`invoice_${normalizedFormat}_url`] ||
    order?.[`${normalizedFormat}_url`] ||
    order?.factura?.[`${normalizedFormat}_url`] ||
    '';

  return safeText(direct, '');
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
