'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Amigo, Profile } from '@/lib/types/social';

function rowToAmigo(r: any, friendIdField: 'amigo_id' | 'user_id'): Amigo {
  return {
    id: r.id,
    userId: r.user_id,
    amigoId: r[friendIdField],
    alias: r.alias ?? null,
    status: r.status,
    createdAt: r.created_at,
  };
}

export function useAmigos() {
  const { user } = useAuth();
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<Amigo[]>([]);
  const [ready, setReady] = useState(false);

  const fetchAmigos = useCallback(async () => {
    if (!user) { setAmigos([]); setPendingIncoming([]); setReady(true); return; }
    setReady(false);

    const [{ data: myRows }, { data: incomingRows }] = await Promise.all([
      supabase.from('amigos').select('*').eq('user_id', user.id).eq('status', 'accepted').order('created_at', { ascending: false }),
      supabase.from('amigos').select('*').eq('amigo_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }),
    ]);

    const allIds = [
      ...(myRows ?? []).map((r) => r.amigo_id),
      ...(incomingRows ?? []).map((r) => r.user_id),
    ];

    let profileMap = new Map<string, Profile>();
    if (allIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, nombre, email').in('id', allIds);
      profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    }

    setAmigos(
      (myRows ?? []).map((r) => ({ ...rowToAmigo(r, 'amigo_id'), profile: profileMap.get(r.amigo_id) }))
    );
    setPendingIncoming(
      (incomingRows ?? []).map((r) => ({ ...rowToAmigo(r, 'user_id'), profile: profileMap.get(r.user_id) }))
    );
    setReady(true);
  }, [user]);

  useEffect(() => { fetchAmigos(); }, [fetchAmigos]);

  const sendRequest = useCallback(async (amigoId: string, alias: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'No autenticado' };
    if (amigoId === user.id) return { error: 'No puedes agregarte a ti mismo' };

    const { error } = await supabase
      .from('amigos')
      .insert({ user_id: user.id, amigo_id: amigoId, alias: alias.trim() || null, status: 'pending' });

    if (error) {
      if (error.code === '23505') return { error: 'Ya enviaste una solicitud a este usuario' };
      return { error: error.message };
    }
    return {};
  }, [user]);

  const accept = useCallback(async (requestId: string, senderUserId: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'No autenticado' };

    const { error: e1 } = await supabase
      .from('amigos').update({ status: 'accepted' }).eq('id', requestId);
    if (e1) return { error: e1.message };

    // Create reverse record so both sides see each other in their list
    const { error: e2 } = await supabase
      .from('amigos')
      .insert({ user_id: user.id, amigo_id: senderUserId, status: 'accepted' });
    if (e2 && e2.code !== '23505') return { error: e2.message };

    await fetchAmigos();
    return {};
  }, [user, fetchAmigos]);

  const reject = useCallback(async (requestId: string) => {
    await supabase.from('amigos').delete().eq('id', requestId);
    setPendingIncoming((prev) => prev.filter((a) => a.id !== requestId));
  }, []);

  const remove = useCallback(async (amigoId: string) => {
    if (!user) return;
    await Promise.all([
      supabase.from('amigos').delete().eq('user_id', user.id).eq('amigo_id', amigoId),
      supabase.from('amigos').delete().eq('user_id', amigoId).eq('amigo_id', user.id),
    ]);
    setAmigos((prev) => prev.filter((a) => a.amigoId !== amigoId));
  }, [user]);

  const updateAlias = useCallback(async (amigoId: string, alias: string) => {
    if (!user) return;
    await supabase.from('amigos').update({ alias: alias.trim() || null }).eq('user_id', user.id).eq('amigo_id', amigoId);
    setAmigos((prev) => prev.map((a) => a.amigoId === amigoId ? { ...a, alias: alias.trim() || null } : a));
  }, [user]);

  return { amigos, pendingIncoming, ready, sendRequest, accept, reject, remove, updateAlias, refetch: fetchAmigos };
}
