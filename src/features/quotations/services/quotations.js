import supabase from "../../../utils/supabase";

const PAGE_SIZE = 10;
const MAX_ROWS = 5000;

const QUOTATION_SELECT = `
  id,
  folio,
  cliente_id,
  cliente_nombre,
  cliente_telefono,
  cliente_email,
  estado,
  subtotal,
  descuento,
  iva_porcentaje,
  iva_monto,
  isr_porcentaje,
  isr_monto,
  total,
  fecha_vencimiento,
  notas,
  created_at,
  updated_at
`;

function escapeLike(value = "") {
  return String(value).replace(/[%_]/g, "");
}

export function getCurrentMonthValue() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getMonthRange(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);

  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function addDaysISO(days = 14) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function deleteExpiredQuotations() {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("cotizaciones")
    .delete()
    .in("estado", ["borrador", "enviada", "vencida"])
    .lt("fecha_vencimiento", now);

  if (error) throw error;
}

export async function expireQuotations() {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("cotizaciones")
    .update({
      estado: "vencida",
      updated_at: now,
    })
    .in("estado", ["borrador", "enviada"])
    .lt("fecha_vencimiento", now);

  if (error) throw error;
}

function applyQuotationSearch(query, cleanSearch) {
  if (!cleanSearch) return query;

  return query.or(
    `folio.ilike.%${cleanSearch}%,cliente_nombre.ilike.%${cleanSearch}%,cliente_email.ilike.%${cleanSearch}%,cliente_telefono.ilike.%${cleanSearch}%`,
  );
}

function applyQuotationStatus(query, status) {
  if (!status || status === "todas") return query;

  return query.eq("estado", status);
}

function sortQuotations(a, b) {
  const statusOrder = {
    borrador: 1,
    enviada: 2,
    aceptada: 3,
    vencida: 4,
    convertida: 5,
    rechazada: 6,
  };

  const aOrder = statusOrder[a.estado] || 99;
  const bOrder = statusOrder[b.estado] || 99;

  if (a.isCarryover && !b.isCarryover) return -1;
  if (!a.isCarryover && b.isCarryover) return 1;

  if (a.isCarryover && b.isCarryover && aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
}

export async function searchProducts(term = "") {
  let query = supabase
    .from("productos")
    .select(
      `
      id,
      nombre,
      descripcion,
      precio,
      precio_compra,
      codigo,
      categoria,
      unidad,
      habilitado
    `,
    )
    .eq("habilitado", true)
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

export async function generateNextFolio(monthValue) {
  const { start, end } = getMonthRange(monthValue);
  const [year, month] = monthValue.split("-");
  const prefix = `WAL-${year}-${month}-`;

  const { data, error } = await supabase
    .from("cotizaciones")
    .select("folio")
    .gte("created_at", start)
    .lt("created_at", end)
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

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

async function attachQuotationProfit(rows = []) {
  const ids = rows.map((row) => row.id);

  if (!ids.length) return rows;

  const { data, error } = await supabase
    .from("cotizacion_detalles")
    .select("cotizacion_id,cantidad,precio_unitario,costo_unitario")
    .in("cotizacion_id", ids);

  if (error) throw error;

  const profitMap = {};

  for (const item of data || []) {
    const cantidad = Number(item.cantidad || 0);
    const precio = Number(item.precio_unitario || 0);
    const costo = Number(item.costo_unitario || 0);

    profitMap[item.cotizacion_id] =
      (profitMap[item.cotizacion_id] || 0) + cantidad * (precio - costo);
  }

  return rows.map((row) => ({
    ...row,
    ganancia_estimada: profitMap[row.id] || 0,
  }));
}

export async function fetchQuotations({
  page = 1,
  month = getCurrentMonthValue(),
  search = "",
  status = "todas",
}) {
  await expireQuotations();

  const { start, end } = getMonthRange(month);
  const cleanSearch = escapeLike(search.trim());

  let monthQuery = supabase
    .from("cotizaciones")
    .select(QUOTATION_SELECT)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false })
    .range(0, MAX_ROWS);

  monthQuery = applyQuotationSearch(monthQuery, cleanSearch);
  monthQuery = applyQuotationStatus(monthQuery, status);

  const { data: monthRowsData, error: monthError } = await monthQuery;

  if (monthError) throw monthError;

  const carryoverStatuses = [];

  if (status === "todas") {
    carryoverStatuses.push("borrador", "enviada", "aceptada");
  }

  if (["borrador", "enviada", "aceptada"].includes(status)) {
    carryoverStatuses.push(status);
  }

  let carryoverRows = [];

  if (carryoverStatuses.length > 0) {
    let carryoverQuery = supabase
      .from("cotizaciones")
      .select(QUOTATION_SELECT)
      .in("estado", carryoverStatuses)
      .lt("created_at", start)
      .order("created_at", { ascending: false })
      .range(0, MAX_ROWS);

    carryoverQuery = applyQuotationSearch(carryoverQuery, cleanSearch);

    const { data, error } = await carryoverQuery;

    if (error) throw error;

    carryoverRows = (data || []).map((row) => ({
      ...row,
      isCarryover: true,
    }));
  }

  const monthRows = (monthRowsData || []).map((row) => ({
    ...row,
    isCarryover: false,
  }));

  const map = new Map();

  for (const row of [...carryoverRows, ...monthRows]) {
    map.set(row.id, row);
  }

  const mergedRows = await attachQuotationProfit(
    Array.from(map.values()).sort(sortQuotations),
  );

  const total = mergedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  return {
    rows: mergedRows.slice(from, to),
    total,
    totalPages,
  };
}

export async function fetchQuotationSummary({
  month = getCurrentMonthValue(),
  search = "",
  status = "todas",
} = {}) {
  await expireQuotations();

  const { start, end } = getMonthRange(month);
  const cleanSearch = escapeLike(search.trim());

  let query = supabase
    .from("cotizaciones")
    .select("id, estado, total, created_at")
    .gte("created_at", start)
    .lt("created_at", end)
    .range(0, MAX_ROWS);

  query = applyQuotationSearch(query, cleanSearch);
  query = applyQuotationStatus(query, status);

  const { data, error } = await query;

  if (error) throw error;

  const rows = data || [];

  return {
    total: rows.length,
    borradores: rows.filter((x) => x.estado === "borrador").length,
    enviadas: rows.filter((x) => x.estado === "enviada").length,
    aceptadas: rows.filter((x) => x.estado === "aceptada").length,
    rechazadas: rows.filter((x) => x.estado === "rechazada").length,
    vencidas: rows.filter((x) => x.estado === "vencida").length,
    convertidas: rows.filter((x) => x.estado === "convertida").length,
    totalCotizado: rows.reduce((acc, x) => acc + Number(x.total || 0), 0),
  };
}

export async function fetchQuotationById(id) {
  const { data: quotation, error: qError } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("id", id)
    .single();

  if (qError) throw qError;

  let cliente = null;

  if (quotation?.cliente_id) {
    const { data: clientData } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", quotation.cliente_id)
      .maybeSingle();

    cliente = clientData || null;
  }

  const { data: details, error: dError } = await supabase
    .from("cotizacion_detalles")
    .select("*")
    .eq("cotizacion_id", id)
    .order("created_at", { ascending: true });

  if (dError) throw dError;

  const productoIds = [
    ...new Set((details || []).map((item) => item.producto_id).filter(Boolean)),
  ];

  let productosMap = {};

  if (productoIds.length > 0) {
    const { data: products, error: pError } = await supabase
      .from("productos")
      .select(
        "id, nombre, codigo, unidad, descripcion, precio, precio_compra",
      )
      .in("id", productoIds);

    if (pError) throw pError;

    productosMap = (products || []).reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});
  }

  const detallesConProducto = (details || []).map((item) => {
    const product = productosMap[item.producto_id] || null;

    return {
      ...item,
      nombre_producto:
        item.nombre_producto || product?.nombre || "Producto no encontrado",
      codigo: item.codigo || product?.codigo || "",
      unidad: product?.unidad || "",
      producto: product,
    };
  });

  return {
    ...quotation,
    clientes: cliente,
    detalles: detallesConProducto,
  };
}

function buildDetailsPayload(items = []) {
  return items.map((item) => {
    const cantidad = Number(item.cantidad || 0);
    const precio = Number(item.precio_unitario || 0);
    const costo = Number(item.costo_unitario || 0);

    return {
      producto_id: item.producto_id,
      nombre_producto: item.nombre_producto || null,
      codigo: item.codigo || null,
      cantidad,
      precio_unitario: precio,
      costo_unitario: costo,
      importe: cantidad * precio,
    };
  });
}

function calculateTotals(detailsPayload = [], header = {}) {
  const subtotal = detailsPayload.reduce(
    (acc, item) => acc + Number(item.importe || 0),
    0,
  );

  const descuento = Number(header.descuento || 0);
  const ivaPorcentaje = Number(header.iva_porcentaje || 0);
  const isrPorcentaje = Number(header.isr_porcentaje || 0);
  const base = Math.max(subtotal - descuento, 0);
  const ivaMonto = base * (ivaPorcentaje / 100);
  const isrMonto = base * (isrPorcentaje / 100);
  const total = Math.max(base + ivaMonto - isrMonto, 0);

  return {
    subtotal,
    descuento,
    iva_porcentaje: ivaPorcentaje,
    iva_monto: ivaMonto,
    isr_porcentaje: isrPorcentaje,
    isr_monto: isrMonto,
    total,
  };
}

function buildQuotationHeader({ header, detailsPayload, folio = null }) {
  const totals = calculateTotals(detailsPayload, header);
  const now = new Date().toISOString();

  const payload = {
    cliente_id: header.cliente_id || null,
    cliente_nombre: header.cliente_nombre,
    cliente_telefono: header.cliente_telefono || null,
    cliente_email: header.cliente_email || null,

    estado: header.estado || "borrador",
    subtotal: totals.subtotal,
    descuento: totals.descuento,
    iva_porcentaje: totals.iva_porcentaje,
    iva_monto: totals.iva_monto,
    isr_porcentaje: totals.isr_porcentaje,
    isr_monto: totals.isr_monto,
    total: totals.total,

    fecha_vencimiento: header.fecha_vencimiento || addDaysISO(14),
    notas: header.notas || null,
    updated_at: now,
  };

  if (folio) {
    payload.folio = folio;
  }

  return payload;
}

export async function createQuotation({ header, items, month }) {
  const folio = await generateNextFolio(month || getCurrentMonthValue());
  const detailsPayload = buildDetailsPayload(items);

  const quotationPayload = buildQuotationHeader({
    header,
    detailsPayload,
    folio,
  });

  const { data: created, error: qError } = await supabase
    .from("cotizaciones")
    .insert(quotationPayload)
    .select(QUOTATION_SELECT)
    .single();

  if (qError) throw qError;

  if (detailsPayload.length) {
    const rows = detailsPayload.map((item) => ({
      ...item,
      cotizacion_id: created.id,
    }));

    const { error: dError } = await supabase
      .from("cotizacion_detalles")
      .insert(rows);

    if (dError) throw dError;
  }

  return created;
}

export async function updateQuotation(id, { header, items }) {
  const detailsPayload = buildDetailsPayload(items);

  const quotationPayload = buildQuotationHeader({
    header,
    detailsPayload,
  });

  const { data: updated, error: qError } = await supabase
    .from("cotizaciones")
    .update(quotationPayload)
    .eq("id", id)
    .select(QUOTATION_SELECT)
    .single();

  if (qError) throw qError;

  const { error: deleteError } = await supabase
    .from("cotizacion_detalles")
    .delete()
    .eq("cotizacion_id", id);

  if (deleteError) throw deleteError;

  if (detailsPayload.length) {
    const rows = detailsPayload.map((item) => ({
      ...item,
      cotizacion_id: id,
    }));

    const { error: dError } = await supabase
      .from("cotizacion_detalles")
      .insert(rows);

    if (dError) throw dError;
  }

  return updated;
}

// En quotations.js
export function getMonthYearRange(month, year) {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 1, 0, 0, 0, 0);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function deleteQuotation(id) {
  const { error: detailsError } = await supabase
    .from("cotizacion_detalles")
    .delete()
    .eq("cotizacion_id", id);

  if (detailsError) throw detailsError;

  const { error } = await supabase.from("cotizaciones").delete().eq("id", id);

  if (error) throw error;

  return true;
}

export async function generateNextOrderFolio() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `PED-${year}-${month}-`;

  const { data, error } = await supabase
    .from("pedidos")
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

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function generateTrackingToken() {
  const random = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `TRK-${random}`;
}

async function createOrderTracking(orderId) {
  if (!orderId) return null;

  const token = generateTrackingToken();

  const { error } = await supabase.from("pedido_tracking").insert({
    pedido_id: orderId,
    token,
    activo: true,
  });

  if (error) {
    console.warn("No se pudo crear tracking del pedido:", error);
    return null;
  }

  return token;
}

export async function convertQuotationToOrder(quotationId, extra = {}) {
  const quotation = await fetchQuotationById(quotationId);

  if (quotation.estado === "convertida") {
    throw new Error("Esta cotización ya fue convertida a pedido.");
  }

  if (!quotation.detalles?.length) {
    throw new Error("La cotización no tiene productos.");
  }

  if (!quotation.cliente_id) {
    throw new Error(
      "Para pasar esta cotización a pedido, primero tienes que asociar un cliente registrado en el sistema.",
    );
  }

  if (!quotation.cliente_nombre) {
    throw new Error("Falta el nombre del cliente.");
  }

  const folio = await generateNextOrderFolio();
  const fechaInicio = extra.fecha_inicio || extra.entrega_inicio || null;
  const fechaFin = extra.fecha_fin || extra.entrega_fin || null;

  const orderPayload = {
    folio,
    cotizacion_id: quotation.id,
    cliente_id: quotation.cliente_id || null,

    cliente_nombre: quotation.cliente_nombre,
    cliente_telefono: quotation.cliente_telefono || null,
    cliente_email: quotation.cliente_email || null,

    subtotal: Number(quotation.subtotal || 0),
    descuento: Number(quotation.descuento || 0),
    iva_porcentaje: Number(quotation.iva_porcentaje || 0),
    iva_monto: Number(quotation.iva_monto || 0),
    isr_porcentaje: Number(quotation.isr_porcentaje || 0),
    isr_monto: Number(quotation.isr_monto || 0),
    total: Number(quotation.total || 0),

    estado: fechaInicio || fechaFin ? "creado" : "borrador",
    estado_pago: extra.estado_pago || "pendiente",

    metodo_pago: extra.metodo_pago || null,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    entrega_inicio: fechaInicio,
    entrega_fin: fechaFin,
    notas: extra.notas || quotation.notas || null,
  };

  const { data: order, error: orderError } = await supabase
    .from("pedidos")
    .insert(orderPayload)
    .select("*")
    .single();

  if (orderError) throw orderError;

  const orderDetails = quotation.detalles.map((item) => {
    const cantidad = Number(item.cantidad || 0);
    const precio = Number(item.precio_unitario || 0);

    return {
      pedido_id: order.id,
      producto_id: item.producto_id || null,
      codigo: item.codigo || null,
      nombre_producto: item.nombre_producto || "Producto",
      cantidad_pedida: cantidad,
      cantidad_entregada: 0,
      cantidad_pendiente: cantidad,
      precio_unitario: precio,
      costo_unitario: Number(item.costo_unitario || 0),
      importe: Number(item.importe || cantidad * precio),
      estado: "pendiente",
    };
  });

  const { error: detailsError } = await supabase
    .from("pedido_detalles")
    .insert(orderDetails);

  if (detailsError) throw detailsError;

  await createOrderTracking(order.id);

  const { error: quotationError } = await supabase
    .from("cotizaciones")
    .update({
      estado: "convertida",
      updated_at: new Date().toISOString(),
    })
    .eq("id", quotation.id);

  if (quotationError) throw quotationError;

  return order;
}
