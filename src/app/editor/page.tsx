'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import {
  Share2, Eye, PenLine, Plus, Trash2, FileText,
  Lock, ToggleLeft, ToggleRight, X, Save, ArrowLeft, ChevronRight,
} from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import { downloadPDFBlob } from '@/lib/pdf-client';

// ── Types ─────────────────────────────────────────────────────────
interface LineItem { id: string; descripcion: string; cantidad: number; precio: number; }
interface ClientInfo { nombre: string; telefono: string; direccion: string; }
interface CotizacionGuardada {
  id: string;
  nombreInterno: string;
  grupo: string;
  client: ClientInfo;
  descripcion: string;
  alcances: string[];
  notas: string;
  lines: LineItem[];
  showPrices: boolean;
  manualTotal: string;
  template: string;
  quotationNumber: string;
  fecha: string;
  total: number;
  savedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────
function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function emptyLine(): LineItem { return { id: genId(), descripcion: '', cantidad: 1, precio: 0 }; }
function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}
const STORAGE_KEY = 'cotizaciones_guardadas';
function loadAll(): CotizacionGuardada[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}
function saveAll(list: CotizacionGuardada[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function nextQuotationNumber(): string {
  const all = loadAll();
  const nums = all
    .map((c) => parseInt(c.quotationNumber.replace('COT-', ''), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `COT-${String(next).padStart(4, '0')}`;
}
function pdfFilename(c: { nombreInterno: string; client: ClientInfo; quotationNumber: string }): string {
  const label = (c.nombreInterno.trim() || c.client?.nombre?.trim() || '').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 40);
  return label ? `${c.quotationNumber}-${label}.pdf` : `${c.quotationNumber}.pdf`;
}


// ══════════════════════════════════════════════════════════════════
// LIST VIEW
// ══════════════════════════════════════════════════════════════════
function ListView({ onNew, onOpen }: { onNew: () => void; onOpen: (c: CotizacionGuardada) => void }) {
  const [list, setList] = useState<CotizacionGuardada[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [grupoFiltro, setGrupoFiltro] = useState<string>('');
  const { success } = useToast();

  useEffect(() => {
    setList(loadAll().sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
  }, []);

  const grupos = Array.from(new Set(list.map((c) => c.grupo ?? '').filter(Boolean))).sort();
  const filtered = grupoFiltro ? list.filter((c) => c.grupo === grupoFiltro) : list;

  const handleDelete = (id: string) => {
    const updated = loadAll().filter((c) => c.id !== id);
    saveAll(updated);
    setList(updated.sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
    setDeleteTarget(null);
    success('Cotización eliminada');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="px-3 h-14 flex items-center gap-2">
          <FileText size={18} className="text-indigo-600 shrink-0" />
          <span className="font-bold text-slate-900 flex-1 text-sm">Cotizaciones</span>
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2.5 rounded-xl text-xs font-bold btn-press active:bg-indigo-700 shrink-0"
          >
            <Plus size={14} /> Nueva
          </button>
        </div>

        {/* Filtro por grupo */}
        {grupos.length > 0 && (
          <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setGrupoFiltro('')}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold btn-press transition-colors ${
                grupoFiltro === '' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              Todos
            </button>
            {grupos.map((g) => (
              <button
                key={g}
                onClick={() => setGrupoFiltro(g === grupoFiltro ? '' : g)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold btn-press transition-colors ${
                  grupoFiltro === g ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 px-4 py-4 pb-nav max-w-lg mx-auto w-full">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-4">
              <FileText size={36} className="text-indigo-300" />
            </div>
            <p className="font-bold text-slate-700 text-lg">Sin cotizaciones</p>
            <p className="text-slate-400 text-sm mt-1 mb-6">Crea tu primera cotización</p>
            <button
              onClick={onNew}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold btn-press"
            >
              <Plus size={18} /> Nueva Cotización
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              /* div en lugar de button para poder tener botones hijos */
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
              >
                <button
                  onClick={() => onOpen(c)}
                  className="w-full flex items-center px-4 py-4 gap-3 text-left btn-press active:bg-slate-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {c.nombreInterno.trim() || c.client?.nombre || c.quotationNumber}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {c.quotationNumber}{c.client?.nombre ? ` · ${c.client.nombre}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-300">{c.savedAt.split('T')[0]}</p>
                      {c.grupo && (
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-md">
                          {c.grupo}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900 text-sm">{fmt(c.total)}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
                </button>

                {/* Acción eliminar separada del botón principal */}
                <div className="border-t border-slate-50 flex">
                  <button
                    onClick={() => setDeleteTarget(c.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-red-400 active:bg-red-50 btn-press"
                  >
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <p className="font-bold text-slate-900 text-lg mb-1">¿Eliminar cotización?</p>
            <p className="text-slate-500 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="space-y-2">
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-red-500 active:bg-red-600 btn-press"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="w-full py-4 rounded-2xl text-sm font-bold text-slate-700 bg-slate-100 btn-press"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// EDITOR VIEW
// ══════════════════════════════════════════════════════════════════
function EditorView({
  initial,
  onBack,
}: {
  initial?: CotizacionGuardada;
  onBack: () => void;
}) {
  const isEdit = !!initial;

  const [nombreInterno, setNombreInterno] = useState(initial?.nombreInterno ?? '');
  const [grupo, setGrupo] = useState(initial?.grupo ?? '');
  const [client, setClient] = useState<ClientInfo>(initial?.client ?? { nombre: '', telefono: '', direccion: '' });
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '');
  const [alcances, setAlcances] = useState<string[]>(initial?.alcances?.length ? initial.alcances : ['']);
  const [notas, setNotas] = useState(initial?.notas ?? '');
  const [lines, setLines] = useState<LineItem[]>(initial?.lines?.length ? initial.lines : [emptyLine()]);
  const [showPrices, setShowPrices] = useState(initial?.showPrices ?? true);
  const [manualTotal, setManualTotal] = useState(initial?.manualTotal ?? '');
  const template = 'minimal';
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quotationNumber] = useState(
    initial?.quotationNumber ?? nextQuotationNumber()
  );
  const [fecha] = useState(
    initial?.fecha ?? new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
  );
  const { success, error } = useToast();

  const autoTotal = lines.reduce((s, l) => s + l.cantidad * l.precio, 0);
  const total = showPrices ? autoTotal : (parseFloat(manualTotal) || 0);

  const updateLine = (id: string, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLine = (id: string) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  const updateAlcance = (i: number, val: string) =>
    setAlcances((prev) => prev.map((a, idx) => idx === i ? val : a));
  const removeAlcance = (i: number) =>
    setAlcances((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : ['']);

  const buildRecord = (): CotizacionGuardada => ({
    id: initial?.id ?? genId(),
    nombreInterno, grupo, client, descripcion, alcances, notas,
    lines, showPrices, manualTotal, template,
    quotationNumber, fecha, total,
    savedAt: new Date().toISOString(),
  });

  const handleSave = () => {
    try {
      const record = buildRecord();
      const all = loadAll().filter((c) => c.id !== record.id);
      saveAll([record, ...all]);
      success(isEdit ? 'Cambios guardados' : 'Cotización guardada');
    } catch {
      error('No se pudo guardar');
    }
  };

  const buildPayload = () => ({
    quotation: {
      type: 'plumbing' as const,
      client: { name: client.nombre, email: '', phone: client.telefono, address: client.direccion },
      serviceAddress: client.direccion,
      materials: lines.filter(l => l.descripcion.trim()).map((l) => ({
        description: l.descripcion, quantity: l.cantidad, unitPrice: l.precio,
      })),
      laborCost: 0, urgencyFee: 0,
      showClientInfo: true, showLaborCost: false,
      descripcion, alcances: alcances.filter(a => a.trim()),
      showPrices, isManualTotal: !showPrices,
      manualTotalValue: showPrices ? undefined : total,
      notas: notas.trim() || undefined,
      total,
    },
    template, date: fecha, quotationNumber,
  });

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (res.ok) {
        const blob = await res.blob();
        const filename = pdfFilename({ nombreInterno, client, quotationNumber });
        await downloadPDFBlob(blob, filename);
        handleSave();
      } else {
        const body = await res.json().catch(() => ({}));
        error(body.details || body.error || 'Error al generar el PDF');
      }
    } catch (e: any) {
      error(e?.message || 'Error al compartir');
    } finally {
      setIsGenerating(false);
    }
  };

  const q = buildPayload().quotation as any;
  const previewItems = (q.materials ?? []).filter((m: any) => m.description?.trim());
  const previewAlcances = (q.alcances ?? []).filter((a: string) => a.trim());

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="px-3 h-14 flex items-center gap-2">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center text-slate-400 btn-press rounded-xl active:bg-slate-100 shrink-0">
            <ArrowLeft size={20} />
          </button>
          <span className="font-bold text-slate-900 flex-1 text-sm truncate">
            {nombreInterno.trim() || (isEdit ? 'Editar cotización' : 'Nueva cotización')}
          </span>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 bg-slate-100 active:bg-slate-200 text-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold btn-press shrink-0"
          >
            <Save size={14} /> Guardar
          </button>
          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="flex items-center gap-1.5 bg-indigo-600 active:bg-indigo-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold btn-press disabled:opacity-50 shrink-0"
          >
            {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Share2 size={14} />}
            Compartir
          </button>
        </div>
        <div className="flex border-t border-slate-100">
          {(['form', 'preview'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold border-b-2 btn-press transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400'}`}
            >
              {tab === 'form' ? <><PenLine size={15} /> Formulario</> : <><Eye size={15} /> Vista Previa</>}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-nav">
        {activeTab === 'form' ? (
          <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">

            {/* Registro interno */}
            <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lock size={13} className="text-amber-500 shrink-0" />
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Registro interno (no aparece en el PDF)</span>
              </div>
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1.5 block">Nombre</span>
                <input type="text" value={nombreInterno} onChange={(e) => setNombreInterno(e.target.value)}
                  placeholder="Ej. Casa Hernández — Planta baja" className="input bg-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1.5 block">Grupo / Proyecto</span>
                <input type="text" value={grupo} onChange={(e) => setGrupo(e.target.value)}
                  placeholder="Ej. Ferreteros Unidos, Obra 5, 2026..." className="input bg-white" />
                <p className="text-xs text-amber-600 mt-1">Sirve para filtrar cotizaciones por cliente u obra</p>
              </div>
            </section>

            {/* Cliente */}
            <section className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <h2 className="font-bold text-slate-900">Cliente</h2>
              <label className="block">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Nombre</span>
                <input type="text" value={client.nombre} onChange={(e) => setClient({ ...client, nombre: e.target.value })} placeholder="Nombre o empresa" className="input" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Teléfono</span>
                  <input type="tel" value={client.telefono} onChange={(e) => setClient({ ...client, telefono: e.target.value })} placeholder="555-000-0000" className="input" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Dirección</span>
                  <input type="text" value={client.direccion} onChange={(e) => setClient({ ...client, direccion: e.target.value })} placeholder="Calle, col..." className="input" />
                </label>
              </div>
            </section>

            {/* Detalles */}
            <section className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <h2 className="font-bold text-slate-900">Detalles</h2>
              <label className="block">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Descripción del trabajo</span>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe brevemente el trabajo a realizar..." rows={3} className="input resize-none" />
              </label>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Alcances</span>
                  <button onClick={() => setAlcances((p) => [...p, ''])} className="text-xs font-bold text-indigo-600 btn-press flex items-center gap-1">
                    <Plus size={13} /> Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {alcances.map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <input type="text" value={a} onChange={(e) => updateAlcance(i, e.target.value)}
                        placeholder={`Alcance ${i + 1}`} className="input flex-1" />
                      <button onClick={() => removeAlcance(i)} className="text-slate-300 active:text-red-400 btn-press shrink-0"><X size={15} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Conceptos */}
            <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-50">
                <h2 className="font-bold text-slate-900">
                  Conceptos
                  {lines.filter(l => l.descripcion).length > 0 && (
                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                      {lines.filter(l => l.descripcion).length}
                    </span>
                  )}
                </h2>
                <button onClick={() => setLines((p) => [...p, emptyLine()])} className="flex items-center gap-1 text-sm font-bold text-indigo-600 btn-press">
                  <Plus size={16} /> Agregar
                </button>
              </div>
              <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Mostrar precios</p>
                  <p className="text-xs text-slate-400">{showPrices ? 'Total automático' : 'Total manual'}</p>
                </div>
                <button onClick={() => setShowPrices(p => !p)} className="btn-press">
                  {showPrices ? <ToggleRight size={32} className="text-indigo-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {lines.map((line, idx) => (
                  <div key={line.id} className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 w-5 shrink-0">{idx + 1}</span>
                      <input type="text" value={line.descripcion} onChange={(e) => updateLine(line.id, { descripcion: e.target.value })}
                        placeholder="Descripción del concepto..." className="input flex-1" />
                      <button onClick={() => removeLine(line.id)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 active:bg-red-50 active:text-red-400 btn-press shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className={`flex gap-2 pl-7 ${showPrices ? '' : 'max-w-35'}`}>
                      <label className="w-20 shrink-0">
                        <span className="text-xs text-slate-400 mb-1 block">Cant.</span>
                        <input type="number" min={0.5} step={0.5} value={line.cantidad}
                          onChange={(e) => updateLine(line.id, { cantidad: parseFloat(e.target.value) || 1 })} className="input text-center" />
                      </label>
                      {showPrices && (
                        <>
                          <label className="flex-1">
                            <span className="text-xs text-slate-400 mb-1 block">Precio unitario</span>
                            <input type="number" min={0} step={0.01} value={line.precio}
                              onChange={(e) => updateLine(line.id, { precio: parseFloat(e.target.value) || 0 })} className="input" />
                          </label>
                          <div className="flex-1">
                            <span className="text-xs text-slate-400 mb-1 block">Subtotal</span>
                            <div className="input bg-slate-50 text-slate-700 font-semibold">{fmt(line.cantidad * line.precio)}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-4 border-t border-slate-100 bg-slate-50">
                {showPrices ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total</span>
                    <span className="text-2xl font-extrabold text-slate-900">{fmt(total)}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Total (manual)</span>
                    <input type="number" min={0} step={0.01} value={manualTotal} onChange={(e) => setManualTotal(e.target.value)}
                      placeholder="0.00" className="input text-right font-bold text-slate-900" style={{ fontSize: 22 }} />
                    {total > 0 && <p className="text-right text-sm font-semibold text-indigo-600">{fmt(total)}</p>}
                  </div>
                )}
              </div>
            </section>

            {/* Notas */}
            <section className="bg-white rounded-2xl border border-slate-100 p-4">
              <label className="block">
                <span className="font-bold text-slate-900 mb-2 block">Notas</span>
                <textarea value={notas} onChange={(e) => setNotas(e.target.value)}
                  placeholder="Condiciones, garantías, tiempo de entrega..." rows={3} className="input resize-none" />
              </label>
            </section>

            <button onClick={handleShare} disabled={isGenerating}
              className="w-full py-4 rounded-2xl font-bold text-white bg-indigo-600 active:bg-indigo-700 btn-press disabled:opacity-50 flex items-center justify-center gap-3 text-base"
            >
              {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Share2 size={20} />}
              {isGenerating ? 'Generando...' : 'Compartir Cotización'}
            </button>
          </div>
        ) : (
          /* ── PREVIEW ─────────────────────────────────── */
          <div className="px-3 py-4">
            <div className="bg-white shadow-xl rounded border border-slate-200 mx-auto max-w-2xl overflow-hidden">
              <div className="h-1 bg-slate-900" />
              <div className="px-8 py-8 space-y-6">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                  <div>
                    <p className="text-2xl font-extrabold text-slate-900 tracking-tight">COTIZACIÓN</p>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{quotationNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{fecha}</p>
                  </div>
                </div>

                {client.nombre && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PARA</p>
                    <p className="font-bold text-slate-900 text-base">{client.nombre}</p>
                    {client.telefono && <p className="text-xs text-slate-500 mt-0.5">{client.telefono}</p>}
                    {client.direccion && <p className="text-xs text-slate-500">{client.direccion}</p>}
                  </div>
                )}

                {descripcion && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">DESCRIPCIÓN DEL TRABAJO</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{descripcion}</p>
                  </div>
                )}

                {previewAlcances.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">ALCANCES</p>
                    <ul className="space-y-1.5">
                      {previewAlcances.map((a: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewItems.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">CONCEPTOS</p>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-2 font-bold text-slate-500 text-[10px] uppercase tracking-wide">Descripción</th>
                          <th className="text-center py-2 font-bold text-slate-500 text-[10px] uppercase tracking-wide w-12">Cant.</th>
                          {showPrices && (
                            <>
                              <th className="text-right py-2 font-bold text-slate-500 text-[10px] uppercase tracking-wide w-24">P. Unit.</th>
                              <th className="text-right py-2 font-bold text-slate-500 text-[10px] uppercase tracking-wide w-24">Total</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {previewItems.map((m: any, i: number) => (
                          <tr key={i} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/60' : ''}`}>
                            <td className="py-2.5 font-medium text-slate-800">{m.description}</td>
                            <td className="py-2.5 text-center text-slate-600">{m.quantity}</td>
                            {showPrices && (
                              <>
                                <td className="py-2.5 text-right text-slate-600">{fmt(m.unitPrice)}</td>
                                <td className="py-2.5 text-right font-semibold text-slate-800">{fmt(m.quantity * m.unitPrice)}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-between items-center border-t-2 border-slate-900 pt-4">
                  <span className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-extrabold text-slate-900">{fmt(total)}</span>
                </div>

                {notas.trim() && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">NOTAS</p>
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{notas}</p>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-4 text-center">
                  <p className="text-[10px] text-slate-400">Esta cotización es válida por 15 días naturales a partir de la fecha de emisión.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Para aceptar, responda a este documento o contáctenos directamente.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT — controla qué pantalla mostrar
// ══════════════════════════════════════════════════════════════════
export default function EditorPage() {
  const [screen, setScreen] = useState<'list' | 'editor'>('list');
  const [editing, setEditing] = useState<CotizacionGuardada | undefined>(undefined);

  const openNew = () => { setEditing(undefined); setScreen('editor'); };
  const openExisting = (c: CotizacionGuardada) => { setEditing(c); setScreen('editor'); };
  const goBack = () => { setScreen('list'); setEditing(undefined); };

  if (screen === 'editor') return <EditorView initial={editing} onBack={goBack} />;
  return <ListView onNew={openNew} onOpen={openExisting} />;
}
