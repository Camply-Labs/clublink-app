import { Observable } from 'rxjs';
import { ScoringItem, ScoringItemPayload } from '../models/scoring.model';

export abstract class IScoringRepository {
  abstract watchAll(): Observable<ScoringItem[]>;
  abstract create(payload: ScoringItemPayload, createdBy: string): Promise<string>;
  abstract update(id: string, payload: ScoringItemPayload): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
