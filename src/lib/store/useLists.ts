'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { MaterialList, CreateListInput } from '@/lib/types/material';

function dbRowToList(row: any): MaterialList {
  return {
    id: row.id,
    numero: row.numero,
    nombre: row.nombre ?? '',
    cliente: '',
    telefono: '',
    fecha: row.created_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    notas: row.notas ?? '',
    items: (row.lista_items ?? [])
      .sort((a: any, b: any) => a.orden - b.orden)
      .map((item: any) => ({
        lineId: item.id,
        catalogId: item.catalog_id,
        nombre: item.nombre,
        cantidad: Number(item.cantidad),
        unidad: item.unidad,
      })),
    obraId: row.obra_id ?? null,
    revision: row.revision ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useLists() {
  const { user } = useAuth();
  const [lists, setLists] = useState<MaterialList[]>([]);
  const [ready, setReady] = useState(false);

  const fetchLists = useCallback(async () => {
    if (!user) { setLists([]); setReady(true); return; }
    setReady(false);

    const { data, error } = await supabase
      .from('listas')
      .select('*, lista_items(*)')
      .eq('user_id', user.id)
      .order('numero', { ascending: false });

    if (!error && data) setLists(data.map(dbRowToList));
    setReady(true);
  }, [user]);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  const create = useCallback(async (input: CreateListInput): Promise<MaterialList | null> => {
    if (!user) return null;

    const { data: existing } = await supabase
      .from('listas')
      .select('numero')
      .eq('user_id', user.id)
      .order('numero', { ascending: false })
      .limit(1);
    const numero = existing && existing.length > 0 ? existing[0].numero + 1 : 1;

    const { data: lista, error: listError } = await supabase
      .from('listas')
      .insert({
        user_id: user.id,
        numero,
        nombre: input.nombre,
        notas: input.notas,
        obra_id: input.obraId ?? null,
      })
      .select()
      .single();

    if (listError || !lista) return null;

    if (input.items.length > 0) {
      await supabase.from('lista_items').insert(
        input.items.map((item, i) => ({
          lista_id: lista.id,
          catalog_id: item.catalogId,
          nombre: item.nombre,
          cantidad: item.cantidad,
          unidad: item.unidad,
          orden: i,
        }))
      );
    }

    await fetchLists();

    const { data: newList } = await supabase
      .from('listas')
      .select('*, lista_items(*)')
      .eq('id', lista.id)
      .single();

    return newList ? dbRowToList(newList) : null;
  }, [user, fetchLists]);

  const update = useCallback(async (id: string, input: Partial<CreateListInput>): Promise<MaterialList | null> => {
    const { error: updateError } = await supabase
      .from('listas')
      .update({ nombre: input.nombre, notas: input.notas, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) return null;

    if (input.items !== undefined) {
      await supabase.from('lista_items').delete().eq('lista_id', id);
      if (input.items.length > 0) {
        await supabase.from('lista_items').insert(
          input.items.map((item, i) => ({
            lista_id: id,
            catalog_id: item.catalogId,
            nombre: item.nombre,
            cantidad: item.cantidad,
            unidad: item.unidad,
            orden: i,
          }))
        );
      }
    }

    await fetchLists();

    const { data: updatedList } = await supabase
      .from('listas')
      .select('*, lista_items(*)')
      .eq('id', id)
      .single();

    return updatedList ? dbRowToList(updatedList) : null;
  }, [fetchLists]);

  const updateRevision = useCallback(async (id: string, revision: Record<string, boolean>) => {
    await supabase.from('listas').update({ revision }).eq('id', id);
    setLists((prev) => prev.map((l) => l.id === id ? { ...l, revision } : l));
  }, []);

  const remove = useCallback(async (id: string) => {
    await supabase.from('listas').delete().eq('id', id);
    setLists((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const getById = useCallback((id: string) => {
    return lists.find((l) => l.id === id) ?? null;
  }, [lists]);

  return { lists, ready, create, update, updateRevision, remove, getById };
}
