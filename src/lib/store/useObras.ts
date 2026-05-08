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
    const { data } = await supabase
      .from('obras')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setObras(data.map((r) => ({ id: r.id, nombre: r.nombre, createdAt: r.created_at })));
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
