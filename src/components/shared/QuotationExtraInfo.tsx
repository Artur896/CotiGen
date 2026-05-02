import { Quotation } from '@/lib/types';

interface QuotationExtraInfoProps {
  quotation: Quotation;
  className?: string;
}

export function QuotationExtraInfo({ quotation, className }: QuotationExtraInfoProps) {
  // We only show these if they're available (mainly for plumbing as per request)
  // but architecturally it works for any type that has these fields.
  
  const hasDescription = 'descripcion' in quotation && quotation.descripcion;
  const hasAlcances = 'alcances' in quotation && quotation.alcances && quotation.alcances.length > 0;

  if (!hasDescription && !hasAlcances) return null;

  return (
    <div className={`space-y-6 mb-10 ${className}`}>
      {hasDescription && (
        <div className="break-inside-avoid">
          <h3 className="text-sm font-bold uppercase text-gray-400 mb-3 tracking-wider">Descripción del trabajo</h3>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed text-sm">
            {'descripcion' in quotation && quotation.descripcion}
          </p>
        </div>
      )}

      {hasAlcances && (
        <div className="break-inside-avoid">
          <h3 className="text-sm font-bold uppercase text-gray-400 mb-3 tracking-wider">Alcances</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
            {('alcances' in quotation && quotation.alcances || []).map((alcance, i) => (
              <li key={i} className="pl-2">{alcance}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
