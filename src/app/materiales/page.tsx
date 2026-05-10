'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLists } from '@/lib/store/useLists';
import { MaterialList } from '@/lib/types/material';
import { BottomNav } from '@/components/BottomNav';
import { Package, Plus, Pencil, Trash2, Search, X, ChevronRight, LogOut, ClipboardCheck } from 'lucide-react';
import { InlineLoader } from '@/components/LoadingScreen';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/components/shared/Toast';

const CATEGORIAS = [
  { key: 'CPVC',           label: 'CPVC',            desc: 'Agua caliente y fría',        bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500'    },
  { key: 'PVC Sanitario',  label: 'PVC Sanitario',   desc: 'Drenaje y desagüe',           bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500'  },
  { key: 'PVC Hidráulico', label: 'PVC Hidráulico',  desc: 'Agua a presión',              bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-700',   dot: 'bg-cyan-500'   },
  { key: 'Cobre',          label: 'Cobre',            desc: 'Instalaciones de cobre',      bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  { key: 'Tuboplus',       label: 'Tuboplus',         desc: 'PVC para presión',            bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  { key: 'General',        label: 'General',          desc: 'Todas las categorías',        bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-700',  dot: 'bg-slate-500'  },
];

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function MaterialesPage() {
  const router = useRouter();
  const { lists, ready, remove } = useLists();
  const { user, signOut } = useAuth();
  const { success } = useToast();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MaterialList | null>(null);
  const [showCatPicker, setShowCatPicker] = useState(false);

  const filtered = lists
    .filter((l) => {
      const q = search.toLowerCase();
      return l.cliente.toLowerCase().includes(q) || String(l.numero).includes(q);
    })
    .sort((a, b) => b.numero - a.numero);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <Package size={20} className="text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 leading-tight">Mis Listas</p>
            {user && <p className="text-xs text-slate-400 truncate">{user.nombre}</p>}
          </div>
          {lists.length > 0 && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full">
              {lists.length}
            </span>
          )}
          <button
            onClick={() => signOut()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 active:bg-slate-100 btn-press"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 pt-4 pb-2 bg-slate-50 sticky top-14 z-10">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente..."
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
      <main className="flex-1 px-4 pb-nav pt-2">
        {!ready ? (
          <InlineLoader />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
              <Package size={36} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-700 text-lg">
              {search ? 'Sin resultados' : 'Sin listas aún'}
            </p>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              {search ? 'Intenta con otro nombre' : 'Crea tu primera lista de materiales'}
            </p>
            {!search && (
              <button
                onClick={() => setShowCatPicker(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold btn-press"
              >
                <Plus size={18} /> Nueva Lista
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
              >
                <button
                  onClick={() => router.push(`/materiales/${l.id}`)}
                  className="w-full flex items-center px-4 py-4 gap-3 text-left btn-press active:bg-slate-50"
                >
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-emerald-600">
                      #{String(l.numero).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {l.nombre?.trim() || `Lista #${String(l.numero).padStart(2, '0')}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {l.items.length} material{l.items.length !== 1 ? 'es' : ''} · {formatDate(l.fecha)}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 shrink-0" />
                </button>

                {/* Swipe-like actions */}
                <div className="flex border-t border-slate-50">
                  <button
                    onClick={() => router.push(`/materiales/${l.id}/revision`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-emerald-500 active:bg-emerald-50 btn-press"
                  >
                    <ClipboardCheck size={14} /> Revisar
                  </button>
                  <div className="w-px bg-slate-50" />
                  <button
                    onClick={() => router.push(`/materiales/${l.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-indigo-500 active:bg-indigo-50 btn-press"
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <div className="w-px bg-slate-50" />
                  <button
                    onClick={() => setDeleteTarget(l)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-400 active:bg-red-50 btn-press"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowCatPicker(true)}
        className="fixed right-5 z-20 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-200 flex items-center justify-center btn-press"
        style={{ bottom: 'calc(3.75rem + env(safe-area-inset-bottom) + 1rem)' }}
      >
        <Plus size={26} />
      </button>

      {/* Delete confirm sheet */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Handle */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <p className="font-bold text-slate-900 text-lg mb-1">Eliminar lista</p>
            <p className="text-slate-500 text-sm mb-6">
              ¿Eliminar la lista de{' '}
              <span className="font-bold text-slate-700">{deleteTarget.cliente}</span>?
              {' '}Esta acción no se puede deshacer.
            </p>
            <div className="space-y-2">
              <button
                onClick={async () => { 
                  await remove(deleteTarget.id); 
                  setDeleteTarget(null); 
                  success('Se eliminó correctamente');
                }}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-red-500 active:bg-red-600 btn-press"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="w-full py-4 rounded-2xl text-sm font-bold text-slate-700 bg-slate-100 active:bg-slate-200 btn-press"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category picker sheet */}
      {showCatPicker && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-5"
          onClick={() => setShowCatPicker(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-extrabold text-slate-900 text-center">¿Qué tipo de lista necesitas?</h2>
            <p className="text-sm text-slate-400 mt-1 mb-5 text-center">Selecciona una categoría</p>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORIAS.map(({ key, label, desc, bg, border, text, dot }) => (
                <button
                  key={key}
                  onClick={() => {
                    setShowCatPicker(false);
                    router.push(`/materiales/nueva?cat=${encodeURIComponent(key)}`);
                  }}
                  className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 ${bg} ${border} btn-press text-left`}
                >
                  <span className={`w-3 h-3 rounded-full ${dot}`} />
                  <div>
                    <p className={`font-bold text-sm ${text}`}>{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
