import { inject, Injectable, signal } from '@angular/core';
import {
  Firestore,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { AppStatus, AppStatusKey } from '../models/app-status.model';
import { AuthService } from './auth.service';

const STATUS_REF = (fs: Firestore) => doc(fs, 'app_config', 'status');

@Injectable({ providedIn: 'root' })
export class AppStatusService {
  private readonly firestore = inject(Firestore);
  private readonly auth      = inject(AuthService);

  readonly status    = signal<AppStatus | null>(null);
  readonly isLoading = signal(true);

  private unsub?: () => void;

  constructor() {
    this.startListener();
  }

  private startListener(): void {
    this.unsub = onSnapshot(
      STATUS_REF(this.firestore),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Record<string, unknown>;
          this.status.set({
            status:        (data['status']        as AppStatusKey) ?? 'production',
            since:         this.tsToIso(data['since'])  ?? new Date().toISOString(),
            eta:           this.tsToIso(data['eta'])     ?? null,
            message:       (data['message']       as string) ?? '',
            updatedBy:     (data['updatedBy']     as string) ?? '',
            updatedByName: (data['updatedByName'] as string) ?? '',
          });
        } else {
          this.status.set({
            status: 'production',
            since:  new Date().toISOString(),
            eta:    null,
            message: '',
            updatedBy: '',
            updatedByName: '',
          });
        }
        this.isLoading.set(false);
      },
      () => {
        this.status.set({
          status: 'production',
          since:  new Date().toISOString(),
          eta:    null,
          message: '',
          updatedBy: '',
          updatedByName: '',
        });
        this.isLoading.set(false);
      },
    );
  }

  async setStatus(
    status:   AppStatusKey,
    message:  string,
    eta:      Date | null,
  ): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Não autenticado.');

    const payload: Record<string, unknown> = {
      status,
      message:       message.trim(),
      since:         serverTimestamp(),
      updatedBy:     user.uid,
      updatedByName: user.name || user.email,
      eta:           eta ? eta.toISOString() : null,
    };

    await setDoc(STATUS_REF(this.firestore), payload, { merge: false });
  }

  isBlocked(): boolean {
    const s = this.status();
    if (!s) return false;
    if (s.status === 'production') return false;
    // Admins não são bloqueados — podem ver a app mesmo em manutenção
    const user = this.auth.currentUser();
    return !(user?.role === 'diretoria' && user?.isAdmin === true);
  }

  private tsToIso(v: unknown): string | null {
    if (!v) return null;
    if (typeof (v as { toDate?: unknown }).toDate === 'function')
      return (v as { toDate: () => Date }).toDate().toISOString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'string') return v;
    return null;
  }

  destroy(): void {
    this.unsub?.();
  }
}
