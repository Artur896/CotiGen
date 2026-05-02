import { Header } from '../shared/Header';
import { ItemsTable } from '../shared/ItemsTable';
import { Footer } from '../shared/Footer';
import { QuotationExtraInfo } from '../shared/QuotationExtraInfo';

export function CorporateTemplate({ data }: { data: QuotationData }) {
  return (
    <div className="bg-white w-[210mm] shadow-lg mx-auto font-serif text-slate-900 overflow-hidden relative border border-gray-100 flex flex-col">
      {/* Visual background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-900 opacity-5 -mr-16 -mt-16 rotate-45" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900 opacity-5 -ml-32 -mb-32 rounded-full" />

      <div className="p-16 relative z-10 flex flex-col">
        <div className="border-l-8 border-blue-900 pl-6 mb-12">
          <Header data={data} />
        </div>

        <div className="mt-12">
          <QuotationExtraInfo quotation={data.quotation} />
          <ItemsTable data={data} />
        </div>

        <Footer data={data} accentColor="text-blue-900" />
      </div>
    </div>
  );
}
