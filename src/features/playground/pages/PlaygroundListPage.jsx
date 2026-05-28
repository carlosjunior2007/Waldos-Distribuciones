import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Globe2, Loader2, Plus, Trash2 } from 'lucide-react';
import PlaygroundCreateModal from '../components/PlaygroundCreateModal';
import PlaygroundConfirmModal from '../components/PlaygroundConfirmModal';
import { createPlayground, deletePlayground, getPlaygrounds } from '../services/playground.service';

export default function PlaygroundListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      setItems(await getPlaygrounds());
    } catch (loadError) {
      console.error('Error cargando playgrounds:', loadError);
      setError('No se pudieron cargar los playgrounds.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(payload) {
    setCreating(true);
    setError('');

    try {
      const created = await createPlayground(payload);
      setCreateOpen(false);
      await load();
      navigate(`/dashboard/playground/${created.id}`);
    } catch (createError) {
      console.error('Error creando playground:', createError);
      setError('No se pudo crear el playground. Revisa la conexión o permisos de Supabase.');
    } finally {
      setCreating(false);
    }
  }


  function handleDelete(event, item) {
    event.preventDefault();
    event.stopPropagation();
    setItemToDelete(item);
  }

  async function confirmDeletePlayground() {
    if (!itemToDelete?.id) return;

    setDeletingId(itemToDelete.id);
    setError('');

    try {
      await deletePlayground(itemToDelete.id);
      setItems((prev) => prev.filter((playground) => playground.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (deleteError) {
      console.error('Error eliminando playground:', deleteError);
      setError('No se pudo eliminar el playground. Revisa permisos de Supabase.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <PlaygroundConfirmModal
        open={Boolean(itemToDelete)}
        title="Eliminar playground"
        message="Esta acción no se puede deshacer. Se eliminará el playground completo."
        itemName={itemToDelete?.name}
        loading={deletingId === itemToDelete?.id}
        confirmText="Sí, eliminar playground"
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDeletePlayground}
      />
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-600">Privado</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Playgrounds</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Hojas internas para cálculos, pruebas, revisión de productos y preparación de cambios masivos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-70"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Nuevo playground
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-600" />
            <p className="mt-3 text-sm font-bold text-slate-600">Cargando...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-950">No hay playgrounds todavía</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Crea el primero para cargar productos, hacer cálculos y compartir una hoja pública si la necesitas.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />
              Crear playground
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/dashboard/playground/${item.id}`}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>

                  <div className="flex items-center gap-2">
                    {item.is_public ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        <Globe2 className="h-3.5 w-3.5" />
                        Público
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        Privado
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(event) => handleDelete(event, item)}
                      disabled={deletingId === item.id || item.is_owner === false}
                      title={item.is_owner === false ? "Solo el creador puede eliminar" : "Eliminar playground"}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <h2 className="mt-5 text-lg font-black text-slate-950">{item.name}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.description || 'Sin descripción.'}</p>
                <p className="mt-4 text-xs font-bold text-slate-500">
                  Creado por: <span className="text-slate-800">{item.creator_label || 'Sin dato'}</span>
                </p>
                <p className="mt-2 text-xs font-bold text-slate-400">
                  Actualizado: {item.updated_at ? new Date(item.updated_at).toLocaleString('es-MX') : '-'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <PlaygroundCreateModal
        open={createOpen}
        creating={creating}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
