import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { ClubLogoComponent } from '../club-logo/club-logo.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { FooterComponent } from '../footer/footer.component';
import { environment } from '../../../../environments/environment';
import { AppThemeMode, THEME_CATALOG } from '../../models/app-config.model';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'shell.component.scss',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ClubLogoComponent, AvatarComponent, FooterComponent],
  template: `
    <!-- ═══════════════════════════════════════════════════════
         TOPBAR
         ═══════════════════════════════════════════════════════ -->
    <header class="topbar">
      <!-- Hamburguer / fechar sidebar -->
      <button class="topbar-toggle" (click)="sidebarOpen.set(!sidebarOpen())"
              [attr.aria-label]="sidebarOpen() ? 'Fechar menu' : 'Abrir menu'">
        @if (sidebarOpen()) {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        } @else {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        }
      </button>

      <!-- Logo + nome -->
      <a class="topbar-brand" routerLink="/podium">
        <app-club-logo [size]="42" />
        <span class="topbar-brand-name">
          Garras de Águia
          <small>Desbravadores</small>
        </span>
      </a>

      <!-- Avatar do usuário (abre dropdown de conta) -->
      <div class="topbar-user">
        <button class="topbar-avatar-btn"
                (click)="userMenuOpen.set(!userMenuOpen())"
                [attr.aria-expanded]="userMenuOpen()">
          <app-avatar [photoUrl]="user()?.photoUrl" [name]="user()?.name ?? ''" [size]="36" />
        </button>

        @if (userMenuOpen()) {
          <div class="user-dropdown">
            <div class="user-dropdown-header">
              <app-avatar [photoUrl]="user()?.photoUrl" [name]="user()?.name ?? ''" [size]="44" />
              <div class="user-dropdown-info">
                <div class="user-dropdown-name">{{ user()?.name || user()?.email }}</div>
                <div class="user-dropdown-role">
                  @if (isDirector()) {
                    {{ permSvc.isAdmin() ? '⭐ Admin' : '👑 Diretoria' }}
                  } @else {
                    🦅 Desbravador
                  }
                </div>
              </div>
            </div>
            <div class="user-dropdown-divider"></div>
            <a class="user-dropdown-item" routerLink="/profile"
               (click)="userMenuOpen.set(false)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              Gerenciar Conta
            </a>
            <button class="user-dropdown-item danger" (click)="logout()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
          </div>
        }
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════════
         OVERLAY (fecha sidebar em mobile ao clicar fora)
         ═══════════════════════════════════════════════════════ -->
    @if (sidebarOpen()) {
      <div class="sidebar-overlay" (click)="sidebarOpen.set(false)"></div>
    }

    <!-- ═══════════════════════════════════════════════════════
         SIDEBAR
         ═══════════════════════════════════════════════════════ -->
    <aside class="sidebar" [class.open]="sidebarOpen()">
      <nav class="sidebar-nav">

        <!-- Seção principal — todos os usuários -->
        <div class="sidebar-section">
          <div class="sidebar-section-label">Principal</div>

          <a class="sidebar-link" routerLink="/podium" routerLinkActive="active"
             (click)="closeSidebarMobile()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
            <span>Ranking</span>
          </a>

          <a class="sidebar-link" routerLink="/notices" routerLinkActive="active"
             (click)="closeSidebarMobile()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Quadro de Avisos</span>
          </a>

          <a class="sidebar-link" routerLink="/agenda" routerLinkActive="active"
             (click)="closeSidebarMobile()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8"  y1="2" x2="8"  y2="6"/>
              <line x1="3"  y1="10" x2="21" y2="10"/>
            </svg>
            <span>Agenda</span>
          </a>

          @if (!isDirector()) {
            <a class="sidebar-link" routerLink="/my-points" routerLinkActive="active"
               (click)="closeSidebarMobile()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Meus Pontos</span>
            </a>
          }
        </div>

        <!-- Seção gestão — apenas diretoria -->
        @if (isDirector()) {
          <div class="sidebar-section">
            <div class="sidebar-section-label">Gestão</div>

            @if (permSvc.can('members.view')) {
              <a class="sidebar-link" routerLink="/members" routerLinkActive="active"
                 (click)="closeSidebarMobile()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Membros</span>
              </a>
            }

            @if (permSvc.can('appointments.view')) {
              <a class="sidebar-link" routerLink="/appointments" routerLinkActive="active"
                 (click)="closeSidebarMobile()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5"  x2="12" y2="19"/>
                  <line x1="5"  y1="12" x2="19" y2="12"/>
                </svg>
                <span>Apontamentos</span>
              </a>
            }

            @if (permSvc.can('scoring.edit')) {
              <a class="sidebar-link" routerLink="/scoring" routerLinkActive="active"
                 (click)="closeSidebarMobile()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6"  y1="20" x2="6"  y2="14"/>
                </svg>
                <span>Pontuações</span>
              </a>
            }

            @if (permSvc.can('register.view')) {
              <a class="sidebar-link" routerLink="/register" routerLinkActive="active"
                 (click)="closeSidebarMobile()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                <span>Cadastrar</span>
              </a>
            }
          </div>
        }

        <!-- Seção admin -->
        @if (permSvc.isAdmin()) {
          <div class="sidebar-section">
            <div class="sidebar-section-label">Admin</div>
            <a class="sidebar-link" routerLink="/console" routerLinkActive="active"
               (click)="closeSidebarMobile()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4 17 10 11 4 5"/>
                <line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
              <span>Console</span>
            </a>
            <a class="sidebar-link" routerLink="/settings" routerLinkActive="active"
               (click)="closeSidebarMobile()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Configurações</span>
            </a>
          </div>
        }

      </nav>

      <!-- ── Seletor de Tema ───────────────────────────────────────── -->
      <div class="sb__theme-section">

        <div class="sb__section-label" [class.sb__section-label--hidden]="isCollapsed$()">
          Aparência
        </div>

        <!-- Botão que abre o painel de temas -->
        <button
          class="sb__theme-btn"
          [class.sb__theme-btn--active]="isThemePanelOpen$()"
          (click)="toggleThemePanel()"
          [title]="isCollapsed$() ? 'Tema: ' + currentTheme$().label : ''"
          aria-haspopup="true"
          [attr.aria-expanded]="isThemePanelOpen$()"
        >
          <!-- Swatch de preview da cor atual -->
          <span
            class="sb__theme-swatch"
            [style.background]="currentTheme$().previewBg"
            [style.border-color]="currentTheme$().previewFg"
            aria-hidden="true"
          ></span>

          @if (!isCollapsed$()) {
            <span class="sb__theme-label">{{ currentTheme$().label }}</span>
            <span class="sb__theme-arrow" aria-hidden="true">
              {{ isThemePanelOpen$() ? '▲' : '▼' }}
            </span>
          }
        </button>

        <!-- Painel de seleção de tema -->
        @if (isThemePanelOpen$()) {
          <div
            class="sb__theme-panel"
            [class.sb__theme-panel--collapsed]="isCollapsed$()"
            role="listbox"
            aria-label="Selecionar tema"
          >
            @for (theme of themeCatalog; track theme.id) {
              <button
                class="sb__theme-option"
                [class.sb__theme-option--active]="currentTheme$().id === theme.id"
                (click)="selectTheme(theme.id)"
                role="option"
                [attr.aria-selected]="currentTheme$().id === theme.id"
              >
                <!-- Preview swatch -->
                <span
                  class="sb__theme-option-swatch"
                  [style.background]="theme.previewBg"
                  aria-hidden="true"
                >
                  <span
                    class="sb__theme-option-swatch-fg"
                    [style.background]="theme.previewFg"
                  ></span>
                </span>

                <div class="sb__theme-option-info">
                  <span class="sb__theme-option-name">
                    {{ theme.icon }} {{ theme.label }}
                  </span>
                  @if (!isCollapsed$()) {
                    <span class="sb__theme-option-desc">{{ theme.description }}</span>
                  }
                </div>

                @if (currentTheme$().id === theme.id) {
                  <span class="sb__theme-option-check" aria-hidden="true">✓</span>
                }
              </button>
            }
          </div>
        }

      </div>

      <!-- Footer compacto no sidebar -->
      <div class="sidebar-footer">
        <div class="sidebar-footer-version">v{{ version() }}</div>
        <div class="sidebar-footer-copy">© {{ year }} Garras de Águia</div>
      </div>
    </aside>

    <!-- ═══════════════════════════════════════════════════════
         CONTEÚDO PRINCIPAL
         ═══════════════════════════════════════════════════════ -->
    <main class="page-content" [class.sidebar-is-open]="sidebarOpen()">
      <router-outlet />
      <app-footer version="{{ version() }}" />
    </main>
  `,
})
export class ShellComponent {
  private readonly auth   = inject(AuthService);
  readonly version  = signal(environment.version);
  private readonly router = inject(Router);
  readonly permSvc        = inject(PermissionService);
  readonly themeService  = inject(ThemeService);

  readonly user       = this.auth.currentUser;
  readonly isDirector = computed(() => this.auth.currentUser()?.role === 'diretoria');
  readonly sidebarOpen  = signal(false);
  readonly userMenuOpen = signal(false);
  readonly year = new Date().getFullYear();

  readonly themeCatalog    = THEME_CATALOG;
  readonly currentTheme$   = this.themeService.currentTheme$;
  readonly isCollapsed$      = signal(false);
  readonly isThemePanelOpen$ = signal(false);

  /** Fecha o dropdown de usuário ao clicar em qualquer lugar fora */
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.topbar-user')) {
      this.userMenuOpen.set(false);
    }
  }

  /** Em desktop o sidebar fica aberto — em mobile fecha ao navegar */
  closeSidebarMobile(): void {
    if (window.innerWidth < 1024) {
      this.sidebarOpen.set(false);
    }
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
    });
  }

  toggleThemePanel(): void {
      this.isThemePanelOpen$.update(v => !v);
    }

  selectTheme(mode: AppThemeMode): void {
    this.themeService.setMode(mode);
    setTimeout(() => this.isThemePanelOpen$.set(false), 200);
  }
}
