import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PermissionEditorComponent } from '../permission-editor/permission-editor.component';
import { ModalComponent } from '../modal/modal.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { UserService } from '../../../core/services/user.service';
import { PermissionService } from '../../../core/services/permission.service';
import { ToastService } from '../../../core/services/toast.service';
import { PermissionKey, UpdateProfilePayload, User } from '../../../core/models';

@Component({
  selector: 'app-edit-member',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'edit-member.component.scss',
  imports: [FormsModule, ModalComponent, AvatarComponent, PermissionEditorComponent],
  template: `
    <app-modal
      [title]="'✏️ Editar — ' + (target()?.name ?? '')"
      [open]="open()"
      (closed)="closed.emit()"
    >
      @if (target(); as u) {
        <!-- Avatar + e-mail (somente leitura) -->
        <div class="edit-avatar-row">
          <app-avatar [photoUrl]="photoPreview() || u.photoUrl" [name]="u.name" [size]="64" />
          <div>
            <label class="avatar-upload-label" (click)="avatarInput.click()">
              📷 Trocar foto
            </label>
            <div class="edit-email">{{ u.email }}</div>
          </div>
          <input #avatarInput type="file" accept="image/*"
                 style="display:none;" (change)="onFileChange($event)" />
        </div>

        <div class="form-group">
          <label class="form-label">Nome Completo *</label>
          <input type="text" class="form-control" [(ngModel)]="form.name" />
        </div>

        <div class="form-group">
          <label class="form-label">Unidade / Classe *</label>
          <input type="text" class="form-control" [(ngModel)]="form.unit" />
        </div>

        <div class="form-group">
          <label class="form-label">Cargo no Clube</label>
          <input
            type="text"
            class="form-control"
            [placeholder]="u.role === 'diretoria'
              ? 'Ex: Diretor, Secretário, Tesoureiro…'
              : 'Ex: Líder, Escudeiro, Amigo…'"
            [(ngModel)]="form.position"
          />
        </div>

        <!-- Permissões — só diretoria, só admin pode editar -->
        @if (u.role === 'diretoria' && permSvc.isAdmin()) {
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

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closed.emit()">Cancelar</button>
          <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
            {{ saving() ? 'Salvando…' : 'Salvar' }}
          </button>
        </div>
      }
    </app-modal>
  `,
})
export class EditMemberComponent {
  readonly target = input<User | null>(null);
  readonly open   = input(false);
  readonly closed = output<void>();
  readonly saved  = output<void>();

  readonly permSvc         = inject(PermissionService);
  private readonly userSvc = inject(UserService);
  private readonly toast   = inject(ToastService);

  readonly saving       = signal(false);
  readonly photoPreview = signal<string | null>(null);

  form: {
    name:        string;
    unit:        string;
    position:    string;
    isAdmin:     boolean;
    permissions: PermissionKey[];
  } = { name: '', unit: '', position: '', isAdmin: false, permissions: [] };

  private photoBase64 = '';

  constructor() {
    effect(() => {
      const u = this.target();
      if (!u) return;
      this.form = {
        name:        u.name,
        unit:        u.unit,
        position:    u.position ?? '',
        isAdmin:     u.isAdmin  ?? false,
        permissions: [...(u.permissions ?? [])],
      };
      this.photoPreview.set(null);
      this.photoBase64 = '';
    });
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      this.photoPreview.set(result);
      this.photoBase64 = result;
    };
    reader.readAsDataURL(file);
  }

  onAdminToggle(isAdmin: boolean): void {
    if (isAdmin) this.form.permissions = [];
  }

  async save(): Promise<void> {
    const u = this.target();
    if (!u) return;
    if (!this.form.name.trim() || !this.form.unit.trim()) {
      this.toast.error('Nome e Unidade são obrigatórios.'); return;
    }
    this.saving.set(true);
    try {
      const payload: UpdateProfilePayload = {
        name:        this.form.name.trim(),
        unit:        this.form.unit.trim(),
        position:    this.form.position.trim(),
        photoUrl:    this.photoBase64 || u.photoUrl,
        isAdmin:     u.role === 'diretoria' ? this.form.isAdmin     : undefined,
        permissions: u.role === 'diretoria' ? this.form.permissions : undefined,
      };
      await this.userSvc.updateProfile(u.uid, payload);
      this.toast.success(`${payload.name} atualizado com sucesso!`);
      this.saved.emit();
      this.closed.emit();
    } catch {
      this.toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }
}
