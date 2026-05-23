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
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { User } from '../../core/models';

type ModalTab = 'add' | 'subtract' | 'reset';

@Component({
  selector: 'app-appointments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl:        'appointments.component.scss',
  imports: [FormsModule, AvatarComponent, ModalComponent],
  template: `
    <div class="section-header">
      <h2 class="section-title">Apontamentos</h2>
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="form-control search-input"
          placeholder="Buscar desbravador…"
          [(ngModel)]="searchQuery"
          style="width:220px;"
        />
      </div>
    </div>

    <div class="apont-grid">
      @for (d of visiblePathfinders(); track d.uid) {
        <div class="apont-card">
          <app-avatar [photoUrl]="d.photoUrl" [name]="d.name" [size]="52" />
          <div class="desb-name" style="font-size:0.88rem;">{{ d.name }}</div>
          <div class="desb-unit">{{ d.unit }}</div>
          <div class="desb-points">{{ d.points }} pts</div>
          <div class="apont-last">Últ. atualização: {{ formatDate(d.lastUpdate) }}</div>
          <button class="btn btn-primary btn-sm" style="margin-top:0.4rem;" (click)="openModal(d)">
            ✏️ Apontar
          </button>
        </div>
      }

      @if (visiblePathfinders().length === 0) {
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🦅</div>
          <div class="empty-state-text">Nenhum desbravador encontrado.</div>
        </div>
      }
    </div>

    <!-- ── Modal de apontamento ─────────────────────────────── -->
    <app-modal
      [title]="'✏️ Apontar — ' + (target()?.name ?? '')"
      [open]="modalOpen()"
      (closed)="modalOpen.set(false)"
    >
      @if (target(); as t) {

        <!-- Perfil resumido -->
        <div class="apont-modal-profile">
          <app-avatar [photoUrl]="t.photoUrl" [name]="t.name" [size]="56" />
          <div>
            <div style="font-family:'Cinzel',serif;font-weight:700;color:var(--snow);">
              {{ t.name }}
            </div>
            <div style="font-size:.72rem;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;">
              {{ t.unit }}
            </div>
            <div style="display:flex;align-items:baseline;gap:.3rem;margin-top:4px;">
              <span style="font-family:'Cinzel',serif;font-size:1.4rem;font-weight:900;color:var(--gold-light);">
                {{ t.points }}
              </span>
              <span style="font-size:.7rem;color:var(--gray-mid);">pontos atuais</span>
            </div>
          </div>
        </div>

        <!-- Tabs: Adicionar / Subtrair / Redefinir -->
        <div class="tab-bar" style="margin:1rem 0;">
          <button class="tab-btn" [class.active]="modalTab() === 'add'"
                  (click)="switchTab('add')">
            ➕ Adicionar
          </button>
          <button class="tab-btn" [class.active]="modalTab() === 'subtract'"
                  (click)="switchTab('subtract')">
            ➖ Subtrair
          </button>
          <button class="tab-btn" [class.active]="modalTab() === 'reset'"
                  (click)="switchTab('reset')">
            🔄 Redefinir
          </button>
        </div>

        <!-- ── Aba: Adicionar ──────────────────────────────── -->
        @if (modalTab() === 'add') {
          <div class="form-group">
            <label class="form-label">Pontos a adicionar *</label>
            <input
              type="number"
              class="form-control"
              placeholder="Ex: 50"
              min="1"
              [(ngModel)]="addValue"
            />
            <div class="field-hint">Somente valores positivos. Resultado: {{ previewAdd(t) }} pts</div>
          </div>
          <div class="form-group">
            <label class="form-label">Descrição / Motivo (opcional)</label>
            <input
              type="text"
              class="form-control"
              placeholder="Ex: Participação na reunião…"
              [(ngModel)]="description"
            />
          </div>
        }

        <!-- ── Aba: Subtrair ───────────────────────────────── -->
        @if (modalTab() === 'subtract') {
          <div class="form-group">
            <label class="form-label">Pontos a subtrair *</label>
            <input
              type="number"
              class="form-control"
              placeholder="Ex: 10"
              min="1"
              [(ngModel)]="subtractValue"
            />
            <div class="field-hint">
              Somente valores positivos. Resultado: {{ previewSubtract(t) }} pts
              @if (subtractValue > t.points) {
                <span class="field-hint-warn"> — não pode ficar negativo, será zerado</span>
              }
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Descrição / Motivo (opcional)</label>
            <input
              type="text"
              class="form-control"
              placeholder="Ex: Falta sem justificativa…"
              [(ngModel)]="description"
            />
          </div>
        }

        <!-- ── Aba: Redefinir ──────────────────────────────── -->
        @if (modalTab() === 'reset') {
          <div class="modal-warning">
            ⚠️ Esta ação irá <strong>substituir</strong> a pontuação atual pelo valor informado.
          </div>
          <div class="form-group">
            <label class="form-label">Novo valor de pontos *</label>
            <input
              type="number"
              class="form-control"
              placeholder="Ex: 0"
              min="0"
              [(ngModel)]="resetValue"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Motivo da redefinição (opcional)</label>
            <input
              type="text"
              class="form-control"
              placeholder="Ex: Reinício de temporada"
              [(ngModel)]="description"
            />
          </div>
        }

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="modalOpen.set(false)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="saving()" (click)="confirm()">
            {{ saving() ? 'Salvando…' : 'Confirmar' }}
          </button>
        </div>
      }
    </app-modal>
  `,
})
export class AppointmentsComponent {
  private readonly userSvc   = inject(UserService);
  private readonly apointSvc = inject(AppointmentService);
  private readonly authSvc   = inject(AuthService);
  private readonly toast     = inject(ToastService);

  searchQuery = signal('');
  addValue      = 0;
  subtractValue = 0;
  resetValue    = 0;
  description   = '';

  readonly modalOpen = signal(false);
  readonly modalTab  = signal<ModalTab>('add');
  readonly saving    = signal(false);
  readonly target    = signal<User | null>(null);

  readonly visiblePathfinders = computed(() =>
    this.userSvc.filterBySearch(this.userSvc.getPathfinders(), this.searchQuery())
  );

  // ── Previews de resultado ──────────────────────────────────
  previewAdd(t: User): number {
    const v = Math.max(0, Number(this.addValue) || 0);
    return (t.points ?? 0) + v;
  }

  previewSubtract(t: User): number {
    const v = Math.max(0, Number(this.subtractValue) || 0);
    return Math.max(0, (t.points ?? 0) - v);
  }

  // ── Ações ──────────────────────────────────────────────────
  openModal(user: User): void {
    this.target.set(user);
    this.addValue      = 0;
    this.subtractValue = 0;
    this.resetValue    = 0;
    this.description   = '';
    this.modalTab.set('add');
    this.modalOpen.set(true);
  }

  switchTab(tab: ModalTab): void {
    this.addValue      = 0;
    this.subtractValue = 0;
    this.resetValue    = 0;
    this.description   = '';
    this.modalTab.set(tab);
  }

  async confirm(): Promise<void> {
    const t = this.target();
    if (!t) return;

    const dirName = this.authSvc.currentUser()?.name
      || this.authSvc.currentUser()?.email
      || 'Diretoria';

    this.saving.set(true);
    try {
      switch (this.modalTab()) {

        case 'add': {
          const val = Math.floor(Number(this.addValue) || 0);
          if (val <= 0) {
            this.toast.error('Informe um valor maior que zero.'); return;
          }
          await this.apointSvc.addPoints(t, val, this.description, dirName);
          this.toast.success(`+${val} ponto(s) para ${t.name}!`);
          break;
        }

        case 'subtract': {
          const val = Math.floor(Number(this.subtractValue) || 0);
          if (val <= 0) {
            this.toast.error('Informe um valor maior que zero.'); return;
          }
          // Passa como negativo para addPoints — que já garante mínimo 0
          await this.apointSvc.addPoints(t, -val, this.description || 'Subtração de pontos', dirName);
          this.toast.success(`-${val} ponto(s) de ${t.name}.`);
          break;
        }

        case 'reset': {
          const val = Math.floor(Number(this.resetValue) || 0);
          if (val < 0) {
            this.toast.error('Informe um valor maior ou igual a zero.'); return;
          }
          await this.apointSvc.resetPoints(t, val, this.description, dirName);
          this.toast.success(`Pontos de ${t.name} redefinidos para ${val}.`);
          break;
        }
      }
      this.modalOpen.set(false);
    } catch {
      this.toast.error('Erro ao salvar apontamento. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  formatDate(date?: Date): string {
    if (!date) return 'Nunca';
    const d = typeof (date as unknown as { toDate?: unknown }).toDate === 'function'
      ? (date as unknown as { toDate: () => Date }).toDate()
      : date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('pt-BR');
  }
}
