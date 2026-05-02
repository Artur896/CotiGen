import { QuotationData } from './types';
import { MinimalTemplate } from '@/components/templates/MinimalTemplate';
import { CorporateTemplate } from '@/components/templates/CorporateTemplate';
import { ModernTemplate } from '@/components/templates/ModernTemplate';
import React from 'react';

export const getTemplate = (data: QuotationData) => {
  switch (data.template) {
    case 'minimal':
      return React.createElement(MinimalTemplate, { data });
    case 'corporate':
      return React.createElement(CorporateTemplate, { data });
    case 'modern':
      return React.createElement(ModernTemplate, { data });
    default:
      return React.createElement(MinimalTemplate, { data });
  }
};
