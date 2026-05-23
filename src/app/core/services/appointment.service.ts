import { inject, Injectable } from '@angular/core';
import { IHistoryRepository, IUserRepository } from '../repositories';
import { AppointmentPayload, HistoryEntry, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly historyRepo = inject(IHistoryRepository);
  private readonly userRepo    = inject(IUserRepository);

  async addPoints(target: User, delta: number, description: string, directorName: string): Promise<void> {
    const finalPoints = Math.max(0, (target.points ?? 0) + delta);
    const payload: AppointmentPayload = {
      targetUid: target.uid, type: 'add',
      value: delta, description, directorName,
    };
    await Promise.all([
      this.userRepo.update(target.uid, { points: finalPoints, lastUpdatedBy: directorName }),
      this.historyRepo.appendFull(target.uid, payload, finalPoints),
    ]);
  }

  async resetPoints(target: User, newValue: number, description: string, directorName: string): Promise<void> {
    const payload: AppointmentPayload = {
      targetUid: target.uid, type: 'reset', value: newValue,
      description: description || 'Redefinição de pontos', directorName,
    };
    await Promise.all([
      this.userRepo.update(target.uid, { points: newValue, lastUpdatedBy: directorName }),
      this.historyRepo.appendFull(target.uid, payload, newValue),
    ]);
  }

  getHistory(uid: string, limit = 20): Promise<HistoryEntry[]> {
    return this.historyRepo.listRecent(uid, limit);
  }
}
