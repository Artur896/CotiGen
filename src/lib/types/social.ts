export interface Profile {
  id: string;
  nombre: string;
  email: string;
}

export interface Amigo {
  id: string;
  userId: string;
  amigoId: string;
  alias: string | null;
  status: 'pending' | 'accepted';
  createdAt: string;
  profile?: Profile;
}

export interface Colaborador {
  id: string;
  obraId: string;
  colaboradorId: string;
  invitedBy: string;
  createdAt: string;
  profile?: Profile;
  alias?: string | null;
}
