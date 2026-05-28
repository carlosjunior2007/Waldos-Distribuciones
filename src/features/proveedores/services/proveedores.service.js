import supabase from "../../../utils/supabase";

export async function fetchProviders() {
  const { data, error } = await supabase
    .from("proveedores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function createProvider(payload) {
  const { error } = await supabase
    .from("proveedores")
    .insert([payload]);

  if (error) throw error;
}

export async function updateProvider(id, payload) {
  const { error } = await supabase
    .from("proveedores")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

export async function getProviderDeleteImpact(providerId) {
  if (!providerId) {
    return {
      relatedProducts: [],
      productsWithoutSuppliers: [],
    };
  }

  const { data: relations, error: relationsError } = await supabase
    .from("producto_proveedores")
    .select(`
      id,
      producto_id,
      proveedor_id,
      productos (
        id,
        nombre,
        codigo,
        habilitado
      )
    `)
    .eq("proveedor_id", providerId);

  if (relationsError) throw relationsError;

  const relatedProducts = (relations || [])
    .map((relation) => relation.productos)
    .filter(Boolean);

  if (!relatedProducts.length) {
    return {
      relatedProducts: [],
      productsWithoutSuppliers: [],
    };
  }

  const productIds = relatedProducts.map((product) => product.id);

  const { data: allProductRelations, error: allRelationsError } = await supabase
    .from("producto_proveedores")
    .select("producto_id, proveedor_id")
    .in("producto_id", productIds);

  if (allRelationsError) throw allRelationsError;

  const productsWithoutSuppliers = relatedProducts.filter((product) => {
    const otherRelations = (allProductRelations || []).filter(
      (relation) =>
        relation.producto_id === product.id &&
        relation.proveedor_id !== providerId,
    );

    return otherRelations.length === 0;
  });

  return {
    relatedProducts,
    productsWithoutSuppliers,
  };
}

export async function deleteProvider(id, options = {}) {
  const { hideProductsWithoutSuppliers = false } = options;

  const impact = await getProviderDeleteImpact(id);

  const { error: relationDeleteError } = await supabase
    .from("producto_proveedores")
    .delete()
    .eq("proveedor_id", id);

  if (relationDeleteError) throw relationDeleteError;

  if (hideProductsWithoutSuppliers && impact.productsWithoutSuppliers.length) {
    const productIds = impact.productsWithoutSuppliers.map((product) => product.id);

    const { error: hideError } = await supabase
      .from("productos")
      .update({
        habilitado: false,
        updated_at: new Date().toISOString(),
      })
      .in("id", productIds);

    if (hideError) throw hideError;
  }

  const { error } = await supabase
    .from("proveedores")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return impact;
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


export async function findProductsByCodes(codes = []) {
  const cleanCodes = [...new Set((codes || []).map((code) => String(code || "").trim()).filter(Boolean))];

  if (!cleanCodes.length) return [];

  const { data, error } = await supabase
    .from("productos")
    .select("id, codigo, nombre, precio_compra, habilitado")
    .in("codigo", cleanCodes);

  if (error) throw error;

  return data || [];
}


export async function buildProviderProductImportPreview(providerId, rows = []) {
  if (!providerId) throw new Error("Falta el proveedor.");

  const cleanRows = normalizeImportRows(rows);
  const productCodes = cleanRows.map((row) => row.codigo_producto);
  const products = await findProductsByCodes(productCodes);
  const productsByCode = new Map(products.map((product) => [product.codigo, product]));

  const foundProductIds = products.map((product) => product.id);

  let existingRelations = [];

  if (foundProductIds.length) {
    const { data, error } = await supabase
      .from("producto_proveedores")
      .select("id, producto_id, proveedor_id")
      .eq("proveedor_id", providerId)
      .in("producto_id", foundProductIds);

    if (error) throw error;

    existingRelations = data || [];
  }

  const existingByProductId = new Map(
    existingRelations.map((relation) => [relation.producto_id, relation]),
  );

  const previewRows = cleanRows.map((row, index) => {
    const product = productsByCode.get(row.codigo_producto);
    const existingRelation = product ? existingByProductId.get(product.id) : null;

    return {
      row_number: index + 2,
      ...row,
      producto_id: product?.id || null,
      producto_nombre: product?.nombre || "",
      producto_habilitado: product?.habilitado ?? null,
      status: !product
        ? "not_found"
        : existingRelation
          ? "update"
          : "create",
      message: !product
        ? "Producto no encontrado"
        : existingRelation
          ? "Se actualizará la asociación existente"
          : "Se creará una nueva asociación",
    };
  });

  return {
    rows: previewRows,
    summary: {
      total: previewRows.length,
      found: previewRows.filter((row) => row.status !== "not_found").length,
      not_found: previewRows.filter((row) => row.status === "not_found").length,
      create: previewRows.filter((row) => row.status === "create").length,
      update: previewRows.filter((row) => row.status === "update").length,
    },
  };
}

export async function bulkAssociateProviderProducts(providerId, previewRows = []) {
  if (!providerId) throw new Error("Falta el proveedor.");

  const validRows = (previewRows || []).filter(
    (row) => row.producto_id && row.status !== "not_found",
  );

  if (!validRows.length) {
    return {
      applied: 0,
      skipped: previewRows.length,
    };
  }

  const rowsToUpsert = validRows.map((row) => ({
    producto_id: row.producto_id,
    proveedor_id: providerId,
    sku_proveedor: row.sku_proveedor || null,
    precio_compra:
      row.costo_proveedor === "" || row.costo_proveedor === null || row.costo_proveedor === undefined
        ? null
        : Number(row.costo_proveedor),
    moneda: row.moneda || "MXN",
    tiempo_entrega_dias:
      row.tiempo_entrega_dias === "" || row.tiempo_entrega_dias === null || row.tiempo_entrega_dias === undefined
        ? null
        : Number(row.tiempo_entrega_dias),
    es_principal: normalizeBoolean(row.proveedor_principal),
    notas: row.notas || null,
    activo: true,
  }));

  const { error } = await supabase
    .from("producto_proveedores")
    .upsert(rowsToUpsert, {
      onConflict: "producto_id,proveedor_id",
    });

  if (error) throw error;

  return {
    applied: rowsToUpsert.length,
    skipped: (previewRows || []).length - rowsToUpsert.length,
  };
}

function normalizeImportRows(rows = []) {
  return (rows || [])
    .map((row) => ({
      codigo_producto: String(row.codigo_producto || row.codigo || row.product_code || "").trim(),
      sku_proveedor: String(row.sku_proveedor || row.sku || "").trim(),
      costo_proveedor: cleanNumber(row.costo_proveedor ?? row.costo ?? row.precio_compra ?? ""),
      moneda: String(row.moneda || "MXN").trim().toUpperCase() || "MXN",
      tiempo_entrega_dias: cleanInteger(row.tiempo_entrega_dias ?? row.entrega_dias ?? ""),
      proveedor_principal: row.proveedor_principal || row.principal || "",
      notas: String(row.notas || "").trim(),
    }))
    .filter((row) => row.codigo_producto);
}

function cleanNumber(value) {
  if (value === null || value === undefined) return "";

  const cleanValue = String(value).replace(/[$,]/g, "").trim();

  if (cleanValue === "") return "";

  const parsed = Number(cleanValue);
  return Number.isFinite(parsed) ? parsed : "";
}

function cleanInteger(value) {
  if (value === null || value === undefined || value === "") return "";

  const parsed = Number.parseInt(String(value).trim(), 10);
  return Number.isFinite(parsed) ? parsed : "";
}

function normalizeBoolean(value) {
  return ["si", "sí", "true", "1", "principal", "x", "yes"].includes(
    String(value || "").trim().toLowerCase(),
  );
}
