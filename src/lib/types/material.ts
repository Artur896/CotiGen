export interface CatalogItem {
  id: string;
  nombre: string;
  unidad: string;
  categoria: string;
}

export interface ListItem {
  lineId: string;
  catalogId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface Obra {
  id: string;
  nombre: string;
  createdAt: string;
}

export interface MaterialList {
  id: string;
  numero: number;
  nombre: string;
  cliente: string;
  telefono: string;
  fecha: string;
  notas: string;
  items: ListItem[];
  obraId: string | null;
  revision: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export type CreateListInput = Omit<MaterialList, 'id' | 'numero' | 'createdAt' | 'updatedAt' | 'revision'>;
