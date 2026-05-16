import supabase from "../../../utils/supabase";
import { LOGOS_BUCKET } from "../client.constants";
import { sanitizeClientAddresses } from "../client.helpers";

const CLIENT_SELECT = `
  *,
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
    activo,
    created_at,
    updated_at
  )
`;

export async function fetchClients(search = "") {
  let query = supabase
    .from("clientes")
    .select(CLIENT_SELECT)
    .order("nombre", { ascending: true });

  if (search.trim()) {
    query = query.or(
      `nombre.ilike.%${search}%,razon_social.ilike.%${search}%,rfc.ilike.%${search}%,correo.ilike.%${search}%,numero.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) throw error;

  return normalizeClients(data || []);
}

export async function fetchClientById(clientId) {
  if (!clientId) return null;

  const { data, error } = await supabase
    .from("clientes")
    .select(CLIENT_SELECT)
    .eq("id", clientId)
    .single();

  if (error) throw error;

  return normalizeClient(data);
}

export async function fetchClientAddresses(clientId) {
  if (!clientId) return [];

  const { data, error } = await supabase
    .from("cliente_direcciones")
    .select("*")
    .eq("cliente_id", clientId)
    .eq("activo", true)
    .order("es_principal", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function saveClientAddresses(clientId, addresses = []) {
  if (!clientId) return [];

  const cleanAddresses = sanitizeClientAddresses(addresses);
  const currentAddresses = await fetchClientAddresses(clientId);

  const incomingIds = cleanAddresses
    .map((address) => address.id)
    .filter(Boolean);

  const idsToDisable = currentAddresses
    .filter((address) => !incomingIds.includes(address.id))
    .map((address) => address.id);

  if (idsToDisable.length) {
    const { error } = await supabase
      .from("cliente_direcciones")
      .update({
        activo: false,
        es_principal: false,
        updated_at: new Date().toISOString(),
      })
      .in("id", idsToDisable);

    if (error) throw error;
  }

  for (const address of cleanAddresses) {
    const { id, ...payload } = address;
    const payloadWithClient = {
      ...payload,
      cliente_id: clientId,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { error } = await supabase
        .from("cliente_direcciones")
        .update(payloadWithClient)
        .eq("id", id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("cliente_direcciones").insert({
        ...payloadWithClient,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    }
  }

  return fetchClientAddresses(clientId);
}

export async function fetchClientOrders(clientId) {
  if (!clientId) return [];

  const { data, error } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      folio,
      cliente_id,
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      subtotal,
      descuento,
      iva_porcentaje,
      total,
      estado,
      estado_pago,
      metodo_pago,
      fecha_emision,
      fecha_inicio,
      fecha_fin,
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
        folio,
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
    `,
    )
    .eq("cliente_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((order) => ({
    ...order,
    details: order.pedido_detalles || [],
    deliveries: order.entregas || [],
  }));
}

export async function createClient(payload) {
  const { data, error } = await supabase
    .from("clientes")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateClient(id, payload) {
  // La tabla clientes no tiene updated_at en tu DB actual.
  // No lo mandes en el update o Supabase marcará:
  // Could not find the updated_at column of clientes in the schema cache.
  const { data, error } = await supabase
    .from("clientes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteClient(id) {
  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error) throw error;
}

export async function uploadClientLogo(file, clientId) {
  if (!file) return null;

  const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  const maxSize = 2 * 1024 * 1024;

  if (!validTypes.includes(file.type)) {
    throw new Error("El logo debe ser PNG, JPG o WEBP.");
  }

  if (file.size > maxSize) {
    throw new Error("El logo no debe superar los 2MB.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `${Date.now()}.${ext}`;
  const filePath = `${clientId}/${fileName}`;

  const { error } = await supabase.storage
    .from(LOGOS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(filePath);

  return data?.publicUrl || null;
}

export async function deleteClientLogo(path) {
  if (!path) return;

  const { error } = await supabase.storage.from(LOGOS_BUCKET).remove([path]);

  if (error) throw error;
}

function normalizeClients(clients = []) {
  return clients.map(normalizeClient);
}

function normalizeClient(client) {
  if (!client) return client;

  return {
    ...client,
    cliente_direcciones: (client.cliente_direcciones || [])
      .filter((address) => address.activo !== false)
      .sort((a, b) => Number(b.es_principal) - Number(a.es_principal)),
  };
}
