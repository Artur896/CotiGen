import { PlumbingQuotation } from '../types/plumbing';

export const calculatePlumbingTotal = (data: Partial<PlumbingQuotation>): number => {
  if (data.isManualTotal && data.manualTotalValue !== undefined) {
    return data.manualTotalValue;
  }

  const materialsTotal = (data.materials || []).reduce(
    (acc, curr) => acc + (curr.quantity * curr.unitPrice),
    0
  );
  const labor = data.showLaborCost !== false ? (data.laborCost || 0) : 0;
  const urgency = data.urgencyFee || 0;
  const materialApprox = data.materialCostApprox || 0;

  return materialsTotal + labor + urgency + materialApprox;
}
