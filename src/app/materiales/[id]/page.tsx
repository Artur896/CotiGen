'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLists } from '@/lib/store/useLists';
import { useCatalog } from '@/lib/store/useCatalog';
import { useObras } from '@/lib/store/useObras';
import { useAuth } from '@/lib/auth/AuthContext';
import { MaterialList, ListItem, CatalogItem } from '@/lib/types/material';
import { ArrowLeft, Save, FileDown, Plus, Trash2, Search, X, Lock } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { CATEGORIES } from '@/lib/data/defaultCatalog';
import { useToast } from '@/components/shared/Toast';
import { downloadPDFBlob } from '@/lib/pdf-client';

function genLineId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type PageParams = { id: string };

export default function ListaEditorPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<{ cat?: string; obra_id?: string }>;
}) {
  const { id } = use(params);
  const { cat, obra_id } = use(searchParams);
  const isNew = id === 'nueva';
  const categoria = cat ? decodeURIComponent(cat) : 'General';
  const obraId = obra_id ?? null;
  const router = useRouter();

  const { user } = useAuth();
  const { ready: listsReady, create, update, getById } = useLists();
  const { obras } = useObras();
  const { items: catalog, customItems, addCustom } = useCatalog();
  const { success } = useToast();

  const [nombre, setNombre] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<ListItem[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  // Permission check: read-only if collaborator who didn't create this list
  const existingList = !isNew && listsReady ? getById(id) : null;
  const isListCreator = existingList ? existingList.userId === user?.id : true;
  const readOnly = !isNew && loaded && !isListCreator;

  // Add material controls
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Custom material
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customNombre, setCustomNombre] = useState('');
  const [customUnidad, setCustomUnidad] = useState('pieza');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Restore draft for new lists on mount
  useEffect(() => {
    if (!isNew) return;
    try {
      const raw = localStorage.getItem('lista_draft_nueva');
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.nombre) setNombre(draft.nombre);
        if (draft.notas) setNotas(draft.notas);
        if (Array.isArray(draft.items) && draft.items.length > 0) setItems(draft.items);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNew || !listsReady) return;
    const existing = getById(id);
    if (!existing) { router.replace('/materiales'); return; }

    // Prefer localStorage draft (unsaved changes) over DB data
    let restored = false;
    try {
      const raw = localStorage.getItem(`lista_draft_${id}`);
      if (raw) {
        const draft = JSON.parse(raw);
        setNombre(draft.nombre ?? existing.nombre ?? '');
        setNotas(draft.notas ?? existing.notas);
        setItems(draft.items ?? existing.items);
        restored = true;
      }
    } catch {}
    if (!restored) {
      setNombre(existing.nombre ?? '');
      setNotas(existing.notas);
      setItems(existing.items);
    }
    setLoaded(true);
  }, [id, isNew, listsReady, getById, router]);

  // Auto-save draft to localStorage (debounced 1.5 s)
  useEffect(() => {
    if (!loaded) return;
    if (!nombre.trim() && !notas.trim() && items.length === 0) return;
    const key = `lista_draft_${id}`;
    const timer = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify({ nombre, notas, items })); } catch {}
    }, 1500);
    return () => clearTimeout(timer);
  }, [nombre, notas, items, loaded, id]);

  // Items del catálogo base filtrados por categoría
  // Los materiales custom del usuario siempre se incluyen sin importar la categoría
  const catalogPool = categoria === 'General'
    ? catalog
    : [
        ...catalog.filter((i) => i.categoria === categoria),
        ...customItems, // materiales del usuario siempre visibles
      ];

  const filteredCatalog = search.trim().length > 0
    ? catalogPool.filter((i) =>
        i.nombre.toLowerCase().includes(search.toLowerCase()) ||
        i.categoria.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 60)
    : [];

  const handleSelectItem = (item: CatalogItem) => {
    setSelectedItem(item);
    setSearch(item.nombre);
    setShowDropdown(false);
    setShowCustomForm(false);
  };

  const handleClearSearch = () => {
    setSearch('');
    setSelectedItem(null);
    setShowDropdown(false);
    setShowCustomForm(false);
  };

  const handleAddCustom = async () => {
    if (!customNombre.trim()) return;

    // Guardar en catálogo custom (Supabase) y agregar a la lista
    const saved = await addCustom({
      nombre: customNombre.trim(),
      unidad: customUnidad,
      categoria: 'General',
    });

    setItems((prev) => [...prev, {
      lineId: genLineId(),
      catalogId: saved.id,
      nombre: saved.nombre,
      cantidad: addQty,
      unidad: saved.unidad,
    }]);

    setCustomNombre('');
    setCustomUnidad('pieza');
    setShowCustomForm(false);
    setSearch('');
    setShowDropdown(false);
  };

  const handleAdd = () => {
    if (!selectedItem) return;
    const already = items.find((i) => i.catalogId === selectedItem.id);
    if (already) {
      setItems((prev) => prev.map((i) => i.catalogId === selectedItem.id
        ? { ...i, cantidad: i.cantidad + addQty }
        : i
      ));
    } else {
      setItems((prev) => [...prev, {
        lineId: genLineId(),
        catalogId: selectedItem.id,
        nombre: selectedItem.nombre,
        cantidad: addQty,
        unidad: selectedItem.unidad,
      }]);
    }
    setSearch('');
    setSelectedItem(null);
    setAddQty(1);
  };

  const updateQty = (lineId: string, delta: number) =>
    setItems((prev) => prev.map((i) => i.lineId === lineId
      ? { ...i, cantidad: Math.max(0.5, Math.round((i.cantidad + delta) * 10) / 10) }
      : i
    ));

  const setQty = (lineId: string, val: number) =>
    setItems((prev) => prev.map((i) => i.lineId === lineId
      ? { ...i, cantidad: Math.max(0.5, Math.round(val * 10) / 10) }
      : i
    ));

  const removeLine = (lineId: string) =>
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));

  const buildPayload = (): import('@/lib/types/material').CreateListInput => ({
    nombre: nombre.trim(),
    cliente: '',
    telefono: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: notas.trim(),
    items,
    obraId: obraId,
  });

  const handleSave = async () => {
    if (items.length === 0) { setError('Agrega al menos un material.'); return; }
    setSaving(true);
    setError('');
    try {
      const result = isNew ? await create(buildPayload()) : await update(id, buildPayload());
      if (!result) { setError('Error al guardar. Intenta de nuevo.'); return; }
      try { localStorage.removeItem(`lista_draft_${id}`); } catch {}
      success('Se guardó correctamente');
      router.push(obraId ? `/obras/${obraId}` : '/materiales');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (items.length === 0) { setError('Agrega materiales antes de generar el PDF.'); return; }
    setDownloading(true);
    setError('');
    try {
      let listData: MaterialList | null = null;
      if (isNew) listData = await create(buildPayload());
      else listData = await update(id, buildPayload());
      if (!listData) { setError('Error al guardar.'); return; }

      const res = await fetch('/api/materiales/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.details || body.error || 'Error al generar el PDF.');
        return;
      }
      const blob = await res.blob();
      await downloadPDFBlob(blob, `lista-${String(listData.numero).padStart(4, '0')}.pdf`);
      try { localStorage.removeItem(`lista_draft_${id}`); } catch {}
      success('Descarga completa');
      if (isNew) router.replace(`/materiales/${listData.id}`);
    } finally {
      setDownloading(false);
    }
  };

  if (!loaded) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="px-3 h-14 flex items-center gap-2">
          <Link href={obraId ? `/obras/${obraId}` : '/materiales'} className="w-9 h-9 flex items-center justify-center text-slate-400 btn-press rounded-xl active:bg-slate-100 shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm leading-tight truncate">
              {isNew ? 'Nueva lista' : 'Editar lista'}
            </p>
            {isNew && (
              <p className="text-xs text-slate-400 leading-tight truncate">{categoria}</p>
            )}
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-emerald-700 bg-emerald-50 active:bg-emerald-100 btn-press disabled:opacity-50 shrink-0"
          >
            {downloading
              ? <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              : <FileDown size={18} />}
          </button>
          {readOnly ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-slate-400 bg-slate-100 shrink-0">
              <Lock size={15} /> Solo lectura
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 active:bg-emerald-700 btn-press disabled:opacity-50 shrink-0"
            >
              <Save size={15} />
              {saving ? '...' : 'Guardar'}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        {readOnly && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl font-medium">
            <Lock size={14} /> No eres el creador de esta lista — solo puedes consultarla
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* List name */}
        <section className="bg-white rounded-2xl border border-slate-100 p-4">
          <label className="block">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Nombre de la lista
            </span>
            <input
              type="text"
              value={nombre}
              onChange={(e) => !readOnly && setNombre(e.target.value)}
              placeholder="Ej. Casa Hernández, Obra 3, Departamento..."
              className={`input ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              readOnly={readOnly}
            />
            <p className="text-xs text-slate-300 mt-1.5">Solo para identificar la lista, no aparece en el PDF</p>
          </label>
        </section>

        {/* Notes */}
        <section className="bg-white rounded-2xl border border-slate-100 p-4">
          <label className="block">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Notas</span>
            <textarea
              value={notas}
              onChange={(e) => !readOnly && setNotas(e.target.value)}
              placeholder="Observaciones, nombre del cliente, dirección..."
              rows={3}
              className={`input resize-none ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              readOnly={readOnly}
            />
          </label>
        </section>

        {/* Add material */}
        {!readOnly && <section className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
          <h2 className="font-bold text-slate-900 text-base">Agregar Material</h2>

          {/* Search + dropdown */}
          <div ref={searchRef} className="relative">
            <div className={`flex items-center gap-2 border-2 rounded-2xl px-3 bg-white transition-colors ${
              showDropdown && search ? 'border-emerald-400' : 'border-slate-200'
            }`}>
              <Search size={17} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedItem(null);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={categoria === 'General' ? 'Buscar en todos los materiales...' : `Buscar en ${categoria}...`}
                className="flex-1 py-3.5 bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
                style={{ fontSize: 16 }}
              />
              {search && (
                <button onMouseDown={(e) => e.preventDefault()} onClick={handleClearSearch} className="shrink-0 p-1 text-slate-400 btn-press">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown — absolute so it overlays content below */}
            {showDropdown && search.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                   style={{ maxHeight: '52vh', overflowY: 'auto' }}>
                {filteredCatalog.length === 0 ? (
                  <div className="px-4 py-4 text-center">
                    <p className="text-slate-400 text-sm mb-3">Sin resultados para "{search}"</p>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCustomNombre(search);
                        setShowCustomForm(true);
                        setShowDropdown(false);
                      }}
                      className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl btn-press"
                    >
                      <Plus size={15} /> Agregar como nuevo material
                    </button>
                  </div>
                ) : (
                  // Lista plana agrupada por categoría (incluye 'General' y cualquier categoría custom)
                  (() => {
                    const allCategories = [...new Set(filteredCatalog.map(i => i.categoria))].sort();
                    return allCategories.map((cat) => {
                      const catItems = filteredCatalog.filter(i => i.categoria === cat);
                      if (!catItems.length) return null;
                      return (
                        <div key={cat}>
                          <p className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100 sticky top-0">
                            {cat}
                          </p>
                          {catItems.map((item) => (
                            <button key={item.id} onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelectItem(item)}
                              className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-emerald-50 border-b border-slate-50 last:border-0 btn-press">
                              <span className="text-sm font-semibold text-slate-800 leading-tight">{item.nombre}</span>
                              <span className="text-xs text-slate-400 ml-3 shrink-0">{item.unidad}</span>
                            </button>
                          ))}
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            )}
          </div>

          {/* Custom material form */}
          {showCustomForm && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-emerald-900">Nuevo material</p>
                <button onClick={() => setShowCustomForm(false)} className="text-emerald-400 btn-press">
                  <X size={16} />
                </button>
              </div>
              <input
                autoFocus
                type="text"
                value={customNombre}
                onChange={(e) => setCustomNombre(e.target.value)}
                placeholder="Nombre del material"
                className="input"
                style={{ fontSize: 16 }}
              />
              <select
                value={customUnidad}
                onChange={(e) => setCustomUnidad(e.target.value)}
                className="input"
              >
                {['pieza','metro','litro','kg','gramos','rollo','caja','par','juego','servicio','hora'].map(u => (
                  <option key={u}>{u}</option>
                ))}
              </select>
              <button
                onClick={handleAddCustom}
                disabled={!customNombre.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 active:bg-emerald-700 btn-press disabled:opacity-40"
              >
                Agregar a la lista
              </button>
            </div>
          )}

          {/* Selected item */}
          {selectedItem && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-emerald-900 truncate">{selectedItem.nombre}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{selectedItem.categoria} · {selectedItem.unidad}</p>
              </div>
              <button onClick={handleClearSearch} className="text-emerald-400 btn-press shrink-0">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Qty row */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Cantidad</span>
            <div className="flex items-center border-2 border-slate-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setAddQty((q) => Math.max(0.5, Math.round((q - 1) * 10) / 10))}
                className="w-12 h-12 flex items-center justify-center text-slate-500 font-bold text-2xl active:bg-slate-100 btn-press shrink-0"
              >−</button>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={addQty}
                onChange={(e) => setAddQty(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                className="flex-1 h-12 text-center font-bold text-slate-900 focus:outline-none bg-transparent"
                style={{ fontSize: 16 }}
              />
              <button
                onClick={() => setAddQty((q) => Math.round((q + 1) * 10) / 10)}
                className="w-12 h-12 flex items-center justify-center text-slate-500 font-bold text-2xl active:bg-slate-100 btn-press shrink-0"
              >+</button>
            </div>
            <button
              onClick={() => setAddQty((q) => Math.round((q + 0.5) * 10) / 10)}
              className="mt-2 w-full h-10 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 active:bg-emerald-100 btn-press border border-emerald-200"
            >+ ½ más</button>
          </div>

          <button
            onClick={handleAdd}
            disabled={!selectedItem}
            className="w-full h-12 rounded-2xl font-bold text-white bg-emerald-600 active:bg-emerald-700 btn-press disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Agregar a la lista
          </button>
        </section>}

        {/* Materials list */}
        {items.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">
                Lista
                <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </h2>
            </div>

            <div className="divide-y divide-slate-50">
              {items.map((item) => (
                <div key={item.lineId} className="flex items-center px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{item.nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.unidad}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {readOnly ? (
                      <span className="w-12 text-center font-bold text-slate-700 py-2">{item.cantidad}</span>
                    ) : (
                      <>
                        <button
                          onClick={() => updateQty(item.lineId, -1)}
                          className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-lg flex items-center justify-center active:bg-slate-200 btn-press"
                        >−</button>
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={item.cantidad}
                          onChange={(e) => setQty(item.lineId, parseFloat(e.target.value) || 0.5)}
                          className="w-12 text-center font-bold border border-slate-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          style={{ fontSize: 16 }}
                        />
                        <button
                          onClick={() => updateQty(item.lineId, 1)}
                          className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-lg flex items-center justify-center active:bg-slate-200 btn-press"
                        >+</button>
                        <button
                          onClick={() => updateQty(item.lineId, 0.5)}
                          className="h-9 px-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center active:bg-emerald-100 btn-press"
                          title="Agregar medio"
                        >+½</button>
                      </>
                    )}
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => removeLine(item.lineId)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 active:bg-red-50 active:text-red-400 btn-press"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Save button */}
        {!readOnly && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-white bg-emerald-600 active:bg-emerald-700 btn-press disabled:opacity-50 text-base"
          >
            {saving ? 'Guardando...' : isNew ? 'Crear Lista' : 'Guardar Cambios'}
          </button>
        )}
      </main>
    </div>
  );
}
