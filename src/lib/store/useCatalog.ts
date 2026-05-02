'use client';

import { useState, useEffect, useCallback } from 'react';
import { CatalogItem } from '@/lib/types/material';
import { DEFAULT_CATALOG } from '@/lib/data/defaultCatalog';

const KEY = 'cotigen_catalog';

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useCatalog() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        setItems(JSON.parse(raw));
      } else {
        localStorage.setItem(KEY, JSON.stringify(DEFAULT_CATALOG));
        setItems(DEFAULT_CATALOG);
      }
    } catch {}
    setReady(true);
  }, []);

  const persist = useCallback((next: CatalogItem[]) => {
    const sorted = [...next].sort(
      (a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre)
    );
    setItems(sorted);
    localStorage.setItem(KEY, JSON.stringify(sorted));
  }, []);

  const add = useCallback((input: Omit<CatalogItem, 'id'>): CatalogItem => {
    const item: CatalogItem = { id: genId(), ...input };
    persist([...items, item]);
    return item;
  }, [items, persist]);

  const update = useCallback((id: string, patch: Partial<Omit<CatalogItem, 'id'>>) => {
    persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, [items, persist]);

  const remove = useCallback((id: string) => {
    persist(items.filter((i) => i.id !== id));
  }, [items, persist]);

  return { items, ready, add, update, remove };
}
