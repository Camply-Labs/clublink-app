import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  OnInit,
  runInInjectionContext
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { AppStatusService } from './core/services/app-status.service';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { AppStatusComponent } from './features/app-status/app-status.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastContainerComponent, AppStatusComponent],
  template: `
    <app-toast-container />

    @if (blocked()) {
      <app-status-screen />
    } @else {
      <router-outlet />
    }
  `,
})
export class AppComponent implements OnInit {
  private readonly auth      = inject(AuthService);
  private readonly router    = inject(Router);
  private readonly statusSvc = inject(AppStatusService);
  private readonly injectorObj = inject(Injector);

  readonly blocked = computed(() => {
    if (this.statusSvc.isLoading()) return false; // aguarda carregar
    return this.statusSvc.isBlocked();
  });

  ngOnInit(): void {
    runInInjectionContext(this.injectorObj, () => {
      toObservable(this.auth.isLoading).pipe(
        filter(loading => !loading),
        take(1),
      ).subscribe(() => {
        const user = this.auth.currentUser();
        const url  = this.router.url;

        if (!user && url !== '/login') {
          this.router.navigate(['/login']);
        } else if (user && url === '/login') {
          this.router.navigate([user.role === 'diretoria' ? '/podium' : '/my-points']);
        }
      });
    });
  }
}
