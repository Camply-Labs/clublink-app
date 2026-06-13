import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NoticeService } from '../../core/services/notice.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import {
  MarkdownEditorComponent,
  renderMarkdown,
} from '../../shared/components/markdown-editor/markdown-editor.component';
import { Notice, NoticePayload, NOTICE_COLORS } from '../../core/models/notice.model';
import { NoticeRepliesComponent } from '../../shared/components/notice-replies/notice-replies.component';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-notices',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'notices.component.scss',
  imports: [FormsModule, ModalComponent, MarkdownEditorComponent, NoticeRepliesComponent],
  template: `
    <div class="section-header">
      <h2 class="section-title">📌 Quadro de Avisos</h2>
      @if (permSvc.can('notices.edit')) {
        <button class="btn btn-primary btn-sm" (click)="openCreate()">
          ➕ Novo Aviso
        </button>
      }
    </div>

    @if (noticeSvc.notices().length === 0) {
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">
          Nenhum aviso publicado ainda.
          @if (permSvc.can('notices.edit')) {
            <br/>Clique em "Novo Aviso" para publicar o primeiro.
          }
        </div>
      </div>
    } @else {
      <div class="notices-grid">
        @for (n of noticeSvc.notices(); track n.id) {
          <article class="notice-card" [style.--accent]="n.color">
            @if (n.pinned) {
              <div class="notice-pin" title="Fixado">📌</div>
            }

            @if (n.coverImage) {
              <div class="notice-cover">
                <img [src]="n.coverImage" [alt]="n.title" />
              </div>
            }

            <div class="notice-body">
              <h3 class="notice-title">{{ n.title }}</h3>

              <div class="notice-content" [innerHTML]="render(n.content)"></div>

              <div class="notice-footer">
                <div class="notice-meta">
                  <span class="notice-author">{{ n.authorName }}</span>
                  <span class="notice-date">
                    {{ formatDate(n.createdAt) }}
                    @if (n.updatedAt) {
                      <span class="notice-edited"> · editado em {{ formatDate(n.updatedAt) }}</span>
                    }
                  </span>
                </div>

                @if (permSvc.can('notices.edit')) {
                  <div class="notice-actions">
                    <button class="btn btn-secondary btn-sm" (click)="openEdit(n)">✏️</button>
                    <button class="btn btn-danger btn-sm"
                            [disabled]="deleting() === n.id"
                            (click)="confirmDelete(n)">
                      {{ deleting() === n.id ? '…' : '🗑' }}
                    </button>
                  </div>
                }
              </div>

              <!-- Responder / contagem de respostas -->
              <button class="notice-reply-btn" (click)="openReplies(n)">
                💬 Responder
                @if (n.replyCount > 0) {
                  <span class="reply-count-badge">{{ n.replyCount }}</span>
                }
              </button>
            </div>
          </article>
        }
      </div>
    }

    <!-- ── Modal: Criar / Editar ────────────────────────────── -->
    <app-modal
      [title]="mode() === 'create' ? '➕ Novo Aviso' : '✏️ Editar Aviso'"
      [open]="modalOpen()"
      (closed)="modalOpen.set(false)"
    >
      <div class="form-group">
        <label class="form-label">Título *</label>
        <input type="text" class="form-control"
               placeholder="Ex: Acampamento de fim de ano"
               [(ngModel)]="form.title" />
      </div>

      <div class="form-group">
        <label class="form-label">Conteúdo *</label>
        <app-markdown-editor
          [(value)]="form.content"
          [(coverImage)]="form.coverImage!"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cor de destaque</label>
          <div class="color-picker">
            @for (c of noticeColors; track c.value) {
              <button class="color-dot"
                      type="button"
                      [style.background]="c.value"
                      [class.selected]="form.color === c.value"
                      [title]="c.label"
                      (click)="form.color = c.value">
              </button>
            }
          </div>
        </div>

        <div class="form-group">
          <label class="pin-toggle" [class.active]="form.pinned">
            <input type="checkbox" [(ngModel)]="form.pinned" />
            <span class="toggle-box">{{ form.pinned ? '✓' : '' }}</span>
            <div>
              <div class="toggle-label">📌 Fixar no topo</div>
              <div class="toggle-hint">Avisos fixados aparecem primeiro</div>
            </div>
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="modalOpen.set(false)">Cancelar</button>
        <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
          {{ saving() ? 'Salvando…' : (mode() === 'edit' ? '💾 Salvar' : '➕ Publicar') }}
        </button>
      </div>
    </app-modal>

    <!-- ── Modal: Respostas ──────────────────────────────────── -->
    <app-notice-replies
      [notice]="repliesTarget()"
      [open]="repliesModalOpen()"
      (closed)="repliesModalOpen.set(false)"
    />

    <!-- ── Modal: Confirmar exclusão ────────────────────────── -->
    <app-modal title="🗑 Remover Aviso" [open]="deleteModalOpen()"
               (closed)="deleteModalOpen.set(false)">
      <p style="color:var(--gray-light);font-size:.9rem;line-height:1.6;margin-bottom:1.5rem;">
        Tem certeza que deseja remover o aviso
        <strong style="color:var(--snow);">"{{ deleteTarget()?.title }}"</strong>?<br/>
        <span style="color:var(--gray-mid);font-size:.8rem;">Esta ação não pode ser desfeita.</span>
      </p>
      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="deleteModalOpen.set(false)">Cancelar</button>
        <button class="btn btn-danger" [disabled]="deleting() !== null" (click)="deleteNotice()">
          {{ deleting() ? 'Removendo…' : 'Remover' }}
        </button>
      </div>
    </app-modal>
  `,
})
export class NoticesComponent {
  readonly noticeSvc = inject(NoticeService);
  readonly permSvc   = inject(PermissionService);
  private readonly toast = inject(ToastService);

  readonly noticeColors = NOTICE_COLORS;

  readonly modalOpen       = signal(false);
  readonly mode            = signal<ModalMode>('create');
  readonly saving          = signal(false);
  readonly deleting        = signal<string | null>(null);
  readonly deleteModalOpen = signal(false);
  readonly deleteTarget    = signal<Notice | null>(null);

  readonly repliesModalOpen = signal(false);
  readonly repliesTarget    = signal<Notice | null>(null);

  form: NoticePayload = this.emptyForm();
  private editTarget: Notice | null = null;

  render(md: string): string {
    return renderMarkdown(md);
  }

  openReplies(n: Notice): void {
    this.repliesTarget.set(n);
    this.repliesModalOpen.set(true);
  }

  openCreate(): void {
    this.form       = this.emptyForm();
    this.editTarget = null;
    this.mode.set('create');
    this.modalOpen.set(true);
  }

  openEdit(n: Notice): void {
    this.editTarget = n;
    this.form = {
      title:      n.title,
      content:    n.content,
      coverImage: n.coverImage ?? '',
      color:      n.color,
      pinned:     n.pinned,
    };
    this.mode.set('edit');
    this.modalOpen.set(true);
  }

  async save(): Promise<void> {
    if (!this.form.title.trim()) {
      this.toast.error('O título é obrigatório.'); return;
    }
    if (!this.form.content.trim()) {
      this.toast.error('O conteúdo não pode estar vazio.'); return;
    }

    this.saving.set(true);
    try {
      const payload: NoticePayload = {
        title:      this.form.title.trim(),
        content:    this.form.content,
        coverImage: this.form.coverImage || undefined,
        color:      this.form.color,
        pinned:     this.form.pinned,
      };

      if (this.mode() === 'edit' && this.editTarget) {
        await this.noticeSvc.update(this.editTarget.id, payload);
        this.toast.success('Aviso atualizado!');
      } else {
        await this.noticeSvc.create(payload);
        this.toast.success('Aviso publicado!');
      }
      this.modalOpen.set(false);
    } catch {
      this.toast.error('Erro ao salvar aviso.');
    } finally {
      this.saving.set(false);
    }
  }

  confirmDelete(n: Notice): void {
    this.deleteTarget.set(n);
    this.deleteModalOpen.set(true);
  }

  async deleteNotice(): Promise<void> {
    const n = this.deleteTarget();
    if (!n) return;
    this.deleting.set(n.id);
    try {
      await this.noticeSvc.delete(n.id);
      this.toast.success('Aviso removido.');
      this.deleteModalOpen.set(false);
    } catch {
      this.toast.error('Erro ao remover aviso.');
    } finally {
      this.deleting.set(null);
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  private emptyForm(): NoticePayload {
    return { title: '', content: '', coverImage: '', color: '#c9a84c', pinned: false };
  }
}
