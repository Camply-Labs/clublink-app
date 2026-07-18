import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScoringService } from '../../core/services/scoring.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ScoringItem, ScoringItemPayload } from '../../core/models/scoring.model';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-scoring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'scoring.component.scss',
  imports: [FormsModule, ModalComponent],
  template: `
    <div class="section-header">
      <h2 class="section-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </svg>
       Pontuações Padrão</h2>
      <button class="btn btn-primary btn-sm" (click)="openCreate()">
        ➕ Nova Pontuação
      </button>
    </div>

    <p class="scoring-desc">
      Defina os itens padrão usados nos apontamentos.
      Valores <strong class="pos">positivos</strong> somam pontos;
      valores <strong class="neg">negativos</strong> subtraem.
    </p>

    <!-- Positivas -->
    @if (scoringSvc.positiveItems().length > 0) {
      <div class="scoring-group-title positive">➕ Positivas</div>
      <div class="scoring-grid">
        @for (item of scoringSvc.positiveItems(); track item.id) {
          <div class="scoring-card positive">
            <div class="scoring-card-pts">+{{ item.points }}</div>
            <div class="scoring-card-info">
              <div class="scoring-card-name">{{ item.name }}</div>
              @if (item.description) {
                <div class="scoring-card-desc">{{ item.description }}</div>
              }
              @if (item.category) {
                <div class="scoring-card-cat">{{ item.category }}</div>
              }
            </div>
            <div class="scoring-card-actions">
              <button class="btn btn-secondary btn-sm" (click)="openEdit(item)">✏️</button>
              <button class="btn btn-danger btn-sm"
                      [disabled]="deleting() === item.id"
                      (click)="deleteItem(item)">
                {{ deleting() === item.id ? '…' : '🗑' }}
              </button>
            </div>
          </div>
        }
      </div>
    }

    <!-- Negativas -->
    @if (scoringSvc.negativeItems().length > 0) {
      <div class="scoring-group-title negative" style="margin-top:1.5rem;">
        ➖ Negativas
      </div>
      <div class="scoring-grid">
        @for (item of scoringSvc.negativeItems(); track item.id) {
          <div class="scoring-card negative">
            <div class="scoring-card-pts">{{ item.points }}</div>
            <div class="scoring-card-info">
              <div class="scoring-card-name">{{ item.name }}</div>
              @if (item.description) {
                <div class="scoring-card-desc">{{ item.description }}</div>
              }
              @if (item.category) {
                <div class="scoring-card-cat">{{ item.category }}</div>
              }
            </div>
            <div class="scoring-card-actions">
              <button class="btn btn-secondary btn-sm" (click)="openEdit(item)">✏️</button>
              <button class="btn btn-danger btn-sm"
                      [disabled]="deleting() === item.id"
                      (click)="deleteItem(item)">
                {{ deleting() === item.id ? '…' : '🗑' }}
              </button>
            </div>
          </div>
        }
      </div>
    }

    @if (scoringSvc.items().length === 0) {
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">
          Nenhuma pontuação cadastrada ainda.<br/>
          Clique em "Nova Pontuação" para começar.
        </div>
      </div>
    }

    <!-- Modal criar / editar -->
    <app-modal
      [title]="mode() === 'create' ? '➕ Nova Pontuação' : '✏️ Editar Pontuação'"
      [open]="modalOpen()"
      (closed)="modalOpen.set(false)"
    >
      <div class="form-group">
        <label class="form-label">Nome *</label>
        <input type="text" class="form-control"
               placeholder="Ex: Bíblia, Presença, Uniforme…"
               [(ngModel)]="form.name" />
      </div>

      <div class="form-group">
        <label class="form-label">Descrição</label>
        <input type="text" class="form-control"
               placeholder="Breve descrição do critério"
               [(ngModel)]="form.description" />
      </div>

      <div class="form-group">
        <label class="form-label">Categoria</label>
        <input type="text" class="form-control"
               placeholder="Ex: Espiritual, Disciplina, Participação…"
               [(ngModel)]="form.category" />
      </div>

      <div class="form-group">
        <label class="form-label">Pontos *</label>
        <div class="points-input-group">
          <div class="points-type-selector">
            <label class="points-type" [class.active]="form.points > 0 || pointsType() === 'positive'">
              <input type="radio" name="ptype" value="positive"
                     [checked]="pointsType() === 'positive'"
                     (change)="setPointsType('positive')" />
              <span>➕ Positivo</span>
            </label>
            <label class="points-type" [class.active]="form.points < 0 || pointsType() === 'negative'">
              <input type="radio" name="ptype" value="negative"
                     [checked]="pointsType() === 'negative'"
                     (change)="setPointsType('negative')" />
              <span>➖ Negativo</span>
            </label>
          </div>
          <input type="number" class="form-control" min="1"
                 placeholder="Ex: 10"
                 [(ngModel)]="pointsAbs"
                 (ngModelChange)="onPointsAbsChange($event)" />
        </div>
        <div class="points-preview" [class.pos]="computedPoints() > 0" [class.neg]="computedPoints() < 0">
          Valor final: <strong>{{ computedPoints() > 0 ? '+' : '' }}{{ computedPoints() }}</strong> pontos
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="modalOpen.set(false)">Cancelar</button>
        <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
          {{ saving() ? 'Salvando…' : (mode() === 'edit' ? '💾 Salvar' : '➕ Criar') }}
        </button>
      </div>
    </app-modal>
  `,
})
export class ScoringComponent {
  readonly scoringSvc = inject(ScoringService);
  private readonly toast = inject(ToastService);

  readonly modalOpen = signal(false);
  readonly mode      = signal<ModalMode>('create');
  readonly saving    = signal(false);
  readonly deleting  = signal<string | null>(null);

  // Tipo de pontuação selecionado
  readonly pointsType = signal<'positive' | 'negative'>('positive');
  pointsAbs = 0;  // valor absoluto inserido pelo usuário

  readonly computedPoints = () =>
    this.pointsType() === 'positive'
      ? Math.abs(this.pointsAbs)
      : -Math.abs(this.pointsAbs);

  form: ScoringItemPayload = this.emptyForm();
  private editTarget: ScoringItem | null = null;

  setPointsType(type: 'positive' | 'negative'): void {
    this.pointsType.set(type);
    this.form = { ...this.form, points: this.computedPoints() };
  }

  onPointsAbsChange(val: number): void {
    this.pointsAbs = Math.abs(val) || 0;
    this.form = { ...this.form, points: this.computedPoints() };
  }

  openCreate(): void {
    this.form        = this.emptyForm();
    this.editTarget  = null;
    this.pointsAbs   = 0;
    this.pointsType.set('positive');
    this.mode.set('create');
    this.modalOpen.set(true);
  }

  openEdit(item: ScoringItem): void {
    this.editTarget = item;
    this.form = {
      name:        item.name,
      description: item.description,
      category:    item.category,
      points:      item.points,
    };
    this.pointsAbs = Math.abs(item.points);
    this.pointsType.set(item.points >= 0 ? 'positive' : 'negative');
    this.mode.set('edit');
    this.modalOpen.set(true);
  }

  async save(): Promise<void> {
    if (!this.form.name.trim()) {
      this.toast.error('O nome é obrigatório.'); return;
    }
    if (this.pointsAbs <= 0) {
      this.toast.error('Informe um valor de pontos maior que zero.'); return;
    }

    const payload: ScoringItemPayload = {
      name:        this.form.name.trim(),
      description: this.form.description.trim(),
      category:    this.form.category.trim(),
      points:      this.computedPoints(),
    };

    this.saving.set(true);
    try {
      if (this.mode() === 'edit' && this.editTarget) {
        await this.scoringSvc.update(this.editTarget.id, payload);
        this.toast.success('Pontuação atualizada!');
      } else {
        await this.scoringSvc.create(payload);
        this.toast.success('Pontuação criada!');
      }
      this.modalOpen.set(false);
    } catch {
      this.toast.error('Erro ao salvar pontuação.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteItem(item: ScoringItem): Promise<void> {
    this.deleting.set(item.id);
    try {
      await this.scoringSvc.delete(item.id);
      this.toast.success(`"${item.name}" removido.`);
    } catch {
      this.toast.error('Erro ao remover pontuação.');
    } finally {
      this.deleting.set(null);
    }
  }

  private emptyForm(): ScoringItemPayload {
    return { name: '', description: '', category: '', points: 0 };
  }
}
