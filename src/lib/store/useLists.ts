'use client';

import { useState, useEffect, useCallback } from 'react';
import { MaterialList, CreateListInput } from '@/lib/types/material';

const KEY = 'cotigen_lists';

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nextNumero(lists: MaterialList[]): number {
  if (!lists.length) return 1;
  return Math.max(...lists.map((l) => l.numero)) + 1;
}

export function useLists() {
  const [lists, setLists] = useState<MaterialList[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLists(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const persist = useCallback((next: MaterialList[]) => {
    setLists(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const create = useCallback((input: CreateListInput): MaterialList => {
    const now = new Date().toISOString();
    const list: MaterialList = {
      id: genId(),
      numero: nextNumero(lists),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    persist([...lists, list]);
    return list;
  }, [lists, persist]);

  const update = useCallback((id: string, input: Partial<CreateListInput>): MaterialList | null => {
    let updated: MaterialList | null = null;
    persist(
      lists.map((l) => {
        if (l.id !== id) return l;
        updated = { ...l, ...input, updatedAt: new Date().toISOString() };
        return updated;
      })
    );
    return updated;
  }, [lists, persist]);

  const remove = useCallback((id: string) => {
    persist(lists.filter((l) => l.id !== id));
  }, [lists, persist]);

  const getById = useCallback((id: string) => lists.find((l) => l.id === id) ?? null, [lists]);

  return { lists, ready, create, update, remove, getById };
}
