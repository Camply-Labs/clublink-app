import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  OnInit,
  runInInjectionContext
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith, take } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { AppStatusService } from './core/services/app-status.service';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { AppStatusComponent } from './features/app-status/app-status.component';

import { ThemeService }          from './core/theme/theme.service';
import { CustomizationService }  from './core/services/customization.service';

/** Rotas que nunca são bloqueadas pelo status da aplicação */
const OVERRIDE_PATHS = ['/admin-override'];

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastContainerComponent, AppStatusComponent],
  template: `
    <app-toast-container />

    @if (blocked()) {
      <!-- Tela de bloqueio — sobrepõe TUDO exceto /admin-override -->
      <app-status-screen />
    } @else {
      <router-outlet />
    }
  `,
})
export class AppComponent implements OnInit {
  private readonly auth       = inject(AuthService);
  private readonly router     = inject(Router);
  private readonly statusSvc  = inject(AppStatusService);
  private readonly injectorObj = inject(Injector);

  private _theme         = inject(ThemeService);
  private _customization = inject(CustomizationService);

readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    {
      initialValue: this.router.url,
    }
  );

  /**
   * true quando a rota atual é uma rota de override (ex: /admin-override).
   * Usa signal para reagir a mudanças de rota.
   */
  private readonly isOverrideRoute = computed(() => {
    // Lemos via router.url — reativo a cada NavigationEnd
    return OVERRIDE_PATHS.some(p => this.currentUrl().startsWith(p));
  });

  /**
   * Bloqueia se:
   *  1. O status terminou de carregar
   *  2. O status pede bloqueio
   *  3. NÃO estamos na rota de override
   */
  readonly blocked = computed(() => {
    if (this.statusSvc.isLoading())  return false;
    if (this.isOverrideRoute())      return false;
    return this.statusSvc.isBlocked();
  });

  ngOnInit(): void {
    this._theme.init();
    this._customization.loadCustomization();

    setTimeout(() => {
      runInInjectionContext(this.injectorObj, () => {
        toObservable(this.auth.isLoading).pipe(
          filter(loading => !loading),
          take(1),
        ).subscribe(() => {
          const user = this.auth.currentUser();
          const url  = this.router.url;

          // Não redireciona se está na rota de override
          if (OVERRIDE_PATHS.some(p => url.startsWith(p))) return;

          if (!user && url !== '/login') {
            this.router.navigate(['/login']);
          } else if (user && url === '/login') {
            this.router.navigate([user.role === 'diretoria' ? '/podium' : '/my-points']);
          }
        });
      });
    }, 500);
  }
}
