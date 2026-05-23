// ============================================================
//  Modelo de status da aplicação
// ============================================================

export type AppStatusKey = 'production' | 'maintenance' | 'offline';

export interface AppStatus {
  status:       AppStatusKey;
  since:        string;          // ISO string — quando o status foi definido
  /** ISO string | null — null = previsão indeterminada */
  eta:          string | null;
  /** Mensagem opcional exibida na tela de bloqueio */
  message:      string;
  updatedBy:    string;          // UID do admin
  updatedByName: string;
}

export const APP_STATUS_CONFIG: Record<AppStatusKey, {
  label:      string;
  icon:       string;
  color:      string;           // CSS var ou valor hex
  blockApp:   boolean;          // se true, bloqueia a aplicação para não-admins
}> = {
  production: {
    label:    'Em Produção',
    icon:     '✅',
    color:    '#68d391',
    blockApp: false,
  },
  maintenance: {
    label:    'Em Manutenção',
    icon:     '🔧',
    color:    '#f6ad55',
    blockApp: true,
  },
  offline: {
    label:    'Fora do Ar',
    icon:     '🚫',
    color:    '#fc8181',
    blockApp: true,
  },
};
