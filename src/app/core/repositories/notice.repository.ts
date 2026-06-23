import { Observable } from 'rxjs';
import { Notice, NoticePayload, NoticeReply, NoticeReplyPayload } from '../models/notice.model';

export abstract class INoticeRepository {
  // ── Avisos ─────────────────────────────────────────────────
  abstract watchAll(): Observable<Notice[]>;
  abstract create(payload: NoticePayload, authorUid: string, authorName: string): Promise<string>;
  abstract update(id: string, payload: NoticePayload): Promise<void>;
  abstract delete(id: string): Promise<void>;

  // ── Likes do aviso (sub-collection notices/{id}/likes/{uid}) ──
  /**
   * Stream em tempo real do conjunto de UIDs que curtiram o aviso.
   * Implementado via sub-collection com doc ID = UID — sem necessidade
   * de índices, basta checar `likedUids.includes(uid)` e `.length`.
   */
  abstract watchLikes(noticeId: string): Observable<string[]>;

  /** Toggle de curtida — cria/remove o doc notices/{id}/likes/{uid} */
  abstract toggleNoticeLike(noticeId: string, uid: string): Promise<void>;

  // ── Respostas (sub-collection) ────────────────────────────
  /** Stream em tempo real das respostas de um aviso, ordenadas (pinned desc, createdAt asc) */
  abstract watchReplies(noticeId: string): Observable<NoticeReply[]>;

  /** Cria uma resposta e incrementa replyCount no aviso (transação) */
  abstract createReply(
    noticeId: string,
    payload:  NoticeReplyPayload,
    authorUid: string,
    authorName: string,
    authorPhoto: string,
  ): Promise<string>;

  /** Remove uma resposta e decrementa replyCount (transação) */
  abstract deleteReply(noticeId: string, replyId: string): Promise<void>;

  /** Adiciona/remove o like do usuário atual em uma resposta (toggle) */
  abstract toggleLike(noticeId: string, replyId: string, uid: string): Promise<void>;

  /** Apenas o autor do aviso pode fixar/desafixar uma resposta */
  abstract setReplyPinned(noticeId: string, replyId: string, pinned: boolean): Promise<void>;
}
