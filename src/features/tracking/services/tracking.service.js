import supabase from "../../../utils/supabase.js";
import { normalizeTracking } from '../tracking.helpers';

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

  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data || null;
}
