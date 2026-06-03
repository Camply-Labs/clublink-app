import { inject, Injectable, signal, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IScoringRepository } from '../repositories/scoring.repository';
import { AuthService } from './auth.service';
import { ScoringItem, ScoringItemPayload } from '../models/scoring.model';

@Injectable({ providedIn: 'root' })
export class ScoringService {
  private readonly repo       = inject(IScoringRepository);
  private readonly auth       = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<ScoringItem[]>([]);

  readonly positiveItems = computed(() =>
    this.items().filter(i => i.points > 0).sort((a, b) => b.points - a.points)
  );

  readonly negativeItems = computed(() =>
    this.items().filter(i => i.points < 0).sort((a, b) => a.points - b.points)
  );

  constructor() {
    this.repo.watchAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => this.items.set(list));
  }

  create(payload: ScoringItemPayload): Promise<string> {
    return this.repo.create(payload, this.auth.currentUser()?.uid ?? '');
  }

  update(id: string, payload: ScoringItemPayload): Promise<void> {
    return this.repo.update(id, payload);
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
