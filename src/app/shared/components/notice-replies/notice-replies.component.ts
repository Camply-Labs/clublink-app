import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NoticeService } from '../../../core/services/notice.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../modal/modal.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import { Notice, NoticeReply } from '../../../core/models/notice.model';

@Component({
  selector: 'app-notice-replies',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'notice-replies.component.scss',
  imports: [FormsModule, ModalComponent, AvatarComponent, SpinnerComponent],
  template: `
    <app-modal
      [title]="'💬 Respostas — ' + (notice()?.title ?? '')"
      [open]="open()"
      (closed)="closed.emit()"
    >
      @if (loading()) {
        <app-spinner [small]="true" label="Carregando respostas…" />
      } @else if (replies().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon" style="font-size:2rem;">💬</div>
          <div class="empty-state-text">
            Nenhuma resposta ainda.<br/>Seja o primeiro a comentar!
          </div>
        </div>
      } @else {
        <div class="replies-list">
          @for (r of replies(); track r.id) {
            <div class="reply-item" [class.pinned]="r.pinned">
              @if (r.pinned) {
                <div class="reply-pin-badge">📌 Fixado</div>
              }

              <div class="reply-header">
                <app-avatar [photoUrl]="r.authorPhoto" [name]="r.authorName" [size]="32" />
                <div class="reply-meta">
                  <div class="reply-author">{{ r.authorName }}</div>
                  <div class="reply-date">{{ formatDate(r.createdAt) }}</div>
                </div>

                <!-- Ações: pin (só autor do aviso) e excluir (autor da resposta ou notices.edit) -->
                <div class="reply-actions">
                  @if (isNoticeAuthor()) {
                    <button class="reply-action-btn"
                            [class.active]="r.pinned"
                            title="Fixar resposta"
                            (click)="togglePin(r)">
                      📌
                    </button>
                  }
                  @if (canDelete(r)) {
                    <button class="reply-action-btn danger"
                            title="Excluir resposta"
                            (click)="deleteReply(r)">
                      🗑
                    </button>
                  }
                </div>
              </div>

              <div class="reply-text">{{ r.text }}</div>

              <div class="reply-footer">
                <button class="like-btn" [class.liked]="hasLiked(r)"
                        (click)="toggleLike(r)">
                  {{ hasLiked(r) ? '❤️' : '🤍' }} {{ r.likedBy.length || '' }}
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Campo de nova resposta -->
      <div class="reply-form">
        <textarea class="form-control reply-textarea"
                  rows="2"
                  maxlength="500"
                  placeholder="Escreva sua resposta… (apenas texto simples)"
                  [(ngModel)]="newReplyText"
                  (keydown.enter)="onEnter($event)">
        </textarea>
        <div class="reply-form-footer">
          <span class="reply-char-count">{{ newReplyText.length }}/500</span>
          <button class="btn btn-primary btn-sm"
                  [disabled]="sending() || !newReplyText.trim()"
                  (click)="sendReply()">
            {{ sending() ? 'Enviando…' : '💬 Responder' }}
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="closed.emit()">Fechar</button>
      </div>
    </app-modal>
  `,
})
export class NoticeRepliesComponent {
  private readonly noticeSvc = inject(NoticeService);
  private readonly toast     = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly notice = input<Notice | null>(null);
  readonly open   = input(false);
  readonly closed = output<void>();

  readonly replies = signal<NoticeReply[]>([]);
  readonly loading = signal(false);
  readonly sending = signal(false);

  newReplyText = '';

  private currentSub?: { unsubscribe: () => void };

  constructor() {
    // Sempre que o aviso ou abertura mudar, (re)assina o stream de respostas
    effect(() => {
      const n = this.notice();
      const isOpen = this.open();

      this.currentSub?.unsubscribe();
      this.replies.set([]);

      if (!n || !isOpen) return;

      this.loading.set(true);
      const sub = this.noticeSvc.watchReplies(n.id).subscribe(list => {
        this.replies.set(list);
        this.loading.set(false);
      });
      this.currentSub = sub;
    });

    this.destroyRef.onDestroy(() => this.currentSub?.unsubscribe());
  }

  isNoticeAuthor(): boolean {
    const n = this.notice();
    return !!n && n.authorUid === this.noticeSvc.currentUid;
  }

  canDelete(r: NoticeReply): boolean {
    return r.authorUid === this.noticeSvc.currentUid || this.isNoticeAuthor();
  }

  hasLiked(r: NoticeReply): boolean {
    return r.likedBy.includes(this.noticeSvc.currentUid);
  }

  async toggleLike(r: NoticeReply): Promise<void> {
    const n = this.notice();
    if (!n) return;
    try {
      await this.noticeSvc.toggleLike(n.id, r.id);
    } catch {
      this.toast.error('Erro ao curtir resposta.');
    }
  }

  async togglePin(r: NoticeReply): Promise<void> {
    const n = this.notice();
    if (!n) return;
    try {
      await this.noticeSvc.setReplyPinned(n.id, r.id, !r.pinned);
    } catch {
      this.toast.error('Erro ao fixar resposta.');
    }
  }

  async deleteReply(r: NoticeReply): Promise<void> {
    const n = this.notice();
    if (!n) return;
    try {
      await this.noticeSvc.deleteReply(n.id, r.id);
      this.toast.success('Resposta removida.');
    } catch {
      this.toast.error('Erro ao remover resposta.');
    }
  }

  onEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (!e.shiftKey) {
      e.preventDefault();
      this.sendReply();
    }
  }

  async sendReply(): Promise<void> {
    const n = this.notice();
    const text = this.newReplyText.trim();
    if (!n || !text) return;

    this.sending.set(true);
    try {
      await this.noticeSvc.createReply(n.id, text);
      this.newReplyText = '';
    } catch {
      this.toast.error('Erro ao enviar resposta.');
    } finally {
      this.sending.set(false);
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
