'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAmigos } from '@/lib/store/useAmigos';
import { Amigo, Profile } from '@/lib/types/social';
import { supabase } from '@/lib/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { QRScanner } from '@/components/QRScanner';
import { InlineLoader } from '@/components/LoadingScreen';
import { useToast } from '@/components/shared/Toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users, QrCode, X, UserCheck, UserX, Pencil, Trash2, Copy, Check,
  Bell, ChevronRight, ScanLine, UserPlus, Loader2,
} from 'lucide-react';

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function AmigoAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-11 h-11 text-base' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} rounded-2xl bg-violet-100 text-violet-700 font-bold flex items-center justify-center shrink-0`}>
      {initials(name)}
    </div>
  );
}

export default function AmigosPage() {
  const { user } = useAuth();
  const { amigos, pendingIncoming, ready, accept, reject, remove, updateAlias, sendRequest } = useAmigos();
  const { success, error: showError, info } = useToast();

  // QR modal (my own QR)
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  // Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{ profile: Profile; uid: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [aliasForScan, setAliasForScan] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  // Amigo detail sheet
  const [selectedAmigo, setSelectedAmigo] = useState<Amigo | null>(null);
  const [aliasInput, setAliasInput] = useState('');
  const [editingAlias, setEditingAlias] = useState(false);
  const [savingAlias, setSavingAlias] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Amigo | null>(null);

  const addLink = typeof window !== 'undefined' ? `${window.location.origin}/agregar?uid=${user?.id}` : '';

  /* ---- QR scan handler ---- */
  const handleScanResult = useCallback(async (text: string) => {
    setShowScanner(false);

    // Parse the uid from the scanned URL
    let uid: string | null = null;
    try {
      const url = new URL(text);
      uid = url.searchParams.get('uid');
    } catch {
      showError('El código QR no es válido');
      return;
    }

    if (!uid) { showError('El código QR no es válido'); return; }
    if (uid === user?.id) { info('Este es tu propio código QR'); return; }

    const alreadyFriend = amigos.some((a) => a.amigoId === uid);
    if (alreadyFriend) { info('Ya son amigos'); return; }

    setLoadingProfile(true);
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, nombre, email')
      .eq('id', uid)
      .single();
    setLoadingProfile(false);

    if (!profile) { showError('Usuario no encontrado'); return; }

    setScanResult({ profile, uid });
    setAliasForScan('');
  }, [user, amigos, showError, info]);

  const handleSendFromScan = async () => {
    if (!scanResult) return;
    setSendingRequest(true);
    const { error: err } = await sendRequest(scanResult.uid, aliasForScan);
    setSendingRequest(false);
    if (err) { showError(err); return; }
    setScanResult(null);
    success(`Solicitud enviada a ${scanResult.profile.nombre}`);
  };

  /* ---- Copy link ---- */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(addLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    info('Enlace copiado');
  };

  /* ---- Accept / Reject ---- */
  const handleAccept = async (a: Amigo) => {
    const { error: err } = await accept(a.id, a.userId);
    if (err) showError(err);
    else success(`${a.profile?.nombre ?? 'Usuario'} agregado`);
  };

  const handleReject = async (a: Amigo) => {
    await reject(a.id);
    info('Solicitud rechazada');
  };

  /* ---- Amigo sheet ---- */
  const openAmigoSheet = (a: Amigo) => {
    setSelectedAmigo(a);
    setAliasInput(a.alias ?? '');
    setEditingAlias(false);
  };

  const handleSaveAlias = async () => {
    if (!selectedAmigo) return;
    setSavingAlias(true);
    await updateAlias(selectedAmigo.amigoId, aliasInput);
    setSavingAlias(false);
    setEditingAlias(false);
    setSelectedAmigo((prev) => prev ? { ...prev, alias: aliasInput.trim() || null } : null);
    success('Alias actualizado');
  };

  const handleRemove = async () => {
    if (!confirmDelete) return;
    await remove(confirmDelete.amigoId);
    setConfirmDelete(null);
    setSelectedAmigo(null);
    success('Amigo eliminado');
  };

  const displayName = (a: Amigo) => a.alias || a.profile?.nombre || 'Usuario';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center gap-2">
          <Users size={20} className="text-violet-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 leading-tight">Amigos</p>
            {user && <p className="text-xs text-slate-400 truncate">{user.nombre}</p>}
          </div>
          {pendingIncoming.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {pendingIncoming.length}
            </span>
          )}
          {/* Scan button */}
          <button
            onClick={() => setShowScanner(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 active:bg-slate-100 btn-press"
            title="Escanear QR"
          >
            <ScanLine size={20} />
          </button>
          {/* My QR button */}
          <button
            onClick={() => setShowQR(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 active:bg-slate-100 btn-press"
            title="Mi código QR"
          >
            <QrCode size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-nav pt-4 space-y-5">
        {!ready ? (
          <InlineLoader />
        ) : (
          <>
            {/* Solicitudes pendientes */}
            {pendingIncoming.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Bell size={14} className="text-amber-500" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Solicitudes ({pendingIncoming.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {pendingIncoming.map((a) => (
                    <div key={a.id} className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3">
                      <AmigoAvatar name={a.profile?.nombre ?? 'U'} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{a.profile?.nombre ?? 'Usuario'}</p>
                        <p className="text-xs text-slate-400 truncate">{a.profile?.email}</p>
                      </div>
                      <button onClick={() => handleReject(a)} className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400 active:bg-red-50 btn-press">
                        <UserX size={18} />
                      </button>
                      <button onClick={() => handleAccept(a)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-violet-100 text-violet-700 active:bg-violet-200 btn-press">
                        <UserCheck size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Lista de amigos */}
            <section>
              {amigos.length > 0 && (
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 px-1">
                  Mis amigos ({amigos.length})
                </p>
              )}
              {amigos.length === 0 && pendingIncoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                    <Users size={36} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-700 text-lg">Sin amigos aún</p>
                  <p className="text-slate-400 text-sm mt-1 mb-6 max-w-xs">
                    Escanea el QR de alguien o comparte el tuyo
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowScanner(true)}
                      className="flex items-center gap-2 bg-violet-600 text-white px-5 py-3 rounded-2xl font-bold btn-press text-sm"
                    >
                      <ScanLine size={16} /> Escanear
                    </button>
                    <button
                      onClick={() => setShowQR(true)}
                      className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-bold btn-press text-sm"
                    >
                      <QrCode size={16} /> Mi QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {amigos.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => openAmigoSheet(a)}
                      className="w-full bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3 text-left btn-press active:bg-slate-50"
                    >
                      <AmigoAvatar name={displayName(a)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{displayName(a)}</p>
                        {a.alias && (
                          <p className="text-xs text-slate-400 truncate">{a.profile?.nombre}</p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-slate-300 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* ── QR Scanner (fullscreen) ── */}
      {showScanner && (
        <QRScanner
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ── Loading profile after scan ── */}
      {loadingProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-6 py-5 flex items-center gap-3 shadow-xl">
            <Loader2 size={20} className="text-violet-600 animate-spin" />
            <p className="font-semibold text-slate-700">Buscando usuario...</p>
          </div>
        </div>
      )}

      {/* ── Add friend sheet (post-scan) ── */}
      {scanResult && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setScanResult(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

            {/* Profile */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-700 font-extrabold text-xl flex items-center justify-center shrink-0">
                {initials(scanResult.profile.nombre)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-slate-900 text-lg leading-tight">{scanResult.profile.nombre}</p>
                <p className="text-sm text-slate-400 truncate">{scanResult.profile.email}</p>
              </div>
              <button onClick={() => setScanResult(null)} className="text-slate-400 btn-press p-1 shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Alias */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                Alias (opcional)
              </label>
              <input
                type="text"
                value={aliasForScan}
                onChange={(e) => setAliasForScan(e.target.value)}
                placeholder={`Ej. "${scanResult.profile.nombre.split(' ')[0]}" o "Jefe"`}
                className="input w-full"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1.5">Así aparecerá en tu lista. Solo tú lo ves.</p>
            </div>

            <button
              onClick={handleSendFromScan}
              disabled={sendingRequest}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-violet-600 active:bg-violet-700 btn-press disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sendingRequest
                ? <Loader2 size={18} className="animate-spin" />
                : <UserPlus size={18} />
              }
              {sendingRequest ? 'Enviando...' : `Agregar a ${scanResult.profile.nombre.split(' ')[0]}`}
            </button>
          </div>
        </div>
      )}

      {/* ── My QR Modal ── */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold text-slate-900 text-lg">Mi código QR</p>
              <button onClick={() => setShowQR(false)} className="text-slate-400 btn-press p-1">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100">
                <QRCodeSVG value={addLink} size={200} bgColor="#ffffff" fgColor="#1e293b" level="M" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-900">{user?.nombre}</p>
                <p className="text-xs text-slate-400 mt-0.5">Escanea para agregarme como amigo</p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 w-full justify-center py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm btn-press active:bg-slate-200"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar enlace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Amigo detail sheet ── */}
      {selectedAmigo && !confirmDelete && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setSelectedAmigo(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-5">
              <AmigoAvatar name={displayName(selectedAmigo)} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">{displayName(selectedAmigo)}</p>
                <p className="text-xs text-slate-400 truncate">{selectedAmigo.profile?.nombre}</p>
              </div>
              <button onClick={() => setSelectedAmigo(null)} className="text-slate-400 btn-press p-1">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold text-slate-500 mb-2">ALIAS (como lo ves tú)</p>
              {editingAlias ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveAlias()}
                    placeholder={selectedAmigo.profile?.nombre ?? 'Alias...'}
                    className="input flex-1"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveAlias}
                    disabled={savingAlias}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold btn-press disabled:opacity-50"
                  >
                    {savingAlias ? '...' : 'Guardar'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingAlias(true)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 btn-press"
                >
                  <span className="text-sm text-slate-700">
                    {selectedAmigo.alias || <span className="text-slate-400 italic">Sin alias (usar nombre real)</span>}
                  </span>
                  <Pencil size={14} className="text-slate-400" />
                </button>
              )}
            </div>

            <button
              onClick={() => setConfirmDelete(selectedAmigo)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-red-500 bg-red-50 active:bg-red-100 btn-press"
            >
              <Trash2 size={16} /> Eliminar amigo
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <p className="font-bold text-slate-900 text-lg mb-1">Eliminar amigo</p>
            <p className="text-slate-500 text-sm mb-6">
              ¿Eliminar a <span className="font-bold text-slate-700">{displayName(confirmDelete)}</span> de tu lista?
              Esto lo removerá de tus obras compartidas también.
            </p>
            <div className="space-y-2">
              <button onClick={handleRemove} className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-red-500 active:bg-red-600 btn-press">
                Sí, eliminar
              </button>
              <button onClick={() => setConfirmDelete(null)} className="w-full py-4 rounded-2xl text-sm font-bold text-slate-700 bg-slate-100 active:bg-slate-200 btn-press">
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
