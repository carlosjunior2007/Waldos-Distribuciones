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

export async function getCurrentPlaygroundUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user || null;
}

function creatorLabelFromWorkbook(workbook, currentUser) {
  if (!workbook) return 'Sin creador';
  if (workbook.created_by && currentUser?.id && workbook.created_by === currentUser.id) return 'Tú';
  if (workbook.created_by_email) return workbook.created_by_email;
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

export async function saveSheetCells(sheetId, grid) {
  const cells = gridToCells(sheetId, grid);

  const { error: deleteError } = await supabase
    .from('playground_cells')
    .delete()
    .eq('sheet_id', sheetId);

  if (deleteError) throw deleteError;

  if (!cells.length) return [];

  let response = await supabase
    .from('playground_cells')
    .insert(cells)
    .select('*');

  if (response.error && isMissingStyleColumnError(response.error)) {
    response = await supabase
      .from('playground_cells')
      .insert(cellsWithoutStyle(cells))
      .select('*');
  }

  if (response.error) throw response.error;
  return response.data || [];
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
  let response = await supabase
    .from('playground_cells')
    .upsert(normalized, { onConflict: 'sheet_id,row_index,col_index' })
    .select('*');

  if (response.error && isMissingStyleColumnError(response.error)) {
    response = await supabase
      .from('playground_cells')
      .upsert(cellsWithoutStyle(normalized), { onConflict: 'sheet_id,row_index,col_index' })
      .select('*');
  }

  if (response.error) throw response.error;
  return response.data || [];
}

export function subscribeToPlaygroundChanges({ workbookId, sheets = [], onCellChange, onSheetChange, onWorkbookChange }) {
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

  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.warn('No se pudo conectar realtime del playground. Revisa Realtime en Supabase.');
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

export async function getProductsForPlayground() {
  const { data, error } = await supabase
    .from('productos')
    .select('id, codigo, nombre, descripcion, precio, precio_compra, cantidad_caja, unidad, categoria, imagen')
    .eq('habilitado', true)
    .order('nombre', { ascending: true })
    .range(0, 9999);

  if (error) throw error;
  return data || [];
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
