import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IUserRepository } from '../repositories';
import { CreateUserPayload, UpdateProfilePayload, User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly repo       = inject(IUserRepository);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<User[]>([]);

  constructor() {
    this.repo.watchAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => this.users.set(list));
  }

  getPathfinders(): User[] {
    return this.users()
      .filter(u => u.role === 'desbravador')
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  }

  getDirectors(): User[] {
    return this.users()
      .filter(u => u.role === 'diretoria')
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getAll(): User[] {
    return [...this.users()].sort((a, b) => a.name.localeCompare(b.name));
  }

  getRankOf(uid: string): number {
    return this.getPathfinders().findIndex(u => u.uid === uid) + 1;
  }

  create(payload: CreateUserPayload): Promise<string> {
    return this.repo.create(payload);
  }

  updateProfile(uid: string, payload: UpdateProfilePayload): Promise<void> {
    return this.repo.updateProfile(uid, payload);
  }

  delete(uid: string): Promise<void> {
    return this.repo.delete(uid);
  }

  filterBySearch(users: User[], query: string): User[] {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      u => u.name.toLowerCase().includes(q) || u.unit.toLowerCase().includes(q),
    );
  }
}
