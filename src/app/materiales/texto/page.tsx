'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, FileText } from 'lucide-react';
import { ListItem } from '@/lib/types/material';

function genLineId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const EJEMPLO = `3 tubos de 100 PVC
5 coples de 100
1 te de 100
3 codos de 100x45
1 pegamento de 1/2 l PVC
1 limpiador p/PVC
3 llaves de esfera de 25 soldable co
3 tes de 25 co
2 coples de 25 con
10 tubos de 20
10 coples de 20
2 tes de 2`;

export default function ListaTextoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = searchParams.get('obra_id');

  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExtraer = async () => {
    if (!texto.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/materiales/extraer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo extraer la lista. Intenta de nuevo.');
        return;
      }

      const items: ListItem[] = (data.items as { nombre: string; cantidad: number; unidad: string }[]).map(
        (it, i) => ({
          lineId: genLineId(),
          catalogId: `texto-${Date.now()}-${i}`,
          nombre: it.nombre,
          cantidad: it.cantidad,
          unidad: it.unidad,
        })
      );

      try {
        localStorage.setItem(
          'lista_draft_nueva',
          JSON.stringify({ nombre: '', notas: '', items })
        );
      } catch {}

      router.push(`/materiales/nueva?cat=General${obraId ? `&obra_id=${obraId}` : ''}`);
    } catch {
      setError('No se pudo contactar al servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link
            href={obraId ? `/obras/${obraId}` : '/materiales'}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 active:bg-slate-100 btn-press -ml-1"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 leading-tight">Lista en forma de texto</p>
            <p className="text-xs text-slate-400 truncate">La IA extrae los materiales por ti</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-24">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-indigo-500 shrink-0" />
            <p className="text-sm font-bold text-slate-700">Pega el mensaje de materiales</p>
          </div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={EJEMPLO}
            rows={12}
            className="input resize-none text-sm leading-relaxed"
          />
          <p className="text-xs text-slate-400 mt-2">
            Ejemplo: &quot;3 tubos de 100 PVC&quot;, &quot;5 coples de 100&quot;, &quot;1 te de 100&quot;… una línea por material.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-3">
            {error}
          </div>
        )}

        <button
          onClick={handleExtraer}
          disabled={!texto.trim() || loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold btn-press disabled:opacity-40 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Extrayendo materiales...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Extraer con IA
            </>
          )}
        </button>
      </main>
    </div>
  );
}
