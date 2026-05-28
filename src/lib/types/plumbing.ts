export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface PlumbingItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PlumbingQuotation {
  type: 'plumbing';
  client: ClientInfo;
  serviceAddress: string;
  materials: PlumbingItem[];
  laborCost: number;
  urgencyFee?: number;
  materialCostApprox?: number;
  showClientInfo?: boolean;
  descripcion?: string;
  alcances?: string[];
  showLaborCost?: boolean;
  showMaterialCostApprox?: boolean;
  showPrices?: boolean;
  isManualTotal?: boolean;
  manualTotalValue?: number;
  notas?: string;
  total: number;
}
