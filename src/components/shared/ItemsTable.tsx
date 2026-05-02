import { QuotationData } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface ItemsTableProps {
  data: QuotationData;
  className?: string;
}

export function ItemsTable({ data, className }: ItemsTableProps) {
  const { quotation } = data;

  if (quotation.type === 'plumbing') {
    const showPrices = quotation.showPrices !== false;
    return (
      <div className={className}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-100">
              <th className="py-4 font-bold text-sm uppercase text-gray-400">Descripción</th>
              <th className="py-4 font-bold text-sm uppercase text-gray-400 text-center">Cant.</th>
              {showPrices && (
                <th className="py-4 font-bold text-sm uppercase text-gray-400 text-right">Total</th>
              )}
            </tr>
          </thead>
          <tbody>
            {quotation.materials.map((item, index) => (
              <tr key={index} className="border-b border-slate-50">
                <td className="py-4">{item.description}</td>
                <td className="py-4 text-center">{item.quantity}</td>
                {showPrices && <td className="py-4" />}
              </tr>
            ))}
            {quotation.showLaborCost !== false && (
              <tr className="border-b border-slate-50">
                <td className="py-4 font-semibold" colSpan={2}>Costo de Mano de Obra</td>
                {showPrices && (
                  <td className="py-4 text-right font-semibold">{formatCurrency(quotation.laborCost)}</td>
                )}
              </tr>
            )}
            {quotation.showMaterialCostApprox !== false && Boolean(quotation.materialCostApprox) && quotation.materialCostApprox! > 0 && (
              <tr className="border-b border-slate-50">
                <td className="py-4 font-semibold" colSpan={2}>Costo de Material Aproximado</td>
                {showPrices && (
                  <td className="py-4 text-right font-semibold">{formatCurrency(quotation.materialCostApprox!)}</td>
                )}
              </tr>
            )}
            {Boolean(quotation.urgencyFee) && quotation.urgencyFee! > 0 && (
              <tr className="border-b border-slate-50">
                <td className="py-4 font-semibold" colSpan={2}>Tarifa de Urgencia</td>
                {showPrices && (
                  <td className="py-4 text-right font-semibold">{formatCurrency(quotation.urgencyFee!)}</td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={className}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-100">
            <th className="py-4 font-bold text-sm uppercase text-gray-400">Fase / Descripción</th>
            <th className="py-4 font-bold text-sm uppercase text-gray-400 text-right">Costo</th>
          </tr>
        </thead>
        <tbody>
          {quotation.phases.map((phase, index) => (
            <tr key={index} className="border-b border-slate-50">
              <td className="py-4">
                <div className="font-semibold">{phase.name}</div>
                <div className="text-sm text-gray-500">{phase.description}</div>
              </td>
              <td className="py-4 text-right font-medium">{formatCurrency(phase.cost)}</td>
            </tr>
          ))}
          <tr className="border-b border-slate-50">
              <td className="py-4">
                <div className="font-semibold">Tiempo de Desarrollo</div>
                <div className="text-sm text-gray-500">
                  {quotation.estimatedHours} horas @ {formatCurrency(quotation.hourlyRate)}/hr
                </div>
              </td>
              <td className="py-4 text-right font-medium">
                {formatCurrency(quotation.estimatedHours * quotation.hourlyRate)}
              </td>
            </tr>
        </tbody>
      </table>
      
      {quotation.technologies.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Tecnologías Utilizadas</h4>
          <div className="flex flex-wrap gap-2">
            {quotation.technologies.map((tech, i) => (
              <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
