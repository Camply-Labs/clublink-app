// ============================================================
//  MODELO DE NOTIFICAÇÕES
//  Publicado por serviço externo na coleção `notifications`.
//  O Angular apenas lê — nunca escreve nesta coleção.
// ============================================================

export type NotificationChannel  = 'PUSH' | 'IN_APP';
export type NotificationTargetType = 'GLOBAL' | 'DESBRAVADOR' | 'DIRETORIA';
export type NotificationType     = 'NOTICE' | 'APPOINTMENT' | 'AGENDA' | 'SYSTEM';
export type NotificationEnvironment = 'PROD' | 'DEV';

export interface NotificationTarget {
  type:    NotificationTargetType;
  members: string[];
}

export interface AppNotification {
  id:          string;
  title:       string;
  message:     string;
  route:       string;
  channels:    NotificationChannel[];
  target:      NotificationTarget;
  type:        NotificationType;
  readBy?:     { [uid: string]: NotificationRead }; // IDs dos usuários que já leram a notificação
  environment: NotificationEnvironment;
  createdAt?:  string; // ISO string — preenchido pelo serviço externo
}

/**
 * Sub-collection: users/{uid}/notification_reads/{notifId}
 * Criado pelo Angular ao marcar uma notificação como lida.
 */
export interface NotificationRead {
  readAt: string; // ISO string
}
