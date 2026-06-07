import supabase from "../../../utils/supabase";

export const INVENTORY_FILES_BUCKET = "inventario";
export const INVENTORY_FILE_MAX_SIZE_MB = 10;

const INVENTORY_ENTRY_SELECT = `
  *,
  proveedor:proveedor_id (
    id,
    codigo,
    nombre,
    razon_social,
    rfc
  ),
  lotes:inventario_lotes (
    id,
    entrada_id,
    producto_id,
    cantidad_inicial,
    cantidad_disponible,
    costo_unitario,
    costo_total,
    fecha_compra,
    notas,
    producto:producto_id (
      id,
      codigo,
      nombre,
      descripcion
    )
  )
`;

const INVENTORY_MOVEMENT_SELECT = `
  *,
  producto:producto_id (
    id,
    codigo,
    nombre
  ),
  lote:lote_id (
    id,
    fecha_compra,
    cantidad_inicial,
    cantidad_disponible,
    costo_unitario
  ),
  entrada:entrada_id (
    id,
    folio,
    numero_factura,
    fecha_compra,
    proveedor:proveedor_id (
      id,
      nombre
    )
  ),
  pedido:pedido_id (
    id,
    folio,
    cliente_nombre
  ),
  entrega:entrega_id (
    id,
    folio,
    fecha_entrega
  )
`;

function getInventoryErrorMessage(error, fallback = "No se pudo completar la operación de inventario.") {
  const raw = String(error?.message || error?.details || error?.hint || error || "").trim();
  const lower = raw.toLowerCase();

  if (!raw) return fallback;
  if (lower.includes("inventario insuficiente")) return raw;
  if (lower.includes("entrada de inventario ya fue usada")) return raw;
  if (lower.includes("no puedes borrar esta entrada")) return raw;
  if (lower.includes("esta entrega ya tiene inventario consumido")) return "Esta entrega ya descontó stock. No se puede descontar dos veces.";
  if (lower.includes("entrega no encontrada")) return "No se encontró la entrega. Actualiza la página y vuelve a intentar.";
  if (lower.includes("permission denied") || lower.includes("row-level security")) return "No tienes permisos para modificar inventario. Revisa tu sesión o las políticas RLS.";
  if (lower.includes("foreign key")) return "No se pudo relacionar el movimiento con el pedido, entrega, lote o factura. Algún registro fue eliminado o no existe.";

  return raw || fallback;
}

function buildInventoryError(error, fallback) {
  const nextError = new Error(getInventoryErrorMessage(error, fallback));
  nextError.originalError = error;
  return nextError;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateFilter(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizeEndDate(value) {
  const date = normalizeDateFilter(value);
  return date ? `${date}T23:59:59.999` : null;
}

function normalizeStartDate(value) {
  const date = normalizeDateFilter(value);
  return date ? `${date}T00:00:00.000` : null;
}

function getFileExtension(file) {
  const name = String(file?.name || "archivo");
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "pdf";
}

export async function uploadInventoryFile(file, folio) {
  if (!file) return null;

  const maxBytes = INVENTORY_FILE_MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`El archivo pesa más de ${INVENTORY_FILE_MAX_SIZE_MB} MB. Comprime el PDF o sube una versión más ligera.`);
  }

  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/xml",
    "text/xml",
  ];

  if (file.type && !allowedTypes.includes(file.type)) {
    throw new Error("Solo puedes subir PDF, imagen o XML.");
  }

  const extension = getFileExtension(file);
  const safeFolio = String(folio || "entrada")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-");
  const fileName = `${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}.${extension}`;
  const filePath = `${safeFolio}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(INVENTORY_FILES_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(INVENTORY_FILES_BUCKET)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: data?.publicUrl || filePath,
    name: file.name,
    type: file.type || null,
    size: file.size || 0,
  };
}

export async function fetchInventorySummary({ search = "", page = 0, pageSize = 20, dateFrom = "", dateTo = "" } = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const term = String(search || "").trim();
  const fromDate = normalizeDateFilter(dateFrom);
  const toDate = normalizeDateFilter(dateTo);

  let query = supabase
    .from("inventario_existencias")
    .select("*", { count: "exact" })
    .gt("cantidad_disponible", 0)
    .order("nombre", { ascending: true })
    .range(from, to);

  if (term) {
    query = query.or(`nombre.ilike.%${term}%,codigo.ilike.%${term}%,descripcion.ilike.%${term}%`);
  }

  if (fromDate) {
    query = query.gte("ultima_compra", fromDate);
  }

  if (toDate) {
    query = query.lte("ultima_compra", toDate);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return {
    data: data || [],
    count: count || 0,
    page,
    pageSize,
  };
}

export async function fetchInventoryEntries({ dateFrom = "", dateTo = "" } = {}) {
  const fromDate = normalizeDateFilter(dateFrom);
  const toDate = normalizeDateFilter(dateTo);

  let query = supabase
    .from("inventario_entradas")
    .select(INVENTORY_ENTRY_SELECT)
    .order("fecha_compra", { ascending: false })
    .order("created_at", { ascending: false });

  if (fromDate) {
    query = query.gte("fecha_compra", fromDate);
  }

  if (toDate) {
    query = query.lte("fecha_compra", toDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function fetchInventoryEntryById(entryId) {
  const { data, error } = await supabase
    .from("inventario_entradas")
    .select(INVENTORY_ENTRY_SELECT)
    .eq("id", entryId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchInventoryMovements({ productId = null, limit = 300, dateFrom = "", dateTo = "" } = {}) {
  const fromDateTime = normalizeStartDate(dateFrom);
  const toDateTime = normalizeEndDate(dateTo);

  let query = supabase
    .from("inventario_movimientos")
    .select(INVENTORY_MOVEMENT_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (productId) {
    query = query.eq("producto_id", productId);
  }

  if (fromDateTime) {
    query = query.gte("created_at", fromDateTime);
  }

  if (toDateTime) {
    query = query.lte("created_at", toDateTime);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function fetchInventoryLotsByProduct(productId) {
  const { data, error } = await supabase
    .from("inventario_lotes")
    .select(`
      *,
      entrada:entrada_id!inner (
        id,
        folio,
        numero_factura,
        fecha_compra,
        archivo_url,
        estado,
        proveedor:proveedor_id (
          id,
          nombre,
          codigo
        )
      )
    `)
    .eq("producto_id", productId)
    .eq("entrada.estado", "activa")
    .gt("cantidad_disponible", 0)
    .order("fecha_compra", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchInventoryFormCatalogs() {
  const { data, error } = await supabase
    .from("proveedores")
    .select("id,codigo,nombre,razon_social,rfc,activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;

  return {
    providers: data || [],
  };
}

export async function searchInventoryProducts({ search = "", page = 0, pageSize = 12 } = {}) {
  const term = String(search || "").trim();
  if (term.length < 2) {
    return { data: [], count: 0, page, pageSize };
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("productos")
    .select("id,codigo,nombre,descripcion,precio_compra,precio,habilitado", { count: "exact" })
    .eq("habilitado", true)
    .or(`nombre.ilike.%${term}%,codigo.ilike.%${term}%,descripcion.ilike.%${term}%`)
    .order("nombre", { ascending: true })
    .range(from, to);

  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
    page,
    pageSize,
  };
}

async function buildNextInventoryFolio() {
  const { data, error } = await supabase
    .from("inventario_entradas")
    .select("folio")
    .like("folio", "COMP-%")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const maxNumber = (data || []).reduce((max, entry) => {
    const match = String(entry?.folio || "").match(/COMP-(\d+)$/i);
    if (!match) return max;

    const value = Number.parseInt(match[1], 10);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);

  return `COMP-${String(maxNumber + 1).padStart(4, "0")}`;
}

export async function createInventoryEntry(payload) {
  const products = sanitizeInventoryProducts(payload?.products);
  if (!products.length) throw new Error("Agrega al menos un producto con cantidad mayor a 0.");

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;
  const purchaseDate = payload.fecha_compra || today();

  const subtotal = products.reduce(
    (acc, item) => acc + item.cantidad * item.costo_unitario,
    0,
  );
  const iva = toNumber(payload.iva);
  const total = payload.total ? toNumber(payload.total) : subtotal + iva;
  const folio = await buildNextInventoryFolio();
  const uploadedFile = await uploadInventoryFile(payload.archivo_file, folio);

  const { data: entry, error: entryError } = await supabase
    .from("inventario_entradas")
    .insert({
      proveedor_id: payload.proveedor_id || null,
      folio,
      numero_factura: payload.numero_factura || null,
      fecha_compra: purchaseDate,
      archivo_url: uploadedFile?.url || payload.archivo_url || null,
      archivo_nombre: uploadedFile?.name || payload.archivo_nombre || null,
      archivo_tipo: uploadedFile?.type || payload.archivo_tipo || null,
      subtotal,
      iva,
      total,
      notas: payload.notas || null,
      estado: "activa",
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (entryError) throw entryError;

  const lotsPayload = products.map((item) => ({
    entrada_id: entry.id,
    producto_id: item.producto_id,
    cantidad_inicial: item.cantidad,
    cantidad_disponible: item.cantidad,
    costo_unitario: item.costo_unitario,
    fecha_compra: purchaseDate,
    notas: item.notas || null,
    created_by: userId,
    updated_by: userId,
  }));

  const { data: lots, error: lotsError } = await supabase
    .from("inventario_lotes")
    .insert(lotsPayload)
    .select();

  if (lotsError) {
    await supabase.from("inventario_entradas").delete().eq("id", entry.id);
    throw lotsError;
  }

  const movementsPayload = (lots || []).map((lot) => ({
    producto_id: lot.producto_id,
    lote_id: lot.id,
    entrada_id: entry.id,
    tipo: "entrada",
    cantidad: Number(lot.cantidad_inicial || 0),
    referencia: folio || payload.numero_factura || "Entrada de inventario",
    notas: "Entrada registrada desde inventario",
    created_by: userId,
  }));

  if (movementsPayload.length) {
    const { error: movementError } = await supabase
      .from("inventario_movimientos")
      .insert(movementsPayload);

    if (movementError) throw movementError;
  }

  return fetchInventoryEntryById(entry.id);
}

async function getInventoryEntryUsage(entryId) {
  if (!entryId) throw new Error("Entrada inválida.");

  const { data: entry, error: entryError } = await supabase
    .from("inventario_entradas")
    .select("id,folio,estado")
    .eq("id", entryId)
    .maybeSingle();

  if (entryError) throw entryError;
  if (!entry) throw new Error("No se encontró la entrada de inventario.");

  const { data: lots, error: lotsError } = await supabase
    .from("inventario_lotes")
    .select("id,cantidad_inicial,cantidad_disponible")
    .eq("entrada_id", entryId);

  if (lotsError) throw lotsError;

  const lotIds = (lots || []).map((lot) => lot.id).filter(Boolean);
  const usedLots = (lots || []).filter((lot) => {
    const initial = Number(lot.cantidad_inicial || 0);
    const available = Number(lot.cantidad_disponible || 0);
    return available < initial;
  });

  let consumptionCount = 0;
  if (lotIds.length) {
    const { count, error: consumptionError } = await supabase
      .from("inventario_consumos_entrega")
      .select("id", { count: "exact", head: true })
      .in("lote_id", lotIds);

    if (consumptionError) throw consumptionError;
    consumptionCount = count || 0;
  }

  const { data: nonEntryMovements, error: movementError } = await supabase
    .from("inventario_movimientos")
    .select("id,tipo,pedido_id,pedido_detalle_id,entrega_id,entrega_detalle_id")
    .eq("entrada_id", entryId)
    .neq("tipo", "entrada");

  if (movementError) throw movementError;

  // Regla práctica: si el lote volvió completo, la entrada se puede limpiar.
  // El historial de salida/reversa que quedó de un pedido borrado no debe secuestrar la compra para siempre.
  // Si todavía falta cantidad, entonces sí está usada actualmente y no se borra. Qué concepto tan atrevido: el estado actual importa.
  const used = usedLots.length > 0;

  return {
    entry,
    lots: lots || [],
    lotIds,
    used,
    usedLotsCount: usedLots.length,
    consumptionCount,
    nonEntryMovementsCount: (nonEntryMovements || []).length,
  };
}

function getEntryUsedMessage(usage) {
  return `No puedes borrar esta entrada porque todavía tiene stock usado en ${usage.usedLotsCount} lote(s). Primero revierte o cancela la entrega/pedido que lo descontó, hasta que la cantidad disponible vuelva a ser igual a la cantidad inicial.`;
}

async function deleteInventoryEntryWithRpc(entryId) {
  const { data, error } = await supabase.rpc("borrar_inventario_entrada", {
    p_entrada_id: entryId,
  });

  if (error) {
    const raw = String(error?.message || "").toLowerCase();
    const missingFunction =
      raw.includes("could not find the function") ||
      raw.includes("function public.borrar_inventario_entrada") ||
      raw.includes("borrar_inventario_entrada") && raw.includes("schema cache");

    if (missingFunction) return false;
    throw buildInventoryError(error, "No se pudo borrar la entrada de inventario.");
  }

  return data || true;
}

export async function cancelInventoryEntry(entryId) {
  const usage = await getInventoryEntryUsage(entryId);

  if (usage.used) {
    throw new Error(getEntryUsedMessage(usage));
  }

  const { error: movementError } = await supabase
    .from("inventario_movimientos")
    .delete()
    .eq("entrada_id", entryId)
    .eq("tipo", "entrada");

  if (movementError) throw movementError;

  const { error: lotsDeleteError } = await supabase
    .from("inventario_lotes")
    .delete()
    .eq("entrada_id", entryId);

  if (lotsDeleteError) throw lotsDeleteError;

  const { error: entryError } = await supabase
    .from("inventario_entradas")
    .update({ estado: "cancelada", updated_at: new Date().toISOString() })
    .eq("id", entryId);

  if (entryError) throw entryError;
  return true;
}

export async function deleteInventoryEntry(entryId) {
  const usage = await getInventoryEntryUsage(entryId);

  if (usage.used) {
    throw new Error(getEntryUsedMessage(usage));
  }

  // Preferimos el RPC porque borra en la base de datos con SECURITY DEFINER.
  // Así evitamos el clásico teatro de Supabase/RLS: “operación exitosa” con cero filas borradas.
  const rpcResult = await deleteInventoryEntryWithRpc(entryId);
  if (rpcResult) return true;

  // Fallback por si todavía no corriste el SQL nuevo. Funciona si tus políticas RLS permiten borrar.
  if (usage.lotIds.length) {
    const { error: consumptionDeleteError } = await supabase
      .from("inventario_consumos_entrega")
      .delete()
      .in("lote_id", usage.lotIds);

    if (consumptionDeleteError) throw consumptionDeleteError;
  }

  const { error: movementError } = await supabase
    .from("inventario_movimientos")
    .delete()
    .eq("entrada_id", entryId);

  if (movementError) throw movementError;

  const { error: lotsDeleteError } = await supabase
    .from("inventario_lotes")
    .delete()
    .eq("entrada_id", entryId);

  if (lotsDeleteError) throw lotsDeleteError;

  const { data: deletedEntry, error: entryError } = await supabase
    .from("inventario_entradas")
    .delete()
    .eq("id", entryId)
    .select("id");

  if (entryError) throw entryError;
  if (!deletedEntry?.length) {
    throw new Error("Supabase no borró la entrada. Revisa que hayas ejecutado el SQL nuevo o que exista una política DELETE para inventario_entradas.");
  }

  return true;
}

export async function consumeInventoryForDelivery(deliveryId) {
  if (!deliveryId) throw new Error("Entrega inválida para inventario.");

  const { data, error } = await supabase.rpc("consumir_inventario_fifo", {
    p_entrega_id: deliveryId,
  });

  if (error) throw buildInventoryError(error, "No se pudo descontar inventario para esta entrega.");
  return data;
}

export async function revertInventoryForDelivery(deliveryId) {
  if (!deliveryId) throw new Error("Entrega inválida para revertir inventario.");

  const { data, error } = await supabase.rpc("revertir_inventario_entrega", {
    p_entrega_id: deliveryId,
  });

  if (error) throw buildInventoryError(error, "No se pudo revertir el inventario de esta entrega.");
  return data;
}

function countDecimalPlaces(value) {
  const text = String(value ?? "").trim().replace(/,/g, ".");
  if (!text.includes(".")) return 0;
  return text.split(".")[1]?.length || 0;
}

function roundToFour(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 10000) / 10000;
}

function sanitizeInventoryProducts(products = []) {
  return (products || [])
    .filter((item) => item?.producto_id && toNumber(item.cantidad) > 0)
    .map((item) => {
      if (countDecimalPlaces(item.cantidad) > 4) {
        throw new Error("La cantidad acepta máximo 4 decimales.");
      }

      if (countDecimalPlaces(item.costo_unitario) > 4) {
        throw new Error("El costo unitario acepta máximo 4 decimales.");
      }

      return {
        producto_id: item.producto_id,
        cantidad: roundToFour(item.cantidad),
        costo_unitario: roundToFour(item.costo_unitario),
        notas: item.notas || null,
      };
    });
}
