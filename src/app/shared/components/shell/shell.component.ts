import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { ClubLogoComponent } from '../club-logo/club-logo.component';
import { FooterComponent } from '../footer/footer.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'shell.component.scss',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ClubLogoComponent, AvatarComponent, FooterComponent],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <app-club-logo [size]="42" />
        <span>
          Garras de Águia
          <small>Clube de Desbravadores</small>
        </span>
      </div>

      <button class="navbar-toggler" (click)="menuOpen.set(!menuOpen())" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>

      <div class="navbar-collapse" [class.open]="menuOpen()">
        <ul class="navbar-nav">
          <li>
            <a class="nav-link" routerLink="/podium" routerLinkActive="active"
               (click)="menuOpen.set(false)">🏔 Ranking</a>
          </li>

          @if (permSvc.can('members.view')) {
            <li>
              <a class="nav-link" routerLink="/members" routerLinkActive="active"
                 (click)="menuOpen.set(false)">👥 Membros</a>
            </li>
          }
          @if (permSvc.can('appointments.view')) {
            <li>
              <a class="nav-link" routerLink="/appointments" routerLinkActive="active"
                 (click)="menuOpen.set(false)">✏️ Apontamentos</a>
            </li>
          }
          @if (permSvc.can('register.view')) {
            <li>
              <a class="nav-link" routerLink="/register" routerLinkActive="active"
                 (click)="menuOpen.set(false)">➕ Cadastrar</a>
            </li>
          }

          @if (!isDirector()) {
            <li>
              <a class="nav-link" routerLink="/my-points" routerLinkActive="active"
                 (click)="menuOpen.set(false)">⭐ Meus Pontos</a>
            </li>
          }

          <li>
            <a class="nav-link" routerLink="/profile" routerLinkActive="active"
               (click)="menuOpen.set(false)">👤 Perfil</a>
          </li>

          @if (permSvc.isAdmin()) {
            <li>
              <a class="nav-link" routerLink="/console" routerLinkActive="active"
                 (click)="menuOpen.set(false)">⚙️ Console</a>
            </li>
          }
        </ul>

        <div class="nav-user-info">
          <app-avatar [photoUrl]="user()?.photoUrl" [name]="user()?.name ?? ''" [size]="32" />
          <div>
            <div class="nav-user-name">{{ user()?.name || user()?.email }}</div>
            <div class="nav-user-role">
              @if (isDirector()) {
                {{ permSvc.isAdmin() ? '⭐ Admin' : '👑 Diretoria' }}
              } @else {
                🦅 Desbravador
              }
            </div>
          </div>
          <button class="btn-logout" (click)="logout()">Sair</button>
        </div>
      </div>
    </nav>

    <main class="page-content page-bg">
      <router-outlet />
    </main>

    <app-footer version={{environment.version}} />
  `,
})
export class ShellComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  readonly permSvc        = inject(PermissionService);
  readonly environment  = environment;
  readonly user       = this.auth.currentUser;
  readonly isDirector = computed(() => this.auth.currentUser()?.role === 'diretoria');
  readonly menuOpen   = signal(false);

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
    });
  }
}
