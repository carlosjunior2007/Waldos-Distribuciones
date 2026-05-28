import supabase from "../../../utils/supabase";

export async function fetchProducts() {
  const { data, error } = await supabase
    .from("productos")
    .select(`
      *,
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
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return normalizeProducts(data || []);
}

export async function fetchSuppliers() {
  const { data, error } = await supabase
    .from("proveedores")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

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

export async function createProduct(payload, suppliers = []) {
  const { data, error } = await supabase
    .from("productos")
    .insert([payload])
    .select("id")
    .single();

  if (error) throw error;

  await syncProductSuppliers(data.id, suppliers);
}

export async function updateProduct(id, payload, suppliers = []) {
  const { error } = await supabase
    .from("productos")
    .update(payload)
    .eq("id", id);

  if (error) throw error;

  await syncProductSuppliers(id, suppliers);
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

function normalizeProducts(products = []) {
  return products.map((product) => ({
    ...product,
    proveedores_asociados: normalizeProductSuppliers(product.producto_proveedores),
  }));
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
    }))
    .sort((a, b) => Number(b.es_principal) - Number(a.es_principal));
}

async function syncProductSuppliers(productId, suppliers = []) {
  if (!productId) return;

  const cleanSuppliers = sanitizeProductSuppliers(suppliers);

  const { error: deleteError } = await supabase
    .from("producto_proveedores")
    .delete()
    .eq("producto_id", productId);

  if (deleteError) throw deleteError;

  if (!cleanSuppliers.length) return;

  const rows = cleanSuppliers.map((supplier) => ({
    producto_id: productId,
    proveedor_id: supplier.proveedor_id,
    sku_proveedor: supplier.sku_proveedor || null,
    precio_compra:
      supplier.precio_compra === "" || supplier.precio_compra === null
        ? null
        : Number(supplier.precio_compra),
    moneda: supplier.moneda || "MXN",
    tiempo_entrega_dias:
      supplier.tiempo_entrega_dias === "" || supplier.tiempo_entrega_dias === null
        ? null
        : Number(supplier.tiempo_entrega_dias),
    es_principal: Boolean(supplier.es_principal),
    notas: supplier.notas || null,
    activo: supplier.activo !== false,
  }));

  const { error: insertError } = await supabase
    .from("producto_proveedores")
    .insert(rows);

  if (insertError) throw insertError;
}

function sanitizeProductSuppliers(suppliers = []) {
  const seen = new Set();

  const rows = (suppliers || [])
    .filter((supplier) => supplier?.proveedor_id)
    .filter((supplier) => {
      if (seen.has(supplier.proveedor_id)) return false;
      seen.add(supplier.proveedor_id);
      return true;
    });

  if (!rows.length) return [];

  const hasMain = rows.some((supplier) => supplier.es_principal);

  return rows.map((supplier, index) => ({
    ...supplier,
    es_principal: hasMain ? Boolean(supplier.es_principal) : index === 0,
  }));
}
