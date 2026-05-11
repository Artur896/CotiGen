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

export type NotificacionTipo = 'friend_request' | 'friend_accepted' | 'obra_compartida';

export interface Notificacion {
  id: string;
  userId: string;
  tipo: NotificacionTipo;
  titulo: string;
  cuerpo: string | null;
  data: Record<string, string>;
  leida: boolean;
  createdAt: string;
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
