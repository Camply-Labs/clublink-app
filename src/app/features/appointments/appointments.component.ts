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
import { ScoringService } from '../../core/services/scoring.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ScoringLegendComponent } from '../../shared/components/scoring-legend/scoring-legend.component';
import { User } from '../../core/models';
import { ScoringItem } from '../../core/models/scoring.model';
import { NgTemplateOutlet } from '@angular/common';

type ModalTab   = 'add' | 'subtract' | 'reset';
type GroupScope = 'unit' | 'all';

@Component({
  selector: 'app-appointments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'appointments.component.scss',
  imports: [FormsModule, AvatarComponent, ModalComponent, ScoringLegendComponent, NgTemplateOutlet],
  template: `
    <!-- ── Cabeçalho ─────────────────────────────────────────── -->
    <div class="section-header">
      <h2 class="section-title">Apontamentos</h2>
      <div class="apont-header-actions">
        <button class="btn btn-secondary btn-sm" (click)="legendOpen.set(true)">
          📊 Tabela de Pontuações
        </button>
        <button class="btn btn-secondary btn-sm" (click)="openGroup()">
          👥 Apontar por Grupo
        </button>
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" class="form-control search-input"
                 placeholder="Buscar desbravador…"
                 [(ngModel)]="searchQuery" style="width:200px;" />
        </div>
      </div>
    </div>

    <!-- ── Cards individuais ─────────────────────────────────── -->
    <div class="apont-grid">
      @for (d of visiblePathfinders(); track d.uid) {
        <div class="apont-card">
          <app-avatar [photoUrl]="d.photoUrl" [name]="d.name" [size]="52" />
          <div class="desb-name" style="font-size:.88rem;">{{ d.name }}</div>
          <div class="desb-unit">{{ d.unit }}</div>
          <div class="desb-points">{{ currentPts(d) }} pts</div>
          <div class="apont-last">Últ. atualização: {{ formatDate(d.lastUpdate) }}</div>
          <button class="btn btn-primary btn-sm" style="margin-top:.4rem;"
                  (click)="openModal(d)">✏️ Apontar</button>
        </div>
      }
      @if (visiblePathfinders().length === 0) {
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🦅</div>
          <div class="empty-state-text">Nenhum desbravador encontrado.</div>
        </div>
      }
    </div>

    <!-- ══════════════════════════════════════════════════════════
         MODAL INDIVIDUAL
         ══════════════════════════════════════════════════════════ -->
    <app-modal
      [title]="'✏️ Apontar — ' + (target()?.name ?? '')"
      [open]="modalOpen()"
      (closed)="closeModal()"
    >
      @if (target(); as t) {
        <div class="apont-modal-profile">
          <app-avatar [photoUrl]="t.photoUrl" [name]="t.name" [size]="56" />
          <div>
            <div style="font-family:'Cinzel',serif;font-weight:700;color:var(--snow);">{{ t.name }}</div>
            <div style="font-size:.72rem;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;">{{ t.unit }}</div>
            <div style="display:flex;align-items:baseline;gap:.3rem;margin-top:4px;">
              <span style="font-family:'Cinzel',serif;font-size:1.4rem;font-weight:900;color:var(--gold-light);">
                {{ currentPts(t) }}
              </span>
              <span style="font-size:.7rem;color:var(--gray-mid);">pontos atuais</span>
            </div>
          </div>
        </div>

        <ng-container *ngTemplateOutlet="scoringForm; context: { $implicit: [t] }" />

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" [disabled]="saving()" (click)="confirm([t])">
            {{ saving() ? 'Salvando…' : 'Confirmar' }}
          </button>
        </div>
      }
    </app-modal>

    <!-- ══════════════════════════════════════════════════════════
         MODAL POR GRUPO
         ══════════════════════════════════════════════════════════ -->
    <app-modal
      [title]="groupTitle()"
      [open]="groupModalOpen()"
      (closed)="closeGroup()"
    >
      <!-- Step 1: Escolha do escopo -->
      @if (groupStep() === 'scope') {
        <p class="group-hint">
          Selecione se o apontamento será feito para uma unidade específica
          ou para todos os desbravadores do clube.
        </p>

        <div class="group-scope-options">
          <label class="group-scope-option" [class.selected]="groupScope() === 'unit'"
                 (click)="groupScope.set('unit')">
            <div class="scope-icon">🏷️</div>
            <div>
              <div class="scope-label">Por Unidade</div>
              <div class="scope-desc">Selecione uma unidade específica</div>
            </div>
          </label>
          <label class="group-scope-option" [class.selected]="groupScope() === 'all'"
                 (click)="groupScope.set('all')">
            <div class="scope-icon">🦅</div>
            <div>
              <div class="scope-label">Clube Todo</div>
              <div class="scope-desc">Todos os {{ allPathfinders().length }} desbravadores</div>
            </div>
          </label>
        </div>

        <!-- Seleção de unidade -->
        @if (groupScope() === 'unit') {
          <div class="form-group" style="margin-top:.75rem;">
            <label class="form-label">Unidade *</label>
            <div class="unit-list">
              @for (unit of availableUnits(); track unit) {
                <label class="unit-option" [class.selected]="selectedUnit() === unit">
                  <input type="radio" name="unit" [value]="unit"
                         [checked]="selectedUnit() === unit"
                         (change)="selectedUnit.set(unit)" />
                  <span class="unit-name">{{ unit }}</span>
                  <span class="unit-count">
                    {{ pathfindersByUnit(unit).length }} membro(s)
                  </span>
                </label>
              }
            </div>
          </div>
        }

        <!-- Preview dos alvos -->
        @if (groupTargets().length > 0) {
          <div class="group-targets-preview">
            <div class="group-targets-label">
              {{ groupTargets().length }} desbravador(es) serão apontados:
            </div>
            <div class="group-targets-list">
              @for (u of groupTargets(); track u.uid) {
                <div class="group-target-chip">
                  <app-avatar [photoUrl]="u.photoUrl" [name]="u.name" [size]="22" />
                  <span>{{ u.name }}</span>
                </div>
              }
            </div>
          </div>
        }

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeGroup()">Cancelar</button>
          <button class="btn btn-primary"
                  [disabled]="groupTargets().length === 0"
                  (click)="groupStep.set('form')">
            Próximo →
          </button>
        </div>
      }

      <!-- Step 2: Formulário de pontuação -->
      @if (groupStep() === 'form') {
        <div class="group-scope-badge">
          @if (groupScope() === 'all') {
            🦅 Clube todo — {{ groupTargets().length }} desbravadores
          } @else {
            🏷️ Unidade: {{ selectedUnit() }} — {{ groupTargets().length }} membro(s)
          }
        </div>

        <ng-container *ngTemplateOutlet="scoringForm; context: { $implicit: groupTargets() }" />

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="groupStep.set('scope')">← Voltar</button>
          <button class="btn btn-primary" [disabled]="saving()" (click)="confirm(groupTargets())">
            {{ saving() ? 'Apontando…' : '✅ Aplicar a ' + groupTargets().length + ' membro(s)' }}
          </button>
        </div>
      }

      <!-- Step 3: Resultado -->
      @if (groupStep() === 'result') {
        <div class="group-result">
          <div class="group-result-icon">✅</div>
          <div class="group-result-title">Apontamento concluído!</div>
          <div class="group-result-body">
            {{ groupResultMsg() }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" (click)="closeGroup()">Fechar</button>
        </div>
      }
    </app-modal>

    <!-- Template reutilizável: formulário de scoring (individual e grupo) -->
    <ng-template #scoringForm let-targets>
      <!-- Tabs -->
      <div class="tab-bar" style="margin:1rem 0 .75rem;">
        <button class="tab-btn" [class.active]="modalTab() === 'add'"
                (click)="switchTab('add')">➕ Adicionar</button>
        <button class="tab-btn" [class.active]="modalTab() === 'subtract'"
                (click)="switchTab('subtract')">➖ Subtrair</button>
        <button class="tab-btn" [class.active]="modalTab() === 'reset'"
                (click)="switchTab('reset')">🔄 Redefinir</button>
      </div>

      <!-- Adicionar -->
      @if (modalTab() === 'add') {
        @if (scoringSvc.positiveItems().length > 0) {
          <div class="scoring-checks-title">📋 Pontuações padrão</div>
          <div class="scoring-checks">
            @for (item of scoringSvc.positiveItems(); track item.id) {
              <label class="scoring-check" [class.checked]="isChecked(item.id)">
                <input type="checkbox" [checked]="isChecked(item.id)"
                       (change)="toggleCheck(item)" />
                <span class="check-box">{{ isChecked(item.id) ? '✓' : '' }}</span>
                <span class="check-label">{{ item.name }}</span>
                <span class="check-pts positive">+{{ item.points }}</span>
              </label>
            }
          </div>
          <div class="divider" style="margin:.75rem 0;"></div>
        }
        <div class="form-group">
          <label class="form-label">Pontos adicionais (opcional)</label>
          <input type="number" class="form-control" placeholder="Ex: 10" min="1"
                 [(ngModel)]="addValue" (ngModelChange)="recalcPreview()" />
        </div>
        <div class="scoring-total-preview positive">
          Total a adicionar: <strong>+{{ totalAddPreview() }}</strong> pts
        </div>
        <div class="form-group" style="margin-top:.75rem;">
          <label class="form-label">Descrição / Motivo (opcional)</label>
          <input type="text" class="form-control"
                 placeholder="Ex: Participação na reunião…"
                 [(ngModel)]="description" />
        </div>
      }

      <!-- Subtrair -->
      @if (modalTab() === 'subtract') {
        @if (scoringSvc.negativeItems().length > 0) {
          <div class="scoring-checks-title">📋 Pontuações padrão</div>
          <div class="scoring-checks">
            @for (item of scoringSvc.negativeItems(); track item.id) {
              <label class="scoring-check" [class.checked]="isChecked(item.id)">
                <input type="checkbox" [checked]="isChecked(item.id)"
                       (change)="toggleCheck(item)" />
                <span class="check-box">{{ isChecked(item.id) ? '✓' : '' }}</span>
                <span class="check-label">{{ item.name }}</span>
                <span class="check-pts negative">{{ item.points }}</span>
              </label>
            }
          </div>
          <div class="divider" style="margin:.75rem 0;"></div>
        }
        <div class="form-group">
          <label class="form-label">Pontos adicionais a subtrair (opcional)</label>
          <input type="number" class="form-control" placeholder="Ex: 10" min="1"
                 [(ngModel)]="subtractValue" (ngModelChange)="recalcPreview()" />
        </div>
        <div class="scoring-total-preview negative">
          Total a subtrair: <strong>{{ totalSubtractPreview() }}</strong> pts
        </div>
        <div class="form-group" style="margin-top:.75rem;">
          <label class="form-label">Descrição / Motivo (opcional)</label>
          <input type="text" class="form-control"
                 placeholder="Ex: Falta sem justificativa…"
                 [(ngModel)]="description" />
        </div>
      }

      <!-- Redefinir -->
      @if (modalTab() === 'reset') {
        <div class="modal-warning">
          ⚠️ Esta ação irá <strong>substituir</strong> a pontuação atual pelo valor informado
          para cada membro selecionado.
        </div>
        <div class="form-group">
          <label class="form-label">Novo valor de pontos *</label>
          <input type="number" class="form-control" placeholder="Ex: 0" min="0"
                 [(ngModel)]="resetValue" />
        </div>
        <div class="form-group">
          <label class="form-label">Motivo (opcional)</label>
          <input type="text" class="form-control" placeholder="Ex: Reinício de temporada"
                 [(ngModel)]="description" />
        </div>
      }
    </ng-template>

    <!-- Modal tabela de pontuações -->
    <app-scoring-legend [open]="legendOpen()" (closed)="legendOpen.set(false)" />
  `,
})
export class AppointmentsComponent {
  private readonly userSvc   = inject(UserService);
  private readonly apointSvc = inject(AppointmentService);
  private readonly authSvc   = inject(AuthService);
  private readonly toast     = inject(ToastService);
  readonly scoringSvc        = inject(ScoringService);

  searchQuery   = signal('');
  addValue      = 0;
  subtractValue = 0;
  resetValue    = 0;
  description   = '';

  // ── Modais ─────────────────────────────────────────────────
  readonly modalOpen       = signal(false);
  readonly legendOpen      = signal(false);
  readonly groupModalOpen  = signal(false);
  readonly saving          = signal(false);
  readonly target          = signal<User | null>(null);

  // ── Grupo ──────────────────────────────────────────────────
  readonly groupStep   = signal<'scope' | 'form' | 'result'>('scope');
  readonly groupScope  = signal<GroupScope>('all');
  readonly selectedUnit = signal<string>('');
  readonly groupResultMsg = signal('');

  readonly groupTitle = computed(() => {
    if (this.groupStep() === 'scope')  return '👥 Apontar por Grupo';
    if (this.groupStep() === 'result') return '✅ Resultado';
    return this.groupScope() === 'all'
      ? '👥 Apontar — Clube Todo'
      : `👥 Apontar — ${this.selectedUnit()}`;
  });

  // ── Tab ────────────────────────────────────────────────────
  readonly modalTab = signal<ModalTab>('add');

  // ── Pontos locais ─────────────────────────────────────────
  readonly localPoints = signal<Record<string, number>>({});

  // ── Checkboxes ────────────────────────────────────────────
  private checkedItems = new Map<string, ScoringItem>();

  // ── Desbravadores ─────────────────────────────────────────
  readonly allPathfinders = computed(() => this.userSvc.getPathfinders());

  readonly visiblePathfinders = computed(() =>
    this.userSvc.filterBySearch(this.allPathfinders(), this.searchQuery())
  );

  readonly availableUnits = computed(() =>
    [...new Set(this.allPathfinders().map(u => u.unit).filter(Boolean))].sort()
  );

  pathfindersByUnit(unit: string): User[] {
    return this.allPathfinders().filter(u => u.unit === unit);
  }

  readonly groupTargets = computed<User[]>(() => {
    if (this.groupScope() === 'all') return this.allPathfinders();
    const unit = this.selectedUnit();
    return unit ? this.pathfindersByUnit(unit) : [];
  });

  // ── Scoring helpers ───────────────────────────────────────
  currentPts(t: User): number {
    return this.localPoints()[t.uid] ?? t.points ?? 0;
  }

  isChecked(id: string): boolean { return this.checkedItems.has(id); }

  toggleCheck(item: ScoringItem): void {
    this.checkedItems.has(item.id)
      ? this.checkedItems.delete(item.id)
      : this.checkedItems.set(item.id, item);
  }

  private checkedTotal(): number {
    let total = 0;
    this.checkedItems.forEach(i => { total += i.points; });
    return total;
  }

  totalAddPreview(): number {
    return this.checkedTotal() + (Math.abs(Number(this.addValue)) || 0);
  }

  totalSubtractPreview(): number {
    return Math.abs(this.checkedTotal()) + (Math.abs(Number(this.subtractValue)) || 0);
  }

  recalcPreview(): void { /* triggers change detection */ }

  // ── Abrir / fechar modais ──────────────────────────────────
  openModal(user: User): void {
    this.target.set(user);
    this.resetForm();
    this.modalTab.set('add');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.checkedItems = new Map();
  }

  openGroup(): void {
    this.resetForm();
    this.groupScope.set('all');
    this.selectedUnit.set('');
    this.groupStep.set('scope');
    this.groupModalOpen.set(true);
  }

  closeGroup(): void {
    this.groupModalOpen.set(false);
    this.checkedItems = new Map();
  }

  switchTab(tab: ModalTab): void {
    this.resetForm();
    this.modalTab.set(tab);
  }

  private resetForm(): void {
    this.addValue      = 0;
    this.subtractValue = 0;
    this.resetValue    = 0;
    this.description   = '';
    this.checkedItems  = new Map();
  }

  // ── Confirmar (individual ou grupo) ───────────────────────
  async confirm(targets: User[]): Promise<void> {
    if (!targets.length) return;

    const dirName = this.authSvc.currentUser()?.name
      || this.authSvc.currentUser()?.email
      || 'Diretoria';

    const checkedNames = [...this.checkedItems.values()].map(i => i.name).join(', ');
    const autoDesc = checkedNames
      ? (this.description ? `${checkedNames} · ${this.description}` : checkedNames)
      : this.description;

    this.saving.set(true);
    try {
      const newLocalPts: Record<string, number> = { ...this.localPoints() };

      switch (this.modalTab()) {

        case 'add': {
          const delta = this.totalAddPreview();
          if (delta <= 0) { this.toast.error('Selecione ao menos uma pontuação ou informe um valor.'); return; }
          await Promise.all(targets.map(t =>
            this.apointSvc.addPoints(t, delta, autoDesc, dirName)
          ));
          targets.forEach(t => { newLocalPts[t.uid] = this.currentPts(t) + delta; });
          this.toast.success(`+${delta} pt(s) para ${targets.length} membro(s)!`);
          break;
        }

        case 'subtract': {
          const delta = this.totalSubtractPreview();
          if (delta <= 0) { this.toast.error('Selecione ao menos uma pontuação ou informe um valor.'); return; }
          await Promise.all(targets.map(t =>
            this.apointSvc.addPoints(t, -delta, autoDesc || 'Subtração de pontos', dirName)
          ));
          targets.forEach(t => { newLocalPts[t.uid] = Math.max(0, this.currentPts(t) - delta); });
          this.toast.success(`-${delta} pt(s) de ${targets.length} membro(s).`);
          break;
        }

        case 'reset': {
          const val = Math.floor(Number(this.resetValue) || 0);
          if (val < 0) { this.toast.error('Informe um valor maior ou igual a zero.'); return; }
          await Promise.all(targets.map(t =>
            this.apointSvc.resetPoints(t, val, this.description, dirName)
          ));
          targets.forEach(t => { newLocalPts[t.uid] = val; });
          this.toast.success(`Pontos redefinidos para ${val} em ${targets.length} membro(s).`);
          break;
        }
      }

      // Atualiza pontos localmente
      this.localPoints.set(newLocalPts);

      // Individual: fecha modal
      if (targets.length === 1 && this.modalOpen()) {
        this.closeModal();
      }

      // Grupo: vai para tela de resultado
      if (this.groupModalOpen()) {
        this.groupResultMsg.set(
          `Apontamento aplicado a ${targets.length} desbravador(es)` +
          (this.groupScope() === 'unit' ? ` da unidade "${this.selectedUnit()}"` : ' do clube todo') +
          '.'
        );
        this.groupStep.set('result');
        this.checkedItems = new Map();
      }

    } catch {
      this.toast.error('Erro ao salvar apontamento(s). Tente novamente.');
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
