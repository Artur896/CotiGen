import { WebDevQuotation } from '../types/webdev';

export const calculateWebDevTotal = (data: Partial<WebDevQuotation>): number => {
  const phasesTotal = (data.phases || []).reduce(
    (acc, curr) => acc + (curr.cost || 0),
    0
  );
  
  // Total can be sum of phases OR hours * rate. 
  // For this model, let's say phases determine the cost, and hours/rate are for info.
  // Or maybe it's whichever is greater? Let's stick to phases total for simplicity or sum both if required.
  // Requirement says: phases (list), hours, rate.
  // Let's assume hourly rate * hours + phases.
  
  const estimatedTotal = (data.estimatedHours || 0) * (data.hourlyRate || 0);
  
  return phasesTotal + estimatedTotal;
};
