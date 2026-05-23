import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from '@angular/fire/firestore';
import { IHistoryRepository } from '../../core/repositories';
import { AppointmentPayload, HistoryEntry } from '../../core/models';

@Injectable()
export class FirebaseHistoryRepository implements IHistoryRepository {
  private readonly firestore = inject(Firestore);

  private histCol(uid: string) {
    return collection(this.firestore, 'users', uid, 'history');
  }

  async appendFull(uid: string, payload: AppointmentPayload, finalPoints: number): Promise<string> {
    const delta = payload.type === 'add'
      ? payload.value
      : payload.value - (finalPoints - (payload.value - finalPoints)); // reset: delta = newValue - oldValue

    const ref = await addDoc(this.histCol(uid), {
      type:        payload.type,
      delta:       payload.type === 'add' ? payload.value : finalPoints,
      finalPoints,
      description: payload.description,
      updatedBy:   payload.directorName,
      timestamp:   serverTimestamp(),
    });

    void delta; // delta calculado para fins de logging, não usado aqui
    return ref.id;
  }

  async listRecent(uid: string, limitCount = 20): Promise<HistoryEntry[]> {
    const q    = query(this.histCol(uid), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);

    return snap.docs.map(d => {
      const data = d.data();
      const ts   = (data['timestamp'] as { toDate?: () => Date } | null)?.toDate?.() ?? new Date();
      return {
        id:          d.id,
        type:        data['type']        as HistoryEntry['type'],
        delta:       (data['delta']       as number) ?? 0,
        finalPoints: (data['finalPoints'] as number) ?? 0,
        description: (data['description'] as string) ?? '',
        updatedBy:   (data['updatedBy']   as string) ?? '',
        timestamp:   ts,
      } satisfies HistoryEntry;
    });
  }

  async deleteAll(uid: string): Promise<void> {
    const snap  = await getDocs(this.histCol(uid));
    const batch = writeBatch(this.firestore);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}
