import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IEventRepository } from '../repositories/event.repository';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { IcsService } from './ics.service';
import { PermissionService } from './permission.service';
import { AgendaEvent, AgendaEventPayload, ImportLog } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly repo       = inject(IEventRepository);
  private readonly auth       = inject(AuthService);
  private readonly userSvc    = inject(UserService);
  private readonly icsSvc     = inject(IcsService);
  private readonly permSvc    = inject(PermissionService);
  private readonly destroyRef = inject(DestroyRef);

  /** Cache reativo de todos os eventos */
  readonly events = signal<AgendaEvent[]>([]);

  constructor() {
    this.repo.watchAll(this.permSvc.isDirector())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => this.events.set(list));
  }

  /**
   * Retorna eventos visíveis para o usuário atual.
   * Desbravadores não veem eventos privados.
   */
  visibleEvents(): AgendaEvent[] {
    const canSeePrivate = this.permSvc.isDirector();
    return this.events().filter(ev => !ev.isPrivate || canSeePrivate);
  }

  create(payload: AgendaEventPayload): Promise<string> {
    const uid = this.auth.currentUser()?.uid ?? '';
    return this.repo.create(payload, uid);
  }

  update(id: string, payload: AgendaEventPayload): Promise<void> {
    return this.repo.update(id, payload);
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }

  listImportLogs(): Promise<ImportLog[]> {
    return this.repo.listImportLogs();
  }

  // ── Importação de .ics ────────────────────────────────────

  async importFromFile(file: File): Promise<{ count: number; hash: string }> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Não autenticado.');

    const { events: parsed, hash, filename } = await this.icsSvc.parseFile(file);

    // Converte eventos parseados para AgendaEvent completo
    const importedEvents: AgendaEvent[] = parsed.map(ev => ({
      id:             '',
      title:          ev.title          ?? 'Sem título',
      start:          ev.start          ?? new Date().toISOString(),
      end:            ev.end,
      allDay:         ev.allDay         ?? false,
      description:    ev.description    ?? '',
      location:       ev.location       ?? '',
      color:          ev.color          ?? '#4299e1',
      isPrivate:      ev.isPrivate      ?? false,
      source:         'import',
      importHash:     hash,
      importedAt:     new Date().toISOString(),
      importedBy:     user.uid,
      importedByName: user.name || user.email,
      importFile:     filename,
    }));

    // Gera eventos de aniversário de todos os membros
    const birthdayEvents = this.generateBirthdayEvents(hash, filename, user.uid, user.name || user.email);

    const allNewEvents = [...importedEvents, ...birthdayEvents];

    const importLog: Omit<ImportLog, 'id'> = {
      filename,
      hash,
      importedAt:      new Date().toISOString(),
      importedBy:      user.uid,
      importedByName:  user.name || user.email,
      eventCount:      allNewEvents.length,
    };

    await this.repo.importEvents(allNewEvents, importLog);
    return { count: allNewEvents.length, hash };
  }

  private generateBirthdayEvents(
    hash: string,
    filename: string,
    importedBy: string,
    importedByName: string,
  ): AgendaEvent[] {
    const currentYear = new Date().getFullYear();
    const events: AgendaEvent[] = [];

    for (const user of this.userSvc.getAll()) {
      if (!user.birth) continue;

      // Gera o aniversário para o ano corrente e o próximo
      for (const year of [currentYear, currentYear + 1]) {
        const dateStr = `${year}-${user.birth.slice(5, 10)}`; // MM-DD do birth
        events.push({
          id:             '',
          title:          `🎂 Aniversário de ${user.name}`,
          start:          `${dateStr}`,
          allDay:         true,
          description:    `Aniversário de ${user.name} (${user.unit}${user.position ? ' · ' + user.position : ''})`,
          location:       '',
          color:          '#f687b3',
          isPrivate:      false,
          source:         'birthday',
          importHash:     hash,
          importedAt:     new Date().toISOString(),
          importedBy,
          importedByName,
          importFile:     filename,
        });
      }
    }

    return events;
  }

  // ── Exportação de .ics ────────────────────────────────────

  exportToIcs(events: AgendaEvent[]): void {
    const date    = new Date().toISOString().slice(0, 10);
    const content = this.icsSvc.generate(events);
    this.icsSvc.downloadIcs(content, `garras-de-aguia_agenda_${date}.ics`);
  }
}
