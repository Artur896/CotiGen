import { Header } from '../shared/Header';
import { ItemsTable } from '../shared/ItemsTable';
import { Footer } from '../shared/Footer';
import { QuotationExtraInfo } from '../shared/QuotationExtraInfo';

export function MinimalTemplate({ data }: { data: QuotationData }) {
  return (
    <div className="bg-white p-12 w-[210mm] shadow-lg mx-auto font-sans text-slate-900 border border-gray-100 flex flex-col">
      <Header data={data} />
      <div className="mt-12">
        <QuotationExtraInfo quotation={data.quotation} />
        <ItemsTable data={data} />
      </div>
      <Footer data={data} />
    </div>
  );
}
