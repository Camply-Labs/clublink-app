import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { INoticeRepository } from '../repositories/notice.repository';
import { AuthService } from './auth.service';
import {
  Notice,
  NoticePayload,
  NoticeReply,
  NoticeReplyPayload,
} from '../models/notice.model';

@Injectable({ providedIn: 'root' })
export class NoticeService {
  private readonly repo       = inject(INoticeRepository);
  private readonly auth       = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly notices = signal<Notice[]>([]);

  constructor() {
    this.repo.watchAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => this.notices.set(list));
  }

  // ── Avisos ─────────────────────────────────────────────────

  create(payload: NoticePayload): Promise<string> {
    const user = this.auth.currentUser();
    return this.repo.create(payload, user?.uid ?? '', user?.name || user?.email || '');
  }

  update(id: string, payload: NoticePayload): Promise<void> {
    return this.repo.update(id, payload);
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }

  watchLikes(noticeId: string): Observable<string[]> {
    return this.repo.watchLikes(noticeId);
  }

  toggleNoticeLike(noticeId: string): Promise<void> {
    const uid = this.auth.currentUser()?.uid ?? '';
    return this.repo.toggleNoticeLike(noticeId, uid);
  }

  // ── Respostas ──────────────────────────────────────────────

  watchReplies(noticeId: string): Observable<NoticeReply[]> {
    return this.repo.watchReplies(noticeId);
  }

  createReply(noticeId: string, text: string): Promise<string> {
    const user = this.auth.currentUser();
    const payload: NoticeReplyPayload = { text };
    return this.repo.createReply(
      noticeId,
      payload,
      user?.uid ?? '',
      user?.name || user?.email || '',
      user?.photoUrl ?? '',
    );
  }

  deleteReply(noticeId: string, replyId: string): Promise<void> {
    return this.repo.deleteReply(noticeId, replyId);
  }

  toggleLike(noticeId: string, replyId: string): Promise<void> {
    const uid = this.auth.currentUser()?.uid ?? '';
    return this.repo.toggleLike(noticeId, replyId, uid);
  }

  setReplyPinned(noticeId: string, replyId: string, pinned: boolean): Promise<void> {
    return this.repo.setReplyPinned(noticeId, replyId, pinned);
  }

  /** UID do usuário atual — usado para checar like/autoria nos templates */
  get currentUid(): string {
    return this.auth.currentUser()?.uid ?? '';
  }
}
