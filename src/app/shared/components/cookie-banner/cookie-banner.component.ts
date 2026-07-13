import {
  Component,
  OnInit,
  signal,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule }      from '@angular/common';
import { LocalStorageCacheService } from '../../../core/cache/local-storage-cache.service';
import { CACHE_KEYS }               from '../../../core/cache/cache.model';

/**
 * ============================================================
 *  CookieBannerComponent
 *  shared/components/cookie-banner/cookie-banner.component.ts
 *
 *  Banner de consentimento de cookies LGPD-friendly.
 *  – Aparece apenas se o usuário ainda não consentiu
 *  – Persiste decisão no localStorage via LocalStorageCacheService
 *  – Sem TTL (persiste indefinidamente até o usuário limpar o cache)
 *  – Exporta o status de consentimento para que outros serviços possam
 *    verificar antes de ativar analytics / cache de dados sensíveis
 *
 *  Uso:
 *    <app-cookie-banner />   ← colocar no AppComponent template
 * ============================================================
 */
export interface CookieConsent {
  analytics:   boolean;  // Google Analytics, etc.
  functional:  boolean;  // Cache de sessão, preferências (sempre true)
  marketing:   boolean;  // Remarketing (não usado no ClubLink hoje)
  decidedAt:   string;   // ISO 8601
}

@Component({
  selector:        'app-cookie-banner',
  standalone:      true,
  imports:         [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible$()) {
      <div class="ck-banner" role="dialog" aria-live="polite"
           aria-label="Aviso de cookies" aria-modal="false">

        <div class="ck-banner__inner">
          <!-- Ícone -->
          <div class="ck-banner__icon" aria-hidden="true">🍪</div>

          <!-- Texto -->
          <div class="ck-banner__content">
            <p class="ck-banner__title">Este site usa cookies</p>
            <p class="ck-banner__desc">
              Usamos cookies funcionais para salvar suas preferências e
              garantir uma experiência personalizada. Ao continuar navegando,
              você concorda com nossa
              <a href="/politica-de-privacidade" class="ck-link">
                Política de Privacidade
              </a>.
            </p>
          </div>

          <!-- Ações -->
          <div class="ck-banner__actions">
            <button class="ck-btn ck-btn--outline" (click)="onDecline()">
              Apenas essenciais
            </button>
            <button class="ck-btn ck-btn--primary" (click)="onAcceptAll()">
              Aceitar todos
            </button>
          </div>
        </div>

      </div>
    }
  `,
  styles: [`
    .ck-banner {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      width: min(96vw, 780px);
      background: #0D1B3E;
      border: 1px solid rgba(212, 160, 23, .3);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, .6);
      animation: ckSlideUp .35s cubic-bezier(.4, 0, .2, 1) both;
    }
    .ck-banner__inner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      flex-wrap: wrap;
    }
    .ck-banner__icon {
      font-size: 2rem;
      flex-shrink: 0;
    }
    .ck-banner__content {
      flex: 1;
      min-width: 200px;
    }
    .ck-banner__title {
      font-weight: 700;
      color: #F5F5F0;
      font-size: .95rem;
      margin-bottom: .3rem;
    }
    .ck-banner__desc {
      font-size: .82rem;
      color: #B8BDCC;
      line-height: 1.55;
    }
    .ck-link {
      color: #D4A017;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .ck-banner__actions {
      display: flex;
      gap: .75rem;
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .ck-btn {
      padding: .55rem 1.25rem;
      border-radius: 100px;
      font-size: .85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all .25s ease;
      border: 2px solid transparent;
      white-space: nowrap;
    }
    .ck-btn--primary {
      background: linear-gradient(135deg, #1A3A8F, #2A5CC7);
      color: #fff;
      border-color: #2A5CC7;
    }
    .ck-btn--primary:hover {
      background: linear-gradient(135deg, #2A5CC7, #3a70e0);
      transform: translateY(-1px);
    }
    .ck-btn--outline {
      background: transparent;
      color: #B8BDCC;
      border-color: rgba(255, 255, 255, .2);
    }
    .ck-btn--outline:hover {
      border-color: #D4A017;
      color: #D4A017;
    }
    @keyframes ckSlideUp {
      from { opacity: 0; transform: translateX(-50%) translateY(20px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @media (max-width: 600px) {
      .ck-banner { bottom: 0; left: 0; right: 0; width: 100%;
                   transform: none; border-radius: 16px 16px 0 0; }
      .ck-banner__actions { width: 100%; justify-content: flex-end; }
    }
  `],
})
export class CookieBannerComponent implements OnInit {

  private _cache      = inject(LocalStorageCacheService);
  private _platformId = inject(PLATFORM_ID);

  readonly visible$ = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this._platformId)) return;

    // Mostra o banner apenas se não houver decisão anterior
    const existing = this._cache.get<CookieConsent>(CACHE_KEYS.COOKIE_CONSENT);
    this.visible$.set(!existing.hit);
  }

  onAcceptAll(): void {
    this._saveConsent({ analytics: true, functional: true, marketing: false });
  }

  onDecline(): void {
    this._saveConsent({ analytics: false, functional: true, marketing: false });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _saveConsent(partial: Omit<CookieConsent, 'decidedAt'>): void {
    const consent: CookieConsent = {
      ...partial,
      decidedAt: new Date().toISOString(),
    };
    // Sem TTL — persiste até o usuário limpar o storage
    this._cache.set(CACHE_KEYS.COOKIE_CONSENT, consent);
    this.visible$.set(false);
  }

  // ── API pública estática ──────────────────────────────────────────────────

  /**
   * Verifica se o usuário já consentiu com o tipo especificado.
   * Use em guards / serviços antes de ativar tracking.
   *
   * @example
   *   const ok = CookieBannerComponent.hasConsent(cache, 'analytics');
   */
  static hasConsent(
    cache: LocalStorageCacheService,
    type: keyof Omit<CookieConsent, 'decidedAt'>,
  ): boolean {
    const res = cache.get<CookieConsent>(CACHE_KEYS.COOKIE_CONSENT);
    if (!res.hit || !res.value) return false;
    return res.value[type] === true;
  }
}
