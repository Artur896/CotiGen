'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Notificacion } from '@/lib/types/social';

interface NotificacionesContextType {
  notificaciones: Notificacion[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesContextType | null>(null);

function rowToNotif(r: any): Notificacion {
  return {
    id: r.id,
    userId: r.user_id,
    tipo: r.tipo,
    titulo: r.titulo,
    cuerpo: r.cuerpo ?? null,
    data: r.data ?? {},
    leida: r.leida,
    createdAt: r.created_at,
  };
}

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

function showBrowserNotif(titulo: string, cuerpo: string | null) {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(titulo, {
      body: cuerpo ?? undefined,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    });
  } catch { /* ignore */ }
}

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  const fetchNotifs = useCallback(async () => {
    if (!user) { setNotificaciones([]); return; }
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotificaciones((data ?? []).map(rowToNotif));
  }, [user]);

  // Initial fetch
  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // Request permission + register Web Push subscription
  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;

    const registerPush = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

      const permission = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;

      if (permission !== 'granted') return;

      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        const sub = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        });
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), userId: user.id }),
        });
      } catch { /* ignore — push not critical */ }
    };

    registerPush();
  }, [user]);

  // Realtime subscription — fires on every INSERT to notificaciones
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notif_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = rowToNotif(payload.new);
          setNotificaciones((prev) => [notif, ...prev]);
          showBrowserNotif(notif.titulo, notif.cuerpo);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
    setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notificaciones').update({ leida: true }).eq('user_id', user.id).eq('leida', false);
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }, [user]);

  const remove = useCallback(async (id: string) => {
    await supabase.from('notificaciones').delete().eq('id', id);
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notificaciones.filter((n) => !n.leida).length;


  return (
    <NotificacionesContext.Provider value={{ notificaciones, unreadCount, markAsRead, markAllAsRead, remove }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) throw new Error('useNotificaciones must be used inside NotificacionesProvider');
  return ctx;
}
