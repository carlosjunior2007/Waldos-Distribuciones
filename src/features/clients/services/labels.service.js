import supabase from "../../../utils/supabase";

export async function searchClientsForLabels(search = "") {
  let query = supabase
    .from("clientes")
    .select("*")
    .order("nombre", { ascending: true })
    .limit(12);

  if (search.trim()) {
    query = query.or(
      `nombre.ilike.%${search}%,razon_social.ilike.%${search}%,rfc.ilike.%${search}%,correo.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

export async function fetchProductsForLabels() {
  const { data, error } = await supabase
    .from("productos")
    .select("id,nombre,codigo,unidad,precio,precio_compra")
    .order("nombre", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function fetchLabelsByClient(clientId) {
  if (!clientId) return [];

  const { data, error } = await supabase
    .from("etiquetas")
    .select(
      `
      *,
      productos (
        id,
        nombre,
        codigo,
        unidad
      ),
      clientes (
        id,
        nombre,
        numero,
        correo,
        logo,
        razon_social,
        rfc
      )
    `,
    )
    .eq("cliente_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function createLabel(payload) {
  const { error } = await supabase.from("etiquetas").insert(payload);

  if (error) throw error;
}

export async function updateLabel(id, payload) {
  const { error } = await supabase
    .from("etiquetas")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteLabel(id) {
  const { error } = await supabase.from("etiquetas").delete().eq("id", id);

  if (error) throw error;
}