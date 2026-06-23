// ============================================================
//  MODELOS DE DOMÍNIO
// ============================================================

export type UserRole = 'desbravador' | 'diretoria';

// ── Permissões granulares (apenas diretoria) ─────────────────
export type PermissionKey =
  | 'podium.view'
  | 'members.view'   | 'members.edit'   | 'members.delete'
  | 'appointments.view' | 'appointments.edit'
  | 'register.view'  | 'register.edit'
  | 'agenda.view'    | 'agenda.edit'
  | 'scoring.view'  | 'scoring.edit'
  | 'notices.view'  | 'notices.edit'
  | 'admin.view';

export const ALL_PERMISSIONS: { key: PermissionKey; label: string; group: string }[] = [
  { key: 'podium.view',        label: 'Visualizar Ranking',      group: 'Ranking'      },
  { key: 'members.view',       label: 'Visualizar Membros',      group: 'Membros'      },
  { key: 'members.edit',       label: 'Editar Membros',          group: 'Membros'      },
  { key: 'members.delete',     label: 'Remover Membros',         group: 'Membros'      },
  { key: 'appointments.view',  label: 'Visualizar Apontamentos', group: 'Apontamentos' },
  { key: 'appointments.edit',  label: 'Realizar Apontamentos',   group: 'Apontamentos' },
  { key: 'register.view',      label: 'Visualizar Cadastro',     group: 'Cadastro'     },
  { key: 'register.edit',      label: 'Criar Cadastros',         group: 'Cadastro'     },
  { key: 'agenda.view',        label: 'Visualizar Agenda',       group: 'Agenda'       },
  { key: 'agenda.edit',        label: 'Editar Agenda',           group: 'Agenda'       },
  { key: 'scoring.view',       label: 'Visualizar Pontuações',   group: 'Pontuações'   },
  { key: 'scoring.edit',       label: 'Gerenciar Pontuações',    group: 'Pontuações'   },
  { key: 'notices.view',       label: 'Visualizar Avisos',       group: 'Avisos'       },
  { key: 'notices.edit',       label: 'Gerenciar Avisos',        group: 'Avisos'       },
  { key: 'admin.view',         label: 'Gerenciar Permissões',    group: 'Admin'        },
];

export interface User {
  uid:            string;
  name:           string;
  email:          string;
  unit:           string;
  position:       string;
  role:           UserRole;
  points:         number;
  photoUrl:       string;
  /** Data de nascimento ISO string (YYYY-MM-DD) */
  birth?:         string;
  googleUid?:     string;
  isAdmin?:       boolean;
  permissions?:   PermissionKey[];
  createdAt?:     Date;
  createdBy?:     string;
  lastUpdate?:    Date;
  lastUpdatedBy?: string;
}

export interface HistoryEntry {
  id?:          string;
  type:         'add' | 'reset';
  delta:        number;
  finalPoints:  number;
  description:  string;
  updatedBy:    string;
  timestamp:    Date;
}

export interface AppointmentPayload {
  targetUid:    string;
  type:         'add' | 'reset';
  value:        number;
  description:  string;
  directorName: string;
}

export interface CreateUserPayload {
  name:         string;
  unit:         string;
  position:     string;
  email:        string;
  password:     string;
  role:         UserRole;
  points:       number;
  photoUrl:     string;
  birth?:       string;
  isAdmin?:     boolean;
  permissions?: PermissionKey[];
}

export interface UpdateProfilePayload {
  name:         string;
  unit:         string;
  position:     string;
  photoUrl:     string;
  birth?:       string;
  isAdmin?:     boolean;
  permissions?: PermissionKey[];
}

export interface ToastMessage {
  id:      number;
  message: string;
  type:    'success' | 'error' | 'info';
}
