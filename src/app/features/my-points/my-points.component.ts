import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { UserService } from '../../core/services/user.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { HistoryEntry } from '../../core/models';

@Component({
  selector: 'app-my-points',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl:        'my-points.component.scss',
  imports: [AvatarComponent, SpinnerComponent],
  template: `
    <div class="section-header">
      <h2 class="section-title">Meus Pontos</h2>
    </div>

    <!-- Hero Card -->
    <div class="my-points-hero">
      <app-avatar
        [photoUrl]="user()?.photoUrl"
        [name]="user()?.name ?? ''"
        [size]="90"
      />
      <div style="font-family:'Cinzel',serif;font-size:1.2rem;color:var(--snow);margin:1rem 0 .2rem;">
        {{ user()?.name }}
      </div>
      <div style="font-size:.78rem;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.75rem;">
        {{ user()?.unit }}
      </div>
      <div class="my-points-value">{{ livePoints() }}</div>
      <div class="my-points-label">Pontos</div>
      <div class="my-rank-badge">
        🏔 Posição:
        {{ rank() > 0 ? '#' + rank() + ' de ' + totalPathfinders() : '—' }}
      </div>
    </div>

    <!-- Histórico -->
    <div class="card" style="margin-bottom:1.5rem;">
      <h3 class="card-title">📋 Histórico de Pontos</h3>

      @if (loadingHistory()) {
        <app-spinner [small]="true" label="Carregando histórico…" />
      } @else if (history().length === 0) {
        <div class="empty-state">
          <div class="empty-state-text">Nenhum registro de pontos ainda.</div>
        </div>
      } @else {
        <div class="history-list">
          @for (h of history(); track h.id) {
            <div class="history-item">
              <div class="history-item-info">
                <div class="history-item-name">{{ historyLabel(h) }}</div>
                <div class="history-item-date">
                  {{ formatDate(h.timestamp) }} · por {{ h.updatedBy || 'Sistema' }}
                </div>
                @if (h.description) {
                  <div class="history-item-desc">"{{ h.description }}"</div>
                }
              </div>
              <div>
                <div [class]="historyClass(h)">{{ historyDelta(h) }}</div>
                <div class="climber-pts-label">{{ h.finalPoints }} total</div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MyPointsComponent implements OnInit {
  private readonly authSvc   = inject(AuthService);
  private readonly apointSvc = inject(AppointmentService);
  private readonly userSvc   = inject(UserService);

  readonly user = this.authSvc.currentUser;

  /** Pontos em tempo real vindos do listener Firestore */
  readonly livePoints = computed(() => {
    const uid = this.user()?.uid;
    if (!uid) return 0;
    return this.userSvc.users().find(u => u.uid === uid)?.points
      ?? this.user()?.points
      ?? 0;
  });

  readonly rank = computed(() => {
    const uid = this.user()?.uid;
    return uid ? this.userSvc.getRankOf(uid) : 0;
  });

  readonly totalPathfinders = computed(() => this.userSvc.getPathfinders().length);

  readonly history        = signal<HistoryEntry[]>([]);
  readonly loadingHistory = signal(true);

  async ngOnInit(): Promise<void> {
    const uid = this.user()?.uid;
    if (!uid) return;
    try {
      const entries = await this.apointSvc.getHistory(uid);
      this.history.set(entries);
    } finally {
      this.loadingHistory.set(false);
    }
  }

  historyLabel(h: HistoryEntry): string {
    if (h.type === 'reset') return '🔄 Redefinição';
    return h.delta > 0 ? '➕ Acréscimo' : '➖ Decréscimo';
  }

  historyClass(h: HistoryEntry): string {
    if (h.type === 'reset') return 'history-points-reset';
    return h.delta > 0 ? 'history-points-positive' : 'history-points-negative';
  }

  historyDelta(h: HistoryEntry): string {
    if (h.type === 'reset') return `→ ${h.finalPoints}`;
    return h.delta > 0 ? `+${h.delta}` : `${h.delta}`;
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
}
