import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ScoringLegendComponent } from '../../shared/components/scoring-legend/scoring-legend.component';
import { User } from '../../core/models';

interface Star    { id: number; cx: number; cy: number; r: number; opacity: number; }
interface Climber { user: User; cx: number; cy: number; color: string; clipId: string; }

@Component({
  selector:        'app-podium',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [AvatarComponent, NgClass, ScoringLegendComponent],
  styleUrl:        'podium.component.scss',
  template: `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
        Ranking — Monte Everest</h2>
      <button class="btn btn-secondary btn-sm" (click)="legendOpen.set(true)">
        📊 Tabela de Pontuações
      </button>
    </div>

    <app-scoring-legend [open]="legendOpen()" (closed)="legendOpen.set(false)" />

    @if (pathfinders().length === 0) {
      <div class="empty-state">
        <div class="empty-state-icon">🏔</div>
        <div class="empty-state-text">Nenhum desbravador cadastrado ainda.</div>
      </div>
    } @else {
      <div class="everest-container">
        <div class="everest-title gold-shimmer">🏔 Monte Everest — Escalada de Pontos</div>

        <!-- ── SVG DA MONTANHA ───────────────────────────────── -->
        <div class="everest-svg-wrapper">
          <svg
            viewBox="0 0 800 340"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            preserveAspectRatio="xMidYMid meet"
            style="width:100%;display:block;"
          >
            <defs>
              <linearGradient id="ev_sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stop-color="#1a3a6e"/>
                <stop offset="100%" stop-color="#0d2548"/>
              </linearGradient>
              <linearGradient id="ev_mount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stop-color="#4a6fa5"/>
                <stop offset="100%" stop-color="#1a3255"/>
              </linearGradient>
              <linearGradient id="ev_snow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stop-color="#ffffff"/>
                <stop offset="100%" stop-color="#c8d8f0"/>
              </linearGradient>

              <!--
                clipPath circular para cada escalador.
                O raio do avatar é 14 — o círculo de clip
                centra no mesmo ponto da imagem.
              -->
              @for (c of climbers(); track c.clipId) {
                <clipPath [attr.id]="c.clipId">
                  <circle [attr.cx]="c.cx" [attr.cy]="c.cy - 14" r="14"/>
                </clipPath>
              }
            </defs>

            <!-- Céu -->
            <rect width="800" height="340" fill="url(#ev_sky)"/>

            <!-- Estrelas -->
            @for (s of stars; track s.id) {
              <circle
                [attr.cx]="s.cx" [attr.cy]="s.cy" [attr.r]="s.r"
                fill="white" [attr.opacity]="s.opacity"
              />
            }

            <!-- Corpo da montanha -->
            <path
              d="M0,340 L80,340 L160,255 L220,215 L280,170
                 L330,130 L370,88 L400,38
                 L430,88 L470,130 L520,170 L580,215
                 L640,255 L720,340 L800,340 Z"
              fill="url(#ev_mount)"
            />

            <!-- Sombra lateral direita -->
            <path
              d="M400,38 L430,88 L520,170 L580,215 L640,255 L720,340 L800,340"
              fill="rgba(0,0,0,0.18)"
            />

            <!-- Neve no cume -->
            <path
              d="M370,88 L400,38 L430,88 L415,98 L400,78 L385,98 Z"
              fill="url(#ev_snow)" opacity="0.9"
            />

            <!-- Label CUME -->
            <text
              x="400" y="30"
              text-anchor="middle"
              font-family="Cinzel,serif"
              font-size="9"
              fill="#c9a84c"
              letter-spacing="2"
              opacity="0.9"
            >CUME</text>

            <!-- ── Marcadores com FOTO de cada escalador ─────── -->
            @for (c of climbers(); track c.user.uid) {
              <g>
                <!-- Anel colorido de fundo (borda do avatar) -->
                <circle
                  [attr.cx]="c.cx"
                  [attr.cy]="c.cy - 14"
                  r="16"
                  [attr.fill]="c.color"
                  opacity="0.95"
                  stroke="white"
                  stroke-width="1.5"
                />

                @if (c.user.photoUrl) {
                  <!-- Foto clipada em círculo -->
                  <image
                    [attr.href]="c.user.photoUrl"
                    [attr.x]="c.cx - 14"
                    [attr.y]="c.cy - 28"
                    width="28"
                    height="28"
                    preserveAspectRatio="xMidYMid slice"
                    [attr.clip-path]="'url(#' + c.clipId + ')'"
                  />
                } @else {
                  <!-- Fallback: inicial sobre o anel colorido -->
                  <text
                    [attr.x]="c.cx"
                    [attr.y]="c.cy - 9"
                    text-anchor="middle"
                    font-family="Cinzel,serif"
                    font-size="11"
                    fill="#0a1628"
                    font-weight="bold"
                  >{{ c.user.name[0].toUpperCase() }}</text>
                }

                <!-- Haste -->
                <line
                  [attr.x1]="c.cx" [attr.y1]="c.cy - 0"
                  [attr.x2]="c.cx" [attr.y2]="c.cy + 6"
                  [attr.stroke]="c.color" stroke-width="2"
                />

                <!-- Ponto de base na montanha -->
                <circle
                  [attr.cx]="c.cx" [attr.cy]="c.cy + 7"
                  r="3" [attr.fill]="c.color"
                />
              </g>
            }
          </svg>
        </div>
        <!-- ── FIM SVG ─────────────────────────────────────── -->

        <!-- Lista de ranking -->
        <div class="climber-list">
          @for (desb of pathfinders(); track desb.uid; let i = $index) {
            <div class="climber-item">
              <div class="climber-rank" [ngClass]="rankClass(i)">{{ rankIcon(i) }}</div>
              <app-avatar [photoUrl]="desb.photoUrl" [name]="desb.name" [size]="40" />
              <div class="climber-info">
                <div class="climber-name">{{ desb.name }}</div>
                <div class="climber-unit">
                  {{ desb.position ? desb.position + ' · ' : '' }}{{ desb.unit }}
                </div>
              </div>
              <div>
                <div class="climber-points">{{ desb.points }}</div>
                <div class="climber-pts-label">pts</div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class PodiumComponent {
  private readonly userSvc = inject(UserService);

  readonly pathfinders = computed(() => this.userSvc.getPathfinders());
  readonly legendOpen      = signal(false);

  readonly climbers = computed<Climber[]>(() => {
    const desbs  = this.pathfinders().slice(0, 10);
    const maxPts = Math.max(1, desbs[0]?.points ?? 1);

    return desbs.map((user, i) => {
      const ratio = (user.points ?? 0) / maxPts;
      // cx: alternado esq/dir do centro; líder (~ratio 1) fica mais central
      const cx = 400 + (i % 2 === 0 ? -1 : 1) * (1 - ratio) * 150;
      // cy: cume = 50, base = 275  →  range de 225px
      const cy = 50 + (1 - ratio) * 225;

      return {
        user,
        cx:     Math.round(cx * 10) / 10,
        cy:     Math.round(cy * 10) / 10,
        color:  CLIMBER_COLORS[i % CLIMBER_COLORS.length],
        // ID único para o clipPath de cada escalador
        clipId: `clip_${user.uid.replace(/[^a-zA-Z0-9]/g, '_')}`,
      };
    });
  });

  readonly stars: Star[] = Array.from({ length: 20 }, (_, i) => ({
    id:      i,
    cx:      30 + i * 38,
    cy:      +(10 + Math.sin(i * 2.5) * 15).toFixed(1),
    r:       +(0.8 + (i % 3) * 0.3).toFixed(1),
    opacity: +(0.3 + (i % 4) * 0.1).toFixed(1),
  }));

  rankClass(i: number): string {
    return (['rank-1', 'rank-2', 'rank-3'] as const)[i] ?? 'rank-other';
  }

  rankIcon(i: number): string {
    return (['🥇', '🥈', '🥉'] as const)[i] ?? `#${i + 1}`;
  }
}

const CLIMBER_COLORS = [
  '#ffd700','#c0c0c0','#cd7f32','#90cdf4','#68d391',
  '#f6ad55','#fc8181','#b794f4','#76e4f7','#fbb6ce',
];
