import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { AppStatusService } from '../../core/services/app-status.service';
import { APP_STATUS_CONFIG } from '../../core/models/app-status.model';
import { ClubLinkLogoComponent } from '../../shared/components/clublink-logo/clublink-logo.component';

@Component({
  selector: 'app-status-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'app-status.component.scss',
  imports: [ClubLinkLogoComponent],
  template: `
    @if (status(); as s) {
      <div class="status-page" [attr.data-status]="s.status">

        <!-- Fundo animado -->
        <div class="status-bg-orbs">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
        </div>

        <div class="status-card">
          <!-- Logo -->
          <app-clublink-logo [size]="72" />

          <!-- Ícone de status -->
          <div class="status-icon">{{ cfg().icon }}</div>

          <!-- Títulos -->
          <h1 class="status-club-name">ClubLink App</h1>
          <h2 class="status-label" [style.color]="cfg().color">{{ cfg().label }}</h2>

          <!-- Mensagem personalizada -->
          @if (s.message) {
            <p class="status-message">"{{ s.message }}"</p>
          }

          <div class="status-divider"></div>

          <!-- Metadados -->
          <div class="status-meta">
            <div class="status-meta-row">
              <span class="status-meta-label">Desde</span>
              <span class="status-meta-value">{{ formatDate(s.since) }}</span>
            </div>

            <div class="status-meta-row">
              <span class="status-meta-label">Previsão de retorno</span>
              <span class="status-meta-value" [style.color]="cfg().color">
                {{ etaLabel() }}
              </span>
            </div>

            @if (s.updatedByName) {
              <div class="status-meta-row">
                <span class="status-meta-label">Informado por</span>
                <span class="status-meta-value">{{ s.updatedByName }}</span>
              </div>
            }
          </div>

          <p class="status-footer-note">
            Entre em contato com a diretoria para mais informações.
          </p>
        </div>
      </div>
    }
  `,
})
export class AppStatusComponent {
  private readonly statusSvc = inject(AppStatusService);

  readonly status = this.statusSvc.status;

  readonly cfg = computed(() => {
    const s = this.status();
    return APP_STATUS_CONFIG[s?.status ?? 'production'];
  });

  readonly etaLabel = computed((): string => {
    const eta = this.status()?.eta;
    if (!eta) return 'Indeterminada';
    const d = new Date(eta);
    if (isNaN(d.getTime())) return 'Indeterminada';
    return d.toLocaleString('pt-BR', {
      day:    '2-digit',
      month:  'long',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });
  });

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day:    '2-digit',
      month:  'long',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });
  }
}
