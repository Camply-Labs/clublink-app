import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser }               from '@angular/common';
import {
  CacheEntry,
  CacheWriteOptions,
  CacheReadResult,
  CacheKey,
} from '../models/cache.model';

/**
 * ============================================================
 *  LocalStorageCacheService
 *  core/cache/local-storage-cache.service.ts
 *
 *  Serviço GENÉRICO de cache via localStorage.
 *  Use-o diretamente ou estenda-o em serviços especializados.
 *
 *  Responsabilidades:
 *   – Serializar / desserializar com envelope CacheEntry<T>
 *   – Verificar TTL e versão de schema automaticamente
 *   – Funcionar com SSR (isPlatformBrowser guard)
 *   – Nunca lançar exceções ao usuário (todos os erros são logados)
 *
 *  Uso básico:
 *    cache.set('minha:chave', { foo: 'bar' }, { ttlMs: 60_000 });
 *    const res = cache.get<{ foo: string }>('minha:chave');
 *    if (res.hit) console.log(res.value?.foo);
 * ============================================================
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageCacheService {

  private readonly _isBrowser: boolean;
  private readonly _SCHEMA_VERSION = '1';

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this._isBrowser = isPlatformBrowser(platformId);
  }

  // ── Escrita ───────────────────────────────────────────────────────────────

  /**
   * Grava um valor no cache.
   * @param key    Chave única (use CACHE_KEYS para evitar typos)
   * @param value  Qualquer valor serializável em JSON
   * @param opts   TTL, versão de schema etc.
   * @returns true se gravado com sucesso, false em caso de erro
   */
  set<T>(key: CacheKey, value: T, opts: CacheWriteOptions = {}): boolean {
    if (!this._isBrowser) return false;

    const entry: CacheEntry<T> = {
      value,
      storedAt:      Date.now(),
      expiresAt:     opts.ttlMs ? Date.now() + opts.ttlMs : 0,
      schemaVersion: opts.schemaVersion ?? this._SCHEMA_VERSION,
    };

    try {
      localStorage.setItem(key, JSON.stringify(entry));
      return true;
    } catch (err) {
      console.warn(`[ClubLink Cache] Falha ao gravar "${key}":`, err);
      return false;
    }
  }

  // ── Leitura ───────────────────────────────────────────────────────────────

  /**
   * Lê um valor do cache.
   * Retorna { hit: false } se: chave não existe, expirada ou schema diferente.
   */
  get<T>(key: CacheKey, expectedSchema?: string): CacheReadResult<T> {
    if (!this._isBrowser) return { hit: false, value: null };

    const raw = localStorage.getItem(key);
    if (!raw) return { hit: false, value: null };

    try {
      const entry = JSON.parse(raw) as CacheEntry<T>;

      // Verifica versão de schema
      const schema = expectedSchema ?? this._SCHEMA_VERSION;
      if (entry.schemaVersion !== schema) {
        this.delete(key);
        return { hit: false, value: null };
      }

      // Verifica expiração
      if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
        this.delete(key);
        return { hit: false, value: null };
      }

      const remainingMs = entry.expiresAt > 0
        ? entry.expiresAt - Date.now()
        : undefined;

      return { hit: true, value: entry.value, remainingMs };

    } catch (err) {
      console.warn(`[ClubLink Cache] Falha ao ler "${key}":`, err);
      this.delete(key);
      return { hit: false, value: null };
    }
  }

  // ── Exclusão ──────────────────────────────────────────────────────────────

  /** Remove uma chave específica */
  delete(key: CacheKey): void {
    if (!this._isBrowser) return;
    try { localStorage.removeItem(key); } catch { /* silent */ }
  }

  /**
   * Remove todas as chaves que começam com um prefixo.
   * Útil para limpar um namespace inteiro (ex: 'clublink:').
   */
  deleteByPrefix(prefix: string): void {
    if (!this._isBrowser) return;
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(prefix)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch { /* silent */ }
  }

  /** Apaga TUDO do localStorage (use com cuidado) */
  clear(): void {
    if (!this._isBrowser) return;
    try { localStorage.clear(); } catch { /* silent */ }
  }

  // ── Utilitários ───────────────────────────────────────────────────────────

  /** Verifica se uma chave existe E não está expirada */
  has(key: CacheKey): boolean {
    return this.get(key).hit;
  }

  /** Retorna quantos ms restam para expirar (undefined = sem expiração, -1 = já expirou) */
  ttlRemaining(key: CacheKey): number | undefined {
    const result = this.get(key);
    if (!result.hit) return -1;
    return result.remainingMs;
  }

  /** Lista todas as chaves que começam com um prefixo */
  listKeys(prefix = ''): string[] {
    if (!this._isBrowser) return [];
    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
      }
    } catch { /* silent */ }
    return keys;
  }

  /**
   * "Touch" – renova o TTL de uma entrada existente sem alterar o valor.
   * Útil para manter sessões ativas enquanto o usuário interage.
   */
  touch(key: CacheKey, newTtlMs: number): boolean {
    const result = this.get(key);
    if (!result.hit || result.value === null) return false;
    return this.set(key, result.value, { ttlMs: newTtlMs });
  }
}
