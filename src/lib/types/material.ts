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

export interface MaterialList {
  id: string;
  numero: number;
  nombre: string;
  cliente: string;
  telefono: string;
  fecha: string;
  notas: string;
  items: ListItem[];
  createdAt: string;
  updatedAt: string;
}

export type CreateListInput = Omit<MaterialList, 'id' | 'numero' | 'createdAt' | 'updatedAt'>;
