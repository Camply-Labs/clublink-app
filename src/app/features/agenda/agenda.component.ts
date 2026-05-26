import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin  from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin     from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale    from '@fullcalendar/core/locales/pt-br';

import { EventService } from '../../core/services/event.service';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { AgendaEvent, AgendaEventPayload, EVENT_COLORS, ImportLog } from '../../core/models/event.model';

type ModalMode = 'create' | 'edit' | 'view';

@Component({
  selector: 'app-agenda',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'agenda.component.scss',
  imports: [FormsModule, FullCalendarModule, ModalComponent, SpinnerComponent],
  template: `
    <div class="section-header">
      <h2 class="section-title">📅 Agenda</h2>
      <div class="agenda-actions">
        @if (permSvc.can('agenda.edit')) {
          <button class="btn btn-secondary btn-sm" (click)="icsInput.click()">
            📥 Importar .ics
          </button>
          <input #icsInput type="file" accept=".ics,text/calendar"
                 style="display:none;" (change)="onIcsImport($event)" />
          <button class="btn btn-secondary btn-sm" (click)="exportIcs()">
            📤 Exportar .ics
          </button>
          <button class="btn btn-primary btn-sm" (click)="openCreate()">
            ➕ Novo Evento
          </button>
        }
      </div>
    </div>

    <!-- Log de importações (recolhível) -->
    @if (permSvc.can('agenda.edit') && importLogs().length > 0) {
      <div class="import-log-bar" (click)="showLogs.set(!showLogs())">
        <span>📋 {{ importLogs().length }} importação(ões) registrada(s)</span>
        <span class="log-toggle">{{ showLogs() ? '▲' : '▼' }}</span>
      </div>
      @if (showLogs()) {
        <div class="import-log-list">
          @for (log of importLogs(); track log.id) {
            <div class="import-log-item">
              <span class="log-file">📄 {{ log.filename }}</span>
              <span class="log-meta">
                {{ log.eventCount }} eventos · {{ formatDate(log.importedAt) }}
                · por {{ log.importedByName }}
              </span>
              <span class="log-hash" title="SHA-256: {{ log.hash }}">
                #{{ log.hash.slice(0, 8) }}
              </span>
            </div>
          }
        </div>
      }
    }

    <!-- Indicador de importação em progresso -->
    @if (importing()) {
      <div class="importing-bar">
        <app-spinner [small]="true" />
        <span>Importando calendário…</span>
      </div>
    }

    <!-- FullCalendar -->
    <div class="calendar-wrapper">
      <full-calendar [options]="calendarOptions()" />
    </div>

    <!-- ── Modal: Criar / Editar / Visualizar Evento ───────── -->
    <app-modal
      [title]="modalTitle()"
      [open]="modalOpen()"
      (closed)="closeModal()"
    >
      @if (modalMode() === 'view' && viewEvent(); as ev) {
        <!-- Visualização -->
        <div class="event-view">
          <div class="event-view-color" [style.background]="ev.color"></div>
          <div class="event-view-body">
            <div class="event-view-title">{{ ev.title }}</div>
            @if (ev.isPrivate) {
              <span class="event-private-badge">🔒 Privado</span>
            }
            <div class="event-view-dates">
              <span>{{ formatDate(ev.start) }}</span>
              @if (ev.end) { <span> → {{ formatDate(ev.end) }}</span> }
            </div>
            @if (ev.description) {
              <div class="event-view-desc">{{ ev.description }}</div>
            }
            @if (ev.location) {
              <div class="event-view-location">📍 {{ ev.location }}</div>
            }
            <div class="event-view-source">
              Origem:
              @if (ev.source === 'birthday') { 🎂 Aniversário }
              @else if (ev.source === 'import') {
                📥 Importado ({{ ev.importFile }})
              }
              @else { ✏️ Criado manualmente }
            </div>
          </div>
        </div>

        <div class="modal-footer">
          @if (permSvc.can('agenda.edit')) {
            <button class="btn btn-danger btn-sm"
                    [disabled]="deleting()"
                    (click)="deleteEvent(ev.id)">
              {{ deleting() ? 'Excluindo…' : '🗑 Excluir' }}
            </button>
            <button class="btn btn-secondary btn-sm" (click)="openEdit(ev)">
              ✏️ Editar
            </button>
          }
          <button class="btn btn-secondary" (click)="closeModal()">Fechar</button>
        </div>
      }

      @if (modalMode() === 'create' || modalMode() === 'edit') {
        <!-- Formulário -->
        <div class="form-group">
          <label class="form-label">Título *</label>
          <input type="text" class="form-control" placeholder="Nome do evento"
                 [(ngModel)]="form.title" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Data de início *</label>
            <input type="datetime-local" class="form-control"
                   [(ngModel)]="form.start" />
          </div>
          <div class="form-group">
            <label class="form-label">Data de término</label>
            <input type="datetime-local" class="form-control"
                   [(ngModel)]="form.end" />
          </div>
        </div>

        <div class="form-group">
          <label class="all-day-toggle" [class.active]="form.allDay">
            <input type="checkbox" [(ngModel)]="form.allDay" />
            <span class="toggle-box">{{ form.allDay ? '✓' : '' }}</span>
            <span>Evento de dia inteiro</span>
          </label>
        </div>

        <div class="form-group">
          <label class="form-label">Descrição</label>
          <textarea class="form-control" rows="2" placeholder="Detalhes do evento"
                    [(ngModel)]="form.description" style="resize:vertical;"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Local</label>
          <input type="text" class="form-control" placeholder="Endereço ou local"
                 [(ngModel)]="form.location" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cor</label>
            <div class="color-picker">
              @for (c of eventColors; track c.value) {
                <button class="color-dot"
                        [style.background]="c.value"
                        [class.selected]="form.color === c.value"
                        [title]="c.label"
                        type="button"
                        (click)="form.color = c.value">
                </button>
              }
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="private-toggle" [class.active]="form.isPrivate">
            <input type="checkbox" [(ngModel)]="form.isPrivate" />
            <span class="toggle-box">{{ form.isPrivate ? '✓' : '' }}</span>
            <div>
              <div class="toggle-label">🔒 Evento privado</div>
              <div class="toggle-hint">Visível apenas para a diretoria</div>
            </div>
          </label>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary"
                  [disabled]="saving()"
                  (click)="saveEvent()">
            {{ saving() ? 'Salvando…' : (modalMode() === 'edit' ? '💾 Salvar' : '➕ Criar') }}
          </button>
        </div>
      }
    </app-modal>
  `,
})
export class AgendaComponent implements OnInit {
  private readonly eventSvc = inject(EventService);
  readonly permSvc          = inject(PermissionService);
  private readonly auth     = inject(AuthService);
  private readonly toast    = inject(ToastService);

  readonly eventColors = EVENT_COLORS;

  // ── Estado ─────────────────────────────────────────────────
  readonly importing  = signal(false);
  readonly saving     = signal(false);
  readonly deleting   = signal(false);
  readonly showLogs   = signal(false);
  readonly importLogs = signal<ImportLog[]>([]);

  // ── Modal ──────────────────────────────────────────────────
  readonly modalOpen  = signal(false);
  readonly modalMode  = signal<ModalMode>('view');
  readonly viewEvent  = signal<AgendaEvent | null>(null);
  readonly editTarget = signal<AgendaEvent | null>(null);

  readonly modalTitle = computed(() => {
    if (this.modalMode() === 'create') return '➕ Novo Evento';
    if (this.modalMode() === 'edit')   return '✏️ Editar Evento';
    return this.viewEvent()?.title ?? 'Evento';
  });

  // ── Formulário ─────────────────────────────────────────────
  form: AgendaEventPayload = this.emptyForm();

  // ── Opções do FullCalendar ─────────────────────────────────
  readonly calendarOptions = computed<CalendarOptions>(() => {
    const visible  = this.eventSvc.visibleEvents();
    const canEdit  = this.permSvc.can('agenda.edit');

    const fcEvents: EventInput[] = visible.map(ev => ({
      id:               ev.id,
      title:            ev.isPrivate ? `🔒 ${ev.title}` : ev.title,
      start:            ev.start,
      end:              ev.end,
      allDay:           ev.allDay,
      backgroundColor:  ev.color,
      borderColor:      ev.color,
      textColor:        '#0a1628',
      extendedProps:    { eventData: ev },
    }));

    return {
      plugins:        [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      locale:         ptBrLocale,
      initialView:    'dayGridMonth',
      headerToolbar:  {
        left:   'prev,next today',
        center: 'title',
        right:  'dayGridMonth,timeGridWeek,listMonth',
      },
      events:         fcEvents,
      selectable:     canEdit,
      editable:       false,   // arrastar desabilitado — edita via modal
      eventClick:     (arg: EventClickArg) => this.onEventClick(arg),
      select:         canEdit ? (arg: DateSelectArg) => this.onDateSelect(arg) : undefined,
      height:         'auto',
      aspectRatio:    1.8,
      eventDisplay:   'block',
      dayMaxEvents:   3,
      navLinks:       true,
      nowIndicator:   true,
    };
  });

  // ── Lifecycle ──────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    if (this.permSvc.can('agenda.edit')) {
      try {
        const logs = await this.eventSvc.listImportLogs();
        this.importLogs.set(logs);
      } catch { /* não crítico */ }
    }
  }

  // ── Handlers do calendário ─────────────────────────────────
  onEventClick(arg: EventClickArg): void {
    const ev = arg.event.extendedProps['eventData'] as AgendaEvent;
    this.viewEvent.set(ev);
    this.modalMode.set('view');
    this.modalOpen.set(true);
  }

  onDateSelect(arg: DateSelectArg): void {
    this.form = this.emptyForm();
    this.form.start  = arg.startStr.length === 10
      ? `${arg.startStr}T08:00`
      : arg.startStr.slice(0, 16);
    this.form.end    = arg.endStr.length === 10
      ? `${arg.endStr}T09:00`
      : arg.endStr.slice(0, 16);
    this.form.allDay = arg.allDay;
    this.modalMode.set('create');
    this.modalOpen.set(true);
  }

  // ── Modal CRUD ─────────────────────────────────────────────
  openCreate(): void {
    this.form = this.emptyForm();
    this.modalMode.set('create');
    this.editTarget.set(null);
    this.modalOpen.set(true);
  }

  openEdit(ev: AgendaEvent): void {
    this.editTarget.set(ev);
    this.form = {
      title:       ev.title,
      start:       ev.start.slice(0, 16),
      end:         ev.end?.slice(0, 16) ?? '',
      allDay:      ev.allDay,
      description: ev.description,
      location:    ev.location,
      color:       ev.color,
      isPrivate:   ev.isPrivate,
    };
    this.modalMode.set('edit');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.viewEvent.set(null);
    this.editTarget.set(null);
  }

  async saveEvent(): Promise<void> {
    if (!this.form.title.trim()) {
      this.toast.error('O título é obrigatório.'); return;
    }
    if (!this.form.start) {
      this.toast.error('A data de início é obrigatória.'); return;
    }

    this.saving.set(true);
    try {
      const payload: AgendaEventPayload = {
        ...this.form,
        title:       this.form.title.trim(),
        description: this.form.description.trim(),
        location:    this.form.location.trim(),
        end:         this.form.end || undefined,
      };

      if (this.modalMode() === 'edit' && this.editTarget()) {
        await this.eventSvc.update(this.editTarget()!.id, payload);
        this.toast.success('Evento atualizado!');
      } else {
        await this.eventSvc.create(payload);
        this.toast.success('Evento criado!');
      }
      this.closeModal();
    } catch {
      this.toast.error('Erro ao salvar evento.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteEvent(id: string): Promise<void> {
    this.deleting.set(true);
    try {
      await this.eventSvc.delete(id);
      this.toast.success('Evento excluído.');
      this.closeModal();
    } catch {
      this.toast.error('Erro ao excluir evento.');
    } finally {
      this.deleting.set(false);
    }
  }

  // ── Import / Export .ics ───────────────────────────────────
  async onIcsImport(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    (event.target as HTMLInputElement).value = '';

    this.importing.set(true);
    try {
      const { count, hash } = await this.eventSvc.importFromFile(file);
      this.toast.success(`Importação concluída: ${count} evento(s). Hash: #${hash.slice(0, 8)}`);
      const logs = await this.eventSvc.listImportLogs();
      this.importLogs.set(logs);
    } catch (err) {
      this.toast.error('Erro ao importar: ' + (err as Error).message);
    } finally {
      this.importing.set(false);
    }
  }

  exportIcs(): void {
    const events = this.eventSvc.visibleEvents();
    if (events.length === 0) {
      this.toast.info('Nenhum evento para exportar.'); return;
    }
    this.eventSvc.exportToIcs(events);
    this.toast.success(`${events.length} evento(s) exportado(s).`);
  }

  // ── Helpers ────────────────────────────────────────────────
  formatDate(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  private emptyForm(): AgendaEventPayload {
    return {
      title:       '',
      start:       '',
      end:         '',
      allDay:      false,
      description: '',
      location:    '',
      color:       '#c9a84c',
      isPrivate:   false,
    };
  }
}
