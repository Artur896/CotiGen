'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Colaborador, Profile } from '@/lib/types/social';

export function useColaboradores(obraId: string) {
  const { user } = useAuth();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [ready, setReady] = useState(false);

  const fetchColaboradores = useCallback(async () => {
    if (!user || !obraId) { setColaboradores([]); setReady(true); return; }
    setReady(false);

    const { data: rows } = await supabase
      .from('obra_colaboradores')
      .select('*')
      .eq('obra_id', obraId)
      .order('created_at', { ascending: true });

    if (!rows || rows.length === 0) { setColaboradores([]); setReady(true); return; }

    const colabIds = rows.map((r) => r.colaborador_id);

    const [{ data: profilesData }, { data: amigosData }] = await Promise.all([
      supabase.from('profiles').select('id, nombre, email').in('id', colabIds),
      supabase.from('amigos').select('amigo_id, alias').eq('user_id', user.id).in('amigo_id', colabIds),
    ]);

    const profileMap = new Map<string, Profile>((profilesData ?? []).map((p) => [p.id, p]));
    const aliasMap = new Map<string, string | null>((amigosData ?? []).map((a) => [a.amigo_id, a.alias]));

    setColaboradores(
      rows.map((r) => ({
        id: r.id,
        obraId: r.obra_id,
        colaboradorId: r.colaborador_id,
        invitedBy: r.invited_by,
        createdAt: r.created_at,
        profile: profileMap.get(r.colaborador_id),
        alias: aliasMap.get(r.colaborador_id),
      }))
    );
    setReady(true);
  }, [user, obraId]);

  useEffect(() => { fetchColaboradores(); }, [fetchColaboradores]);

  const add = useCallback(async (colaboradorId: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'No autenticado' };
    const { error } = await supabase
      .from('obra_colaboradores')
      .insert({ obra_id: obraId, colaborador_id: colaboradorId, invited_by: user.id });
    if (error) {
      if (error.code === '23505') return { error: 'Ya es colaborador de esta obra' };
      return { error: error.message };
    }
    await fetchColaboradores();
    return {};
  }, [user, obraId, fetchColaboradores]);

  const remove = useCallback(async (colaboradorId: string) => {
    await supabase.from('obra_colaboradores').delete()
      .eq('obra_id', obraId).eq('colaborador_id', colaboradorId);
    setColaboradores((prev) => prev.filter((c) => c.colaboradorId !== colaboradorId));
  }, [obraId]);

  return { colaboradores, ready, add, remove, refetch: fetchColaboradores };
}
