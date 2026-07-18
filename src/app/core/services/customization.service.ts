import {
  Injectable, signal, computed, inject, PLATFORM_ID,
} from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth }                  from '@angular/fire/auth';
import { CustomizationCacheService } from './customization-cache.service';
import {
  ClubCustomization,
  ResolvedClubCustomization,
  DEFAULT_CLUB_CUSTOMIZATION,
} from '../../shared/models/app-config.model';
import { StringHelper } from '../../shared/helpers/string.helper';

/**
 * ============================================================
 *  CustomizationService
 *  core/customization/customization.service.ts
 *
 *  Orquestra o ciclo de vida das personalizações do clube.
 *  NÃO gerencia cores — isso é responsabilidade do ThemeService.
 *
 *  Fluxo:
 *  1. AppComponent.ngOnInit() → loadFromCache() (síncrono, rápido)
 *  2. Pós-login → loadFromFirestore() (atualiza cache e signals)
 *  3. Admin salva → saveToFirestore() (invalida cache, regrava, atualiza)
 *  4. Logout → reset()
 * ============================================================
 */
@Injectable({ providedIn: 'root' })
export class CustomizationService {

  private readonly COLLECTION = 'app_config';
  private readonly DOC_ID     = 'customization';

  private _firestore  = inject(Firestore);
  private _auth       = inject(Auth);
  private _cache      = inject(CustomizationCacheService);

  // ── Signals ───────────────────────────────────────────────────────────────

  private _data = signal<ResolvedClubCustomization>({ ...DEFAULT_CLUB_CUSTOMIZATION });

  readonly customization$ = this._data.asReadonly();
  readonly clubName$       = computed(() => this._data().clubName);
  readonly logoUrl$        = computed(() => this._data().logoUrl);
  readonly social$         = computed(() => this._data().social);
  readonly contact$        = computed(() => this._data().contact);
  readonly support$        = computed(() => this._data().support);

  readonly isLoading$ = signal(false);
  readonly error$     = signal<string | null>(null);

  // ── Público ───────────────────────────────────────────────────────────────

  getValueOrDefault<K extends keyof ResolvedClubCustomization>(
    atributo: K
  ): ResolvedClubCustomization[K] {
      const valor = this.customization$()[atributo];

      if (valor === null || valor === undefined) {
          return DEFAULT_CLUB_CUSTOMIZATION[atributo];
      }

      if (typeof valor === "string" && StringHelper.isNullOrEmpty(valor)) {
          return DEFAULT_CLUB_CUSTOMIZATION[atributo];
      }

      return valor;
  }

  haveSocialLinks(): boolean {
    const social = this.getValueOrDefault('social');
    return !!(social.instagram || social.facebook || social.youtube || social.whatsapp || social.twitter || social.tiktok);
  }

  loadCustomization(): void {
    if(this._cache.isCached()) {
      this.loadFromCache();
    }
    else {
      this.loadFromFirestore();
    }
  }

  loadFromDefaults(): void {
    if(!this._cache.isCached()) {
      this._data.set({ ...DEFAULT_CLUB_CUSTOMIZATION });
    }
  }

  /** Carrega do cache (sem Firestore). Chame no AppComponent.ngOnInit(). */
  loadFromCache(): void {
    if (this._cache.isCached()) {
      this._data.set(this._cache.getResolved());
    }
  }

  /** Busca do Firestore pós-login. Atualiza cache e signals. */
  async loadFromFirestore(): Promise<void> {
    this.isLoading$.set(true);
    this.error$.set(null);
    try {
      const snap = await getDoc(doc(this._firestore, this.COLLECTION, this.DOC_ID));
      const raw: ClubCustomization = snap.exists() ? (snap.data() as ClubCustomization) : {};
      this._cache.save(raw);
      this._data.set(this._cache.getResolved());
    } catch (err) {
      console.error('[ClubLink] Erro ao carregar customização:', err);
      this.error$.set('Não foi possível carregar as configurações do clube.');
      this.loadFromDefaults();
    } finally {
      this.isLoading$.set(false);
    }
  }

  /** Salva no Firestore. Só admins devem chamar. */
  async saveToFirestore(data: ClubCustomization): Promise<void> {
    const user = this._auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');

    this.isLoading$.set(true);
    this.error$.set(null);
    try {
      const payload: ClubCustomization = {
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      };
      await setDoc(doc(this._firestore, this.COLLECTION, this.DOC_ID), payload, { merge: true });
      this._cache.invalidate();
      this._cache.save(payload);
      this._data.set(this._cache.getResolved());
    } catch (err) {
      console.error('[ClubLink] Erro ao salvar customização:', err);
      this.error$.set('Não foi possível salvar as configurações.');
      throw err;
    } finally {
      this.isLoading$.set(false);
    }
  }

  /** Chame no logout. */
  reset(): void {
    this._cache.invalidateAll();
    this._data.set({ ...DEFAULT_CLUB_CUSTOMIZATION });
  }
}
