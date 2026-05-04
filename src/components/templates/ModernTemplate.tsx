import { Header } from '../shared/Header';
import { ItemsTable } from '../shared/ItemsTable';
import { Footer } from '../shared/Footer';
import { QuotationExtraInfo } from '../shared/QuotationExtraInfo';
import { QuotationData } from '@/lib/types';

export function ModernTemplate({ data }: { data: QuotationData }) {
  return (
    <div className="bg-white w-[210mm] shadow-lg mx-auto font-sans text-slate-800 border border-gray-100 relative flex flex-col">
      {/* Accent Header */}
      <div className="h-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 w-full" />

      <div className="p-12 flex flex-col">
        <Header data={data} className="[&_h1]:text-transparent [&_h1]:bg-clip-text [&_h1]:bg-gradient-to-r [&_h1]:from-violet-600 [&_h1]:to-purple-600" />

        <div className="mt-12 bg-slate-50/50 p-8 rounded-2xl">
          <QuotationExtraInfo quotation={data.quotation} />
          <ItemsTable data={data} />
        </div>

        <Footer data={data} accentColor="text-violet-600" />
      </div>
    </div>
  );
}
