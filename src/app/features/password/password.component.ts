import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl:        'password.component.scss',
  imports: [FormsModule],
  template: `
    <div class="section-header">
      <h2 class="section-title">Alterar Senha</h2>
    </div>

    <div style="max-width:420px;">
      <div class="card">
        <div class="form-group">
          <label class="form-label">Senha Atual *</label>
          <div class="input-group">
            <input
              [type]="showCurrent() ? 'text' : 'password'"
              class="form-control"
              placeholder="Sua senha atual"
              [(ngModel)]="currentPw"
            />
            <button class="pw-toggle" type="button" (click)="showCurrent.set(!showCurrent())">
              {{ showCurrent() ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Nova Senha *</label>
          <div class="input-group">
            <input
              [type]="showNew() ? 'text' : 'password'"
              class="form-control"
              placeholder="Mínimo 6 caracteres"
              [(ngModel)]="newPw"
            />
            <button class="pw-toggle" type="button" (click)="showNew.set(!showNew())">
              {{ showNew() ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Confirmar Nova Senha *</label>
          <div class="input-group">
            <input
              [type]="showConfirm() ? 'text' : 'password'"
              class="form-control"
              placeholder="Repita a nova senha"
              [(ngModel)]="confirmPw"
            />
            <button class="pw-toggle" type="button" (click)="showConfirm.set(!showConfirm())">
              {{ showConfirm() ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <button
          class="btn btn-primary btn-full"
          style="margin-top:.5rem;"
          [disabled]="saving()"
          (click)="save()"
        >
          {{ saving() ? 'Salvando…' : 'Salvar Nova Senha' }}
        </button>
      </div>
    </div>
  `,
})
export class PasswordComponent {
  private readonly auth  = inject(AuthService);
  private readonly toast = inject(ToastService);

  currentPw = '';
  newPw     = '';
  confirmPw = '';

  readonly saving      = signal(false);
  readonly showCurrent = signal(false);
  readonly showNew     = signal(false);
  readonly showConfirm = signal(false);

  async save(): Promise<void> {
    if (!this.currentPw || !this.newPw || !this.confirmPw) {
      this.toast.error('Preencha todos os campos.');
      return;
    }
    if (this.newPw !== this.confirmPw) {
      this.toast.error('As senhas não coincidem.');
      return;
    }
    if (this.newPw.length < 6) {
      this.toast.error('Nova senha deve ter ao menos 6 caracteres.');
      return;
    }

    this.saving.set(true);
    try {
      await this.auth.changePassword(this.currentPw, this.newPw);
      this.toast.success('Senha alterada com sucesso!');
      this.currentPw = '';
      this.newPw     = '';
      this.confirmPw = '';
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      const map: Record<string, string> = {
        'auth/wrong-password':    'Senha atual incorreta.',
        'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
        'auth/weak-password':     'Nova senha muito fraca.',
      };
      this.toast.error(map[code] ?? 'Erro ao alterar senha.');
    } finally {
      this.saving.set(false);
    }
  }
}
