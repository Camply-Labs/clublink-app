import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'profile.component.scss',
  imports: [FormsModule, AvatarComponent],
  template: `
    <div class="section-header">
      <h2 class="section-title">Perfil</h2>
    </div>

    <div class="profile-layout">

      <!-- ── Cartão de identidade ──────────────────────────── -->
      <div class="card profile-id-card">
        <app-avatar
          [photoUrl]="user()?.photoUrl"
          [name]="user()?.name ?? ''"
          [size]="80"
        />
        <div class="profile-name">{{ user()?.name }}</div>
        <div class="profile-unit">{{ user()?.unit }}</div>
        @if (user()?.position) {
          <div class="profile-position">{{ user()?.position }}</div>
        }
        <div class="profile-email">{{ user()?.email }}</div>
        <div class="profile-role-badge" [class.is-admin]="user()?.isAdmin">
          @if (user()?.role === 'diretoria') {
            {{ user()?.isAdmin ? '⭐ Administrador' : '👑 Diretoria' }}
          } @else {
            🦅 Desbravador
          }
        </div>
      </div>

      <div class="profile-forms">

        <!-- ── Vincular Google ──────────────────────────────── -->
        <div class="card">
          <h3 class="card-title">🔗 Login com Google</h3>

          @if (googleLinked()) {
            <div class="google-linked-badge">
              <span>✓</span> Conta Google vinculada
            </div>
          } @else {
            <p class="google-hint">
              Vincule sua conta Google para entrar sem digitar senha.
            </p>
            <button
              class="btn btn-google btn-full"
              [disabled]="linkingGoogle()"
              (click)="linkGoogle()"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {{ linkingGoogle() ? 'Vinculando…' : 'Vincular conta Google' }}
            </button>
          }
        </div>

        <!-- ── Alterar senha ────────────────────────────────── -->
        <div class="card">
          <h3 class="card-title">🔒 Alterar Senha</h3>

          <div class="form-group">
            <label class="form-label">Senha Atual *</label>
            <div class="input-group">
              <input [type]="showCurrent() ? 'text' : 'password'" class="form-control"
                     placeholder="Sua senha atual" [(ngModel)]="currentPw" />
              <button class="pw-toggle" type="button" (click)="showCurrent.set(!showCurrent())">
                {{ showCurrent() ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Nova Senha *</label>
            <div class="input-group">
              <input [type]="showNew() ? 'text' : 'password'" class="form-control"
                     placeholder="Mínimo 6 caracteres" [(ngModel)]="newPw" />
              <button class="pw-toggle" type="button" (click)="showNew.set(!showNew())">
                {{ showNew() ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Confirmar Nova Senha *</label>
            <div class="input-group">
              <input [type]="showConfirm() ? 'text' : 'password'" class="form-control"
                     placeholder="Repita a nova senha" [(ngModel)]="confirmPw" />
              <button class="pw-toggle" type="button" (click)="showConfirm.set(!showConfirm())">
                {{ showConfirm() ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <button class="btn btn-primary btn-full" style="margin-top:.5rem;"
                  [disabled]="savingPw()" (click)="savePassword()">
            {{ savingPw() ? 'Salvando…' : 'Salvar Nova Senha' }}
          </button>
        </div>

      </div>
    </div>
  `,
})
export class ProfileComponent {
  private readonly auth  = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly user = this.auth.currentUser;

  currentPw = ''; newPw = ''; confirmPw = '';

  readonly savingPw      = signal(false);
  readonly linkingGoogle = signal(false);
  readonly showCurrent   = signal(false);
  readonly showNew       = signal(false);
  readonly showConfirm   = signal(false);

  readonly googleLinked = signal(this.auth.hasGoogleLinked);

  async linkGoogle(): Promise<void> {
    this.linkingGoogle.set(true);
    try {
      await this.auth.linkGoogle();
      this.googleLinked.set(true);
      this.toast.success('Conta Google vinculada com sucesso!');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/credential-already-in-use') {
        this.toast.error('Esta conta Google já está vinculada a outro usuário.');
      } else if (code === 'auth/popup-closed-by-user') {
        this.toast.info('Janela fechada. Tente novamente.');
      } else {
        this.toast.error('Erro ao vincular conta Google.');
      }
    } finally {
      this.linkingGoogle.set(false);
    }
  }

  async savePassword(): Promise<void> {
    if (!this.currentPw || !this.newPw || !this.confirmPw) {
      this.toast.error('Preencha todos os campos.'); return;
    }
    if (this.newPw !== this.confirmPw) {
      this.toast.error('As senhas não coincidem.'); return;
    }
    if (this.newPw.length < 6) {
      this.toast.error('Nova senha deve ter ao menos 6 caracteres.'); return;
    }
    this.savingPw.set(true);
    try {
      await this.auth.changePassword(this.currentPw, this.newPw);
      this.toast.success('Senha alterada com sucesso!');
      this.currentPw = ''; this.newPw = ''; this.confirmPw = '';
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      const map: Record<string, string> = {
        'auth/wrong-password':    'Senha atual incorreta.',
        'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
        'auth/weak-password':     'Nova senha muito fraca.',
      };
      this.toast.error(map[code] ?? 'Erro ao alterar senha.');
    } finally {
      this.savingPw.set(false);
    }
  }
}
