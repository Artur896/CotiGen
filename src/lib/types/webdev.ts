export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ProjectPhase {
  name: string;
  description: string;
  cost: number;
}

export interface WebDevQuotation {
  type: 'webdev';
  client: ClientInfo;
  projectDescription: string;
  phases: ProjectPhase[];
  estimatedHours: number;
  hourlyRate: number;
  technologies: string[];
  total: number;
}
