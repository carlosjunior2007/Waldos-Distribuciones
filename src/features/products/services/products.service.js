import supabase from "../../../utils/supabase";

export async function fetchProducts() {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data?.user || null;
}

export async function getCurrentUserId() {
  const user = await getCurrentUser();
  return user?.id || null;
}

export async function createProduct(payload) {
  const { error } = await supabase.from("productos").insert([payload]);

  if (error) throw error;
}

export async function updateProduct(id, payload) {
  const { error } = await supabase
    .from("productos")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("productos").delete().eq("id", id);

  if (error) throw error;
}

export async function uploadProductImage(file, productId) {
  if (!file) return null;

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${productId}-${Date.now()}.${fileExt}`;
  const filePath = `productos/${fileName}`;

  const { error } = await supabase.storage.from("productos").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("productos").getPublicUrl(filePath);

  return data?.publicUrl || null;
}

export async function deleteProductImage(imagePath) {
  if (!imagePath) return;

  const { error } = await supabase.storage.from("productos").remove([imagePath]);

  if (error) throw error;
}

export async function getAuthUserEmail(userId) {
  const { data, error } = await supabase.rpc("get_auth_user_email", {
    p_user_id: userId,
  });

  if (error) return null;

  return data || null;
}