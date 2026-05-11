import supabase from "../../../utils/supabase";
import { LOGOS_BUCKET } from "../client.constants";

export async function fetchClients(search = "") {
  let query = supabase
    .from("clientes")
    .select("*")
    .order("nombre", { ascending: true });

  if (search.trim()) {
    query = query.or(
      `nombre.ilike.%${search}%,razon_social.ilike.%${search}%,rfc.ilike.%${search}%,correo.ilike.%${search}%,numero.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

export async function fetchClientQuotations(clientId) {
  if (!clientId) return [];

  const { data, error } = await supabase
    .from("cotizaciones")
    .select(
      `
      id,
      folio,
      cliente_nombre,
      total,
      estado,
      created_at,
      fecha_vencimiento
    `,
    )
    .eq("cliente_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
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