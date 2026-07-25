// ============================================================
//  NotificationService
//  • Escuta a coleção `notifications` em tempo real
//  • Filtra por environment (PROD) e target (GLOBAL / SPECIFIC)
//  • Gerencia leituras por usuário (sub-collection notification_reads)
//  • Expõe contagem de não lidas como signal
// ============================================================

import { computed, inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  query,
  orderBy,
  where,
  updateDoc,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { AppNotification } from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly firestore  = inject(Firestore);
  private readonly auth       = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /** Todas as notificações visíveis para o usuário atual */
  readonly notifications  = signal<AppNotification[]>([]);
  /** IDs já lidos pelo usuário */
  readonly readIds        = signal<Set<string>>(new Set());

  /** Notificações não lidas */
  readonly unreadCount = computed(() =>
    this.notifications().filter(n => !this.readIds().has(n.id)).length
  );

  /** Notificações ordenadas: não lidas primeiro */
  readonly sorted = computed(() => {
    const read = this.readIds();
    return [...this.notifications()].sort((a, b) => {
      const aRead = read.has(a.id) ? 1 : 0;
      const bRead = read.has(b.id) ? 1 : 0;
      return aRead - bRead;
    });
  });

  constructor() {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.startListeners(uid);
  }

  private startListeners(uid: string): void {
    // ── Stream de notificações (PROD apenas) ─────────────────
    const targetList = this.auth.currentUser()?.role === 'desbravador' ? ['GLOBAL', 'DESBRAVADOR'] : ['GLOBAL', 'DESBRAVADOR', 'DIRETORIA'];
    const notifStream$ = collectionData(
      query(
        collection(this.firestore, 'notifications'),
        where('environment', '==', environment.production ? 'PROD' : 'DEV'),
        where('target.type', 'in', targetList),
        where('channels', 'array-contains', 'IN_APP'),
        orderBy('createdAt', 'desc'),
      )
    );

    notifStream$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(notifs => {
        const rawNotifs = notifs as AppNotification[];

        this.notifications.set(rawNotifs);

        this.readIds.set(
          new Set(
            rawNotifs
              .filter(notification => notification.readBy?.[uid])
              .map(notification => notification.id)
          )
        );
      });
  }

  /**
   * Marca uma notificação como lida pelo usuário atual.
   * Cria o documento em users/{uid}/notification_reads/{notifId}.
   */
  async markAsRead(notifId: string): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;

    const ref = doc(this.firestore, 'notifications', notifId);

    updateDoc(ref, {
      [`readBy.${uid}`]: {
        readAt: new Date().toISOString()
      }
    });

    this.readIds.update(set => {
      set.add(notifId);
      return set;
    });
  }

  isRead(id: string): boolean {
    return this.readIds().has(id);
  }
}
