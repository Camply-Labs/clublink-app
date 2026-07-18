import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { PermissionEditorComponent } from '../../shared/components/permission-editor/permission-editor.component';
import { PermissionKey, UserRole } from '../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'register.component.scss',
  imports: [FormsModule, PermissionEditorComponent],
  template: `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <line x1="20" y1="8" x2="20" y2="14"/>
          <line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
        Cadastrar Membro</h2>
    </div>

    <div class="register-wrapper">
      <div class="tab-bar" style="margin-bottom:1.5rem;">
        <button class="tab-btn" [class.active]="role() === 'desbravador'"
                (click)="role.set('desbravador')">🦅 Desbravador</button>
        <button class="tab-btn" [class.active]="role() === 'diretoria'"
                (click)="role.set('diretoria')">⭐ Diretoria</button>
      </div>

      <div class="card">
        <!-- Avatar -->
        <div class="avatar-upload-wrapper">
          <div class="avatar-preview" (click)="avatarInput.click()">
            @if (photoPreview()) {
              <img [src]="photoPreview()" alt="Preview"
                   style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
            } @else {
              <span class="avatar-preview-icon">📷</span>
            }
          </div>
          <label class="avatar-upload-label" (click)="avatarInput.click()">Escolher foto</label>
          <input #avatarInput type="file" accept="image/*"
                 style="display:none;" (change)="onFileChange($event)" />
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <label class="form-label">Nome Completo *</label>
          <input type="text" class="form-control" placeholder="Nome do membro"
                 [(ngModel)]="form.name" />
        </div>

        <div class="form-group">
          <label class="form-label">Unidade / Classe *</label>
          <input type="text" class="form-control" placeholder="Ex: Águias, Falcões…"
                 [(ngModel)]="form.unit" />
        </div>

        <div class="form-group">
          <label class="form-label">Cargo no Clube</label>
          <input type="text" class="form-control"
                 [placeholder]="role() === 'diretoria' ? 'Ex: Diretor, Secretário, Tesoureiro…' : 'Ex: Líder, Escudeiro, Amigo…'"
                 [(ngModel)]="form.position" />
        </div>

        <div class="form-group">
          <label class="form-label">Data de Nascimento</label>
          <input type="date" class="form-control" [(ngModel)]="form.birth" />
        </div>

        <div class="divider"></div>

        <p class="credentials-title">Credenciais de Acesso</p>

        <div class="form-group">
          <label class="form-label">E-mail *</label>
          <input type="email" class="form-control" placeholder="email@exemplo.com"
                 [(ngModel)]="form.email" />
        </div>

        <div class="form-group">
          <label class="form-label">Senha Inicial *</label>
          <div class="input-group">
            <input [type]="showPw() ? 'text' : 'password'" class="form-control"
                   placeholder="Mínimo 6 caracteres" [(ngModel)]="form.password" />
            <button class="pw-toggle" type="button" (click)="showPw.set(!showPw())">
              {{ showPw() ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        @if (role() === 'desbravador') {
          <div class="form-group">
            <label class="form-label">Pontos Iniciais</label>
            <input type="number" class="form-control" placeholder="0" min="0"
                   [(ngModel)]="form.points" />
          </div>
        }

        @if (role() === 'diretoria' && permSvc.isAdmin()) {
          <div class="divider"></div>

          <label class="admin-toggle" [class.active]="form.isAdmin">
            <input type="checkbox" [(ngModel)]="form.isAdmin"
                   (ngModelChange)="onAdminToggle($event)" />
            <span class="admin-toggle-box">{{ form.isAdmin ? '✓' : '' }}</span>
            <div>
              <div class="admin-toggle-label">⭐ Administrador</div>
              <div class="admin-toggle-hint">Acesso total, sem restrições</div>
            </div>
          </label>

          <app-permission-editor
            [isAdmin]="form.isAdmin"
            [(selected)]="form.permissions"
          />
        }

        <button class="btn btn-primary btn-full" style="margin-top:1rem;"
                [disabled]="saving()" (click)="submit()">
          {{ saving() ? 'Cadastrando…' : 'Cadastrar' }}
        </button>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly userSvc = inject(UserService);
  readonly permSvc         = inject(PermissionService);
  private readonly toast   = inject(ToastService);

  readonly role         = signal<UserRole>('desbravador');
  readonly saving       = signal(false);
  readonly showPw       = signal(false);
  readonly photoPreview = signal<string | null>(null);

  form = {
    name: '', unit: '', position: '', birth: '', email: '', password: '',
    points: 0, isAdmin: false, permissions: [] as PermissionKey[],
  };

  private photoBase64 = '';

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const r = e.target?.result as string;
      this.photoPreview.set(r);
      this.photoBase64 = r;
    };
    reader.readAsDataURL(file);
  }

  onAdminToggle(isAdmin: boolean): void {
    if (isAdmin) this.form.permissions = [];
  }

  async submit(): Promise<void> {
    const { name, unit, position, email, password, points } = this.form;
    if (!name.trim() || !unit.trim() || !email.trim() || !password) {
      this.toast.error('Preencha todos os campos obrigatórios.'); return;
    }
    if (password.length < 6) {
      this.toast.error('Senha deve ter ao menos 6 caracteres.'); return;
    }
    this.saving.set(true);
    try {
      await this.userSvc.create({
        name:        name.trim(),
        unit:        unit.trim(),
        position:    position.trim(),
        email:       email.trim(),
        password,
        role:        this.role(),
        birth:       this.form.birth || undefined,
        points:      this.role() === 'desbravador' ? Math.max(0, Number(points) || 0) : 0,
        photoUrl:    this.photoBase64,
        isAdmin:     this.role() === 'diretoria' ? this.form.isAdmin : false,
        permissions: this.role() === 'diretoria' ? this.form.permissions : [],
      });
      this.toast.success(`${this.role() === 'diretoria' ? 'Diretoria' : 'Desbravador'} ${name.trim()} cadastrado!`);
      this.resetForm();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      const map: Record<string, string> = {
        'auth/email-already-in-use': 'E-mail já em uso.',
        'auth/invalid-email':        'E-mail inválido.',
        'auth/weak-password':        'Senha muito fraca.',
      };
      this.toast.error(map[code] ?? 'Erro ao cadastrar.');
    } finally {
      this.saving.set(false);
    }
  }

  private resetForm(): void {
    this.form = { name: '', unit: '', position: '', birth: '', email: '', password: '', points: 0, isAdmin: false, permissions: [] };
    this.photoPreview.set(null);
    this.photoBase64 = '';
  }
}
