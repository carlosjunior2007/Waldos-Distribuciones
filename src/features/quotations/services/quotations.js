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
  cliente_rfc,
  cliente_razon_social,
  estado,
  subtotal,
  descuento,
  total,
  gastos,
  ganancia,
  iva_porcentaje,
  iva_monto,
  isr_porcentaje,
  isr_monto,
  retencion_iva_porcentaje,
  retencion_iva_monto,
  total_impuestos,
  total_retenciones,
  fecha_vencimiento,
  fecha_completado,
  notas,
  created_at,
  updated_at
`;

function escapeLike(value = "") {
  return String(value).replace(/[%_]/g, "");
}

function applyQuotationSearch(query, cleanSearch) {
  if (!cleanSearch) return query;

  return query.or(
    `folio.ilike.%${cleanSearch}%,cliente_nombre.ilike.%${cleanSearch}%,cliente_rfc.ilike.%${cleanSearch}%,cliente_razon_social.ilike.%${cleanSearch}%`,
  );
}

function sortQuotations(a, b) {
  if (a.isCarryover && !b.isCarryover) return -1;
  if (!a.isCarryover && b.isCarryover) return 1;

  const statusOrder = {
    pendiente: 1,
    en_proceso: 2,
    vencido: 3,
    completado: 4,
    cancelado: 5,
  };

  const aOrder = statusOrder[a.estado] || 99;
  const bOrder = statusOrder[b.estado] || 99;

  if (a.isCarryover && b.isCarryover && aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
}

function groupQuantitiesByProduct(items = []) {
  return items.reduce((acc, item) => {
    if (!item.producto_id) return acc;

    acc[item.producto_id] =
      (acc[item.producto_id] || 0) + Number(item.cantidad || 0);

    return acc;
  }, {});
}

function buildStockDeltas({ oldItems = [], newItems = [] }) {
  const oldMap = groupQuantitiesByProduct(oldItems);
  const newMap = groupQuantitiesByProduct(newItems);

  const ids = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);

  return Array.from(ids)
    .map((productoId) => ({
      producto_id: productoId,
      oldQuantity: Number(oldMap[productoId] || 0),
      newQuantity: Number(newMap[productoId] || 0),
      delta: Number(newMap[productoId] || 0) - Number(oldMap[productoId] || 0),
    }))
    .filter((item) => item.delta !== 0);
}

async function getProductsForStock(productIds = []) {
  if (!productIds.length) return {};

  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, cantidad")
    .in("id", productIds);

  if (error) throw error;

  return (data || []).reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});
}

async function applyStockDeltas(deltas = []) {
  if (!deltas.length) return;

  const productIds = deltas.map((item) => item.producto_id);
  const productsMap = await getProductsForStock(productIds);

  for (const item of deltas) {
    const product = productsMap[item.producto_id];

    if (!product) {
      throw new Error("Uno de los productos ya no existe.");
    }

    const currentStock = Number(product.cantidad || 0);
    const nextStock = currentStock - item.delta;

    if (nextStock < 0) {
      throw new Error(
        `Stock insuficiente para "${product.nombre}". Disponible: ${currentStock}, requerido extra: ${item.delta}.`,
      );
    }

    const { error } = await supabase
      .from("productos")
      .update({
        cantidad: nextStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.producto_id);

    if (error) throw error;
  }
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
    .eq("estado", "pendiente")
    .lt("fecha_vencimiento", now);

  if (error) throw error;
}

export async function searchProducts(term = "") {
  let query = supabase
    .from("productos")
    .select(
      "id, nombre, descripcion, precio, precio_compra, precio_utilidad, codigo, categoria, unidad, disponibilidad, habilitado, cantidad",
    )
    .eq("disponibilidad", true)
    .eq("habilitado", true)
    .gt("cantidad", 0)
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

export function calculateTotals(detailsPayload = [], header = {}) {
  const subtotal = detailsPayload.reduce(
    (acc, item) => acc + Number(item.importe || 0),
    0,
  );

  const descuento = Number(header.descuento || 0);
  const gastos = Number(header.gastos || 0);

  const ivaPorcentaje = Number(header.iva_porcentaje || 0);
  const isrPorcentaje = Number(header.isr_porcentaje || 0);
  const retencionIvaPorcentaje = Number(header.retencion_iva_porcentaje || 0);

  const base = Math.max(subtotal - descuento, 0);

  const ivaMonto = base * (ivaPorcentaje / 100);
  const isrMonto = base * (isrPorcentaje / 100);
  const retencionIvaMonto = base * (retencionIvaPorcentaje / 100);

  const totalImpuestos = ivaMonto;
  const totalRetenciones = isrMonto + retencionIvaMonto;
  const total = base + totalImpuestos - totalRetenciones;

  const gananciaBruta = detailsPayload.reduce(
    (acc, item) => acc + Number(item.ganancia_linea || 0),
    0,
  );

  const ganancia = gananciaBruta - gastos;

  return {
    subtotal,
    descuento,
    gastos,
    base,
    iva_porcentaje: ivaPorcentaje,
    iva_monto: ivaMonto,
    isr_porcentaje: isrPorcentaje,
    isr_monto: isrMonto,
    retencion_iva_porcentaje: retencionIvaPorcentaje,
    retencion_iva_monto: retencionIvaMonto,
    total_impuestos: totalImpuestos,
    total_retenciones: totalRetenciones,
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
  const cleanSearch = escapeLike(search.trim());

  let monthQuery = supabase
    .from("cotizaciones")
    .select(QUOTATION_SELECT)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false })
    .range(0, MAX_ROWS);

  monthQuery = applyQuotationSearch(monthQuery, cleanSearch);

  if (status !== "todas") {
    monthQuery = monthQuery.eq("estado", status);
  }

  const carryoverStatuses = [];

  if (status === "todas") {
    carryoverStatuses.push("pendiente", "en_proceso");
  }

  if (status === "pendiente") {
    carryoverStatuses.push("pendiente");
  }

  if (status === "en_proceso") {
    carryoverStatuses.push("en_proceso");
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

  const { data: monthRowsData, error: monthError } = await monthQuery;

  if (monthError) throw monthError;

  const monthRows = (monthRowsData || []).map((row) => ({
    ...row,
    isCarryover: false,
  }));

  const map = new Map();

  for (const row of [...carryoverRows, ...monthRows]) {
    map.set(row.id, row);
  }

  const mergedRows = Array.from(map.values()).sort(sortQuotations);

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

  let monthQuery = supabase
    .from("cotizaciones")
    .select("id, estado, total, ganancia, created_at")
    .gte("created_at", start)
    .lt("created_at", end)
    .range(0, MAX_ROWS);

  monthQuery = applyQuotationSearch(monthQuery, cleanSearch);

  if (status !== "todas") {
    monthQuery = monthQuery.eq("estado", status);
  }

  const carryoverStatuses = [];

  if (status === "todas") {
    carryoverStatuses.push("pendiente", "en_proceso");
  }

  if (status === "pendiente") {
    carryoverStatuses.push("pendiente");
  }

  if (status === "en_proceso") {
    carryoverStatuses.push("en_proceso");
  }

  let carryoverRows = [];

  if (carryoverStatuses.length > 0) {
    let carryoverQuery = supabase
      .from("cotizaciones")
      .select("id, estado, total, ganancia, created_at")
      .in("estado", carryoverStatuses)
      .lt("created_at", start)
      .range(0, MAX_ROWS);

    carryoverQuery = applyQuotationSearch(carryoverQuery, cleanSearch);

    const { data, error } = await carryoverQuery;

    if (error) throw error;

    carryoverRows = data || [];
  }

  const { data: monthRowsData, error: monthError } = await monthQuery;

  if (monthError) throw monthError;

  const map = new Map();

  for (const row of [...carryoverRows, ...(monthRowsData || [])]) {
    map.set(row.id, row);
  }

  const rows = Array.from(map.values());

  return {
    total: rows.length,
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

  let cliente = null;

  if (quotation?.cliente_id) {
    const { data: clientData, error: clientError } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", quotation.cliente_id)
      .maybeSingle();

    if (!clientError) {
      cliente = clientData || null;
    }
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
      .select("id, nombre, codigo, unidad, descripcion, precio, precio_compra, cantidad")
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
      stock_actual: Number(product?.cantidad || 0),
      producto: product,
    };
  });

  return {
    ...quotation,
    clientes: cliente,
    cliente_rfc: quotation.cliente_rfc || cliente?.rfc || "",
    cliente_razon_social:
      quotation.cliente_razon_social || cliente?.razon_social || "",
    detalles: detallesConProducto,
  };
}

function buildQuotationPayload({ header, detailsPayload, folio = null }) {
  const totals = calculateTotals(detailsPayload, header);
  const now = new Date().toISOString();

  const payload = {
    cliente_id: header.cliente_id || null,
    cliente_nombre: header.cliente_nombre,
    cliente_telefono: header.cliente_telefono || null,
    cliente_email: header.cliente_email || null,
    cliente_rfc: header.cliente_rfc || null,
    cliente_razon_social: header.cliente_razon_social || null,

    estado: header.estado,
    subtotal: totals.subtotal,
    descuento: totals.descuento,
    total: totals.total,
    gastos: totals.gastos,
    ganancia: totals.ganancia,

    iva_porcentaje: totals.iva_porcentaje,
    iva_monto: totals.iva_monto,
    isr_porcentaje: totals.isr_porcentaje,
    isr_monto: totals.isr_monto,
    retencion_iva_porcentaje: totals.retencion_iva_porcentaje,
    retencion_iva_monto: totals.retencion_iva_monto,
    total_impuestos: totals.total_impuestos,
    total_retenciones: totals.total_retenciones,

    fecha_vencimiento: header.fecha_vencimiento || addDaysISO(7),
    fecha_completado: header.estado === "completado" ? now : null,
    notas: header.notas || null,
    updated_at: now,
  };

  if (folio) {
    payload.folio = folio;
  }

  return payload;
}

export async function createQuotation({ header, items, month }) {
  const folio = await generateNextFolio(month);
  const detailsPayload = buildDetailsPayload(items);

  const stockDeltas = buildStockDeltas({
    oldItems: [],
    newItems: detailsPayload,
  });

  await applyStockDeltas(stockDeltas);

  const quotationPayload = buildQuotationPayload({
    header,
    detailsPayload,
    folio,
  });

  const { data: created, error: qError } = await supabase
    .from("cotizaciones")
    .insert(quotationPayload)
    .select()
    .single();

  if (qError) {
    await applyStockDeltas(
      stockDeltas.map((item) => ({
        ...item,
        delta: -item.delta,
      })),
    );
    throw qError;
  }

  const payload = detailsPayload.map((item) => ({
    ...item,
    cotizacion_id: created.id,
  }));

  if (payload.length > 0) {
    const { error: dError } = await supabase
      .from("cotizacion_detalles")
      .insert(payload);

    if (dError) {
      await supabase.from("cotizaciones").delete().eq("id", created.id);
      await applyStockDeltas(
        stockDeltas.map((item) => ({
          ...item,
          delta: -item.delta,
        })),
      );
      throw dError;
    }
  }

  return created;
}

export async function updateQuotation(id, { header, items }) {
  const { data: oldDetails, error: oldDetailsError } = await supabase
    .from("cotizacion_detalles")
    .select("producto_id, cantidad")
    .eq("cotizacion_id", id);

  if (oldDetailsError) throw oldDetailsError;

  const detailsPayload = buildDetailsPayload(items);

  const stockDeltas = buildStockDeltas({
    oldItems: oldDetails || [],
    newItems: detailsPayload,
  });

  await applyStockDeltas(stockDeltas);

  const quotationPayload = buildQuotationPayload({
    header,
    detailsPayload,
  });

  const { error: qError } = await supabase
    .from("cotizaciones")
    .update(quotationPayload)
    .eq("id", id);

  if (qError) {
    await applyStockDeltas(
      stockDeltas.map((item) => ({
        ...item,
        delta: -item.delta,
      })),
    );
    throw qError;
  }

  const { error: deleteError } = await supabase
    .from("cotizacion_detalles")
    .delete()
    .eq("cotizacion_id", id);

  if (deleteError) {
    await applyStockDeltas(
      stockDeltas.map((item) => ({
        ...item,
        delta: -item.delta,
      })),
    );
    throw deleteError;
  }

  const payload = detailsPayload.map((item) => ({
    ...item,
    cotizacion_id: id,
  }));

  if (payload.length > 0) {
    const { error: insertError } = await supabase
      .from("cotizacion_detalles")
      .insert(payload);

    if (insertError) {
      await applyStockDeltas(
        stockDeltas.map((item) => ({
          ...item,
          delta: -item.delta,
        })),
      );
      throw insertError;
    }
  }
}

export async function deleteQuotation(id) {
  const { data: oldDetails, error: oldDetailsError } = await supabase
    .from("cotizacion_detalles")
    .select("producto_id, cantidad")
    .eq("cotizacion_id", id);

  if (oldDetailsError) throw oldDetailsError;

  const stockDeltas = buildStockDeltas({
    oldItems: oldDetails || [],
    newItems: [],
  });

  await applyStockDeltas(stockDeltas);

  const { error: detailError } = await supabase
    .from("cotizacion_detalles")
    .delete()
    .eq("cotizacion_id", id);

  if (detailError) {
    await applyStockDeltas(
      stockDeltas.map((item) => ({
        ...item,
        delta: -item.delta,
      })),
    );
    throw detailError;
  }

  const { error } = await supabase.from("cotizaciones").delete().eq("id", id);

  if (error) {
    await applyStockDeltas(
      stockDeltas.map((item) => ({
        ...item,
        delta: -item.delta,
      })),
    );
    throw error;
  }
}