/**
 * ============================================================
 *  ClubLink – Cache Models
 *  core/cache/cache.model.ts
 * ============================================================
 */

/** Envelope genérico armazenado no localStorage */
export interface CacheEntry<T = unknown> {
  value: T;
  storedAt: number;
  /** Epoch ms em que o registro expira (0 = sem expiração) */
  expiresAt: number;
  schemaVersion: string;
}

export interface CacheWriteOptions {
  ttlMs?: number;
  schemaVersion?: string;
}

export interface CacheReadResult<T> {
  hit: boolean;
  value: T | null;
  remainingMs?: number;
}

/** Chaves de cache conhecidas pelo ClubLink */
export const CACHE_KEYS = {
  CLUB_CUSTOMIZATION: 'clublink:customization',
  USER_SESSION:       'clublink:user_session',
  COOKIE_CONSENT:     'clublink:cookie_consent',
  USER_THEME:         'clublink:user_theme',   // ← preferência de tema por usuário
} as const;

export type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS] | string;
