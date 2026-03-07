import supabase from "../utils/supabase";

const PAGE_SIZE = 10;

function escapeLike(value = "") {
  return value.replace(/[%_]/g, "");
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

export function addDaysISO(days = 7) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function expireQuotations() {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("cotizaciones")
    .update({
      estado: "vencido",
      updated_at: now,
    })
    .in("estado", ["pendiente", "en_proceso"])
    .lt("fecha_vencimiento", now);

  if (error) throw error;
}

export async function searchProducts(term = "") {
  let query = supabase
    .from("productos")
    .select(
      "id, nombre, descripcion, precio, precio_compra, precio_utilidad, codigo, categoria, unidad, disponibilidad"
    )
    .eq("disponibilidad", true)
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
    if (!Number.isNaN(parsed) && parsed > max) max = parsed;
  }

  const next = String(max + 1).padStart(3, "0");
  return `${prefix}${next}`;
}

export function buildDetailsPayload(items = []) {
  return items.map((item) => {
    const cantidad = Number(item.cantidad || 0);
    const precio = Number(item.precio_unitario || 0);
    const costo = Number(item.costo_unitario || 0);
    const importe = cantidad * precio;
    const gananciaLinea = cantidad * (precio - costo);

    return {
      producto_id: item.producto_id,
      cantidad,
      precio_unitario: precio,
      costo_unitario: costo,
      importe,
      ganancia_linea: gananciaLinea,
    };
  });
}

export function calculateTotals(items = [], descuento = 0, gastos = 0) {
  const subtotal = items.reduce(
    (acc, item) => acc + Number(item.importe || 0),
    0
  );

  const ganancia = items.reduce(
    (acc, item) => acc + Number(item.ganancia_linea || 0),
    0
  ) - Number(gastos || 0);

  const total = subtotal - Number(descuento || 0);

  return {
    subtotal,
    total,
    ganancia,
  };
}

export async function fetchQuotations({
  page = 1,
  month = getCurrentMonthValue(),
  search = "",
  status = "todas",
}) {
  await expireQuotations();

  const { start, end } = getMonthRange(month);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("cotizaciones")
    .select("*", { count: "exact" })
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  const cleanSearch = escapeLike(search.trim());

  if (cleanSearch) {
    query = query.or(
      `folio.ilike.%${cleanSearch}%,cliente_nombre.ilike.%${cleanSearch}%`
    );
  }

  if (status !== "todas") {
    query = query.eq("estado", status);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) throw error;

  return {
    rows: data || [],
    total: count || 0,
    totalPages: Math.max(1, Math.ceil((count || 0) / PAGE_SIZE)),
  };
}

export async function fetchQuotationSummary(month = getCurrentMonthValue()) {
  await expireQuotations();

  const { start, end } = getMonthRange(month);

  const base = supabase
    .from("cotizaciones")
    .select("id, estado, total, ganancia", { count: "exact" })
    .gte("created_at", start)
    .lt("created_at", end);

  const [{ data: allRows, count: totalCount, error: allError }] =
    await Promise.all([base]);

  if (allError) throw allError;

  const rows = allRows || [];

  return {
    total: totalCount || 0,
    pendientes: rows.filter((x) => x.estado === "pendiente").length,
    enProceso: rows.filter((x) => x.estado === "en_proceso").length,
    completadas: rows.filter((x) => x.estado === "completado").length,
    canceladas: rows.filter((x) => x.estado === "cancelado").length,
    vencidas: rows.filter((x) => x.estado === "vencido").length,
    totalVentas: rows.reduce((acc, x) => acc + Number(x.total || 0), 0),
    totalGananciaReal: rows
      .filter((x) => x.estado === "completado")
      .reduce((acc, x) => acc + Number(x.ganancia || 0), 0),
  };
}

export async function fetchQuotationById(id) {
  const { data: quotation, error: qError } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("id", id)
    .single();

  if (qError) throw qError;

  const { data: details, error: dError } = await supabase
    .from("cotizacion_detalles")
    .select("*")
    .eq("cotizacion_id", id)
    .order("created_at", { ascending: true });

  if (dError) throw dError;

  const productoIds = [...new Set((details || []).map((item) => item.producto_id).filter(Boolean))];

  let productosMap = {};

  if (productoIds.length > 0) {
    const { data: products, error: pError } = await supabase
      .from("productos")
      .select("id, nombre, codigo, unidad, descripcion, precio, precio_compra")
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
      nombre_producto: product?.nombre || "Producto no encontrado",
      codigo: product?.codigo || "",
      unidad: product?.unidad || "",
      producto: product,
    };
  });

  return {
    ...quotation,
    detalles: detallesConProducto,
  };
}

export async function createQuotation({ header, items, month }) {
  const folio = await generateNextFolio(month);
  const detailsPayload = buildDetailsPayload(items);
  const totals = calculateTotals(
    detailsPayload,
    header.descuento,
    header.gastos
  );

  const now = new Date().toISOString();

  const quotationPayload = {
    folio,
    cliente_nombre: header.cliente_nombre,
    cliente_telefono: header.cliente_telefono || null,
    cliente_email: header.cliente_email || null,
    estado: header.estado,
    subtotal: totals.subtotal,
    descuento: Number(header.descuento || 0),
    total: totals.total,
    gastos: Number(header.gastos || 0),
    ganancia: totals.ganancia,
    fecha_vencimiento: header.fecha_vencimiento || addDaysISO(7),
    fecha_completado: header.estado === "completado" ? now : null,
    notas: header.notas || null,
    updated_at: now,
  };

  const { data: created, error: qError } = await supabase
    .from("cotizaciones")
    .insert(quotationPayload)
    .select()
    .single();

  if (qError) throw qError;

  const payload = detailsPayload.map((item) => ({
    ...item,
    cotizacion_id: created.id,
  }));

  const { error: dError } = await supabase
    .from("cotizacion_detalles")
    .insert(payload);

  if (dError) throw dError;

  return created;
}

export async function updateQuotation(id, { header, items }) {
  const detailsPayload = buildDetailsPayload(items);
  const totals = calculateTotals(
    detailsPayload,
    header.descuento,
    header.gastos
  );

  const now = new Date().toISOString();

  const quotationPayload = {
    cliente_nombre: header.cliente_nombre,
    cliente_telefono: header.cliente_telefono || null,
    cliente_email: header.cliente_email || null,
    estado: header.estado,
    subtotal: totals.subtotal,
    descuento: Number(header.descuento || 0),
    total: totals.total,
    gastos: Number(header.gastos || 0),
    ganancia: totals.ganancia,
    fecha_vencimiento: header.fecha_vencimiento,
    fecha_completado: header.estado === "completado" ? now : null,
    notas: header.notas || null,
    updated_at: now,
  };

  const { error: qError } = await supabase
    .from("cotizaciones")
    .update(quotationPayload)
    .eq("id", id);

  if (qError) throw qError;

  const { error: deleteError } = await supabase
    .from("cotizacion_detalles")
    .delete()
    .eq("cotizacion_id", id);

  if (deleteError) throw deleteError;

  const payload = detailsPayload.map((item) => ({
    ...item,
    cotizacion_id: id,
  }));

  if (payload.length > 0) {
    const { error: insertError } = await supabase
      .from("cotizacion_detalles")
      .insert(payload);

    if (insertError) throw insertError;
  }
}

export async function deleteQuotation(id) {
  const { error: detailError } = await supabase
    .from("cotizacion_detalles")
    .delete()
    .eq("cotizacion_id", id);

  if (detailError) throw detailError;

  const { error } = await supabase.from("cotizaciones").delete().eq("id", id);

  if (error) throw error;
}