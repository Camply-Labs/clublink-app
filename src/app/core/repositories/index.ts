import { Observable } from 'rxjs';
import {
  AppointmentPayload,
  CreateUserPayload,
  HistoryEntry,
  UpdateProfilePayload,
  User,
} from '../models';

export abstract class IUserRepository {
  abstract watchAll(): Observable<User[]>;
  abstract findById(uid: string): Promise<User | null>;
  abstract create(payload: CreateUserPayload): Promise<string>;
  abstract update(uid: string, data: Partial<Omit<User, 'uid'>>): Promise<void>;
  abstract updateProfile(uid: string, payload: UpdateProfilePayload): Promise<void>;
  abstract linkGoogle(uid: string, googleUid: string): Promise<void>;
  abstract findByGoogleUid(googleUid: string): Promise<User | null>;
  abstract delete(uid: string): Promise<void>;
}

export abstract class IHistoryRepository {
  abstract appendFull(uid: string, payload: AppointmentPayload, finalPoints: number): Promise<string>;
  abstract listRecent(uid: string, limit?: number): Promise<HistoryEntry[]>;
  abstract deleteAll(uid: string): Promise<void>;
}
