import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { ScoringService } from '../../../core/services/scoring.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-scoring-legend',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'scoring-legend.component.scss',
  imports: [ModalComponent],
  template: `
    <app-modal
      title="📊 Tabela de Pontuações"
      [open]="open()"
      (closed)="closed.emit()"
    >
      @if (positiveItems().length === 0 && negativeItems().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">Nenhuma pontuação padrão cadastrada ainda.</div>
        </div>
      } @else {

        <!-- Positivas -->
        @if (positiveItems().length > 0) {
          <div class="legend-section-title positive">➕ Pontuações Positivas</div>
          <div class="legend-list">
            @for (item of positiveItems(); track item.id) {
              <div class="legend-item">
                <div class="legend-item-info">
                  <div class="legend-item-name">{{ item.name }}</div>
                  @if (item.description) {
                    <div class="legend-item-desc">{{ item.description }}</div>
                  }
                  @if (item.category) {
                    <div class="legend-item-cat">{{ item.category }}</div>
                  }
                </div>
                <div class="legend-item-pts positive">+{{ item.points }}</div>
              </div>
            }
          </div>
        }

        <!-- Negativas -->
        @if (negativeItems().length > 0) {
          <div class="legend-section-title negative" style="margin-top:1.1rem;">
            ➖ Pontuações Negativas
          </div>
          <div class="legend-list">
            @for (item of negativeItems(); track item.id) {
              <div class="legend-item">
                <div class="legend-item-info">
                  <div class="legend-item-name">{{ item.name }}</div>
                  @if (item.description) {
                    <div class="legend-item-desc">{{ item.description }}</div>
                  }
                  @if (item.category) {
                    <div class="legend-item-cat">{{ item.category }}</div>
                  }
                </div>
                <div class="legend-item-pts negative">{{ item.points }}</div>
              </div>
            }
          </div>
        }
      }

      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="closed.emit()">Fechar</button>
      </div>
    </app-modal>
  `,
})
export class ScoringLegendComponent {
  private readonly scoringSvc = inject(ScoringService);

  readonly open   = input(false);
  readonly closed = output<void>();

  readonly positiveItems = this.scoringSvc.positiveItems;
  readonly negativeItems = this.scoringSvc.negativeItems;
}
