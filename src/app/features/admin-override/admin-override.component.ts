import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { AppStatusService } from '../../core/services/app-status.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  AppStatusKey,
  APP_STATUS_CONFIG,
} from '../../core/models/app-status.model';
import { ClubLinkLogoComponent } from '../../shared/components/clublink-logo/clublink-logo.component';

type Step = 'login' | 'panel';

const STATUS_OPTIONS: { key: AppStatusKey; label: string; icon: string; color: string }[] = [
  { key: 'production',  label: 'Em Produção',   icon: '✅', color: '#68d391' },
  { key: 'maintenance', label: 'Em Manutenção', icon: '🔧', color: '#f6ad55' },
  { key: 'offline',     label: 'Fora do Ar',    icon: '🚫', color: '#fc8181' },
];

@Component({
  selector: 'app-admin-override',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'admin-override.component.scss',
  imports: [FormsModule, ClubLinkLogoComponent],
  template: `
    <div class="override-page">

      <!-- Fundo sutil -->
      <div class="override-bg"></div>

      <div class="override-card">
        <app-clublink-logo [size]="64" />
        <h1 class="override-title">Garras de Águia</h1>
        <p class="override-subtitle">Painel de Controle de Status</p>

        <!-- ── STEP: LOGIN ─────────────────────────────────── -->
        @if (step() === 'login') {
          <p class="override-hint">
            Esta rota é restrita a administradores.<br/>
            Faça login com suas credenciais de admin para continuar.
          </p>

          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input type="email" class="form-control"
                   placeholder="admin@garradeaguia.com"
                   [(ngModel)]="email"
                   autocomplete="email"
                   (keyup.enter)="login()" />
          </div>

          <div class="form-group">
            <label class="form-label">Senha</label>
            <div class="input-group">
              <input [type]="showPw() ? 'text' : 'password'"
                     class="form-control"
                     placeholder="••••••••"
                     [(ngModel)]="password"
                     autocomplete="current-password"
                     (keyup.enter)="login()" />
              <button class="pw-toggle" type="button"
                      (click)="showPw.set(!showPw())">
                {{ showPw() ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          @if (loginError()) {
            <div class="override-error">{{ loginError() }}</div>
          }

          <button class="btn btn-primary btn-full"
                  [disabled]="loggingIn()"
                  (click)="login()">
            {{ loggingIn() ? 'Verificando…' : 'Entrar como Admin' }}
          </button>
        }

        <!-- ── STEP: PAINEL DE STATUS ──────────────────────── -->
        @if (step() === 'panel') {
          <!-- Status atual -->
          @if (currentStatus(); as cs) {
            <div class="status-current" [attr.data-status]="cs.status">
              <span class="status-current-icon">
                {{ statusCfg(cs.status).icon }}
              </span>
              <div>
                <div class="status-current-label"
                     [style.color]="statusCfg(cs.status).color">
                  {{ statusCfg(cs.status).label }}
                </div>
                <div class="status-current-since">
                  Desde {{ formatDate(cs.since) }}
                </div>
              </div>
            </div>
          }

          <div class="override-divider"></div>

          <!-- Selecionar novo status -->
          <p class="override-section-label">Alterar status para:</p>

          <div class="status-options">
            @for (opt of statusOptions; track opt.key) {
              <label class="status-option"
                     [class.selected]="newStatus() === opt.key">
                <input type="radio" name="status"
                       [value]="opt.key"
                       [checked]="newStatus() === opt.key"
                       (change)="newStatus.set(opt.key)" />
                <span class="status-option-icon">{{ opt.icon }}</span>
                <span class="status-option-label"
                      [style.color]="opt.color">{{ opt.label }}</span>
              </label>
            }
          </div>

          <!-- Mensagem -->
          <div class="form-group" style="margin-top:.75rem;">
            <label class="form-label">Mensagem (opcional)</label>
            <input type="text" class="form-control"
                   placeholder="Ex: Voltamos em breve!"
                   [(ngModel)]="newMessage" />
          </div>

          <!-- ETA -->
          @if (newStatus() !== 'production') {
            <div class="form-group">
              <label class="override-eta-toggle"
                     [class.active]="etaIndeterminate()">
                <input type="checkbox"
                       [(ngModel)]="etaIndeterminate"
                       (ngModelChange)="onEtaToggle($event)" />
                <span class="toggle-box">{{ etaIndeterminate() ? '✓' : '' }}</span>
                <span>Previsão indeterminada</span>
              </label>
              @if (!etaIndeterminate()) {
                <input type="datetime-local" class="form-control"
                       style="margin-top:.5rem;"
                       [(ngModel)]="newEtaString"
                       [min]="minEta" />
              }
            </div>
          }

          <!-- Ações -->
          <div class="override-actions">
            <button class="btn btn-secondary btn-sm" (click)="logout()">
              Sair
            </button>
            <button class="btn btn-primary"
                    [disabled]="saving()"
                    (click)="saveStatus()">
              {{ saving() ? 'Salvando…' : '💾 Aplicar Status' }}
            </button>
          </div>

          <!-- Link para voltar à app se produção -->
          @if (currentStatus()?.status === 'production') {
            <button class="go-to-app" type="button" (click)="goToApp()">
              → Ir para a aplicação
            </button>
          }
        }

      </div>
    </div>
  `,
})
export class AdminOverrideComponent implements OnInit {
  private readonly firebaseAuth = inject(Auth);
  private readonly firestore    = inject(Firestore);
  private readonly statusSvc    = inject(AppStatusService);
  private readonly authSvc      = inject(AuthService);
  private readonly toast        = inject(ToastService);
  private readonly router       = inject(Router);

  readonly statusOptions = STATUS_OPTIONS;

  // ── State ──────────────────────────────────────────────────
  readonly step         = signal<Step>('login');
  readonly loggingIn    = signal(false);
  readonly saving       = signal(false);
  readonly showPw       = signal(false);
  readonly loginError   = signal<string | null>(null);
  readonly currentStatus = this.statusSvc.status;

  email    = '';
  password = '';

  readonly newStatus      = signal<AppStatusKey>('production');
  readonly etaIndeterminate = signal(true);
  newMessage   = '';
  newEtaString = '';
  readonly minEta = new Date().toISOString().slice(0, 16);

  ngOnInit(): void {
    // Se o usuário já está logado como admin, pula direto para o painel
    const user = this.authSvc.currentUser();
    if (user?.role === 'diretoria' && user?.isAdmin) {
      this.prefillForm();
      this.step.set('panel');
    }
  }

  // ── Login local (independente do AuthService global) ───────
  async login(): Promise<void> {
    if (!this.email || !this.password) {
      this.loginError.set('Preencha e-mail e senha.'); return;
    }
    this.loggingIn.set(true);
    this.loginError.set(null);

    try {
      const cred = await signInWithEmailAndPassword(
        this.firebaseAuth, this.email.trim(), this.password,
      );
      const uid = cred.user.uid;

      // Verifica se é admin no Firestore
      const snap = await getDoc(doc(this.firestore, 'users', uid));
      if (!snap.exists()) {
        await signOut(this.firebaseAuth);
        this.loginError.set('Usuário sem cadastro no sistema.');
        return;
      }

      const data = snap.data() as Record<string, unknown>;
      if (data['role'] !== 'diretoria' || data['isAdmin'] !== true) {
        await signOut(this.firebaseAuth);
        this.loginError.set('Acesso negado. Apenas administradores podem usar esta rota.');
        return;
      }

      // Cria o perfil no AuthService para que setStatus funcione
      this.authSvc.currentUser.set({
        uid,
        name:          (data['name']        as string) ?? '',
        email:         (data['email']       as string) ?? '',
        unit:          (data['unit']        as string) ?? '',
        position:      (data['position']    as string) ?? '',
        role:          'diretoria',
        points:        0,
        photoUrl:      (data['photoUrl']    as string) ?? '',
        isAdmin:       true,
        permissions:   [],
      });

      this.prefillForm();
      this.step.set('panel');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      const map: Record<string, string> = {
        'auth/wrong-password':     'Senha incorreta.',
        'auth/user-not-found':     'Usuário não encontrado.',
        'auth/invalid-credential': 'Credenciais inválidas.',
        'auth/too-many-requests':  'Muitas tentativas. Aguarde e tente novamente.',
      };
      this.loginError.set(map[code] ?? 'Erro ao autenticar.');
    } finally {
      this.loggingIn.set(false);
    }
  }

  logout(): void {
    signOut(this.firebaseAuth);
    this.authSvc.currentUser.set(null);
    this.email    = '';
    this.password = '';
    this.step.set('login');
  }

  // ── Status ─────────────────────────────────────────────────
  statusCfg(key: AppStatusKey) {
    return APP_STATUS_CONFIG[key];
  }

  onEtaToggle(val: boolean): void {
    if (val) this.newEtaString = '';
  }

  async saveStatus(): Promise<void> {
    this.saving.set(true);
    try {
      const status = this.newStatus();
      const eta = (status !== 'production' && !this.etaIndeterminate() && this.newEtaString)
        ? new Date(this.newEtaString)
        : null;

      await this.statusSvc.setStatus(status, this.newMessage, eta);
      this.toast.success(`Status alterado para "${APP_STATUS_CONFIG[status].label}"!`);

      // Se voltou para produção, oferece ir para a app
      if (status === 'production') {
        setTimeout(() => this.goToApp(), 1500);
      }
    } catch (err) {
      this.toast.error('Erro ao salvar: ' + (err as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  goToApp(): void {
    this.router.navigate(['/']);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  private prefillForm(): void {
    const s = this.currentStatus();
    if (!s) return;
    this.newStatus.set(s.status);
    this.newMessage = s.message ?? '';
    if (s.eta) {
      this.etaIndeterminate.set(false);
      this.newEtaString = new Date(s.eta).toISOString().slice(0, 16);
    } else {
      this.etaIndeterminate.set(true);
    }
  }
}
