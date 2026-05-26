import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  collectionData,
  serverTimestamp,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { Observable, catchError, map, throwError } from 'rxjs';
import { IEventRepository } from '../../core/repositories/event.repository';
import { AgendaEvent, AgendaEventPayload, ImportLog } from '../../core/models/event.model';

function toDate(v: unknown): string | undefined {
  if (!v) return undefined;
  if (typeof (v as { toDate?: unknown }).toDate === 'function')
    return (v as { toDate: () => Date }).toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return undefined;
}

function docToEvent(data: Record<string, unknown>, id: string): AgendaEvent {
  return {
    id,
    title:           (data['title']           as string)  ?? '',
    start:           toDate(data['start'])                 ?? '',
    end:             toDate(data['end']),
    allDay:          (data['allDay']           as boolean) ?? false,
    description:     (data['description']      as string)  ?? '',
    location:        (data['location']         as string)  ?? '',
    color:           (data['color']            as string)  ?? '#c9a84c',
    isPrivate:       (data['isPrivate']        as boolean) ?? false,
    source:          (data['source']           as AgendaEvent['source']) ?? 'manual',
    importHash:      (data['importHash']       as string)  ?? undefined,
    importedAt:      toDate(data['importedAt']),
    importedBy:      (data['importedBy']       as string)  ?? undefined,
    importedByName:  (data['importedByName']   as string)  ?? undefined,
    importFile:      (data['importFile']       as string)  ?? undefined,
    createdAt:       toDate(data['createdAt']),
    createdBy:       (data['createdBy']        as string)  ?? undefined,
  };
}

@Injectable()
export class FirebaseEventRepository implements IEventRepository {
  private readonly firestore = inject(Firestore);

  private eventsCol()    { return collection(this.firestore, 'events'); }
  private importLogCol() { return collection(this.firestore, 'import_log'); }

  watchAll(isDirector: boolean): Observable<AgendaEvent[]> {
    let q = query(this.eventsCol(), orderBy('start', 'asc'));
    if (!isDirector) {
      q = query(q, where('isPrivate', '==', false));
    }
    return collectionData(
      q,
      { idField: 'id' },
    ).pipe(
      map(docs =>
        docs.map(d => docToEvent(d as Record<string, unknown>, (d as { id: string }).id))
      ),
    );
  }

  async create(payload: AgendaEventPayload, createdBy: string): Promise<string> {
    const ref = await addDoc(this.eventsCol(), {
      ...payload,
      source:    'manual',
      createdBy,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(id: string, payload: AgendaEventPayload): Promise<void> {
    await updateDoc(doc(this.firestore, 'events', id), { ...payload });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'events', id));
  }

  async importEvents(events: AgendaEvent[], importLog: Omit<ImportLog, 'id'>): Promise<void> {
    // 1. Busca todos os eventos que NÃO são manuais (import + birthday)
    const toDeleteSnap = await getDocs(
      query(this.eventsCol(), where('source', 'in', ['import', 'birthday'])),
    );

    // 2. Batch: deleta os não-manuais e insere os novos
    const BATCH_LIMIT = 490;
    let batch = writeBatch(this.firestore);
    let ops   = 0;

    const flush = async () => { await batch.commit(); batch = writeBatch(this.firestore); ops = 0; };

    // Deletar
    for (const d of toDeleteSnap.docs) {
      batch.delete(d.ref);
      if (++ops >= BATCH_LIMIT) await flush();
    }

    // Inserir novos eventos
    for (const ev of events) {
      const { id: _id, ...data } = ev;
      void _id;
      batch.set(doc(this.eventsCol()), { ...data, createdAt: serverTimestamp() });
      if (++ops >= BATCH_LIMIT) await flush();
    }

    // Registrar log de importação
    batch.set(doc(this.importLogCol()), {
      ...importLog,
      importedAt: serverTimestamp(),
    });

    if (ops > 0) await batch.commit();
  }

  async listImportLogs(): Promise<ImportLog[]> {
    const snap = await getDocs(
      query(this.importLogCol(), orderBy('importedAt', 'desc')),
    );
    return snap.docs.map(d => {
      const data = d.data() as Record<string, unknown>;
      return {
        id:              d.id,
        filename:        (data['filename']        as string) ?? '',
        hash:            (data['hash']            as string) ?? '',
        importedAt:      toDate(data['importedAt'])          ?? '',
        importedBy:      (data['importedBy']      as string) ?? '',
        importedByName:  (data['importedByName']  as string) ?? '',
        eventCount:      (data['eventCount']      as number) ?? 0,
      };
    });
  }
}
