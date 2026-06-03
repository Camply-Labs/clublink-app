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
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { IScoringRepository } from '../../core/repositories/scoring.repository';
import { ScoringItem, ScoringItemPayload } from '../../core/models/scoring.model';

function docToScoring(data: Record<string, unknown>, id: string): ScoringItem {
  const ts = (v: unknown): string | undefined => {
    if (!v) return undefined;
    if (typeof (v as { toDate?: unknown }).toDate === 'function')
      return (v as { toDate: () => Date }).toDate().toISOString();
    return undefined;
  };
  return {
    id,
    name:        (data['name']        as string) ?? '',
    description: (data['description'] as string) ?? '',
    points:      (data['points']      as number) ?? 0,
    category:    (data['category']    as string) ?? '',
    createdAt:   ts(data['createdAt']),
    createdBy:   (data['createdBy']   as string) ?? '',
  };
}

@Injectable()
export class FirebaseScoringRepository implements IScoringRepository {
  private readonly firestore = inject(Firestore);
  private col() { return collection(this.firestore, 'scorings'); }

  watchAll(): Observable<ScoringItem[]> {
    return collectionData(
      query(this.col(), orderBy('points', 'desc')),
      { idField: 'id' },
    ).pipe(
      map(docs => docs.map(d =>
        docToScoring(d as Record<string, unknown>, (d as { id: string }).id)
      )),
    );
  }

  async create(payload: ScoringItemPayload, createdBy: string): Promise<string> {
    const ref = await addDoc(this.col(), {
      ...payload,
      createdBy,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(id: string, payload: ScoringItemPayload): Promise<void> {
    await updateDoc(doc(this.firestore, 'scorings', id), { ...payload });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'scorings', id));
  }
}
