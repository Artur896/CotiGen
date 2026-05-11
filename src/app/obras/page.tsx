'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useObras } from '@/lib/store/useObras';
import { useLists } from '@/lib/store/useLists';
import { useAuth } from '@/lib/auth/AuthContext';
import { Obra } from '@/lib/types/material';
import { BottomNav } from '@/components/BottomNav';
import { InlineLoader } from '@/components/LoadingScreen';
import { HardHat, Plus, Trash2, ChevronRight, LogOut, X, CheckCircle2, Users } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';

function ObraCard({
  obra,
  getObraStats,
  onOpen,
  onDelete,
  shared = false,
}: {
  obra: Obra;
  getObraStats: (id: string) => { listCount: number; totalItems: number; doneItems: number };
  onOpen: () => void;
  onDelete?: () => void;
  shared?: boolean;
}) {
  const { listCount, totalItems, doneItems } = getObraStats(obra.id);
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const allDone = totalItems > 0 && doneItems === totalItems;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button
        onClick={onOpen}
        className="w-full flex items-center px-4 py-4 gap-3 text-left btn-press active:bg-slate-50"
      >
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
          allDone ? 'bg-emerald-100' : shared ? 'bg-violet-50' : 'bg-slate-100'
        }`}>
          {allDone
            ? <CheckCircle2 size={22} className="text-emerald-600" />
            : shared
              ? <Users size={20} className="text-violet-500" />
              : <HardHat size={22} className="text-slate-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{obra.nombre}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {shared && obra.ownerNombre && (
              <span className="text-violet-500 font-semibold">{obra.ownerNombre} · </span>
            )}
            {listCount} lista{listCount !== 1 ? 's' : ''}
            {totalItems > 0 && (
              <span className={`ml-2 font-semibold ${allDone ? 'text-emerald-600' : 'text-amber-500'}`}>
                · {doneItems}/{totalItems} materiales
              </span>
            )}
          </p>
          {totalItems > 0 && (
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${allDone ? 'bg-emerald-500' : 'bg-amber-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
        <ChevronRight size={18} className="text-slate-300 shrink-0" />
      </button>

      {!shared && onDelete && (
        <div className="flex border-t border-slate-50">
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-400 active:bg-red-50 btn-press"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

export default function ObrasPage() {
  const router = useRouter();
  const { obras, ready: obrasReady, create, remove } = useObras();
  const { lists, ready: listsReady } = useLists();
  const { user, signOut } = useAuth();
  const { success } = useToast();

  const [showNewObra, setShowNewObra] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Obra | null>(null);

  const ownObras = obras.filter((o) => !o.esCompartida);
  const sharedObras = obras.filter((o) => o.esCompartida);

  const ready = obrasReady && listsReady;

  const handleCreate = async () => {
    if (!newNombre.trim()) return;
    setSaving(true);
    const obra = await create(newNombre);
    setSaving(false);
    if (obra) {
      setNewNombre('');
      setShowNewObra(false);
      router.push(`/obras/${obra.id}`);
    }
  };

  const getObraStats = (obraId: string) => {
    const obraLists = lists.filter((l) => l.obraId === obraId);
    const totalItems = obraLists.reduce((s, l) => s + l.items.length, 0);
    const doneItems = obraLists.reduce(
      (s, l) => s + l.items.filter((i) => l.revision[i.lineId]).length,
      0
    );
    return { listCount: obraLists.length, totalItems, doneItems };
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <HardHat size={20} className="text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 leading-tight">Mis Obras</p>
            {user && <p className="text-xs text-slate-400 truncate">{user.nombre}</p>}
          </div>
          {obras.length > 0 && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full">
              {obras.length}
            </span>
          )}
          <button
            onClick={() => signOut()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 active:bg-slate-100 btn-press"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* List */}
      <main className="flex-1 px-4 pb-nav pt-4">
        {!ready ? (
          <InlineLoader />
        ) : obras.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
              <HardHat size={36} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-700 text-lg">Sin obras aún</p>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              Crea tu primera obra para organizar tus listas
            </p>
            <button
              onClick={() => setShowNewObra(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold btn-press"
            >
              <Plus size={18} /> Nueva Obra
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {ownObras.length > 0 && (
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
                Mis obras ({ownObras.length})
              </p>
            )}
            {ownObras.map((obra) => <ObraCard key={obra.id} obra={obra} getObraStats={getObraStats} onOpen={() => router.push(`/obras/${obra.id}`)} onDelete={() => setDeleteTarget(obra)} />)}

            {sharedObras.length > 0 && (
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1 mt-4">
                Compartidas conmigo ({sharedObras.length})
              </p>
            )}
            {sharedObras.map((obra) => <ObraCard key={obra.id} obra={obra} getObraStats={getObraStats} onOpen={() => router.push(`/obras/${obra.id}`)} shared />)}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowNewObra(true)}
        className="fixed right-5 z-20 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-200 flex items-center justify-center btn-press"
        style={{ bottom: 'calc(3.75rem + env(safe-area-inset-bottom) + 1rem)' }}
      >
        <Plus size={26} />
      </button>

      {/* Nueva obra sheet */}
      {showNewObra && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowNewObra(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-slate-900 text-lg">Nueva obra</p>
              <button onClick={() => setShowNewObra(false)} className="text-slate-400 btn-press p-1">
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Ej. Casa Hernández, Cabaña Sierra..."
              className="input w-full mb-4"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!newNombre.trim() || saving}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-emerald-600 active:bg-emerald-700 btn-press disabled:opacity-50"
            >
              {saving ? 'Creando...' : 'Crear obra'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <p className="font-bold text-slate-900 text-lg mb-1">Eliminar obra</p>
            <p className="text-slate-500 text-sm mb-6">
              ¿Eliminar <span className="font-bold text-slate-700">{deleteTarget.nombre}</span>?
              {' '}Las listas no se eliminan, solo se desvinculan.
            </p>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  await remove(deleteTarget.id);
                  setDeleteTarget(null);
                  success('Obra eliminada');
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

      <BottomNav />
    </div>
  );
}
