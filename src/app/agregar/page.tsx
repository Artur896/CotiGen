'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAmigos } from '@/lib/store/useAmigos';
import { useToast } from '@/components/shared/Toast';
import { Profile } from '@/lib/types/social';
import { UserPlus, UserCheck, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

function AgregarContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { sendRequest, amigos, ready: amigosReady } = useAmigos();
  const { success, error: showError } = useToast();

  const targetUid = searchParams.get('uid') ?? '';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alias, setAlias] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!targetUid) { setNotFound(true); setLoadingProfile(false); return; }
    supabase.from('profiles').select('id, nombre, email').eq('id', targetUid).single().then(({ data }) => {
      if (data) setProfile(data);
      else setNotFound(true);
      setLoadingProfile(false);
    });
  }, [targetUid]);

  const alreadyFriend = amigosReady && amigos.some((a) => a.amigoId === targetUid);
  const isSelf = user?.id === targetUid;

  const handleSend = async () => {
    if (!user) { router.push('/login'); return; }
    setSending(true);
    const { error: err } = await sendRequest(targetUid, alias);
    setSending(false);
    if (err) showError(err);
    else { setSent(true); success('Solicitud enviada'); }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="text-violet-500 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="font-bold text-slate-900 text-lg mb-1">Usuario no encontrado</p>
        <p className="text-slate-400 text-sm">El enlace puede ser inválido o estar desactualizado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center text-slate-400 btn-press rounded-xl active:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </button>
          <p className="font-bold text-slate-900">Agregar amigo</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <div className="w-full max-w-sm">
          {/* Profile card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col items-center gap-3 mb-6 shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-violet-100 text-violet-700 font-extrabold text-2xl flex items-center justify-center">
              {(profile!.nombre ?? 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="text-center">
              <p className="font-extrabold text-slate-900 text-xl">{profile!.nombre}</p>
              <p className="text-sm text-slate-400 mt-0.5">{profile!.email}</p>
            </div>
          </div>

          {isSelf ? (
            <div className="text-center py-4">
              <p className="text-slate-500 font-semibold">Este es tu propio enlace de invitación.</p>
              <p className="text-slate-400 text-sm mt-1">Compártelo con otras personas para que te agreguen.</p>
            </div>
          ) : alreadyFriend ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 py-4">
                <UserCheck size={22} className="text-emerald-600" />
                <p className="font-bold text-slateald-700">Ya son amigos</p>
              </div>
              <button onClick={() => router.push('/amigos')} className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-violet-600 btn-press">
                Ver amigos
              </button>
            </div>
          ) : sent ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 py-4">
                <UserCheck size={22} className="text-violet-600" />
                <p className="font-bold text-slate-700">Solicitud enviada</p>
              </div>
              <p className="text-slate-400 text-sm text-center">
                {profile!.nombre} recibirá tu solicitud y podrá aceptarla desde su lista de amigos.
              </p>
              <button onClick={() => router.push('/')} className="w-full mt-4 py-4 rounded-2xl text-sm font-bold text-white bg-violet-600 btn-press">
                Ir al inicio
              </button>
            </div>
          ) : (
            <>
              {!user ? (
                <div className="space-y-3">
                  <p className="text-center text-slate-500 text-sm">
                    Inicia sesión para agregar a <span className="font-bold">{profile!.nombre}</span> como amigo.
                  </p>
                  <button
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/agregar?uid=${targetUid}`)}`)}
                    className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-violet-600 btn-press"
                  >
                    Iniciar sesión
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                      Alias (opcional)
                    </label>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder={`Ej. "${profile!.nombre.split(' ')[0]}" o "Jefe"`}
                      className="input w-full"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">
                      Así aparecerá en tu lista. Solo tú lo ves.
                    </p>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-violet-600 active:bg-violet-700 btn-press disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending
                      ? <Loader2 size={18} className="animate-spin" />
                      : <UserPlus size={18} />
                    }
                    {sending ? 'Enviando...' : `Agregar a ${profile!.nombre.split(' ')[0]}`}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AgregarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="text-violet-500 animate-spin" />
      </div>
    }>
      <AgregarContent />
    </Suspense>
  );
}
