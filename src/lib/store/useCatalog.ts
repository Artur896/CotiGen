'use client';

import { useState, useEffect, useCallback } from 'react';
import { CatalogItem } from '@/lib/types/material';
import { DEFAULT_CATALOG } from '@/lib/data/defaultCatalog';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

function genId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useCatalog() {
  const { user } = useAuth();
  const [customItems, setCustomItems] = useState<CatalogItem[]>([]);
  const [ready, setReady] = useState(false);

  const fetchCustom = useCallback(async () => {
    if (!user) { setReady(true); return; }

    const { data } = await supabase
      .from('catalogo_custom')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre');

    if (data) {
      setCustomItems(data.map((row: any) => ({
        id: row.id,
        nombre: row.nombre,
        unidad: row.unidad,
        categoria: row.categoria ?? 'General',
      })));
    }
    setReady(true);
  }, [user]);

  useEffect(() => { fetchCustom(); }, [fetchCustom]);

  // Catálogo completo = base fija + custom del usuario
  const items: CatalogItem[] = [
    ...DEFAULT_CATALOG,
    ...customItems,
  ];

  const addCustom = useCallback(async (input: Omit<CatalogItem, 'id'>): Promise<CatalogItem> => {
    const tempId = genId();
    const newItem: CatalogItem = { id: tempId, ...input };

    // Guardar en Supabase
    if (user) {
      const { data } = await supabase
        .from('catalogo_custom')
        .insert({
          user_id: user.id,
          nombre: input.nombre,
          unidad: input.unidad,
          categoria: input.categoria,
        })
        .select()
        .single();

      if (data) {
        const saved: CatalogItem = {
          id: data.id,
          nombre: data.nombre,
          unidad: data.unidad,
          categoria: data.categoria ?? 'General',
        };
        setCustomItems((prev) => [...prev, saved].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        return saved;
      }
    }

    setCustomItems((prev) => [...prev, newItem]);
    return newItem;
  }, [user]);

  const updateCustom = useCallback(async (id: string, patch: Partial<Omit<CatalogItem, 'id'>>) => {
    await supabase.from('catalogo_custom').update(patch).eq('id', id);
    setCustomItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
  }, []);

  const removeCustom = useCallback(async (id: string) => {
    await supabase.from('catalogo_custom').delete().eq('id', id);
    setCustomItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, customItems, ready, addCustom, updateCustom, removeCustom };
}
