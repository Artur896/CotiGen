'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Download, Eye, PenLine, Plus, Trash2, ChevronDown, FileText } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import { downloadPDFBlob } from '@/lib/pdf';

interface LineItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precio: number;
}

interface ClientInfo {
  nombre: string;
  telefono: string;
  direccion: string;
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyLine(): LineItem {
  return { id: genId(), descripcion: '', cantidad: 1, precio: 0 };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

const TEMPLATES = [
  { value: 'minimal',   label: 'Mínimo'      },
  { value: 'corporate', label: 'Corporativo' },
  { value: 'modern',    label: 'Moderno'     },
];

export default function EditorPage() {
  const [client, setClient] = useState<ClientInfo>({ nombre: '', telefono: '', direccion: '' });
  const [notas, setNotas] = useState('');
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [template, setTemplate] = useState('minimal');
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quotationNumber, setQuotationNumber] = useState('');
  const [fecha, setFecha] = useState('');
  const { success } = useToast();

  useEffect(() => {
    setQuotationNumber(`COT-${Math.floor(1000 + Math.random() * 9000)}`);
    setFecha(new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }));
  }, []);

  const total = lines.reduce((s, l) => s + l.cantidad * l.precio, 0);

  const updateLine = (id: string, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const removeLine = (id: string) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation: {
            type: 'plumbing',
            client: { name: client.nombre, email: '', phone: client.telefono, address: client.direccion },
            serviceAddress: client.direccion,
            materials: lines.map((l) => ({ description: l.descripcion, quantity: l.cantidad, unitPrice: l.precio })),
            laborCost: 0,
            urgencyFee: 0,
            showClientInfo: true,
            showLaborCost: false,
            descripcion: notas,
            alcances: [],
            total,
          },
          template,
          date: fecha,
          quotationNumber,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        await downloadPDFBlob(blob, `cotizacion-${quotationNumber}.pdf`);
        success('Descarga completa');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="px-3 h-14 flex items-center gap-2">
          <FileText size={18} className="text-indigo-600 shrink-0" />
          <span className="font-bold text-slate-900 flex-1 text-sm truncate">Cotizaciones</span>

          {/* Template */}
          <div className="relative shrink-0">
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="appearance-none bg-slate-100 text-slate-700 font-bold text-xs py-2.5 pl-2.5 pr-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 max-w-22.5"
            >
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-1 bg-indigo-600 active:bg-indigo-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold btn-press disabled:opacity-50 shrink-0"
          >
            {isGenerating
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Download size={14} />}
            PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-slate-100">
          {(['form', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold border-b-2 btn-press transition-colors ${
                activeTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400'
              }`}
            >
              {tab === 'form' ? <><PenLine size={15} /> Formulario</> : <><Eye size={15} /> Vista Previa</>}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-nav">
        {activeTab === 'form' ? (
          <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">

            {/* Client info */}
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

            {/* Line items */}
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
                <button onClick={() => setLines((p) => [...p, emptyLine()])} className="flex items-center gap-1 text-sm font-bold text-indigo-600 active:text-indigo-700 btn-press">
                  <Plus size={16} /> Agregar
                </button>
              </div>

              <div className="divide-y divide-slate-50">
                {lines.map((line, idx) => (
                  <div key={line.id} className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 w-5 shrink-0">{idx + 1}</span>
                      <input
                        type="text"
                        value={line.descripcion}
                        onChange={(e) => updateLine(line.id, { descripcion: e.target.value })}
                        placeholder="Descripción del concepto..."
                        className="input flex-1"
                      />
                      <button onClick={() => removeLine(line.id)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 active:bg-red-50 active:text-red-400 btn-press shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex gap-2 pl-7">
                      <label className="flex-1">
                        <span className="text-xs text-slate-400 mb-1 block">Cant.</span>
                        <input
                          type="number" min={1} value={line.cantidad}
                          onChange={(e) => updateLine(line.id, { cantidad: parseFloat(e.target.value) || 1 })}
                          className="input text-center"
                        />
                      </label>
                      <label className="flex-2">
                        <span className="text-xs text-slate-400 mb-1 block">Precio unitario</span>
                        <input
                          type="number" min={0} step={0.01} value={line.precio}
                          onChange={(e) => updateLine(line.id, { precio: parseFloat(e.target.value) || 0 })}
                          className="input"
                        />
                      </label>
                      <div className="flex-2">
                        <span className="text-xs text-slate-400 mb-1 block">Subtotal</span>
                        <div className="input bg-slate-50 text-slate-700 font-semibold">
                          {formatCurrency(line.cantidad * line.precio)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="px-4 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total</span>
                <span className="text-2xl font-extrabold text-slate-900">{formatCurrency(total)}</span>
              </div>
            </section>

            {/* Notes */}
            <section className="bg-white rounded-2xl border border-slate-100 p-4">
              <label className="block">
                <span className="font-bold text-slate-900 mb-2 block">Notas</span>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Condiciones, garantías, tiempo de entrega..."
                  rows={3}
                  className="input resize-none"
                />
              </label>
            </section>

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full py-4 rounded-2xl font-bold text-white bg-indigo-600 active:bg-indigo-700 btn-press disabled:opacity-50 flex items-center justify-center gap-3 text-base"
            >
              {isGenerating
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Download size={20} />}
              {isGenerating ? 'Generando PDF...' : 'Descargar Cotización PDF'}
            </button>
          </div>
        ) : (
          /* Preview tab */
          <PreviewTab
            client={client}
            lines={lines}
            notas={notas}
            total={total}
            template={template}
            fecha={fecha}
            quotationNumber={quotationNumber}
          />
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function PreviewTab({
  client, lines, notas, total, template, fecha, quotationNumber,
}: {
  client: ClientInfo;
  lines: LineItem[];
  notas: string;
  total: number;
  template: string;
  fecha: string;
  quotationNumber: string;
}) {
  const COLORS: Record<string, { header: string; accent: string }> = {
    minimal:   { header: '#1e293b', accent: '#6366f1' },
    corporate: { header: '#1e3a5f', accent: '#1d4ed8' },
    modern:    { header: '#4f46e5', accent: '#7c3aed' },
  };
  const c = COLORS[template] ?? COLORS.minimal;

  return (
    <div className="px-4 py-4">
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-5 py-5" style={{ backgroundColor: c.header }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Cotización</p>
              <p className="text-white text-2xl font-extrabold">{quotationNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs mb-1">{fecha}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Client */}
          {client.nombre && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Cliente</p>
              <p className="font-bold text-slate-900">{client.nombre}</p>
              {client.telefono && <p className="text-sm text-slate-500">{client.telefono}</p>}
              {client.direccion && <p className="text-sm text-slate-500">{client.direccion}</p>}
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Conceptos</p>
            <div className="space-y-1">
              {lines.filter(l => l.descripcion).map((l) => (
                <div key={l.id} className="flex justify-between items-baseline py-1.5 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{l.descripcion}</p>
                    <p className="text-xs text-slate-400">{l.cantidad} × {formatCurrency(l.precio)}</p>
                  </div>
                  <p className="font-semibold text-slate-700 text-sm shrink-0 ml-4">{formatCurrency(l.cantidad * l.precio)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900">
            <span className="font-bold text-slate-900">TOTAL</span>
            <span className="text-xl font-extrabold" style={{ color: c.accent }}>{formatCurrency(total)}</span>
          </div>

          {/* Notes */}
          {notas && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Notas</p>
              <p className="text-sm text-slate-600">{notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
