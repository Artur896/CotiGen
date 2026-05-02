import { PlumbingQuotation } from './plumbing';
import { WebDevQuotation } from './webdev';

export type Quotation = PlumbingQuotation | WebDevQuotation;

export type TemplateType = 'minimal' | 'corporate' | 'modern';

export interface QuotationData {
  quotation: Quotation;
  template: TemplateType;
  date: string;
  quotationNumber: string;
}
