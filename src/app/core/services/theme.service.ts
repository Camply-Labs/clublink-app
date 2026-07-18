import {
  Injectable, signal, computed, inject, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemeCacheService } from '../services/theme-cache.service';
import {
  AppThemeMode,
  THEME_CATALOG,
  ThemeDefinition,
  DEFAULT_THEME_MODE,
} from '../../shared/models/app-config.model';

/**
 * ============================================================
 *  ThemeService
 *  core/services/theme.service.ts
 *
 *  Gerencia os três temas da aplicação ClubLink:
 *    'nightsky' → classe .theme-nightsky no <html>
 *    'light'    → classe .theme-light
 *    'dark'     → classe .theme-dark
 *
 *  Fluxo:
 *  1. init() chamado no AppComponent.ngOnInit()
 *  2. Lê cache → senão, detecta prefers-color-scheme do SO
 *     (nightsky é o fallback quando o SO prefere dark)
 *  3. setMode() / cycleModes() persistem no cache e aplicam a classe
 *
 *  CSS:
 *    As variáveis --cl-* são definidas em shared/styles/themes.scss
 *    e sobrescritas por cada classe .theme-*
 * ============================================================
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {

  private _cache      = inject(ThemeCacheService);
  private _platformId = inject(PLATFORM_ID);

  // ── Estado ────────────────────────────────────────────────────────────────

  private _mode = signal<AppThemeMode>(DEFAULT_THEME_MODE);

  readonly mode$    = this._mode.asReadonly();
  readonly catalog$ = signal<ThemeDefinition[]>([...THEME_CATALOG]).asReadonly();

  readonly currentTheme$ = computed(() =>
    THEME_CATALOG.find(t => t.id === this._mode()) ?? THEME_CATALOG[0]
  );

  readonly isNightSky$ = computed(() => this._mode() === 'nightsky');
  readonly isLight$    = computed(() => this._mode() === 'light');
  readonly isDark$     = computed(() => this._mode() === 'dark');

  // ── Init ──────────────────────────────────────────────────────────────────

  init(): void {
    if (!isPlatformBrowser(this._platformId)) return;

    let mode: AppThemeMode;

    if (this._cache.isCached()) {
      mode = this._cache.get();
    } else {
      // Sem preferência salva: nightsky se SO prefere dark, light caso contrário
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      mode = prefersDark ? 'nightsky' : 'light';
    }

    this._applyMode(mode, false);

    // Ouve mudança do SO apenas se o usuário nunca escolheu manualmente
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!this._cache.isCached()) {
        this._applyMode(e.matches ? 'nightsky' : 'light', false);
      }
    });
  }

  // ── Ações públicas ────────────────────────────────────────────────────────

  /** Define um modo específico e persiste */
  setMode(mode: AppThemeMode): void {
    this._applyMode(mode, true);
  }

  /**
   * Cicla entre os três temas em ordem: nightsky → light → dark → nightsky
   * Conveniente para um botão de toggle único no sidebar
   */
  cycleModes(): void {
    const order: AppThemeMode[] = ['nightsky', 'light', 'dark'];
    const idx  = order.indexOf(this._mode());
    const next = order[(idx + 1) % order.length];
    this._applyMode(next, true);
  }

  // ── Implementação ─────────────────────────────────────────────────────────

  private _applyMode(mode: AppThemeMode, persist: boolean): void {
    if (!isPlatformBrowser(this._platformId)) return;

    this._mode.set(mode);

    const html = document.documentElement;
    html.classList.remove('theme-nightsky', 'theme-light', 'theme-dark');
    html.classList.add(`theme-${mode}`);

    // color-scheme nativo do browser
    html.style.colorScheme = mode === 'light' ? 'light' : 'dark';

    if (persist) this._cache.save(mode);
  }
}
