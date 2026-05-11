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

    const [{ data: ownData }, { data: collabRows }] = await Promise.all([
      supabase.from('obras').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('obra_colaboradores').select('obra_id').eq('colaborador_id', user.id),
    ]);

    const collabIds = (collabRows ?? []).map((r) => r.obra_id);
    let sharedData: any[] = [];
    if (collabIds.length > 0) {
      const { data } = await supabase.from('obras').select('*').in('id', collabIds).order('created_at', { ascending: false });
      sharedData = data ?? [];
    }

    let ownerMap = new Map<string, string>();
    const ownerIds = [...new Set(sharedData.map((o) => o.user_id))];
    if (ownerIds.length > 0) {
      const { data: ownerProfiles } = await supabase.from('profiles').select('id, nombre').in('id', ownerIds);
      ownerMap = new Map((ownerProfiles ?? []).map((p) => [p.id, p.nombre]));
    }

    const allObras: Obra[] = [
      ...(ownData ?? []).map((r): Obra => ({ id: r.id, nombre: r.nombre, createdAt: r.created_at })),
      ...sharedData.map((r): Obra => ({
        id: r.id,
        nombre: r.nombre,
        createdAt: r.created_at,
        esCompartida: true,
        ownerId: r.user_id,
        ownerNombre: ownerMap.get(r.user_id) ?? 'Desconocido',
      })),
    ];

    setObras(allObras);
    setReady(true);
  }, [user]);

  useEffect(() => { fetchObras(); }, [fetchObras]);

  const create = useCallback(async (nombre: string): Promise<Obra | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from('obras')
      .insert({ user_id: user.id, nombre: nombre.trim() })
      .select()
      .single();
    if (!data) return null;
    const obra: Obra = { id: data.id, nombre: data.nombre, createdAt: data.created_at };
    setObras((prev) => [obra, ...prev]);
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
