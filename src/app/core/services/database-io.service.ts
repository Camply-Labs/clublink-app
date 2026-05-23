// ============================================================
//  DatabaseIOService — Exportação e Importação de dados
//  Formato proprietário versionado com validação estrita.
// ============================================================

import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  doc,
  writeBatch,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';

// ── Versão do schema de exportação ───────────────────────────
export const EXPORT_SCHEMA_VERSION = '1.0.0';

// ── Coleções suportadas ───────────────────────────────────────
export type CollectionKey = 'users' | 'history';
export const ALL_COLLECTIONS: CollectionKey[] = ['users', 'history'];

// ── Tipos do arquivo JSON ─────────────────────────────────────
export interface ExportedUser {
  uid:            string;
  name:           string;
  email:          string;
  unit:           string;
  position:       string;
  role:           'desbravador' | 'diretoria';
  points:         number;
  photoUrl:       string;
  googleUid?:     string;
  isAdmin?:       boolean;
  permissions?:   string[];
  createdAt?:     string | null;  // ISO string
  createdBy?:     string;
  lastUpdate?:    string | null;
  lastUpdatedBy?: string;
}

export interface ExportedHistoryEntry {
  id:          string;
  type:        'add' | 'reset';
  delta:       number;
  finalPoints: number;
  description: string;
  updatedBy:   string;
  timestamp:   string | null; // ISO string
}

export interface DatabaseExport {
  /** Identifica o formato — sempre "clublink-app-export" */
  _format:     'clublink-app-export';
  /** Versão do schema — usado para validação */
  _version:    string;
  exportedAt:  string;  // ISO string
  exportedBy:  string;  // UID do admin
  collections: {
    users?:   ExportedUser[];
    /** Mapa uid → array de entradas */
    history?: Record<string, ExportedHistoryEntry[]>;
  };
}

// ── Erros de validação ────────────────────────────────────────
export class ImportValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'ImportValidationError';
  }
}

@Injectable({ providedIn: 'root' })
export class DatabaseIOService {
  private readonly firestore = inject(Firestore);
  private readonly auth      = inject(AuthService);

  // ============================================================
  //  EXPORTAÇÃO
  // ============================================================

  async export(collections: CollectionKey[]): Promise<DatabaseExport> {
    const result: DatabaseExport = {
      _format:    'clublink-app-export',
      _version:   EXPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy: this.auth.currentUser()?.uid ?? 'unknown',
      collections: {},
    };

    if (collections.includes('users')) {
      result.collections.users = await this.exportUsers();
    }

    if (collections.includes('history')) {
      result.collections.history = await this.exportHistory();
    }

    return result;
  }

  private async exportUsers(): Promise<ExportedUser[]> {
    const snap = await getDocs(collection(this.firestore, 'users'));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        uid:           d.id,
        name:          (data['name']          as string)   ?? '',
        email:         (data['email']         as string)   ?? '',
        unit:          (data['unit']          as string)   ?? '',
        position:      (data['position']      as string)   ?? '',
        role:          (data['role']          as ExportedUser['role']) ?? 'desbravador',
        points:        (data['points']        as number)   ?? 0,
        photoUrl:      (data['photoUrl']      as string)   ?? '',
        googleUid:     (data['googleUid']     as string)   ?? undefined,
        isAdmin:       (data['isAdmin']       as boolean)  ?? false,
        permissions:   (data['permissions']   as string[]) ?? [],
        createdAt:     this.tsToIso(data['createdAt']),
        createdBy:     (data['createdBy']     as string)   ?? '',
        lastUpdate:    this.tsToIso(data['lastUpdate']),
        lastUpdatedBy: (data['lastUpdatedBy'] as string)   ?? '',
      } satisfies ExportedUser;
    });
  }

  private async exportHistory(): Promise<Record<string, ExportedHistoryEntry[]>> {
    const usersSnap = await getDocs(collection(this.firestore, 'users'));
    const result: Record<string, ExportedHistoryEntry[]> = {};

    for (const userDoc of usersSnap.docs) {
      const uid      = userDoc.id;
      const histSnap = await getDocs(
        query(
          collection(this.firestore, 'users', uid, 'history'),
          orderBy('timestamp', 'desc'),
        ),
      );

      if (!histSnap.empty) {
        result[uid] = histSnap.docs.map(h => {
          const data = h.data();
          return {
            id:          h.id,
            type:        (data['type']        as ExportedHistoryEntry['type']) ?? 'add',
            delta:       (data['delta']       as number) ?? 0,
            finalPoints: (data['finalPoints'] as number) ?? 0,
            description: (data['description'] as string) ?? '',
            updatedBy:   (data['updatedBy']   as string) ?? '',
            timestamp:   this.tsToIso(data['timestamp']),
          } satisfies ExportedHistoryEntry;
        });
      }
    }

    return result;
  }

  // ── Converte Firestore Timestamp → ISO string ─────────────
  private tsToIso(v: unknown): string | null {
    if (!v) return null;
    if (typeof (v as { toDate?: unknown }).toDate === 'function') {
      return (v as { toDate: () => Date }).toDate().toISOString();
    }
    if (v instanceof Date) return v.toISOString();
    return null;
  }

  // ============================================================
  //  DOWNLOAD (helper)
  // ============================================================

  downloadJson(data: DatabaseExport, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ============================================================
  //  VALIDAÇÃO DO JSON
  // ============================================================

  validate(raw: unknown): DatabaseExport {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new ImportValidationError('O arquivo não é um objeto JSON válido.');
    }

    const obj = raw as Record<string, unknown>;

    // ── Campos raiz obrigatórios ──────────────────────────────
    if (obj['_format'] !== 'clublink-app-export') {
      throw new ImportValidationError(
        'Campo "_format" inválido ou ausente. Esperado: "clublink-app-export".',
        '_format',
      );
    }

    if (typeof obj['_version'] !== 'string' || !obj['_version']) {
      throw new ImportValidationError('Campo "_version" ausente ou inválido.', '_version');
    }

    if (typeof obj['exportedAt'] !== 'string' || isNaN(Date.parse(obj['exportedAt'] as string))) {
      throw new ImportValidationError('Campo "exportedAt" ausente ou não é uma data ISO válida.', 'exportedAt');
    }

    if (typeof obj['exportedBy'] !== 'string') {
      throw new ImportValidationError('Campo "exportedBy" ausente ou inválido.', 'exportedBy');
    }

    if (typeof obj['collections'] !== 'object' || obj['collections'] === null) {
      throw new ImportValidationError('Campo "collections" ausente ou inválido.', 'collections');
    }

    const cols = obj['collections'] as Record<string, unknown>;

    if (Object.keys(cols).length === 0) {
      throw new ImportValidationError('O arquivo não contém nenhuma coleção para importar.', 'collections');
    }

    // ── Validar users (se presente) ───────────────────────────
    if ('users' in cols) {
      if (!Array.isArray(cols['users'])) {
        throw new ImportValidationError('"collections.users" deve ser um array.', 'collections.users');
      }
      (cols['users'] as unknown[]).forEach((u, i) => this.validateUser(u, i));
    }

    // ── Validar history (se presente) ────────────────────────
    if ('history' in cols) {
      const hist = cols['history'];
      if (typeof hist !== 'object' || hist === null || Array.isArray(hist)) {
        throw new ImportValidationError(
          '"collections.history" deve ser um objeto { uid: HistoryEntry[] }.',
          'collections.history',
        );
      }
      for (const [uid, entries] of Object.entries(hist as Record<string, unknown>)) {
        if (!Array.isArray(entries)) {
          throw new ImportValidationError(
            `"collections.history.${uid}" deve ser um array.`,
            `collections.history.${uid}`,
          );
        }
        (entries as unknown[]).forEach((e, i) => this.validateHistoryEntry(e, uid, i));
      }
    }

    return raw as DatabaseExport;
  }

  private validateUser(u: unknown, index: number): void {
    const prefix = `collections.users[${index}]`;

    if (typeof u !== 'object' || u === null) {
      throw new ImportValidationError(`${prefix} não é um objeto.`, prefix);
    }

    const obj = u as Record<string, unknown>;
    const req: Array<[string, string]> = [
      ['uid',   'string'],
      ['name',  'string'],
      ['email', 'string'],
      ['unit',  'string'],
      ['role',  'string'],
    ];

    for (const [field, type] of req) {
      if (typeof obj[field] !== type || !(obj[field] as string).trim()) {
        throw new ImportValidationError(
          `${prefix}.${field} é obrigatório e deve ser um ${type} não vazio.`,
          `${prefix}.${field}`,
        );
      }
    }

    if (!['desbravador', 'diretoria'].includes(obj['role'] as string)) {
      throw new ImportValidationError(
        `${prefix}.role inválido ("${obj['role']}"). Esperado: "desbravador" ou "diretoria".`,
        `${prefix}.role`,
      );
    }

    if (typeof obj['points'] !== 'number' || obj['points'] < 0) {
      throw new ImportValidationError(
        `${prefix}.points deve ser um número >= 0.`,
        `${prefix}.points`,
      );
    }
  }

  private validateHistoryEntry(e: unknown, uid: string, index: number): void {
    const prefix = `collections.history.${uid}[${index}]`;

    if (typeof e !== 'object' || e === null) {
      throw new ImportValidationError(`${prefix} não é um objeto.`, prefix);
    }

    const obj = e as Record<string, unknown>;

    if (typeof obj['id'] !== 'string' || !obj['id']) {
      throw new ImportValidationError(`${prefix}.id é obrigatório.`, `${prefix}.id`);
    }

    if (!['add', 'reset'].includes(obj['type'] as string)) {
      throw new ImportValidationError(
        `${prefix}.type inválido ("${obj['type']}"). Esperado: "add" ou "reset".`,
        `${prefix}.type`,
      );
    }

    if (typeof obj['delta'] !== 'number') {
      throw new ImportValidationError(`${prefix}.delta deve ser um número.`, `${prefix}.delta`);
    }

    if (typeof obj['finalPoints'] !== 'number' || obj['finalPoints'] < 0) {
      throw new ImportValidationError(
        `${prefix}.finalPoints deve ser um número >= 0.`,
        `${prefix}.finalPoints`,
      );
    }
  }

  // ============================================================
  //  IMPORTAÇÃO
  // ============================================================

  async import(data: DatabaseExport, collections: CollectionKey[]): Promise<ImportSummary> {
    const summary: ImportSummary = { users: 0, historyEntries: 0, errors: [] };

    if (collections.includes('users') && data.collections.users) {
      summary.users = await this.importUsers(data.collections.users, summary.errors);
    }

    if (collections.includes('history') && data.collections.history) {
      summary.historyEntries = await this.importHistory(
        data.collections.history,
        summary.errors,
      );
    }

    return summary;
  }

  private async importUsers(users: ExportedUser[], errors: string[]): Promise<number> {
    let count  = 0;
    const BATCH_LIMIT = 490; // Firestore batch max = 500, com margem
    let   batch = writeBatch(this.firestore);
    let   ops   = 0;

    for (const u of users) {
      try {
        const ref = doc(this.firestore, 'users', u.uid);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uid, ...data } = u;
        batch.set(ref, data, { merge: true });
        ops++;
        count++;

        if (ops >= BATCH_LIMIT) {
          await batch.commit();
          batch = writeBatch(this.firestore);
          ops   = 0;
        }
      } catch (err) {
        errors.push(`Erro ao importar user ${u.uid}: ${(err as Error).message}`);
      }
    }

    if (ops > 0) await batch.commit();
    return count;
  }

  private async importHistory(
    historyMap: Record<string, ExportedHistoryEntry[]>,
    errors: string[],
  ): Promise<number> {
    let count = 0;

    for (const [uid, entries] of Object.entries(historyMap)) {
      let   batch = writeBatch(this.firestore);
      let   ops   = 0;
      const LIMIT = 490;

      for (const entry of entries) {
        try {
          const ref = doc(this.firestore, 'users', uid, 'history', entry.id);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...data } = entry;
          batch.set(ref, data, { merge: true });
          ops++;
          count++;

          if (ops >= LIMIT) {
            await batch.commit();
            batch = writeBatch(this.firestore);
            ops   = 0;
          }
        } catch (err) {
          errors.push(`Erro ao importar history ${uid}/${entry.id}: ${(err as Error).message}`);
        }
      }

      if (ops > 0) await batch.commit();
    }

    return count;
  }
}

export interface ImportSummary {
  users:          number;
  historyEntries: number;
  errors:         string[];
}
