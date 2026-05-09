import supabase from "../../../utils/supabase.js";

const PAGE_SIZE = 10;

const RECEIPT_SELECT = `
  id,
  folio,
  cliente_id,
  cotizacion_id,
  cliente_nombre,
  cliente_rfc,
  cliente_direccion,
  cliente_telefono,
  fecha,
  ciudad,
  estado,
  notas,
  created_at,
  updated_at
`;

function escapeLike(value = "") {
  return String(value).replace(/[%_]/g, "");
}

export function getTodayISO() {
  return new Date().toISOString();
}

export function getTodayInputDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildClientAddress(client = {}) {
  return [
    client.direccion,
    client.ciudad,
    client.estado,
    client.codigo_postal,
    client.pais,
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeReceiptRows(rows = []) {
  return rows.map((item, index) => ({
    producto_id: item.producto_id || null,
    orden: Number(item.orden || index + 1),
    descripcion: item.descripcion || item.nombre_producto || "Producto",
    cantidad: Number(item.cantidad || 0),
    unidad: item.unidad || "pieza",
  }));
}

export async function searchClients(term = "") {
  let query = supabase
    .from("clientes")
    .select(
      `
      id,
      nombre,
      razon_social,
      rfc,
      numero,
      correo,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      pais
      `,
    )
    .order("nombre", { ascending: true })
    .limit(10);

  const clean = escapeLike(term.trim());

  if (clean) {
    query = query.or(
      `nombre.ilike.%${clean}%,razon_social.ilike.%${clean}%,rfc.ilike.%${clean}%,correo.ilike.%${clean}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}

export async function searchQuotations(term = "") {
  let query = supabase
    .from("cotizaciones")
    .select(
      `
      id,
      folio,
      cliente_id,
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      cliente_rfc,
      cliente_razon_social,
      total,
      estado,
      created_at
      `,
    )
    .order("created_at", { ascending: false })
    .limit(12);

  const clean = escapeLike(term.trim());

  if (clean) {
    query = query.or(
      `folio.ilike.%${clean}%,cliente_nombre.ilike.%${clean}%,cliente_rfc.ilike.%${clean}%,cliente_razon_social.ilike.%${clean}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}

export async function searchProductsForReceipt(term = "") {
  let query = supabase
    .from("productos")
    .select("id, nombre, codigo, unidad")
    .order("nombre", { ascending: true })
    .limit(15);

  const clean = escapeLike(term.trim());

  if (clean) {
    query = query.or(`nombre.ilike.%${clean}%,codigo.ilike.%${clean}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}

export async function fetchQuotationForReceipt(id) {
  const { data: quotation, error: quotationError } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("id", id)
    .single();

  if (quotationError) throw quotationError;

  let client = null;

  if (quotation?.cliente_id) {
    const { data: clientData, error: clientError } = await supabase
      .from("clientes")
      .select(
        `
        id,
        nombre,
        razon_social,
        rfc,
        numero,
        correo,
        direccion,
        ciudad,
        estado,
        codigo_postal,
        pais
        `,
      )
      .eq("id", quotation.cliente_id)
      .maybeSingle();

    if (clientError) throw clientError;
    client = clientData || null;
  }

  const { data: details, error: detailsError } = await supabase
    .from("cotizacion_detalles")
    .select("*")
    .eq("cotizacion_id", id)
    .order("created_at", { ascending: true });

  if (detailsError) throw detailsError;

  const productIds = [
    ...new Set((details || []).map((item) => item.producto_id).filter(Boolean)),
  ];

  let productMap = {};

  if (productIds.length) {
    const { data: products, error: productsError } = await supabase
      .from("productos")
      .select("id, nombre, codigo, unidad")
      .in("id", productIds);

    if (productsError) throw productsError;

    productMap = (products || []).reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});
  }

  const rows = (details || []).map((item, index) => {
    const product = productMap[item.producto_id] || null;

    return {
      producto_id: item.producto_id || null,
      orden: index + 1,
      descripcion:
        product?.nombre ||
        item.nombre_producto ||
        item.descripcion ||
        "Producto",
      cantidad: Number(item.cantidad || 0),
      unidad: product?.unidad || item.unidad || "pieza",
    };
  });

  return {
    quotation,
    client,
    rows,
    cliente_direccion: client ? buildClientAddress(client) : "",
  };
}

export async function generateReceiptFolio() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `CR-${year}-${month}-`;

  const { data, error } = await supabase
    .from("contra_recibos")
    .select("folio")
    .ilike("folio", `${prefix}%`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  let max = 0;

  for (const row of data || []) {
    const folio = row.folio || "";
    const numberPart = folio.split("-").pop();
    const parsed = Number(numberPart);

    if (!Number.isNaN(parsed) && parsed > max) {
      max = parsed;
    }
  }

  const next = String(max + 1).padStart(3, "0");
  return `${prefix}${next}`;
}

export async function fetchReceipts({ page = 1, search = "" } = {}) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("contra_recibos")
    .select(RECEIPT_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  const clean = escapeLike(search.trim());

  if (clean) {
    query = query.or(
      `folio.ilike.%${clean}%,cliente_nombre.ilike.%${clean}%,cliente_rfc.ilike.%${clean}%`,
    );
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: data || [],
    total: count || 0,
    totalPages: Math.max(1, Math.ceil((count || 0) / PAGE_SIZE)),
  };
}

export async function fetchReceiptById(id) {
  const { data: receipt, error: receiptError } = await supabase
    .from("contra_recibos")
    .select("*")
    .eq("id", id)
    .single();

  if (receiptError) throw receiptError;

  let cotizacionFolio = "";

  if (receipt?.cotizacion_id) {
    const { data: quotationData, error: quotationError } = await supabase
      .from("cotizaciones")
      .select("folio")
      .eq("id", receipt.cotizacion_id)
      .maybeSingle();

    if (quotationError) throw quotationError;

    cotizacionFolio = quotationData?.folio || "";
  }

  const { data: details, error: detailsError } = await supabase
    .from("contra_recibo_detalles")
    .select("*")
    .eq("contra_recibo_id", id)
    .order("orden", { ascending: true });

  if (detailsError) throw detailsError;

  return {
    ...receipt,
    cotizacion_folio: cotizacionFolio,
    detalles: normalizeReceiptRows(details || []),
  };
}

function cleanReceiptPayload(header = {}, { includeFolio = false } = {}) {
  const payload = {
    cliente_id: header.cliente_id || null,
    cotizacion_id: header.cotizacion_id || null,
    cliente_nombre: header.cliente_nombre?.trim() || "",
    cliente_rfc: header.cliente_rfc?.trim().toUpperCase() || null,
    cliente_direccion: header.cliente_direccion?.trim() || null,
    cliente_telefono: header.cliente_telefono?.trim() || null,
    fecha: header.fecha || getTodayInputDate(),
    ciudad: header.ciudad?.trim() || "TIJUANA, BAJA CALIFORNIA, MÉXICO",
    estado: header.estado || "emitido",
    notas: header.notas?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (includeFolio) {
    payload.folio = header.folio || null;
  }

  return payload;
}

function cleanDetailPayload(items = [], receiptId) {
  return items
    .filter((item) => String(item.descripcion || "").trim())
    .map((item, index) => ({
      contra_recibo_id: receiptId,
      producto_id: item.producto_id || null,
      orden: Number(item.orden || index + 1),
      descripcion: String(item.descripcion || "").trim(),
      cantidad: Number(item.cantidad || 0),
      unidad: String(item.unidad || "").trim() || null,
    }));
}

export async function createReceipt({ header, items }) {
  const folio = header.folio || (await generateReceiptFolio());

  const payload = cleanReceiptPayload({
    ...header,
    folio,
  }, { includeFolio: true });

  const { data: created, error: receiptError } = await supabase
    .from("contra_recibos")
    .insert(payload)
    .select()
    .single();

  if (receiptError) throw receiptError;

  const detailPayload = cleanDetailPayload(items, created.id);

  if (detailPayload.length) {
    const { error: detailError } = await supabase
      .from("contra_recibo_detalles")
      .insert(detailPayload);

    if (detailError) {
      await supabase.from("contra_recibos").delete().eq("id", created.id);
      throw detailError;
    }
  }

  return fetchReceiptById(created.id);
}

export async function updateReceipt(id, { header, items }) {
  const payload = cleanReceiptPayload(header, { includeFolio: false });

  const { error: receiptError } = await supabase
    .from("contra_recibos")
    .update(payload)
    .eq("id", id);

  if (receiptError) throw receiptError;

  const { error: deleteError } = await supabase
    .from("contra_recibo_detalles")
    .delete()
    .eq("contra_recibo_id", id);

  if (deleteError) throw deleteError;

  const detailPayload = cleanDetailPayload(items, id);

  if (detailPayload.length) {
    const { error: detailError } = await supabase
      .from("contra_recibo_detalles")
      .insert(detailPayload);

    if (detailError) throw detailError;
  }

  return fetchReceiptById(id);
}

export async function deleteReceipt(id) {
  const { error: detailsError } = await supabase
    .from("contra_recibo_detalles")
    .delete()
    .eq("contra_recibo_id", id);

  if (detailsError) throw detailsError;

  const { error } = await supabase.from("contra_recibos").delete().eq("id", id);

  if (error) throw error;
}