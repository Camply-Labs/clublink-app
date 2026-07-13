import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { EditMemberComponent } from '../../shared/components/edit-member/edit-member.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { HistoryEntry, User } from '../../core/models';

type Tab = 'pathfinders' | 'directors';

@Component({
  selector: 'app-members',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'members.component.scss',
  imports: [FormsModule, AvatarComponent, ModalComponent, EditMemberComponent, SpinnerComponent],
  template: `
    <div class="section-header">
      <h2 class="section-title">Membros</h2>
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" class="form-control search-input"
               placeholder="Buscar por nome, unidade ou cargo…"
               [(ngModel)]="searchQuery" style="width:240px;" />
      </div>
    </div>

    <div class="tab-bar">
      <button class="tab-btn" [class.active]="activeTab() === 'pathfinders'"
              (click)="activeTab.set('pathfinders')">🦅 Desbravadores</button>
      <button class="tab-btn" [class.active]="activeTab() === 'directors'"
              (click)="activeTab.set('directors')">⭐ Diretoria</button>
    </div>

    <div class="desb-grid">
      @for (u of visibleUsers(); track u.uid) {
        <div class="desb-card">
          <app-avatar [photoUrl]="u.photoUrl" [name]="u.name" [size]="72" />
          <div class="desb-name">{{ u.name }}</div>

          @if (u.position) {
            <div class="desb-position">{{ u.position }}</div>
          }

          <div class="desb-unit">{{ u.unit || 'Sem unidade' }}</div>

          @if (activeTab() === 'pathfinders') {
            <div class="desb-points">{{ u.points }}</div>
            <div class="desb-points-label">pontos</div>
          } @else {
            <div class="desb-role-badge badge-diretoria">
              {{ u.isAdmin ? '⭐ Admin' : 'Diretoria' }}
            </div>
          }

          <!-- <div class="desb-email">{{ u.email }}</div> -->

          <div class="desb-card-actions">
            <!-- Histórico: só aparece para desbravadores e quem tem members.view -->
            @if (activeTab() === 'pathfinders' && permSvc.can('members.view')) {
              <button class="btn btn-secondary btn-sm"
                      title="Ver histórico de pontos"
                      (click)="openHistory(u)">📋</button>
            }
            @if (permSvc.can('members.edit')) {
              <button class="btn btn-secondary btn-sm"
                      title="Editar membro"
                      (click)="openEdit(u)">✏️</button>
            }
            @if (permSvc.can('members.delete')) {
              <button class="btn btn-danger btn-sm"
                      title="Remover membro"
                      (click)="confirmDelete(u)">🗑</button>
            }
          </div>
        </div>
      }

      @if (visibleUsers().length === 0) {
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">{{ activeTab() === 'pathfinders' ? '🦅' : '⭐' }}</div>
          <div class="empty-state-text">Nenhum cadastro encontrado.</div>
        </div>
      }
    </div>

    <!-- ── Modal: Histórico de Pontos ────────────────────────── -->
    <app-modal
      [title]="'📋 Histórico — ' + (historyTarget()?.name ?? '')"
      [open]="historyModalOpen()"
      (closed)="historyModalOpen.set(false)"
    >
      <!-- Cabeçalho do perfil -->
      @if (historyTarget(); as u) {
        <div class="history-member-header">
          <app-avatar [photoUrl]="u.photoUrl" [name]="u.name" [size]="44" />
          <div>
            <div class="history-member-name">{{ u.name }}</div>
            <div class="history-member-meta">
              @if (u.position) { <span>{{ u.position }}</span><span class="sep">·</span> }
              <span>{{ u.unit }}</span>
            </div>
          </div>
          <div class="history-member-pts">
            <span class="history-pts-value">{{ u.points }}</span>
            <span class="history-pts-label">pts</span>
          </div>
        </div>
      }

      <!-- Lista de entradas -->
      @if (loadingHistory()) {
        <app-spinner [small]="true" label="Carregando histórico…" />
      } @else if (historyEntries().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon" style="font-size:2rem;">📭</div>
          <div class="empty-state-text">Nenhum apontamento registrado ainda.</div>
        </div>
      } @else {
        <div class="history-list">
          @for (h of historyEntries(); track h.id) {
            <div class="history-item">
              <!-- Ícone de tipo -->
              <div class="history-type-icon" [class]="historyIconClass(h)">
                {{ historyIcon(h) }}
              </div>

              <div class="history-item-info">
                <div class="history-item-name">{{ historyLabel(h) }}</div>
                <div class="history-item-date">
                  {{ formatDate(h.timestamp) }} · por {{ h.updatedBy || 'Sistema' }}
                </div>
                @if (h.description) {
                  <div class="history-item-desc">"{{ h.description }}"</div>
                }
              </div>

              <div class="history-item-right">
                <div [class]="historyDeltaClass(h)">{{ historyDelta(h) }}</div>
                <div class="history-total">{{ h.finalPoints }} total</div>
              </div>
            </div>
          }
        </div>
      }

      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="historyModalOpen.set(false)">Fechar</button>
      </div>
    </app-modal>

    <!-- ── Modal: Edição ─────────────────────────────────────── -->
    <app-edit-member
      [target]="editTarget()"
      [open]="editModalOpen()"
      (closed)="editModalOpen.set(false)"
    />

    <!-- ── Modal: Confirmar exclusão ─────────────────────────── -->
    <app-modal title="🗑 Remover Membro" [open]="deleteModalOpen()"
               (closed)="deleteModalOpen.set(false)">
      <p style="color:var(--cl-text-secondary);font-size:.9rem;line-height:1.6;margin-bottom:1.5rem;">
        Tem certeza que deseja remover
        <strong style="color:var(--cl-text-primary);">{{ deleteTarget()?.name }}</strong>?<br/>
        <span style="color:var(--cl-text-muted);font-size:.8rem;">
          Esta ação não pode ser desfeita. O histórico de pontos também será apagado.
        </span>
      </p>
      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="deleteModalOpen.set(false)">Cancelar</button>
        <button class="btn btn-danger" [disabled]="deleting()" (click)="deleteUser()">
          {{ deleting() ? 'Removendo…' : 'Remover' }}
        </button>
      </div>
    </app-modal>
  `,
})
export class MembersComponent {
  private readonly userSvc   = inject(UserService);
  private readonly apointSvc = inject(AppointmentService);
  private readonly toast     = inject(ToastService);
  readonly permSvc           = inject(PermissionService);

  searchQuery = signal('');

  readonly activeTab       = signal<Tab>('pathfinders');

  // ── Histórico ──────────────────────────────────────────────
  readonly historyModalOpen = signal(false);
  readonly historyTarget    = signal<User | null>(null);
  readonly historyEntries   = signal<HistoryEntry[]>([]);
  readonly loadingHistory   = signal(false);

  // ── Edição ─────────────────────────────────────────────────
  readonly editModalOpen    = signal(false);
  readonly editTarget       = signal<User | null>(null);

  // ── Exclusão ───────────────────────────────────────────────
  readonly deleteModalOpen  = signal(false);
  readonly deleteTarget     = signal<User | null>(null);
  readonly deleting         = signal(false);

  readonly visibleUsers = computed(() => {
    const base = this.activeTab() === 'pathfinders'
      ? this.userSvc.getPathfinders()
      : this.userSvc.getDirectors();
    return this.filterBySearch(base, this.searchQuery());
  });

  private filterBySearch(users: User[], query: string): User[] {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.unit.toLowerCase().includes(q) ||
      (u.position ?? '').toLowerCase().includes(q)
    );
  }

  // ── Histórico ──────────────────────────────────────────────
  async openHistory(user: User): Promise<void> {
    this.historyTarget.set(user);
    this.historyEntries.set([]);
    this.loadingHistory.set(true);
    this.historyModalOpen.set(true);
    try {
      const entries = await this.apointSvc.getHistory(user.uid, 30);
      this.historyEntries.set(entries);
    } catch {
      this.toast.error('Erro ao carregar histórico.');
    } finally {
      this.loadingHistory.set(false);
    }
  }

  historyLabel(h: HistoryEntry): string {
    if (h.type === 'reset') return 'Redefinição';
    return h.delta > 0 ? 'Acréscimo' : 'Subtração';
  }

  historyIcon(h: HistoryEntry): string {
    if (h.type === 'reset') return '🔄';
    return h.delta > 0 ? '➕' : '➖';
  }

  historyIconClass(h: HistoryEntry): string {
    if (h.type === 'reset') return 'type-reset';
    return h.delta > 0 ? 'type-add' : 'type-sub';
  }

  historyDelta(h: HistoryEntry): string {
    if (h.type === 'reset') return `→ ${h.finalPoints}`;
    return h.delta > 0 ? `+${h.delta}` : `${h.delta}`;
  }

  historyDeltaClass(h: HistoryEntry): string {
    if (h.type === 'reset') return 'history-points-reset';
    return h.delta > 0 ? 'history-points-positive' : 'history-points-negative';
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // ── Edição ─────────────────────────────────────────────────
  openEdit(user: User): void {
    this.editTarget.set(user);
    this.editModalOpen.set(true);
  }

  // ── Exclusão ───────────────────────────────────────────────
  confirmDelete(user: User): void {
    this.deleteTarget.set(user);
    this.deleteModalOpen.set(true);
  }

  async deleteUser(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    try {
      await this.userSvc.delete(target.uid);
      this.toast.success(`${target.name} removido com sucesso.`);
      this.deleteModalOpen.set(false);
    } catch {
      this.toast.error('Erro ao remover usuário.');
    } finally {
      this.deleting.set(false);
    }
  }
}
