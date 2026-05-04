'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLists } from '@/lib/store/useLists';
import { MaterialList, ListItem, CatalogItem } from '@/lib/types/material';
import { ArrowLeft, Save, FileDown, Plus, Trash2, Search, X } from 'lucide-react';
import { DEFAULT_CATALOG, CATEGORIES } from '@/lib/data/defaultCatalog';

function genLineId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type PageParams = { id: string };

export default function ListaEditorPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { id } = use(params);
  const { cat } = use(searchParams);
  const isNew = id === 'nueva';
  const categoria = cat ? decodeURIComponent(cat) : 'General';
  const router = useRouter();

  const { ready: listsReady, create, update, getById } = useLists();

  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<ListItem[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  // Add material controls
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (isNew || !listsReady) return;
    const existing = getById(id);
    if (!existing) { router.replace('/materiales'); return; }
    setNotas(existing.notas);
    setItems(existing.items);
    setLoaded(true);
  }, [id, isNew, listsReady, getById, router]);

  const catalogPool = categoria === 'General'
    ? DEFAULT_CATALOG
    : DEFAULT_CATALOG.filter((i) => i.categoria === categoria);

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
  };

  const handleClearSearch = () => {
    setSearch('');
    setSelectedItem(null);
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
      ? { ...i, cantidad: Math.max(1, i.cantidad + delta) }
      : i
    ));

  const setQty = (lineId: string, val: number) =>
    setItems((prev) => prev.map((i) => i.lineId === lineId
      ? { ...i, cantidad: Math.max(1, val) }
      : i
    ));

  const removeLine = (lineId: string) =>
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));

  const buildPayload = (): Omit<MaterialList, 'id' | 'numero' | 'createdAt' | 'updatedAt'> => ({
    cliente: '',
    telefono: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: notas.trim(),
    items,
  });

  const handleSave = () => {
    if (items.length === 0) { setError('Agrega al menos un material.'); return; }
    setSaving(true);
    setError('');
    try {
      if (isNew) create(buildPayload()); else update(id, buildPayload());
      router.push('/materiales');
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
      if (isNew) listData = create(buildPayload());
      else listData = update(id, buildPayload());
      if (!listData) { setError('Error al guardar.'); return; }

      const res = await fetch('/api/materiales/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listData),
      });
      if (!res.ok) { setError('Error al generar el PDF.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lista-${String(listData.numero).padStart(4, '0')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      if (isNew) router.replace(`/materiales/${listData.id}`);
    } finally {
      setDownloading(false);
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="px-3 h-14 flex items-center gap-2">
          <Link href="/materiales" className="w-9 h-9 flex items-center justify-center text-slate-400 btn-press rounded-xl active:bg-slate-100 shrink-0">
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
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 active:bg-emerald-700 btn-press disabled:opacity-50 shrink-0"
          >
            <Save size={15} />
            {saving ? '...' : 'Guardar'}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Notes */}
        <section className="bg-white rounded-2xl border border-slate-100 p-4">
          <label className="block">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Notas</span>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones, nombre del cliente, dirección..."
              rows={3}
              className="input resize-none"
            />
          </label>
        </section>

        {/* Add material */}
        <section className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
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
                  <p className="text-center text-slate-400 text-sm py-6">Sin resultados para "{search}"</p>
                ) : categoria === 'General' ? (
                  // General: group by category
                  CATEGORIES.map((c) => {
                    const catItems = filteredCatalog.filter((i) => i.categoria === c);
                    if (!catItems.length) return null;
                    return (
                      <div key={c}>
                        <p className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100 sticky top-0">
                          {c}
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
                  })
                ) : (
                  // Single category: flat list
                  filteredCatalog.map((item) => (
                    <button key={item.id} onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelectItem(item)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-emerald-50 border-b border-slate-50 last:border-0 btn-press">
                      <span className="text-sm font-semibold text-slate-800 leading-tight">{item.nombre}</span>
                      <span className="text-xs text-slate-400 ml-3 shrink-0">{item.unidad}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

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
                onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                className="w-12 h-12 flex items-center justify-center text-slate-500 font-bold text-2xl active:bg-slate-100 btn-press shrink-0"
              >−</button>
              <input
                type="number"
                min={1}
                value={addQty}
                onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-12 text-center font-bold text-slate-900 focus:outline-none bg-transparent"
                style={{ fontSize: 16 }}
              />
              <button
                onClick={() => setAddQty((q) => q + 1)}
                className="w-12 h-12 flex items-center justify-center text-slate-500 font-bold text-2xl active:bg-slate-100 btn-press shrink-0"
              >+</button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!selectedItem}
            className="w-full h-12 rounded-2xl font-bold text-white bg-emerald-600 active:bg-emerald-700 btn-press disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Agregar a la lista
          </button>
        </section>

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
                    <button
                      onClick={() => updateQty(item.lineId, -1)}
                      className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-lg flex items-center justify-center active:bg-slate-200 btn-press"
                    >−</button>
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => setQty(item.lineId, parseInt(e.target.value) || 1)}
                      className="w-12 text-center font-bold border border-slate-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      style={{ fontSize: 16 }}
                    />
                    <button
                      onClick={() => updateQty(item.lineId, 1)}
                      className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-lg flex items-center justify-center active:bg-slate-200 btn-press"
                    >+</button>
                  </div>
                  <button
                    onClick={() => removeLine(item.lineId)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 active:bg-red-50 active:text-red-400 btn-press"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-white bg-emerald-600 active:bg-emerald-700 btn-press disabled:opacity-50 text-base"
        >
          {saving ? 'Guardando...' : isNew ? 'Crear Lista' : 'Guardar Cambios'}
        </button>
      </main>
    </div>
  );
}
