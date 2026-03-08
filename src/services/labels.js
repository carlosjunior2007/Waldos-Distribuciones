import supabase from "../utils/supabase";

const PAGE_SIZE = 10;

export async function fetchClients({ search = "", page = 1 }) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("clientes")
    .select("id, nombre, logo, numero, correo", { count: "exact" })
    .order("nombre", { ascending: true })
    .range(from, to);

  if (search.trim()) {
    query = query.ilike("nombre", `%${search.trim()}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: data || [],
    total: count || 0,
    totalPages: Math.max(1, Math.ceil((count || 0) / PAGE_SIZE)),
  };
}

export async function createClient(payload) {
  const { data, error } = await supabase
    .from("clientes")
    .insert(payload)
    .select("id, nombre, logo, numero, correo")
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(id, payload) {
  const { data, error } = await supabase
    .from("clientes")
    .update(payload)
    .eq("id", id)
    .select("id, nombre, logo, numero, correo")
    .single();

  if (error) throw error;
  return data;
}

export async function uploadClientLogo(file, clientId) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${clientId}/${Date.now()}.${ext}`;

  const BUCKET_NAME = "logosClientes";

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchProductsBasic() {
  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre,codigo")
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchLabelsByClient(clienteId) {
  if (!clienteId) return [];

  const { data, error } = await supabase
    .from("etiquetas")
    .select(
      `
      id,
      cliente_id,
      producto_id,
      codigo_barras,
      codigo,
      texto_extra,
      ancho_mm,
      alto_mm,
      created_at,
      updated_at,
      clientes (
        id,
        nombre,
        logo,
        numero,
        correo
      ),
      productos (
        id,
        nombre
      )
    `,
    )
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createLabel(payload) {
  const { data, error } = await supabase
    .from("etiquetas")
    .insert(payload)
    .select(
      `
      id,
      cliente_id,
      producto_id,
      codigo_barras,
      codigo,
      texto_extra,
      ancho_mm,
      alto_mm,
      created_at,
      updated_at,
      clientes (
        id,
        nombre,
        logo,
        numero,
        correo
      ),
      productos (
        id,
        nombre
      )
    `,
    )
    .single();

  if (error) throw error;
  return data;
}

export async function updateLabel(id, payload) {
  const { data, error } = await supabase
    .from("etiquetas")
    .update(payload)
    .eq("id", id)
    .select(
      `
      id,
      cliente_id,
      producto_id,
      codigo_barras,
      codigo,
      texto_extra,
      ancho_mm,
      alto_mm,
      created_at,
      updated_at,
      clientes (
        id,
        nombre,
        logo,
        numero,
        correo
      ),
      productos (
        id,
        nombre
      )
    `,
    )
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLabel(id) {
  const { error } = await supabase.from("etiquetas").delete().eq("id", id);
  if (error) throw error;
}

const LOGOS_BUCKET = "logosClientes";

function getStoragePathFromPublicUrl(url, bucketName = LOGOS_BUCKET) {
  if (!url) return null;

  try {
    const marker = `/object/public/${bucketName}/`;
    const index = url.indexOf(marker);

    if (index === -1) return null;

    const path = url.slice(index + marker.length);
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}

export async function deleteClient(id) {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteClientLogoByUrl(logoUrl) {
  if (!logoUrl) return;

  const filePath = getStoragePathFromPublicUrl(logoUrl, LOGOS_BUCKET);
  if (!filePath) return;

  const { error } = await supabase.storage
    .from(LOGOS_BUCKET)
    .remove([filePath]);

  if (error) throw error;
}