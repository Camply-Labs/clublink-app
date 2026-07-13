import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule }          from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CustomizationService }  from '../../core/customization/customization.service';
import { ClubCustomization }     from '../../shared/models/app-config.model';

/**
 * ============================================================
 *  SettingsComponent  (Admin-only)
 *  features/settings/settings.component.ts
 *
 *  Logo armazenada como base64 diretamente no Firestore,
 *  dentro do campo `logoUrl` do documento /app_config/customization.
 *
 *  Limites recomendados:
 *   – Tamanho máximo do arquivo: 512 KB (resultará em ~700 KB base64)
 *   – Firestore suporta documentos de até 1 MB
 *   – Para logos maiores, prefira Firebase Storage + URL
 *
 *  Seções:
 *   1. Identidade  – nome do clube, logo (base64)
 *   2. Contato     – endereço, telefone, e-mail, horário
 *   3. Redes sociais
 *   4. Suporte técnico
 * ============================================================
 */

/** Tamanho máximo aceito para a logo em bytes (512 KB) */
const MAX_LOGO_BYTES = 512 * 1024;

/** Tipos MIME aceitos */
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

@Component({
  selector:        'app-settings',
  standalone:      true,
  imports:         [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './settings.component.html',
  styleUrls:       ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {

  private _fb            = inject(FormBuilder);
  private _customization = inject(CustomizationService);

  // ── Estado ────────────────────────────────────────────────────────────────
  readonly isSaving$      = signal(false);
  readonly saveSuccess$   = signal(false);
  readonly saveError$     = signal<string | null>(null);
  readonly logoPreview$   = signal<string>('');
  readonly isConverting$  = signal(false);  // processando base64 localmente

  // ── Abas ──────────────────────────────────────────────────────────────────
  readonly tabs = [
    { id: 'identity', label: 'Identidade',     icon: '🦅' },
    { id: 'contact',  label: 'Contato',         icon: '📍' },
    { id: 'social',   label: 'Redes Sociais',   icon: '📱' },
    { id: 'support',  label: 'Suporte Técnico', icon: '🛠️' },
  ] as const;

  readonly activeTab$ = signal<typeof this.tabs[number]['id']>('identity');

  // ── Formulário ────────────────────────────────────────────────────────────
  form!: FormGroup;

  ngOnInit(): void {
    this._buildForm();
    this._populate();
  }

  private _buildForm(): void {
    this.form = this._fb.group({
      identity: this._fb.group({
        clubName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
        // logoBase64 armazena a string data:image/...;base64,... completa
        logoBase64: [''],
      }),
      contact: this._fb.group({
        meetingSchedule: ['', Validators.maxLength(60)],
        churchName:      ['', Validators.maxLength(100)],
        addressLine1:    ['', Validators.maxLength(120)],
        addressLine2:    ['', Validators.maxLength(80)],
        phone:           ['', Validators.maxLength(20)],
        email:           ['', [Validators.email, Validators.maxLength(100)]],
      }),
      social: this._fb.group({
        instagram: ['', Validators.maxLength(200)],
        facebook:  ['', Validators.maxLength(200)],
        youtube:   ['', Validators.maxLength(200)],
        whatsapp:  ['', Validators.maxLength(200)],
        twitter:   ['', Validators.maxLength(200)],
        tiktok:    ['', Validators.maxLength(200)],
      }),
      support: this._fb.group({
        supportEmail: ['', [Validators.email, Validators.maxLength(100)]],
        supportPhone: ['', Validators.maxLength(20)],
        docsUrl:      ['', Validators.maxLength(200)],
      }),
    });
  }

  private _populate(): void {
    const c = this._customization.customization$();
    this.form.patchValue({
      // logoUrl no modelo pode ser uma URL externa OU uma string base64
      identity: { clubName: c.clubName, logoBase64: c.logoUrl },
      contact:  { ...c.contact },
      social:   { ...c.social },
      support:  { ...c.support },
    });
    // Exibe o valor atual (base64 ou URL) no preview
    this.logoPreview$.set(c.logoUrl);
  }

  // ── Ações ─────────────────────────────────────────────────────────────────

  setTab(id: typeof this.tabs[number]['id']): void {
    this.activeTab$.set(id);
  }

  /**
   * Converte o arquivo selecionado para base64 (sem nenhuma chamada de rede).
   * O resultado é armazenado diretamente no campo `logoBase64` do formulário
   * e será salvo no Firestore junto com os demais dados ao submeter.
   */
  onLogoFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Valida tipo MIME
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.saveError$.set('Formato inválido. Use PNG, JPG, SVG ou WebP.');
      return;
    }

    // Valida tamanho (512 KB)
    if (file.size > MAX_LOGO_BYTES) {
      this.saveError$.set(
        `A imagem deve ter no máximo ${MAX_LOGO_BYTES / 1024} KB. ` +
        `Arquivo selecionado: ${Math.round(file.size / 1024)} KB.`
      );
      return;
    }

    // Limpa erro anterior
    this.saveError$.set(null);
    this.isConverting$.set(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      const base64 = e.target?.result as string;

      // Atualiza preview imediatamente
      this.logoPreview$.set(base64);

      // Grava no campo do formulário — será salvo no submit
      this.form.get('identity.logoBase64')?.setValue(base64);
      this.form.get('identity.logoBase64')?.markAsDirty();

      this.isConverting$.set(false);
    };

    reader.onerror = () => {
      this.saveError$.set('Não foi possível ler o arquivo. Tente novamente.');
      this.isConverting$.set(false);
    };

    reader.readAsDataURL(file);
  }

  /** Remove a logo atual (limpa base64 e preview) */
  onRemoveLogo(): void {
    this.logoPreview$.set('');
    this.form.get('identity.logoBase64')?.setValue('');
    this.form.get('identity.logoBase64')?.markAsDirty();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving$.set(true);
    this.saveSuccess$.set(false);
    this.saveError$.set(null);

    try {
      const v = this.form.value;

      const payload: ClubCustomization = {
        clubName: v.identity.clubName,
        // logoUrl recebe a string base64 (data:image/...;base64,...)
        // ou string vazia se a logo foi removida
        logoUrl:  v.identity.logoBase64 ?? '',
        contact:  this._clean(v.contact),
        social:   this._clean(v.social),
        support:  this._clean(v.support),
      };

      await this._customization.saveToFirestore(payload);

      this.saveSuccess$.set(true);
      setTimeout(() => this.saveSuccess$.set(false), 4000);

    } catch (err: any) {
      this.saveError$.set(err?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      this.isSaving$.set(false);
    }
  }

  // ── Helpers para o template ───────────────────────────────────────────────

  ctrl(path: string) {
    return this.form.get(path);
  }

  isInvalid(path: string): boolean {
    const c = this.ctrl(path);
    return !!(c?.invalid && c?.touched);
  }

  /** Tamanho estimado da logo em cache (base64) para exibir ao usuário */
  get logoSizeKb(): number {
    const b64 = this.form.get('identity.logoBase64')?.value as string ?? '';
    if (!b64) return 0;
    // base64 tem ~33% de overhead — estima o tamanho real em KB
    return Math.round((b64.length * 3) / 4 / 1024);
  }

  get maxLogoKb(): number {
    return MAX_LOGO_BYTES / 1024;
  }

  // ── Utilitários privados ──────────────────────────────────────────────────

  /** Remove entradas vazias/nulas antes de enviar ao Firestore */
  private _clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== '' && v != null)
    ) as Partial<T>;
  }
}
