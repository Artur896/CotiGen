import { QuotationData } from '@/lib/types';

interface HeaderProps {
  data: QuotationData;
  className?: string;
}

export function Header({ data, className }: HeaderProps) {
  const { quotation, date, quotationNumber } = data;
  
  return (
    <div className={className}>
      <div className="flex justify-between items-start border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tighter">Cotización</h1>
          <p className="text-gray-500 mt-1">Ref: {quotationNumber}</p>
        </div>
        <div className="text-right">
          {quotation.type === 'webdev' && (
            <h2 className="text-xl font-semibold">Servicio de Desarrollo Web</h2>
          )}
          <p className="text-gray-500">{date}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div>
          {quotation.type !== 'plumbing' && (
            <>
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">De</h3>
              <p className="font-semibold">
                {quotation.type === 'webdev' ? 'Arturo de la Cruz' : 'Cotizador Pro'}
              </p>
              <p className="text-gray-600 text-sm italic">
                {quotation.type === 'webdev' ? 'Desarrollo Web Profesional' : 'Generador de Cotizaciones'}
              </p>
            </>
          )}
        </div>
        <div className="text-right">
          {(quotation.type !== 'plumbing' || (quotation.type === 'plumbing' && quotation.showClientInfo)) && (
            <>
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">Para</h3>
              <p className="font-semibold">{quotation.client.name}</p>
              <p className="text-gray-600 text-sm whitespace-pre-line">{quotation.client.address}</p>
              <p className="text-gray-600 text-sm">{quotation.client.email}</p>
              <p className="text-gray-600 text-sm">{quotation.client.phone}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
