'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificaciones } from '@/lib/notificaciones/NotificacionesContext';
import { Notificacion } from '@/lib/types/social';
import { Bell, X, UserPlus, UserCheck, HardHat, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from './notif-time';

function NotifIcon({ tipo }: { tipo: Notificacion['tipo'] }) {
  if (tipo === 'friend_request') return <UserPlus size={16} className="text-violet-600" />;
  if (tipo === 'friend_accepted') return <UserCheck size={16} className="text-emerald-600" />;
  return <HardHat size={16} className="text-amber-600" />;
}

function NotifIconBg({ tipo }: { tipo: Notificacion['tipo'] }) {
  if (tipo === 'friend_request') return 'bg-violet-100';
  if (tipo === 'friend_accepted') return 'bg-emerald-100';
  return 'bg-amber-100';
}

export function NotificationBell() {
  const { notificaciones, unreadCount, markAsRead, markAllAsRead, remove } = useNotificaciones();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleNotifTap = async (n: Notificacion) => {
    if (!n.leida) await markAsRead(n.id);
    setOpen(false);
    if (n.tipo === 'friend_request' || n.tipo === 'friend_accepted') {
      router.push('/amigos');
    } else if (n.tipo === 'obra_compartida' && n.data?.obra_id) {
      router.push(`/obras/${n.data.obra_id}`);
    }
  };

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setOpen(true)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 active:bg-slate-100 btn-press"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Sheet */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl shadow-2xl flex flex-col max-h-[75vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
              <p className="font-bold text-slate-900 text-lg mt-2">Notificaciones</p>
              <div className="flex items-center gap-1 mt-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-emerald-600 px-2 py-1 rounded-lg btn-press"
                  >
                    <CheckCheck size={14} /> Leer todas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-400 btn-press p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 px-4 pb-8">
              {notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Bell size={24} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500">Sin notificaciones</p>
                  <p className="text-xs text-slate-400">Aquí aparecerán solicitudes de amistad y obras compartidas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notificaciones.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl transition-colors ${
                        n.leida ? 'bg-white' : 'bg-violet-50/60'
                      }`}
                    >
                      <button
                        onClick={() => handleNotifTap(n)}
                        className="flex items-start gap-3 flex-1 text-left"
                      >
                        <div className={`w-9 h-9 rounded-xl ${NotifIconBg({ tipo: n.tipo })} flex items-center justify-center shrink-0 mt-0.5`}>
                          <NotifIcon tipo={n.tipo} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold leading-tight ${n.leida ? 'text-slate-700' : 'text-slate-900'}`}>
                              {n.titulo}
                            </p>
                            {!n.leida && (
                              <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                            )}
                          </div>
                          {n.cuerpo && (
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.cuerpo}</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">{formatDistanceToNow(n.createdAt)}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => remove(n.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 active:text-red-400 active:bg-red-50 btn-press shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
