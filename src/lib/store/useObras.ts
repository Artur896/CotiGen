'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Obra } from '@/lib/types/material';

export function useObras() {
  const { user } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [ready, setReady] = useState(false);

  const fetchObras = useCallback(async () => {
    if (!user) { setObras([]); setReady(true); return; }
    setReady(false);

    // Always fetch own obras first — this never depends on new tables
    const { data: ownData } = await supabase
      .from('obras')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Shared obras — gracefully skip if obra_colaboradores doesn't exist yet
    let sharedData: any[] = [];
    try {
      const { data: collabRows, error } = await supabase
        .from('obra_colaboradores')
        .select('obra_id')
        .eq('colaborador_id', user.id);

      if (!error && collabRows && collabRows.length > 0) {
        const collabIds = collabRows.map((r) => r.obra_id);
        const { data } = await supabase
          .from('obras')
          .select('*')
          .in('id', collabIds)
          .order('created_at', { ascending: false });
        sharedData = data ?? [];
      }
    } catch {
      // obra_colaboradores not set up yet — continue with own obras only
    }

    let ownerMap = new Map<string, string>();
    const ownerIds = [...new Set(sharedData.map((o) => o.user_id))];
    if (ownerIds.length > 0) {
      const { data: ownerProfiles } = await supabase
        .from('profiles')
        .select('id, nombre')
        .in('id', ownerIds);
      ownerMap = new Map((ownerProfiles ?? []).map((p) => [p.id, p.nombre]));
    }

    setObras([
      ...(ownData ?? []).map((r): Obra => ({ id: r.id, nombre: r.nombre, createdAt: r.created_at })),
      ...sharedData.map((r): Obra => ({
        id: r.id,
        nombre: r.nombre,
        createdAt: r.created_at,
        esCompartida: true,
        ownerId: r.user_id,
        ownerNombre: ownerMap.get(r.user_id) ?? 'Desconocido',
      })),
    ]);
    setReady(true);
  }, [user]);

  useEffect(() => { fetchObras(); }, [fetchObras]);

  // Re-fetch when someone adds/removes us as a collaborator
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('obra_colaboradores_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'obra_colaboradores', filter: `colaborador_id=eq.${user.id}` },
        () => fetchObras()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchObras]);

  const create = useCallback(async (nombre: string): Promise<Obra | null> => {
    if (!user) return null;

    // Insert and select separately so a broken SELECT policy
    // on shared obras doesn't prevent creating new obras.
    const { error: insertError } = await supabase
      .from('obras')
      .insert({ user_id: user.id, nombre: nombre.trim() });

    if (insertError) return null;

    // Fetch the row we just created (own obras policy is always safe)
    const { data } = await supabase
      .from('obras')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;
    const obra: Obra = { id: data.id, nombre: data.nombre, createdAt: data.created_at };
    setObras((prev) => [obra, ...prev.filter((o) => o.id !== obra.id)]);
    return obra;
  }, [user]);

  const rename = useCallback(async (id: string, nombre: string) => {
    await supabase.from('obras').update({ nombre: nombre.trim() }).eq('id', id);
    setObras((prev) => prev.map((o) => o.id === id ? { ...o, nombre: nombre.trim() } : o));
  }, []);

  const remove = useCallback(async (id: string) => {
    await supabase.from('obras').delete().eq('id', id);
    setObras((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return { obras, ready, create, rename, remove };
}
