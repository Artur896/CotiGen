'use client';

import { useState } from 'react';
import { useCatalog } from '@/lib/store/useCatalog';
import { CatalogItem } from '@/lib/types/material';
import { BottomNav } from '@/components/BottomNav';
import { BookOpen, Plus, Pencil, Trash2, X, Search } from 'lucide-react';

const UNIDADES = ['pieza', 'metro', 'litro', 'kg', 'rollo', 'caja', 'par', 'juego', 'servicio', 'hora'];

type FormState = { nombre: string; unidad: string; categoria: string };
const EMPTY: FormState = { nombre: '', unidad: 'pieza', categoria: '' };

export default function CatalogoPage() {
  const { items, ready, add, update, remove } = useCatalog();
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<'none' | 'add' | 'delete'>('none');
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setSheet('add'); };
  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    setForm({ nombre: item.nombre, unidad: item.unidad, categoria: item.categoria });
    setError('');
    setSheet('add');
  };
  const closeSheet = () => { setSheet('none'); setEditing(null); setError(''); };

  const handleSave = () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (editing) {
      update(editing.id, { nombre: form.nombre.trim(), unidad: form.unidad, categoria: form.categoria.trim() });
    } else {
      add({ nombre: form.nombre.trim(), unidad: form.unidad, categoria: form.categoria.trim() });
    }
    closeSheet();
  };

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return i.nombre.toLowerCase().includes(q) || i.categoria.toLowerCase().includes(q);
  });

  const grouped = filtered.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    const cat = item.categoria || 'Sin categoría';
    (acc[cat] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <BookOpen size={20} className="text-amber-500 shrink-0" />
          <span className="font-bold text-slate-900 flex-1">Catálogo</span>
          {items.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full">
              {items.length}
            </span>
          )}
        </div>
      </header>

      {/* Search */}
      <div className="px-4 pt-4 pb-2 sticky top-14 z-10 bg-slate-50">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar material..."
            className="input pl-10 pr-10 py-2.5"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 btn-press p-1">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <main className="flex-1 px-4 pt-2 pb-nav">
        {!ready ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
              <BookOpen size={36} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-700 text-lg">
              {search ? 'Sin resultados' : 'Catálogo vacío'}
            </p>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              {search ? 'Prueba con otro nombre' : 'Agrega los materiales que usas frecuentemente'}
            </p>
            {!search && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold btn-press"
              >
                <Plus size={18} /> Agregar Material
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([cat, catItems]) => (
                <div key={cat}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{cat}</p>
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                    {catItems.map((item) => (
                      <div key={item.id} className="flex items-center px-4 py-3.5 gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{item.nombre}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.unidad}</p>
                        </div>
                        <button
                          onClick={() => openEdit(item)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 active:bg-indigo-50 active:text-indigo-600 btn-press"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(item); setSheet('delete'); }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 active:bg-red-50 active:text-red-500 btn-press"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={openCreate}
        className="fixed right-5 z-20 w-14 h-14 bg-amber-500 text-white rounded-full shadow-xl shadow-amber-200 flex items-center justify-center btn-press"
        style={{ bottom: 'calc(3.75rem + env(safe-area-inset-bottom) + 1rem)' }}
      >
        <Plus size={26} />
      </button>

      {/* Add / Edit Sheet */}
      {sheet === 'add' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={closeSheet}>
          <div
            className="bg-white w-full rounded-t-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-5" />
            <div className="px-5 pb-6 space-y-4">
              <h2 className="font-bold text-xl text-slate-900">
                {editing ? 'Editar material' : 'Nuevo material'}
              </h2>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
              )}

              <label className="block">
                <span className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Nombre *</span>
                <input
                  autoFocus
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder='Ej. Tubo PVC 1/2"'
                  className="input"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Unidad</span>
                  <select
                    value={form.unidad}
                    onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                    className="input"
                  >
                    {UNIDADES.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Categoría</span>
                  <input
                    type="text"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    placeholder="Ej. Plomería"
                    className="input"
                  />
                </label>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSave}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-amber-500 active:bg-amber-600 btn-press"
                >
                  {editing ? 'Guardar cambios' : 'Agregar al catálogo'}
                </button>
                <button
                  onClick={closeSheet}
                  className="w-full py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 active:bg-slate-200 btn-press"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete sheet */}
      {sheet === 'delete' && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setSheet('none')}>
          <div className="bg-white w-full rounded-t-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <p className="font-bold text-slate-900 text-lg mb-1">Eliminar material</p>
            <p className="text-slate-500 text-sm mb-6">
              ¿Eliminar <span className="font-bold text-slate-700">{deleteTarget.nombre}</span> del catálogo?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => { remove(deleteTarget.id); setSheet('none'); }}
                className="w-full py-4 rounded-2xl font-bold text-white bg-red-500 active:bg-red-600 btn-press"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setSheet('none')}
                className="w-full py-4 rounded-2xl font-bold text-slate-700 bg-slate-100 active:bg-slate-200 btn-press"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
