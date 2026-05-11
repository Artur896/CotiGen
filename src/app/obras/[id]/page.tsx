'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useObras } from '@/lib/store/useObras';
import { useLists } from '@/lib/store/useLists';
import { useColaboradores } from '@/lib/store/useColaboradores';
import { useAmigos } from '@/lib/store/useAmigos';
import { useAuth } from '@/lib/auth/AuthContext';
import { MaterialList } from '@/lib/types/material';
import { Colaborador } from '@/lib/types/social';
import { BottomNav } from '@/components/BottomNav';
import { InlineLoader } from '@/components/LoadingScreen';
import { useToast } from '@/components/shared/Toast';
import {
  ArrowLeft, Plus, Pencil, Trash2, ClipboardCheck, ChevronRight,
  Package, CheckCircle2, Circle, Users, UserPlus, X, UserMinus,
} from 'lucide-react';

const CATEGORIAS = [
  { key: 'CPVC',           label: 'CPVC',           desc: 'Agua caliente y fría',   dot: 'bg-red-500'    },
  { key: 'PVC Sanitario',  label: 'PVC Sanitario',  desc: 'Drenaje y desagüe',      dot: 'bg-green-500'  },
  { key: 'PVC Hidráulico', label: 'PVC Hidráulico', desc: 'Agua a presión',         dot: 'bg-cyan-500'   },
  { key: 'Cobre',          label: 'Cobre',           desc: 'Instalaciones de cobre', dot: 'bg-orange-500' },
  { key: 'Tuboplus',       label: 'Tuboplus',        desc: 'PVC para presión',       dot: 'bg-blue-500'   },
  { key: 'General',        label: 'General',         desc: 'Todas las categorías',   dot: 'bg-slate-500'  },
];

type PageParams = { id: string };

export default function ObraDetailPage({ params }: { params: Promise<PageParams> }) {
  const { id: obraId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { obras, ready: obrasReady, rename } = useObras();
  const { lists, ready: listsReady, remove } = useLists();
  const { colaboradores, ready: colabReady, add: addColaborador, remove: removeColaborador } = useColaboradores(obraId);
  const { amigos } = useAmigos();
  const { success, error: showError } = useToast();

  const [showCatPicker, setShowCatPicker] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MaterialList | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAddColab, setShowAddColab] = useState(false);
  const [removeColabTarget, setRemoveColabTarget] = useState<Colaborador | null>(null);

  const ready = obrasReady && listsReady;
  const obra = obras.find((o) => o.id === obraId);
  const isOwner = obra ? !obra.esCompartida : false;

  const colabIds = new Set(colaboradores.map((c) => c.colaboradorId));
  const availableAmigos = amigos.filter((a) => !colabIds.has(a.amigoId) && a.amigoId !== user?.id);

  const colabDisplayName = (c: Colaborador) =>
    c.alias || c.profile?.nombre || 'Colaborador';
  const obraLists = lists
    .filter((l) => l.obraId === obraId)
    .sort((a, b) => b.numero - a.numero);

  const totalItems = obraLists.reduce((s, l) => s + l.items.length, 0);
  const doneItems = obraLists.reduce(
    (s, l) => s + l.items.filter((i) => l.revision[i.lineId]).length,
    0
  );
  const globalPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const globalDone = totalItems > 0 && doneItems === totalItems;

  const startRename = () => {
    setNewName(obra?.nombre ?? '');
    setEditingName(true);
  };

  const handleRename = async () => {
    if (!newName.trim() || !obra) return;
    await rename(obraId, newName);
    setEditingName(false);
    success('Obra actualizada');
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-100 h-14" />
        <InlineLoader />
        <BottomNav />
      </div>
    );
  }

  if (!obra) {
    router.replace('/obras');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="px-3 h-14 flex items-center gap-2">
          <button
            onClick={() => router.push('/obras')}
            className="w-9 h-9 flex items-center justify-center text-slate-400 btn-press rounded-xl active:bg-slate-100 shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="font-bold text-slate-900 text-sm bg-transparent border-b border-emerald-400 outline-none w-full"
                autoFocus
              />
            ) : (
              <p className="font-bold text-slate-900 text-sm truncate">{obra.nombre}</p>
            )}
            <p className="text-xs text-slate-400">
              {obraLists.length} lista{obraLists.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={startRename}
            className="w-9 h-9 flex items-center justify-center text-slate-400 btn-press rounded-xl active:bg-slate-100 shrink-0"
          >
            <Pencil size={16} />
          </button>
        </div>

        {/* Global progress */}
        {totalItems > 0 && (
          <div className="px-4 pb-3 pt-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-semibold">
                {globalDone ? '¡Todo listo!' : 'Progreso general'}
              </span>
              <span className={`text-xs font-bold ${globalDone ? 'text-emerald-600' : 'text-amber-500'}`}>
                {doneItems}/{totalItems} materiales ({globalPct}%)
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${globalDone ? 'bg-emerald-500' : 'bg-amber-400'}`}
                style={{ width: `${globalPct}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Lists */}
      <main className="flex-1 px-4 pb-nav pt-4">
        {obraLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
              <Package size={36} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-700 text-lg">Sin listas</p>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              Agrega la primera lista de materiales a esta obra
            </p>
            <button
              onClick={() => setShowCatPicker(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold btn-press"
            >
              <Plus size={18} /> Nueva Lista
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {obraLists.map((l) => {
              const total = l.items.length;
              const done = l.items.filter((i) => l.revision[i.lineId]).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const allDone = total > 0 && done === total;
              const started = done > 0;

              return (
                <div
                  key={l.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                >
                  <button
                    onClick={() => router.push(`/materiales/${l.id}?obra_id=${obraId}`)}
                    className="w-full flex items-center px-4 py-4 gap-3 text-left btn-press active:bg-slate-50"
                  >
                    {/* Status icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      allDone ? 'bg-emerald-100' : started ? 'bg-amber-50' : 'bg-slate-100'
                    }`}>
                      {allDone ? (
                        <CheckCircle2 size={20} className="text-emerald-600" />
                      ) : started ? (
                        <Circle size={20} className="text-amber-400" />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          #{String(l.numero).padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {l.nombre?.trim() || `Lista #${String(l.numero).padStart(2, '0')}`}
                      </p>

                      {/* Checklist progress */}
                      {total > 0 ? (
                        <>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  allDone ? 'bg-emerald-500' : 'bg-amber-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold shrink-0 ${
                              allDone ? 'text-emerald-600' : started ? 'text-amber-500' : 'text-slate-400'
                            }`}>
                              {done}/{total}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {allDone ? 'Completa ✓' : started ? 'En progreso' : 'Sin revisar'}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">Sin materiales</p>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-slate-300 shrink-0" />
                  </button>

                  {/* Actions */}
                  <div className="flex border-t border-slate-50">
                    <button
                      onClick={() => router.push(`/materiales/${l.id}/revision`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-emerald-500 active:bg-emerald-50 btn-press"
                    >
                      <ClipboardCheck size={14} /> Revisar
                    </button>
                    <div className="w-px bg-slate-50" />
                    <button
                      onClick={() => router.push(`/materiales/${l.id}?obra_id=${obraId}`)}
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
              );
            })}
          </div>
        )}

        {/* Colaboradores section (only visible to owner) */}
        {isOwner && colabReady && (
          <div className="mt-6 mb-2">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Users size={14} className="text-violet-600" />
                  </div>
                  <p className="font-bold text-slate-800 text-sm">Colaboradores</p>
                  {colaboradores.length > 0 && (
                    <span className="text-xs bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded-full">
                      {colaboradores.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAddColab(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 px-3 py-1.5 rounded-xl btn-press active:bg-violet-700"
                >
                  <UserPlus size={13} /> Agregar
                </button>
              </div>

              {/* Body */}
              {colaboradores.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Users size={22} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">Sin colaboradores</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Agrega amigos para que puedan ver y trabajar en esta obra
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {colaboradores.map((c) => {
                    const name = colabDisplayName(c);
                    const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{name}</p>
                          {c.alias && (
                            <p className="text-xs text-slate-400 truncate">{c.profile?.nombre}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setRemoveColabTarget(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 active:bg-red-50 active:text-red-400 btn-press"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

      {/* Category picker */}
      {showCatPicker && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-5"
          onClick={() => setShowCatPicker(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-extrabold text-slate-900 text-center">¿Qué tipo de lista?</h2>
            <p className="text-sm text-slate-400 mt-1 mb-5 text-center">Selecciona una categoría</p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIAS.map(({ key, label, desc, dot }) => (
                <button
                  key={key}
                  onClick={() => {
                    setShowCatPicker(false);
                    router.push(
                      `/materiales/nueva?cat=${encodeURIComponent(key)}&obra_id=${obraId}`
                    );
                  }}
                  className="flex flex-col items-start gap-2 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 btn-press text-left active:border-emerald-200 active:bg-emerald-50"
                >
                  <span className={`w-3 h-3 rounded-full ${dot}`} />
                  <div>
                    <p className="font-bold text-sm text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete list confirm */}
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
            <p className="font-bold text-slate-900 text-lg mb-1">Eliminar lista</p>
            <p className="text-slate-500 text-sm mb-6">
              ¿Eliminar{' '}
              <span className="font-bold text-slate-700">
                {deleteTarget.nombre || `Lista #${String(deleteTarget.numero).padStart(2, '0')}`}
              </span>?
              {' '}Esta acción no se puede deshacer.
            </p>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  await remove(deleteTarget.id);
                  setDeleteTarget(null);
                  success('Lista eliminada');
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

      {/* Add colaborador sheet */}
      {showAddColab && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setShowAddColab(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 shadow-2xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4 shrink-0">
              <p className="font-bold text-slate-900 text-lg">Agregar colaborador</p>
              <button onClick={() => setShowAddColab(false)} className="text-slate-400 btn-press p-1">
                <X size={20} />
              </button>
            </div>
            {availableAmigos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center gap-3">
                <Users size={32} className="text-slate-300" />
                <p className="text-slate-500 font-semibold text-sm">
                  {amigos.length === 0
                    ? 'No tienes amigos aún'
                    : 'Todos tus amigos ya son colaboradores'}
                </p>
                {amigos.length === 0 && (
                  <button
                    onClick={() => { setShowAddColab(false); router.push('/amigos'); }}
                    className="text-sm font-bold text-violet-600 btn-press"
                  >
                    Ir a Amigos →
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-2 -mx-1 px-1">
                {availableAmigos.map((a) => {
                  const name = a.alias || a.profile?.nombre || 'Usuario';
                  return (
                    <button
                      key={a.amigoId}
                      onClick={async () => {
                        const { error: err } = await addColaborador(a.amigoId);
                        if (err) showError(err);
                        else { success(`${name} agregado`); setShowAddColab(false); }
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-50 active:bg-violet-50 btn-press"
                    >
                      <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-bold text-slate-900 text-sm">{name}</p>
                        {a.alias && <p className="text-xs text-slate-400 truncate">{a.profile?.nombre}</p>}
                      </div>
                      <UserPlus size={16} className="text-violet-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remove colaborador confirm */}
      {removeColabTarget && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setRemoveColabTarget(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
              <UserMinus size={22} className="text-red-500" />
            </div>
            <p className="font-bold text-slate-900 text-lg mb-1">Quitar colaborador</p>
            <p className="text-slate-500 text-sm mb-6">
              ¿Quitar a <span className="font-bold text-slate-700">{colabDisplayName(removeColabTarget)}</span> de esta obra?
              Ya no podrá verla.
            </p>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  await removeColaborador(removeColabTarget.colaboradorId);
                  setRemoveColabTarget(null);
                  success('Colaborador removido');
                }}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-red-500 active:bg-red-600 btn-press"
              >
                Sí, quitar
              </button>
              <button
                onClick={() => setRemoveColabTarget(null)}
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
