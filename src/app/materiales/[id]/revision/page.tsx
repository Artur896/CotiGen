'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLists } from '@/lib/store/useLists';
import { MaterialList } from '@/lib/types/material';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';

type PageParams = { id: string };

export default function RevisionPage({ params }: { params: Promise<PageParams> }) {
  const { id } = use(params);
  const router = useRouter();
  const { ready, getById } = useLists();
  
  const [list, setList] = useState<MaterialList | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const existing = getById(id);
    if (!existing) {
      router.replace('/materiales');
      return;
    }
    setList(existing);
    
    // Load state from local storage
    try {
      const saved = localStorage.getItem(`revision-${id}`);
      if (saved) setCheckedItems(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
    
    setLoaded(true);
  }, [id, ready, getById, router]);

  const toggleCheck = (lineId: string) => {
    setCheckedItems(prev => {
      const next = { ...prev, [lineId]: !prev[lineId] };
      localStorage.setItem(`revision-${id}`, JSON.stringify(next));
      return next;
    });
  };
  
  const resetChecks = () => {
    if (confirm('¿Deseas reiniciar la revisión?')) {
      setCheckedItems({});
      localStorage.removeItem(`revision-${id}`);
    }
  };

  if (!loaded || !list) return <LoadingScreen />;

  const total = list.items.length;
  const checkedCount = list.items.filter(i => checkedItems[i.lineId]).length;
  const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="px-3 h-14 flex items-center gap-2">
          <Link href="/materiales" className="w-9 h-9 flex items-center justify-center text-slate-400 btn-press rounded-xl active:bg-slate-100 shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm leading-tight truncate">
              Revisión de Material
            </p>
            <p className="text-xs text-slate-400 leading-tight truncate">
              {list.nombre || `Lista #${String(list.numero).padStart(2, '0')}`}
            </p>
          </div>
          {checkedCount > 0 && (
            <button 
              onClick={resetChecks}
              className="text-xs font-bold text-slate-400 active:text-slate-600 px-2 py-1 btn-press"
            >
              Reiniciar
            </button>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Progreso</span>
            <span className="text-xs font-bold text-emerald-600">{checkedCount} / {total} ({progress}%)</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-2" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        {list.items.map(item => {
          const isChecked = !!checkedItems[item.lineId];
          return (
            <button
              key={item.lineId}
              onClick={() => toggleCheck(item.lineId)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-colors btn-press ${
                isChecked 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-white border-slate-100 active:bg-slate-50'
              }`}
            >
              <div className="shrink-0">
                {isChecked ? (
                  <CheckCircle2 size={24} className="text-emerald-500" />
                ) : (
                  <Circle size={24} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-tight mb-0.5 ${isChecked ? 'text-emerald-900 line-through opacity-70' : 'text-slate-900'}`}>
                  {item.nombre}
                </p>
                <p className={`text-xs ${isChecked ? 'text-emerald-600 opacity-70' : 'text-slate-400'}`}>
                  {item.cantidad} {item.unidad}
                </p>
              </div>
            </button>
          );
        })}
      </main>
    </div>
  );
}
