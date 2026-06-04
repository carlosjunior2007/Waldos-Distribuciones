import supabase from "../../../utils/supabase.js";
import { gridToCells } from '../playground.helpers';
import { DEFAULT_SHEET_NAME } from '../playground.constants';

function makeToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replaceAll('-', '');
  }

  return `${Date.now()}${Math.random().toString(16).slice(2)}`;
}

function isMissingStyleColumnError(error) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return message.includes('style') && (message.includes('does not exist') || message.includes('schema cache'));
}

function isMissingColumnError(error, columnName) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return message.includes(String(columnName).toLowerCase()) && (message.includes('does not exist') || message.includes('schema cache'));
}

function isMissingCellUniqueConstraintError(error) {
  const message = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return message.includes('42p10') || message.includes('no unique or exclusion constraint');
}

function dedupeCellPayloads(cells = []) {
  const map = new Map();
  cells.forEach((cell) => {
    const key = `${cell.sheet_id}:${Number(cell.row_index)}:${Number(cell.col_index)}`;
    map.set(key, {
      ...cell,
      row_index: Number(cell.row_index),
      col_index: Number(cell.col_index),
      updated_at: cell.updated_at || new Date().toISOString(),
    });
  });
  return [...map.values()];
}

function cellsWithoutStyle(cells = []) {
  return cells.map(({ style, ...cell }) => cell);
}


function normalizeRpcWorkbookPayload(payload) {
  if (!payload) return null;
  const raw = payload.workbook ? payload : payload?.data ? payload.data : payload;
  if (raw && raw.ok === false) throw new Error(raw.message || 'Playground no disponible.');
  const workbook = raw.workbook || raw;
  const sheets = raw.sheets || workbook.playground_sheets || [];

  return normalizeWorkbook({
    ...workbook,
    playground_sheets: sheets.map((sheet) => ({
      ...sheet,
      name: sheet.name || sheet.nombre || 'Hoja',
      position: Number(sheet.position ?? sheet.orden ?? 0),
      playground_cells: sheet.playground_cells || sheet.cells || [],
    })),
  });
}

function normalizeCellPayload(sheetId, rowIndex, colIndex, cell = {}) {
  return {
    sheet_id: sheetId,
    row_index: Number(rowIndex),
    col_index: Number(colIndex),
    value: cell.value ?? '',
    formula: cell.formula ?? '',
    style: cell.style || {},
  };
}

function isEmptyCellPayload(cell = {}) {
  const hasValue = String(cell.value ?? '').trim() !== '';
  const hasFormula = String(cell.formula ?? '').trim() !== '';
  const hasStyle = cell.style && Object.keys(cell.style).length > 0;
  return !hasValue && !hasFormula && !hasStyle;
}

function workbookSelect(includeStyle = true) {
  return `
    *,
    playground_sheets (
      id,
      name,
      position,
      playground_cells (
        id,
        row_index,
        col_index,
        value,
        formula${includeStyle ? ', style' : ''}
      )
    )
  `;
}

function normalizeWorkbook(data) {
  if (!data) return data;

  return {
    ...data,
    share_mode: data.share_mode || (data.public_editable ? 'edit' : 'view'),
    playground_sheets: [...(data.playground_sheets || [])].sort(
      (a, b) => Number(a.position || 0) - Number(b.position || 0),
    ),
  };
}

let cachedPlaygroundUser = undefined;
let cachedPlaygroundUserAt = 0;
let pendingPlaygroundUserPromise = null;
const PLAYGROUND_USER_CACHE_MS = 5 * 60 * 1000;

export function clearPlaygroundUserCache() {
  cachedPlaygroundUser = undefined;
  cachedPlaygroundUserAt = 0;
  pendingPlaygroundUserPromise = null;
}

export async function getCurrentPlaygroundUser({ force = false } = {}) {
  const now = Date.now();

  if (
    !force &&
    cachedPlaygroundUser !== undefined &&
    now - cachedPlaygroundUserAt < PLAYGROUND_USER_CACHE_MS
  ) {
    return cachedPlaygroundUser;
  }

  if (!force && pendingPlaygroundUserPromise) {
    return pendingPlaygroundUserPromise;
  }

  pendingPlaygroundUserPromise = (async () => {
    // Importante: getSession() lee la sesión local. getUser() valida contra
    // Supabase y pega a /auth/v1/user; si se llama desde renders/effects del
    // playground puede generar cientos de requests mientras se edita o scrollea.
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    cachedPlaygroundUser = data?.session?.user || null;
    cachedPlaygroundUserAt = Date.now();
    return cachedPlaygroundUser;
  })();

  try {
    return await pendingPlaygroundUserPromise;
  } finally {
    pendingPlaygroundUserPromise = null;
  }
}

function creatorLabelFromWorkbook(workbook, currentUser) {
  if (!workbook) return 'Sin creador';
  if (workbook.created_by_email) return workbook.created_by_email;
  if (workbook.created_by && currentUser?.id && workbook.created_by === currentUser.id && currentUser?.email) return currentUser.email;
  if (workbook.created_by) return `Usuario ${String(workbook.created_by).slice(0, 8)}`;
  return 'Sin creador';
}

export async function getPlaygrounds() {
  const currentUser = await getCurrentPlaygroundUser().catch(() => null);

  let response = await supabase
    .from('playground_workbooks')
    .select('id, name, description, is_public, public_token, share_mode, created_by, created_by_email, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (response.error && (isMissingColumnError(response.error, 'share_mode') || isMissingColumnError(response.error, 'created_by_email'))) {
    response = await supabase
      .from('playground_workbooks')
      .select('id, name, description, is_public, public_token, created_by, created_at, updated_at')
      .order('updated_at', { ascending: false });
  }

  if (response.error) throw response.error;

  return (response.data || []).map((item) => ({
    ...item,
    share_mode: item.share_mode || 'view',
    creator_label: creatorLabelFromWorkbook(item, currentUser),
    is_owner: Boolean(currentUser?.id && item.created_by === currentUser.id),
  }));
}

export async function createPlayground({ name, description, initialSheetName }) {
  const user = await getCurrentPlaygroundUser();

  if (!user) {
    throw new Error('No hay usuario autenticado para crear el playground.');
  }

  const payload = {
    name: name || 'Nuevo playground',
    description: description || null,
    is_public: false,
    public_token: makeToken(),
    share_mode: 'view',
    created_by: user.id,
    updated_by: user.id,
    created_by_email: user.email || null,
  };

  let response = await supabase
    .from('playground_workbooks')
    .insert(payload)
    .select('*')
    .single();

  if (response.error && (isMissingColumnError(response.error, 'share_mode') || isMissingColumnError(response.error, 'created_by_email'))) {
    const { share_mode, created_by_email, ...fallbackPayload } = payload;
    response = await supabase
      .from('playground_workbooks')
      .insert(fallbackPayload)
      .select('*')
      .single();
  }

  if (response.error) throw response.error;
  const workbook = response.data;

  const { data: sheet, error: sheetError } = await supabase
    .from('playground_sheets')
    .insert({
      workbook_id: workbook.id,
      name: initialSheetName || DEFAULT_SHEET_NAME,
      position: 0,
    })
    .select('*')
    .single();

  if (sheetError) throw sheetError;

  return { ...workbook, sheets: [sheet] };
}

export async function getPlaygroundById(id) {
  let response = await supabase
    .from('playground_workbooks')
    .select(workbookSelect(true))
    .eq('id', id)
    .single();

  if (response.error && isMissingStyleColumnError(response.error)) {
    response = await supabase
      .from('playground_workbooks')
      .select(workbookSelect(false))
      .eq('id', id)
      .single();
  }

  if (response.error) throw response.error;

  const currentUser = await getCurrentPlaygroundUser().catch(() => null);
  const normalized = normalizeWorkbook(response.data);

  return {
    ...normalized,
    creator_label: creatorLabelFromWorkbook(normalized, currentUser),
    is_owner: Boolean(currentUser?.id && normalized.created_by === currentUser.id),
  };
}

export async function getPublicPlaygroundByToken(token) {
  // Primero intenta por RPC. Es más estable para links públicos, especialmente en navegadores sin sesión.
  const rpcResponse = await supabase.rpc('get_public_playground_by_token', {
    share_token: token,
  });

  if (!rpcResponse.error) {
    const normalized = normalizeRpcWorkbookPayload(rpcResponse.data);
    if (normalized) return normalized;
  }

  // Compatibilidad con instalaciones anteriores que todavía usan lectura directa por public_token.
  let response = await supabase
    .from('playground_workbooks')
    .select(workbookSelect(true))
    .eq('public_token', token)
    .eq('is_public', true)
    .single();

  if (response.error && isMissingStyleColumnError(response.error)) {
    response = await supabase
      .from('playground_workbooks')
      .select(workbookSelect(false))
      .eq('public_token', token)
      .eq('is_public', true)
      .single();
  }

  if (response.error) {
    console.error('Error consultando playground público:', rpcResponse.error || response.error);
    throw response.error;
  }

  return normalizeWorkbook(response.data);
}

export async function updateWorkbook(id, payload) {
  const { data, error } = await supabase
    .from('playground_workbooks')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function toggleWorkbookPublic(id, enabled, mode = 'view') {
  const cleanMode = mode === 'edit' ? 'edit' : 'view';
  const payload = {
    is_public: Boolean(enabled),
    share_mode: cleanMode,
    updated_at: new Date().toISOString(),
  };

  if (enabled) payload.public_token = makeToken();

  let response = await supabase
    .from('playground_workbooks')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (response.error && isMissingColumnError(response.error, 'share_mode')) {
    const { share_mode, ...fallbackPayload } = payload;
    response = await supabase
      .from('playground_workbooks')
      .update(fallbackPayload)
      .eq('id', id)
      .select('*')
      .single();
  }

  if (response.error) throw response.error;
  return response.data;
}

export async function updateWorkbookShareMode(id, mode = 'view') {
  const cleanMode = mode === 'edit' ? 'edit' : 'view';

  const { data, error } = await supabase
    .from('playground_workbooks')
    .update({
      share_mode: cleanMode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function createSheet(workbookId, name, position) {
  const { data, error } = await supabase
    .from('playground_sheets')
    .insert({
      workbook_id: workbookId,
      name,
      position,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSheet(sheetId) {
  const { error } = await supabase
    .from('playground_sheets')
    .delete()
    .eq('id', sheetId);

  if (error) throw error;
  return true;
}

export async function renameSheet(sheetId, name) {
  const { data, error } = await supabase
    .from('playground_sheets')
    .update({ name })
    .eq('id', sheetId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}


const PLAYGROUND_CELL_CHUNK_SIZE = 450;

function chunkArray(items = [], size = PLAYGROUND_CELL_CHUNK_SIZE) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function insertCellsInChunks(cells = []) {
  const inserted = [];
  for (const chunk of chunkArray(cells)) {
    let response = await supabase
      .from('playground_cells')
      .insert(chunk)
      .select('*');

    if (response.error && isMissingStyleColumnError(response.error)) {
      response = await supabase
        .from('playground_cells')
        .insert(cellsWithoutStyle(chunk))
        .select('*');
    }

    if (response.error) throw response.error;
    inserted.push(...(response.data || []));
  }
  return inserted;
}

async function updateExistingCellByPosition(cell = {}, includeStyle = true) {
  const updatePayload = {
    value: cell.value ?? '',
    formula: cell.formula ?? '',
    updated_at: cell.updated_at || new Date().toISOString(),
  };

  if (includeStyle) updatePayload.style = cell.style || {};

  return supabase
    .from('playground_cells')
    .update(updatePayload)
    .eq('sheet_id', cell.sheet_id)
    .eq('row_index', Number(cell.row_index))
    .eq('col_index', Number(cell.col_index))
    .select('*')
    .maybeSingle();
}

async function manualUpsertCellsWithoutUniqueConstraint(cells = []) {
  const saved = [];

  for (const cell of dedupeCellPayloads(cells)) {
    let updateResponse = await updateExistingCellByPosition(cell, true);

    if (updateResponse.error && isMissingStyleColumnError(updateResponse.error)) {
      updateResponse = await updateExistingCellByPosition(cell, false);
    }

    if (updateResponse.error) throw updateResponse.error;

    if (updateResponse.data) {
      saved.push(updateResponse.data);
      continue;
    }

    let insertResponse = await supabase
      .from('playground_cells')
      .insert(cell)
      .select('*')
      .single();

    if (insertResponse.error && isMissingStyleColumnError(insertResponse.error)) {
      insertResponse = await supabase
        .from('playground_cells')
        .insert(cellsWithoutStyle([cell])[0])
        .select('*')
        .single();
    }

    // Si otra pestaña creó la celda entre el UPDATE y el INSERT, intentamos actualizar otra vez.
    if (insertResponse.error && String(insertResponse.error?.code || '').toLowerCase() === '23505') {
      const retryResponse = await updateExistingCellByPosition(cell, true);
      if (retryResponse.error) throw retryResponse.error;
      if (retryResponse.data) saved.push(retryResponse.data);
      continue;
    }

    if (insertResponse.error) throw insertResponse.error;
    saved.push(insertResponse.data);
  }

  return saved;
}

async function upsertCellsInChunks(cells = []) {
  const upserted = [];
  const cleanCells = dedupeCellPayloads(cells);

  for (const chunk of chunkArray(cleanCells)) {
    let response = await supabase
      .from('playground_cells')
      .upsert(chunk, { onConflict: 'sheet_id,row_index,col_index' })
      .select('*');

    if (response.error && isMissingStyleColumnError(response.error)) {
      response = await supabase
        .from('playground_cells')
        .upsert(cellsWithoutStyle(chunk), { onConflict: 'sheet_id,row_index,col_index' })
        .select('*');
    }

    if (response.error && isMissingCellUniqueConstraintError(response.error)) {
      const fallbackRows = await manualUpsertCellsWithoutUniqueConstraint(chunk);
      upserted.push(...fallbackRows);
      continue;
    }

    if (response.error) throw response.error;
    upserted.push(...(response.data || []));
  }
  return upserted;
}

async function fetchSheetCellRefs(sheetId) {
  const refs = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('playground_cells')
      .select('id,row_index,col_index')
      .eq('sheet_id', sheetId)
      .range(from, to);

    if (error) throw error;
    refs.push(...(data || []));

    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return refs;
}

async function deleteCellsByIds(ids = []) {
  for (const chunk of chunkArray(ids)) {
    const { error } = await supabase
      .from('playground_cells')
      .delete()
      .in('id', chunk);

    if (error) throw error;
  }
}

export async function saveSheetCells(sheetId, grid) {
  const cells = gridToCells(sheetId, grid);

  // Guardado seguro: antes se hacía DELETE de toda la hoja y luego INSERT.
  // Si un chunk fallaba, la hoja quedaba incompleta y al volver a entrar parecía
  // que “no cargaron” productos. Ahora primero hacemos UPSERT de todo lo que sí
  // existe y solo después borramos celdas viejas que ya no están en el grid.
  const existingRefs = await fetchSheetCellRefs(sheetId);
  const nextKeys = new Set(cells.map((cell) => `${Number(cell.row_index)}:${Number(cell.col_index)}`));

  const savedCells = cells.length ? await upsertCellsInChunks(cells) : [];

  const staleIds = existingRefs
    .filter((cell) => !nextKeys.has(`${Number(cell.row_index)}:${Number(cell.col_index)}`))
    .map((cell) => cell.id)
    .filter(Boolean);

  if (staleIds.length) {
    await deleteCellsByIds(staleIds);
  }

  return savedCells;
}


export async function upsertSheetCell(sheetId, rowIndex, colIndex, cell = {}) {
  const payload = normalizeCellPayload(sheetId, rowIndex, colIndex, cell);

  // No borramos la fila al limpiar una celda. Guardamos una celda vacía para que
  // otros usuarios reciban el cambio por realtime aunque la DB no mande OLD completo en DELETE.
  let response = await supabase
    .from('playground_cells')
    .upsert(payload, { onConflict: 'sheet_id,row_index,col_index' })
    .select('*')
    .single();

  if (response.error && isMissingStyleColumnError(response.error)) {
    const { style, ...fallbackPayload } = payload;
    response = await supabase
      .from('playground_cells')
      .upsert(fallbackPayload, { onConflict: 'sheet_id,row_index,col_index' })
      .select('*')
      .single();
  }

  if (response.error) throw response.error;
  return response.data;
}

export async function upsertSheetCells(sheetId, cells = []) {
  const normalized = cells.map((item) => normalizeCellPayload(sheetId, item.rowIndex, item.colIndex, item.cell));

  if (!normalized.length) return [];

  // Guardamos celdas vacías como UPDATE para que borrar contenido también viaje por realtime.
  return upsertCellsInChunks(normalized);
}

export function subscribeToPlaygroundChanges({
  workbookId,
  sheets = [],
  onCellChange,
  onSheetChange,
  onWorkbookChange,
  onRealtimeStatus,
}) {
  if (!workbookId) return null;

  const channel = supabase.channel(`playground-db-${workbookId}`, {
    config: {
      broadcast: { self: false },
    },
  });

  channel.on(
    'broadcast',
    { event: 'workbook-reload' },
    (payload) => onWorkbookChange?.(payload),
  );

  // Broadcast se queda como respaldo rápido. Postgres Changes es la fuente real.
  channel.on(
    'broadcast',
    { event: 'cell-change' },
    ({ payload }) => {
      const sheetId = payload?.sheetId;
      const cells = Array.isArray(payload?.cells) ? payload.cells : [];

      cells.forEach((item) => {
        onCellChange?.({
          eventType: 'BROADCAST',
          new: {
            sheet_id: sheetId,
            row_index: item.rowIndex,
            col_index: item.colIndex,
            value: item.cell?.value ?? '',
            formula: item.cell?.formula ?? '',
            style: item.cell?.style || {},
            updated_at: new Date().toISOString(),
          },
        });
      });
    },
  );

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'playground_workbooks',
      filter: `id=eq.${workbookId}`,
    },
    (payload) => onWorkbookChange?.(payload),
  );

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'playground_sheets',
      filter: `workbook_id=eq.${workbookId}`,
    },
    (payload) => onSheetChange?.(payload),
  );

  (sheets || []).forEach((sheet) => {
    if (!sheet?.id) return;

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'playground_cells',
        filter: `sheet_id=eq.${sheet.id}`,
      },
      (payload) => onCellChange?.(payload),
    );
  });

  channel.subscribe((status, err) => {
    onRealtimeStatus?.(status, err);
    if (status === 'CHANNEL_ERROR') {
      console.warn('No se pudo conectar realtime del playground. Revisa supabase_realtime y las políticas RLS.', err);
    }
  });

  return channel;
}

export function removePlaygroundChannel(channel) {
  if (!channel) return;
  supabase.removeChannel(channel);
}


export async function savePublicCell(token, sheetId, rowIndex, colIndex, cell = {}) {
  const { data, error } = await supabase.rpc('save_public_playground_cell', {
    share_token: token,
    target_sheet_id: sheetId,
    target_row_index: Number(rowIndex),
    target_col_index: Number(colIndex),
    cell_value: cell.value ?? '',
    cell_formula: cell.formula ?? '',
    cell_style: cell.style || {},
  });

  if (error) throw error;
  return data;
}

export async function savePublicSheetCells(token, sheetId, grid) {
  const cells = gridToCells(sheetId, grid);

  const { data, error } = await supabase.rpc('save_public_playground_cells', {
    share_token: token,
    target_sheet_id: sheetId,
    cells_payload: cells,
  });

  if (error) throw error;
  return data;
}


function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

function startOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1).toISOString();
}

function buildDateRange(period = 'all', dateFrom = '', dateTo = '') {
  const now = new Date();

  if (period === 'month') {
    return { from: startOfMonth(now), to: now.toISOString() };
  }

  if (period === 'year') {
    return { from: startOfYear(now), to: now.toISOString() };
  }

  if (period === 'custom') {
    return {
      from: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : '',
      to: dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : '',
    };
  }

  return { from: '', to: '' };
}

async function selectWithOptionalDate({ table, select, orderColumn = 'created_at', period = 'all', dateFrom = '', dateTo = '', limit = 10000 }) {
  const range = buildDateRange(period, dateFrom, dateTo);
  let query = supabase.from(table).select(select).order(orderColumn, { ascending: false }).limit(limit);

  if (range.from) query = query.gte(orderColumn, range.from);
  if (range.to) query = query.lte(orderColumn, range.to);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function calculateProductUtility(row = {}) {
  const precio = Number(row.precio || 0);
  const costo = Number(row.precio_compra || 0);

  if (!Number.isFinite(precio) || precio <= 0 || !Number.isFinite(costo)) return '';

  return Number((((precio - costo) / precio) * 100).toFixed(2));
}

function enrichProductForPlayground(row = {}) {
  return {
    ...row,
    utilidad: calculateProductUtility(row),
  };
}

function pickFields(row = {}, fields = []) {
  if (!fields.length) return row;
  return Object.fromEntries(fields.map((field) => [field, row[field] ?? '']));
}

export const PLAYGROUND_IMPORT_FIELD_SETS = {
  productos: [
    'id', 'codigo', 'nombre', 'descripcion', 'precio', 'precio_compra', 'utilidad', 'categoria', 'unidad', 'cantidad_caja', 'habilitado', 'imagen',
  ],
  pedidos: [
    'id', 'folio', 'cliente_nombre', 'cliente_email', 'estado', 'estado_pago', 'fecha_inicio', 'fecha_fin', 'subtotal', 'iva_porcentaje', 'total', 'created_at',
  ],
  cotizaciones: [
    'id', 'folio', 'cliente_nombre', 'cliente_email', 'estado', 'subtotal', 'iva_porcentaje', 'total', 'fecha_vencimiento', 'created_at',
  ],
  clientes: [
    'id', 'nombre', 'correo', 'numero', 'telefono', 'rfc', 'razon_social', 'regimen_fiscal', 'uso_cfdi', 'ciudad', 'estado', 'created_at',
  ],
  gastos: [
    'id', 'concepto', 'descripcion', 'monto', 'tipo', 'fecha', 'pedido_id', 'cotizacion_id', 'created_at',
  ],
  entregas: [
    'id', 'folio', 'pedido_id', 'estado', 'fecha_entrega', 'recibido_por', 'cliente_direccion_id', 'created_at',
  ],
};

export async function getPlaygroundImportData({ source, period = 'all', dateFrom = '', dateTo = '', fields = [] }) {
  const selectedFields = Array.isArray(fields) && fields.length ? fields : PLAYGROUND_IMPORT_FIELD_SETS[source] || [];

  if (source === 'productos') {
    const rows = await getProductsForPlayground();
    return rows.map((row) => pickFields(enrichProductForPlayground(row), selectedFields));
  }

  const config = {
    pedidos: { table: 'pedidos', select: PLAYGROUND_IMPORT_FIELD_SETS.pedidos.join(', '), orderColumn: 'created_at' },
    cotizaciones: { table: 'cotizaciones', select: PLAYGROUND_IMPORT_FIELD_SETS.cotizaciones.join(', '), orderColumn: 'created_at' },
    clientes: { table: 'clientes', select: PLAYGROUND_IMPORT_FIELD_SETS.clientes.join(', '), orderColumn: 'created_at' },
    gastos: { table: 'gastos', select: PLAYGROUND_IMPORT_FIELD_SETS.gastos.join(', '), orderColumn: 'created_at' },
    entregas: { table: 'entregas', select: PLAYGROUND_IMPORT_FIELD_SETS.entregas.join(', '), orderColumn: 'created_at' },
  }[source];

  if (!config) throw new Error('Fuente de datos no soportada.');

  const rows = await selectWithOptionalDate({
    table: config.table,
    select: config.select,
    orderColumn: config.orderColumn,
    period,
    dateFrom,
    dateTo,
  });

  return rows.map((row) => pickFields(row, selectedFields));
}


export async function getProductsByIdsForPlayground(productIds = []) {
  const ids = Array.from(new Set((productIds || []).map((id) => String(id || '').trim()).filter(Boolean)));

  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('productos')
    .select('id, codigo, nombre, descripcion, precio, precio_compra, cantidad_caja, unidad, categoria, habilitado, imagen')
    .in('id', ids);

  if (error) throw error;
  return data || [];
}

export async function applyProductBulkChanges({ playgroundId, changes }) {
  const cleanChanges = Array.isArray(changes) ? changes : [];

  if (!cleanChanges.length) {
    return { ok: true, updated_count: 0, created_count: 0, change_id: null };
  }

  const createChanges = cleanChanges.filter((change) => change?.action === 'create' || change?.tipo === 'crear' || change?.create === true);
  const updateChanges = cleanChanges.filter((change) => !createChanges.includes(change));

  let updatedCount = 0;
  let createdCount = 0;
  let rpcResult = null;

  if (updateChanges.length) {
    const rpcChanges = updateChanges.map(({ action, tipo, create, ...change }) => change);

    const { data, error } = await supabase.rpc('apply_product_bulk_changes', {
      playground_id: playgroundId || null,
      changes: rpcChanges,
    });

    if (error) throw error;
    rpcResult = data;
    updatedCount = Number(data?.updated_count ?? updateChanges.length);
  }

  if (createChanges.length) {
    const payload = createChanges.map((change) => {
      const clean = {
        codigo: change.codigo || null,
        nombre: change.nombre || null,
        descripcion: change.descripcion || null,
        precio: change.precio ?? null,
        precio_compra: change.precio_compra ?? null,
        categoria: change.categoria || null,
        unidad: change.unidad || null,
        cantidad_caja: change.cantidad_caja ?? null,
        habilitado: change.habilitado ?? true,
      };

      return Object.fromEntries(
        Object.entries(clean).filter(([, value]) => value !== undefined && value !== ''),
      );
    });

    const { data, error } = await supabase
      .from('productos')
      .insert(payload)
      .select('id');

    if (error) throw error;
    createdCount = data?.length ?? createChanges.length;
  }

  return {
    ok: true,
    ...(rpcResult || {}),
    updated_count: updatedCount,
    created_count: createdCount,
  };
}

export async function getProductsForPlayground() {
  const { data, error } = await supabase
    .from('productos')
    .select('id, codigo, nombre, descripcion, precio, precio_compra, cantidad_caja, unidad, categoria, habilitado, imagen')
    .eq('habilitado', true)
    .order('nombre', { ascending: true })
    .range(0, 9999);

  if (error) throw error;
  return (data || []).map(enrichProductForPlayground);
}

export async function deletePlayground(id) {
  const { error } = await supabase
    .from('playground_workbooks')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function createPublicSheet(token, name = 'Hoja', position = 0) {
  const rpcResponse = await supabase.rpc('create_public_playground_sheet', {
    share_token: token,
    sheet_name: name,
    sheet_position: Number(position || 0),
  });

  if (!rpcResponse.error) return rpcResponse.data;

  // Compatibilidad: si el link público está abierto con una sesión interna y RLS lo permite.
  const workbook = await getPublicPlaygroundByToken(token);
  const workbookId = workbook?.id;
  if (!workbookId) throw rpcResponse.error;

  const { data, error } = await supabase
    .from('playground_sheets')
    .insert({
      workbook_id: workbookId,
      name,
      position: Number(position || 0),
    })
    .select('*')
    .single();

  if (error) throw rpcResponse.error || error;
  return data;
}

export async function deletePublicSheet(token, sheetId) {
  const rpcResponse = await supabase.rpc('delete_public_playground_sheet', {
    share_token: token,
    target_sheet_id: sheetId,
  });

  if (!rpcResponse.error) return rpcResponse.data;

  // Compatibilidad: si el link público está abierto con una sesión interna y RLS lo permite.
  const { error } = await supabase
    .from('playground_sheets')
    .delete()
    .eq('id', sheetId);

  if (error) throw rpcResponse.error || error;
  return true;
}
