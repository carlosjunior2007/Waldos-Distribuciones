import supabase from "../../../utils/supabase.js";
import { getActiveInvoice, getInvoiceDocumentUrl, getTrackingToken, normalizeTracking, safeText } from '../tracking.helpers';

function downloadBase64File({ base64, filename, mimeType }) {
  if (!base64) throw new Error('La respuesta no incluyó el archivo en base64.');

  const byteCharacters = atob(base64);
  const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function fetchInvoiceHistoryByOrderId(orderId) {
  if (!orderId) return [];

  try {
    const { data, error } = await supabase
      .from('facturas')
      .select(`
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
      `)
      .eq('pedido_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('No se pudo leer historial de facturas para tracking:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('No se pudo leer historial de facturas para tracking:', error);
    return [];
  }
}

async function tryEnrichOrderWithInvoiceData(order) {
  const orderId = order?.id || order?.pedido_id || order?.order_id;
  if (!orderId) return order;

  let enrichedOrder = order;

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        facturama_id,
        factura_uuid,
        factura_status,
        factura_pdf_url,
        factura_xml_url,
        factura_serie,
        factura_folio,
        factura_fecha,
        factura_timbrada_at
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (!error && data) {
      enrichedOrder = {
        ...enrichedOrder,
        ...data,
      };
    }

    if (error) {
      console.warn('No se pudo enriquecer pedido con campos resumen de factura:', error);
    }
  } catch (error) {
    console.warn('No se pudo enriquecer pedido con campos resumen de factura:', error);
  }

  const invoiceHistory = await fetchInvoiceHistoryByOrderId(orderId);
  if (invoiceHistory.length) {
    enrichedOrder = {
      ...enrichedOrder,
      facturas: invoiceHistory,
    };
  }

  return enrichedOrder;
}

export async function getPublicOrderByTracking(trackingNumber) {
  const tracking = normalizeTracking(trackingNumber);

  if (!tracking) {
    return null;
  }

  // Tu RPC fue creada con el parámetro `tracking_token`.
  // Si en otro ambiente existe como `tracking_input`, hacemos fallback para no romper.
  let { data, error } = await supabase.rpc('get_public_order_by_tracking', {
    tracking_token: tracking,
  });

  if (error?.code === 'PGRST202') {
    const fallback = await supabase.rpc('get_public_order_by_tracking', {
      tracking_input: tracking,
    });

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error('Error consultando tracking:', error);
    throw error;
  }

  const order = Array.isArray(data) ? data[0] || null : data || null;

  return tryEnrichOrderWithInvoiceData(order);
}

export async function downloadPublicInvoiceDocument({ order, format }) {
  const normalizedFormat = String(format || '').toLowerCase();
  if (!['pdf', 'xml'].includes(normalizedFormat)) {
    throw new Error('Formato inválido.');
  }

  const invoice = getActiveInvoice(order);
  if (!invoice) {
    throw new Error('Este tracking todavía no tiene una factura activa para descargar.');
  }

  const directUrl = getInvoiceDocumentUrl(order, invoice, normalizedFormat);
  if (directUrl) {
    window.open(directUrl, '_blank', 'noopener,noreferrer');
    return { ok: true, source: 'url' };
  }

  const orderId = order?.id || order?.pedido_id || invoice?.pedido_id;
  if (!orderId) throw new Error('No se encontró el ID del pedido para descargar la factura.');

  // Misma firma que usa /Pedidos. Menos inventos, menos tragedias.
  const { data, error } = await supabase.functions.invoke('facturama-download-document-sandbox', {
    body: { orderId, format: normalizedFormat },
  });

  if (error) throw new Error(error.message || `No se pudo descargar ${normalizedFormat.toUpperCase()}.`);
  if (!data?.ok) throw new Error(data?.message || `No se pudo descargar ${normalizedFormat.toUpperCase()}.`);

  downloadBase64File({
    base64: data.base64,
    filename: data.filename || `${safeText(invoice?.serie, 'factura')}-${safeText(invoice?.folio || order?.folio, orderId)}.${normalizedFormat}`,
    mimeType: data.mimeType || (normalizedFormat === 'pdf' ? 'application/pdf' : 'application/xml'),
  });

  return data;
}
