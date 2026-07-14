import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NoticeService } from '../../core/services/notice.service';
import { UserService } from '../../core/services/user.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import {
  MarkdownEditorComponent,
  renderMarkdown,
} from '../../shared/components/markdown-editor/markdown-editor.component';
import { Notice, NoticePayload, NOTICE_COLORS } from '../../core/models/notice.model';
import { NoticeRepliesComponent } from '../../shared/components/notice-replies/notice-replies.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-notices',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'notices.component.scss',
  imports: [FormsModule, ModalComponent, MarkdownEditorComponent, NoticeRepliesComponent, AvatarComponent],
  template: `
    <div class="section-header">
      <h2 class="section-title">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Quadro de Avisos
      </h2>
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
      <div class="notices-feed">
        @for (n of noticeSvc.notices(); track n.id) {
          <article class="notice-card" [style.--accent]="n.color">

            <!-- ── Cabeçalho: autor ────────────────────────── -->
            <header class="notice-header">
              <app-avatar [photoUrl]="authorPhoto(n)" [name]="n.authorName" [size]="36" />
              <div class="notice-header-info">
                <div class="notice-author-name">{{ n.authorName }}</div>
                <div class="notice-date">
                  {{ formatDate(n.createdAt) }}
                  @if (n.updatedAt) {
                    <span class="notice-edited"> · editado</span>
                  }
                </div>
              </div>

              @if (n.pinned) {
                <div class="notice-pin" title="Fixado">📌</div>
              }

              @if (permSvc.can('notices.edit')) {
                <div class="notice-actions">
                  <button class="notice-action-btn" (click)="openEdit(n)" title="Editar">✏️</button>
                  <button class="notice-action-btn danger"
                          [disabled]="deleting() === n.id"
                          (click)="confirmDelete(n)" title="Excluir">
                    {{ deleting() === n.id ? '…' : '🗑' }}
                  </button>
                </div>
              }
            </header>

            <!-- ── Imagem (opcional) ───────────────────────── -->
            @if (n.coverImage) {
              <div class="notice-cover">
                <img [src]="n.coverImage" [alt]="n.title" loading="lazy" />
              </div>
            }

            <!-- ── Corpo ────────────────────────────────────── -->
            <div class="notice-body">
              <h3 class="notice-title">{{ n.title }}</h3>
              <div class="notice-content" [innerHTML]="render(n.content)"></div>
            </div>

            <!-- ── Footer: ações de curtir/comentar + contagens ── -->
            <div class="notice-footer">
              <div class="notice-actions-row">
                <button class="notice-like-btn" [class.liked]="hasLiked(n)"
                        (click)="toggleLike(n)">
                  {{ hasLiked(n) ? '❤️' : '🤍' }}
                </button>
                <button class="notice-comment-btn" (click)="openReplies(n)">
                  💬
                </button>
              </div>

              @if (likeCount(n) > 0) {
                <div class="notice-likes-count">
                  {{ likeCount(n) }} {{ likeCount(n) === 1 ? 'curtida' : 'curtidas' }}
                </div>
              }

              @if (n.replyCount > 0) {
                <button class="notice-comments-link" (click)="openReplies(n)">
                  Ver {{ n.replyCount === 1 ? 'o comentário' : 'os ' + n.replyCount + ' comentários' }}
                </button>
              }
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
          #mdEditorRef
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
      <p style="color:var(--cl-text-secondary);font-size:.9rem;line-height:1.6;margin-bottom:1.5rem;">
        Tem certeza que deseja remover o aviso
        <strong style="color:var(--cl-text-primary);">"{{ deleteTarget()?.title }}"</strong>?<br/>
        <span style="color:var(--cl-text-muted);font-size:.8rem;">Esta ação não pode ser desfeita.</span>
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
export class NoticesComponent implements OnDestroy {
  readonly noticeSvc = inject(NoticeService);
  private readonly userSvc = inject(UserService);
  readonly permSvc   = inject(PermissionService);
  private readonly toast = inject(ToastService);

  readonly noticeColors = NOTICE_COLORS;
  readonly mdEditor = viewChild<MarkdownEditorComponent>('mdEditorRef');

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

  /** Foto do autor — busca pelo UID no UserService se disponível, senão vazio */
  authorPhoto(n: Notice): string {
    return this.userSvc.getById(n.authorUid)?.photoUrl ?? '';
  }

  /** UIDs que curtiram cada aviso — uid → string[] */
  private readonly likesMap = signal<Record<string, string[]>>({});

  /** Assinaturas ativas de watchLikes() por noticeId */
  private likeSubs = new Map<string, Subscription>();

  /** Garante que exista uma assinatura de likes para este aviso */
  private ensureLikeSub(noticeId: string): void {
    if (this.likeSubs.has(noticeId)) return;
    const sub = this.noticeSvc.watchLikes(noticeId).subscribe(uids => {
      this.likesMap.update(map => ({ ...map, [noticeId]: uids }));
    });
    this.likeSubs.set(noticeId, sub);
  }

  likeCount(n: Notice): number {
    this.ensureLikeSub(n.id);
    return this.likesMap()[n.id]?.length ?? 0;
  }

  hasLiked(n: Notice): boolean {
    this.ensureLikeSub(n.id);
    return (this.likesMap()[n.id] ?? []).includes(this.noticeSvc.currentUid);
  }

  async toggleLike(n: Notice): Promise<void> {
    try {
      await this.noticeSvc.toggleNoticeLike(n.id);
    } catch {
      this.toast.error('Erro ao curtir aviso.');
    }
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
    // Sincroniza o conteúdo existente no EasyMDE após o modal abrir
    setTimeout(() => this.mdEditor()?.setEditorValue(n.content));
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
        coverImage: this.form.coverImage || null,
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

  ngOnDestroy(): void {
    this.likeSubs.forEach(sub => sub.unsubscribe());
    this.likeSubs.clear();
  }
}
