import { QuotationData } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface FooterProps {
  data: QuotationData;
  className?: string;
  accentColor?: string;
}

export function Footer({ data, className, accentColor = 'bg-black' }: FooterProps) {
  const { quotation } = data;

  return (
    <div className={className}>
      <div className="flex justify-end pt-8">
        <div className="w-64">
          {quotation.type !== 'plumbing' && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="font-semibold text-gray-800">{formatCurrency(quotation.total)}</span>
            </div>
          )}
          <div className="flex justify-between py-4">
            <span className="text-xl font-bold uppercase tracking-wider">Total</span>
            <span className={ `text-2xl font-bold ${accentColor === 'bg-black' ? 'text-black' : 'text-blue-600'}`}>
              {formatCurrency(quotation.total)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-16 border-t pt-8 text-center text-gray-400 text-xs">
        <p></p>
        <p className="mt-2 font-semibold text-gray-500 italic"></p>
      </div>
    </div>
  );
}
