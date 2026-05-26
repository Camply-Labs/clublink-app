import { Observable } from 'rxjs';
import { AgendaEvent, AgendaEventPayload, ImportLog } from '../models/event.model';

export abstract class IEventRepository {
  /** Stream em tempo real de todos os eventos */
  abstract watchAll(isPrivate?: boolean): Observable<AgendaEvent[]>;
  /** Cria um evento manualmente */
  abstract create(payload: AgendaEventPayload, createdBy: string): Promise<string>;
  /** Atualiza um evento existente */
  abstract update(id: string, payload: AgendaEventPayload): Promise<void>;
  /** Remove um evento */
  abstract delete(id: string): Promise<void>;
  /**
   * Importação de eventos .ics:
   * 1. Remove todos os eventos de source=import ou source=birthday
   * 2. Insere os novos eventos
   * 3. Registra o log de importação
   */
  abstract importEvents(
    events:    AgendaEvent[],
    importLog: Omit<ImportLog, 'id'>,
  ): Promise<void>;
  /** Lista os logs de importação */
  abstract listImportLogs(): Promise<ImportLog[]>;
}
