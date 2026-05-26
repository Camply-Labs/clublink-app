// ============================================================
//  MODELO DE EVENTOS DA AGENDA
// ============================================================

export type EventSource = 'manual' | 'import' | 'birthday';

export interface AgendaEvent {
  id:          string;
  title:       string;
  /** ISO string (pode conter apenas data YYYY-MM-DD para allDay) */
  start:       string;
  /** ISO string opcional — undefined para eventos de dia inteiro sem fim */
  end?:        string;
  allDay:      boolean;
  description: string;
  location:    string;
  /** Cor hex exibida no calendário */
  color:       string;
  /** true = visível apenas para diretoria */
  isPrivate:   boolean;
  source:      EventSource;
  /** Hash SHA-256 do arquivo .ics de origem (apenas source=import) */
  importHash?:    string;
  importedAt?:    string;  // ISO string
  importedBy?:    string;  // UID
  importedByName?: string;
  /** Nome original do arquivo importado */
  importFile?:    string;
  createdAt?:  string;
  createdBy?:  string;
}

export interface ImportLog {
  id?:         string;
  filename:    string;
  hash:        string;
  importedAt:  string;
  importedBy:  string;
  importedByName: string;
  eventCount:  number;
}

export interface AgendaEventPayload {
  title:       string;
  start:       string;
  end?:        string;
  allDay:      boolean;
  description: string;
  location:    string;
  color:       string;
  isPrivate:   boolean;
}

export const EVENT_COLORS = [
  { label: 'Dourado',   value: '#c9a84c' },
  { label: 'Azul',      value: '#4299e1' },
  { label: 'Verde',     value: '#48bb78' },
  { label: 'Vermelho',  value: '#fc5252' },
  { label: 'Roxo',      value: '#9f7aea' },
  { label: 'Laranja',   value: '#ed8936' },
  { label: 'Rosa',      value: '#f687b3' },
  { label: 'Cinza',     value: '#a0aec0' },
];
