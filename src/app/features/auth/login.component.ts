import { ChangeDetectionStrategy, Component, inject, Injector, runInInjectionContext, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ClubLinkLogoComponent } from '../../shared/components/clublink-logo/clublink-logo.component';

type View = 'login' | 'forgot';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'login.component.scss',
  imports: [FormsModule, ClubLinkLogoComponent],
  template: `
    <div class="login-page">
      <div class="login-card">
        <app-clublink-logo [size]="90" />
        <h1 class="login-title">ClubLink</h1>
        <p class="login-subtitle">Clube Conectado!</p>

        <!-- ══════════════════════════════════════════════════
             VIEW: LOGIN
             ══════════════════════════════════════════════════ -->
        @if (view() === 'login') {

          <!-- E-mail -->
          <div class="form-group">
            <label class="form-label" for="email">E-mail</label>
            <input id="email" type="email" class="form-control"
                   placeholder="seu@email.com" [(ngModel)]="email"
                   autocomplete="email" (keyup.enter)="login()" />
          </div>

          <!-- Senha -->
          <div class="form-group">
            <label class="form-label" for="password">
              Senha
              <button class="forgot-link" type="button"
                      (click)="goToForgot()">
                Esqueci minha senha
              </button>
            </label>
            <div class="input-group">
              <input id="password" [type]="showPw() ? 'text' : 'password'"
                     class="form-control" placeholder="••••••••"
                     [(ngModel)]="password" autocomplete="current-password"
                     (keyup.enter)="login()" />
              <button class="pw-toggle" type="button" (click)="showPw.set(!showPw())">
                {{ showPw() ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <!-- Entrar -->
          <button class="btn btn-primary btn-full" style="margin-top:.5rem;"
                  [disabled]="loading()" (click)="login()">
            {{ loading() ? 'Entrando…' : 'Entrar' }}
          </button>

          <!-- Divisor -->
          <div class="login-divider"><span>ou</span></div>

          <!-- Entrar com Google -->
          <button class="btn btn-google btn-full"
                  [disabled]="loadingGoogle()" (click)="loginGoogle()">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {{ loadingGoogle() ? 'Aguarde…' : 'Entrar com Google' }}
          </button>

          <p class="login-hint">
            Não possui acesso? Solicite à sua diretoria o cadastro.<br/>
            <small>O login com Google exige que sua conta esteja vinculada previamente.</small>
          </p>
        }

        <!-- ══════════════════════════════════════════════════
             VIEW: ESQUECI MINHA SENHA
             ══════════════════════════════════════════════════ -->
        @if (view() === 'forgot') {

          <!-- Sucesso: e-mail enviado -->
          @if (resetSent()) {
            <div class="reset-success">
              <div class="reset-success-icon">📧</div>
              <h3 class="reset-success-title">E-mail enviado!</h3>
              <p class="reset-success-body">
                Enviamos um link de redefinição de senha para
                <strong>{{ resetEmail }}</strong>.<br/>
                Verifique sua caixa de entrada e a pasta de spam.
              </p>
              <p class="reset-success-note">
                O link expira em <strong>1 hora</strong>.
                Se não receber o e-mail, verifique se o endereço está correto
                e tente novamente.
              </p>
            </div>
            <button class="btn btn-secondary btn-full" style="margin-top:1.25rem;"
                    (click)="backToLogin()">
              ← Voltar ao login
            </button>
          } @else {
            <!-- Formulário de recuperação -->
            <div class="forgot-header">
              <div class="forgot-icon">🔑</div>
              <p class="forgot-desc">
                Informe o e-mail cadastrado. Enviaremos um link
                para você criar uma nova senha.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label" for="reset-email">E-mail cadastrado *</label>
              <input id="reset-email" type="email" class="form-control"
                     placeholder="seu@email.com"
                     [(ngModel)]="resetEmail"
                     autocomplete="email"
                     (keyup.enter)="sendReset()" />
            </div>

            @if (resetError()) {
              <div class="reset-error-msg">{{ resetError() }}</div>
            }

            <button class="btn btn-primary btn-full" style="margin-top:.5rem;"
                    [disabled]="sendingReset()" (click)="sendReset()">
              {{ sendingReset() ? 'Enviando…' : '📨 Enviar link de redefinição' }}
            </button>

            <button class="btn-back-link" type="button"
                    (click)="backToLogin()">
              ← Voltar ao login
            </button>
          }
        }

      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly firebaseAuth = inject(Auth);
  private readonly auth         = inject(AuthService);
  private readonly router       = inject(Router);
  private readonly toast        = inject(ToastService);

  // ── View ────────────────────────────────────────────────────
  readonly view = signal<View>('login');

  // ── Login ───────────────────────────────────────────────────
  email = ''; password = '';
  readonly loading       = signal(false);
  readonly loadingGoogle = signal(false);
  readonly showPw        = signal(false);

  private readonly injectorObj = inject(Injector);

  // ── Recuperação de senha ────────────────────────────────────
  resetEmail    = '';
  readonly sendingReset = signal(false);
  readonly resetSent    = signal(false);
  readonly resetError   = signal<string | null>(null);

  // ── Navegação de views ──────────────────────────────────────
  goToForgot(): void {
    this.resetEmail = this.email; // pré-preenche com o e-mail já digitado
    this.resetSent.set(false);
    this.resetError.set(null);
    this.view.set('forgot');
  }

  backToLogin(): void {
    this.view.set('login');
    this.resetSent.set(false);
    this.resetError.set(null);
  }

  // ── Enviar e-mail de redefinição ────────────────────────────
  async sendReset(): Promise<void> {
    const email = this.resetEmail.trim();
    if (!email) {
      this.resetError.set('Informe seu e-mail cadastrado.');
      return;
    }

    this.sendingReset.set(true);
    this.resetError.set(null);

    try {
      await sendPasswordResetEmail(this.firebaseAuth, email);
      this.resetSent.set(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      // Por segurança, não revelamos se o e-mail existe ou não
      // — mostramos sucesso mesmo para e-mails não cadastrados
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        // Firebase não encontrou o e-mail — exibimos sucesso mesmo assim
        // para não vazar informação sobre quais contas existem
        this.resetSent.set(true);
      } else if (code === 'auth/too-many-requests') {
        this.resetError.set('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else {
        this.resetError.set('Erro ao enviar o e-mail. Tente novamente.');
      }
    } finally {
      this.sendingReset.set(false);
    }
  }

  // ── Login com e-mail/senha ──────────────────────────────────
  login(): void {
    if (!this.email.trim() || !this.password) {
      this.toast.error('Preencha e-mail e senha.'); return;
    }
    this.loading.set(true);
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        runInInjectionContext(this.injectorObj, () => {
          toObservable(this.auth.isLoading).pipe(
            filter(l => !l), take(1),
          ).subscribe(() => {
            this.navigateByRole();
            this.loading.set(false);
          });
        });
      },
      error: (err: { code?: string }) => {
        this.toast.error(this.friendlyError(err));
        this.loading.set(false);
      },
    });
  }

  // ── Login com Google ────────────────────────────────────────
  async loginGoogle(): Promise<void> {
    this.loadingGoogle.set(true);
    try {
      const result = await this.auth.loginWithGoogle();
      if (result === 'not-registered') {
        this.toast.error('Conta Google não vinculada a nenhum cadastro. Solicite à diretoria.');
      } else {
        this.navigateByRole();
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code !== 'auth/popup-closed-by-user') {
        this.toast.error('Erro ao entrar com Google. Tente novamente.');
      }
    } finally {
      this.loadingGoogle.set(false);
    }
  }

  private navigateByRole(): void {
    const role = this.auth.currentUser()?.role;
    this.router.navigate([role === 'diretoria' ? '/podium' : '/my-points']);
  }

  private friendlyError(err: { code?: string }): string {
    const map: Record<string, string> = {
      'auth/wrong-password':     'Senha incorreta.',
      'auth/user-not-found':     'Usuário não encontrado.',
      'auth/invalid-email':      'E-mail inválido.',
      'auth/too-many-requests':  'Muitas tentativas. Tente mais tarde.',
      'auth/invalid-credential': 'Credenciais inválidas.',
    };
    return map[err.code ?? ''] ?? 'Erro ao entrar. Verifique suas credenciais.';
  }
}
