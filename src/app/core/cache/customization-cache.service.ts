import { Injectable }               from '@angular/core';
import { LocalStorageCacheService } from './local-storage-cache.service';
import { CACHE_KEYS }               from './cache.model';
import {
  ClubCustomization,
  ResolvedClubCustomization,
  DEFAULT_CLUB_CUSTOMIZATION,
} from '../../shared/models/app-config.model';

/**
 * ============================================================
 *  CustomizationCacheService
 *  core/cache/customization-cache.service.ts
 *
 *  Cache especializado para as personalizações do clube.
 *  – Merge automático com defaults
 *  – Schema versionado (v3 — sem theme colors)
 *  – Invalidação no login/logout
 * ============================================================
 */
@Injectable({ providedIn: 'root' })
export class CustomizationCacheService {

  private readonly SCHEMA_VERSION = '3';
  private readonly TTL_MS = 0; // sem expiração — dura a sessão

  constructor(private _cache: LocalStorageCacheService) {}

  save(raw: ClubCustomization): void {
    this._cache.set(
      CACHE_KEYS.CLUB_CUSTOMIZATION,
      raw,
      { ttlMs: this.TTL_MS, schemaVersion: this.SCHEMA_VERSION },
    );
  }

  getRaw(): ClubCustomization | null {
    const r = this._cache.get<ClubCustomization>(
      CACHE_KEYS.CLUB_CUSTOMIZATION,
      this.SCHEMA_VERSION,
    );
    return r.hit ? r.value : null;
  }

  getResolved(): ResolvedClubCustomization {
    return this._merge(this.getRaw() ?? {});
  }

  isCached(): boolean {
    return this._cache.has(CACHE_KEYS.CLUB_CUSTOMIZATION);
  }

  invalidate(): void {
    this._cache.delete(CACHE_KEYS.CLUB_CUSTOMIZATION);
  }

  invalidateAll(): void {
    this._cache.deleteByPrefix('clublink:');
  }

  private _merge(raw: ClubCustomization): ResolvedClubCustomization {
    return {
      clubName:  raw.clubName  ?? DEFAULT_CLUB_CUSTOMIZATION.clubName,
      logoUrl:   raw.logoUrl   ?? DEFAULT_CLUB_CUSTOMIZATION.logoUrl,
      updatedAt: raw.updatedAt ?? DEFAULT_CLUB_CUSTOMIZATION.updatedAt,
      updatedBy: raw.updatedBy ?? DEFAULT_CLUB_CUSTOMIZATION.updatedBy,
      social: {
        instagram: raw.social?.instagram,
        facebook:  raw.social?.facebook,
        youtube:   raw.social?.youtube,
        whatsapp:  raw.social?.whatsapp,
        twitter:   raw.social?.twitter,
        tiktok:    raw.social?.tiktok,
      },
      contact: {
        meetingSchedule: raw.contact?.meetingSchedule,
        churchName:      raw.contact?.churchName,
        addressLine1:    raw.contact?.addressLine1,
        addressLine2:    raw.contact?.addressLine2,
        phone:           raw.contact?.phone,
        email:           raw.contact?.email,
      },
      support: {
        supportEmail: raw.support?.supportEmail ?? DEFAULT_CLUB_CUSTOMIZATION.support.supportEmail,
        docsUrl:      raw.support?.docsUrl      ?? DEFAULT_CLUB_CUSTOMIZATION.support.docsUrl,
        supportPhone: raw.support?.supportPhone,
      },
    };
  }
}
