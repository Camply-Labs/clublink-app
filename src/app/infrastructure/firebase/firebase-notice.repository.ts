import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  collectionData,
  serverTimestamp,
  query,
  orderBy,
  runTransaction,
  arrayUnion,
  arrayRemove,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { INoticeRepository } from '../../core/repositories/notice.repository';
import {
  Notice,
  NoticePayload,
  NoticeReply,
  NoticeReplyPayload,
} from '../../core/models/notice.model';

function toIso(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (typeof (v as { toDate?: unknown }).toDate === 'function')
    return (v as { toDate: () => Date }).toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function docToNotice(data: Record<string, unknown>, id: string): Notice {
  return {
    id,
    title:       (data['title']       as string)  ?? '',
    content:     (data['content']     as string)  ?? '',
    coverImage:  (data['coverImage']  as string)  ?? undefined,
    authorUid:   (data['authorUid']   as string)  ?? '',
    authorName:  (data['authorName']  as string)  ?? '',
    color:       (data['color']       as string)  ?? '#c9a84c',
    pinned:      (data['pinned']      as boolean) ?? false,
    replyCount:  (data['replyCount']  as number)  ?? 0,
    createdAt:   toIso(data['createdAt']),
    updatedAt:   data['updatedAt'] ? toIso(data['updatedAt']) : undefined,
  };
}

function docToReply(data: Record<string, unknown>, id: string, noticeId: string): NoticeReply {
  return {
    id,
    noticeId,
    authorUid:   (data['authorUid']   as string)   ?? '',
    authorName:  (data['authorName']  as string)   ?? '',
    authorPhoto: (data['authorPhoto'] as string)   ?? undefined,
    text:        (data['text']        as string)   ?? '',
    likedBy:     (data['likedBy']     as string[]) ?? [],
    pinned:      (data['pinned']      as boolean)  ?? false,
    createdAt:   toIso(data['createdAt']),
  };
}

@Injectable()
export class FirebaseNoticeRepository implements INoticeRepository {
  private readonly firestore = inject(Firestore);

  private noticesCol() {
    return query(
      collection(this.firestore, 'notices'),
      orderBy('pinned', 'desc'),
      orderBy('createdAt', 'desc'),
    );
  }

  private repliesCol(noticeId: string) {
    return query(
      collection(this.firestore, 'notices', noticeId, 'replies'),
      orderBy('pinned', 'desc'),
      orderBy('createdAt', 'asc'),
    );
  }

  // ── Avisos ─────────────────────────────────────────────────

  watchAll(): Observable<Notice[]> {
    return collectionData(this.noticesCol(), { idField: 'id' }).pipe(
      map(docs => docs.map(d =>
        docToNotice(d as Record<string, unknown>, (d as { id: string }).id)
      )),
    );
  }

  async create(payload: NoticePayload, authorUid: string, authorName: string): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'notices'), {
      ...payload,
      authorUid,
      authorName,
      replyCount: 0,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(id: string, payload: NoticePayload): Promise<void> {
    await updateDoc(doc(this.firestore, 'notices', id), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'notices', id));
  }

  // ── Respostas ──────────────────────────────────────────────

  watchReplies(noticeId: string): Observable<NoticeReply[]> {
    return collectionData(this.repliesCol(noticeId), { idField: 'id' }).pipe(
      map(docs => docs.map(d =>
        docToReply(d as Record<string, unknown>, (d as { id: string }).id, noticeId)
      )),
    );
  }

  async createReply(
    noticeId: string,
    payload: NoticeReplyPayload,
    authorUid: string,
    authorName: string,
    authorPhoto: string,
  ): Promise<string> {
    const noticeRef = doc(this.firestore, 'notices', noticeId);
    const replyRef  = doc(collection(this.firestore, 'notices', noticeId, 'replies'));

    await runTransaction(this.firestore, async (tx) => {
      const noticeSnap = await tx.get(noticeRef);
      const current = (noticeSnap.data()?.['replyCount'] as number) ?? 0;

      tx.set(replyRef, {
        authorUid,
        authorName,
        authorPhoto: authorPhoto || '',
        text:        payload.text,
        likedBy:     [],
        pinned:      false,
        createdAt:   serverTimestamp(),
      });

      tx.update(noticeRef, { replyCount: current + 1 });
    });

    return replyRef.id;
  }

  async deleteReply(noticeId: string, replyId: string): Promise<void> {
    const noticeRef = doc(this.firestore, 'notices', noticeId);
    const replyRef  = doc(this.firestore, 'notices', noticeId, 'replies', replyId);

    await runTransaction(this.firestore, async (tx) => {
      const noticeSnap = await tx.get(noticeRef);
      const current = (noticeSnap.data()?.['replyCount'] as number) ?? 0;

      tx.delete(replyRef);
      tx.update(noticeRef, { replyCount: Math.max(0, current - 1) });
    });
  }

  async toggleLike(noticeId: string, replyId: string, uid: string): Promise<void> {
    const replyRef  = doc(this.firestore, 'notices', noticeId, 'replies', replyId);

    // Lê o estado atual para decidir add/remove (toggle)
    await runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(replyRef);
      const likedBy = (snap.data()?.['likedBy'] as string[]) ?? [];
      if (likedBy.includes(uid)) {
        tx.update(replyRef, { likedBy: arrayRemove(uid) });
      } else {
        tx.update(replyRef, { likedBy: arrayUnion(uid) });
      }
    });
  }

  async setReplyPinned(noticeId: string, replyId: string, pinned: boolean): Promise<void> {
    await updateDoc(
      doc(this.firestore, 'notices', noticeId, 'replies', replyId),
      { pinned },
    );
  }
}
