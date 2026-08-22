'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, ChevronLeft } from 'lucide-react';

const CATEGORIAS = [
  { key: 'CPVC',           label: 'CPVC',            desc: 'Agua caliente y fría',   bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500'    },
  { key: 'PVC Sanitario',  label: 'PVC Sanitario',   desc: 'Drenaje y desagüe',      bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500'  },
  { key: 'PVC Hidráulico', label: 'PVC Hidráulico',  desc: 'Agua a presión',         bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-700',   dot: 'bg-cyan-500'   },
  { key: 'Cobre',          label: 'Cobre',            desc: 'Instalaciones de cobre', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  { key: 'Tuboplus',       label: 'Tuboplus',         desc: 'PVC para presión',       bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  { key: 'General',        label: 'General',          desc: 'Todas las categorías',   bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-700',  dot: 'bg-slate-500'  },
];

interface CategoryPickerSheetProps {
  open: boolean;
  onClose: () => void;
  obraId?: string | null;
}

export function CategoryPickerSheet({ open, onClose, obraId }: CategoryPickerSheetProps) {
  const router = useRouter();
  const [step, setStep] = useState<'modo' | 'categoria'>('modo');

  if (!open) return null;

  const handleClose = () => {
    onClose();
    setTimeout(() => setStep('modo'), 200);
  };

  const goToTexto = () => {
    handleClose();
    router.push(`/materiales/texto${obraId ? `?obra_id=${obraId}` : ''}`);
  };

  const goToCategoria = (key: string) => {
    handleClose();
    router.push(
      `/materiales/nueva?cat=${encodeURIComponent(key)}${obraId ? `&obra_id=${obraId}` : ''}`
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-5"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'modo' ? (
          <>
            <h2 className="text-xl font-extrabold text-slate-900 text-center">¿Cómo quieres crear la lista?</h2>
            <p className="text-sm text-slate-400 mt-1 mb-5 text-center">Elige una opción</p>

            <div className="space-y-3">
              <button
                onClick={() => setStep('categoria')}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 btn-press text-left"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <Search size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-sm text-emerald-700">Búsqueda de materiales</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-tight">Arma la lista buscando en el catálogo</p>
                </div>
              </button>

              <button
                onClick={goToTexto}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50 btn-press text-left"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-bold text-sm text-indigo-700">Lista en forma de texto</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-tight">Pega un mensaje y la IA arma la lista</p>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setStep('modo')}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 active:bg-slate-100 btn-press -ml-1"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-xl font-extrabold text-slate-900 flex-1 text-center pr-8">¿Qué tipo de lista?</h2>
            </div>
            <p className="text-sm text-slate-400 mb-5 text-center">Selecciona una categoría</p>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORIAS.map(({ key, label, desc, bg, border, text, dot }) => (
                <button
                  key={key}
                  onClick={() => goToCategoria(key)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 ${bg} ${border} btn-press text-left`}
                >
                  <span className={`w-3 h-3 rounded-full ${dot}`} />
                  <div>
                    <p className={`font-bold text-sm ${text}`}>{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
