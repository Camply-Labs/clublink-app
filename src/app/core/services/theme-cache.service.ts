import { Injectable }               from '@angular/core';
import { LocalStorageCacheService } from './local-storage-cache.service';
import { CACHE_KEYS }               from '../models/cache.model';
import {
  AppThemeMode,
  UserThemePreference,
  DEFAULT_THEME_MODE,
} from '../../shared/models/app-config.model';

/**
 * ============================================================
 *  ThemeCacheService
 *  core/cache/theme-cache.service.ts
 *
 *  Cache especializado para preferência de tema do usuário.
 *  Persiste entre sessões (sem TTL). Não vai ao Firestore.
 *  Aceita os três modos: 'nightsky' | 'light' | 'dark'
 * ============================================================
 */
@Injectable({ providedIn: 'root' })
export class ThemeCacheService {

  private readonly SCHEMA = '1';

  constructor(private _cache: LocalStorageCacheService) {}

  save(mode: AppThemeMode): void {
    const pref: UserThemePreference = { mode, savedAt: new Date().toISOString() };
    this._cache.set(CACHE_KEYS.USER_THEME, pref, { schemaVersion: this.SCHEMA });
  }

  get(): AppThemeMode {
    const r = this._cache.get<UserThemePreference>(CACHE_KEYS.USER_THEME, this.SCHEMA);
    if (!r.hit || !r.value) return DEFAULT_THEME_MODE;
    return r.value.mode;
  }

  isCached(): boolean {
    return this._cache.has(CACHE_KEYS.USER_THEME);
  }

  invalidate(): void {
    this._cache.delete(CACHE_KEYS.USER_THEME);
  }
}
