/**
 * ============================================================
 *  ClubLink – Shared Models
 *  shared/models/app-config.model.ts
 *
 *  Firestore:
 *    /app_config
 *      /status         ← status da aplicação (existente)
 *      /customization  ← personalizações do clube (logo, nome, contato…)
 *
 *  Tema visual é uma preferência POR USUÁRIO — localStorage apenas.
 *
 *  TEMAS DISPONÍVEIS:
 *    'nightsky' → azul-meia-noite + dourado (tema original Garras de Águia)
 *    'light'    → branco + cinza + azul     (tema claro)
 *    'dark'     → preto + cinza + branco    (tema escuro puro)
 * ============================================================
 */

// ── Tema visual (preferência do usuário) ─────────────────────────────────

export type AppThemeMode = 'nightsky' | 'light' | 'dark';

export interface ThemeDefinition {
  id:          AppThemeMode;
  label:       string;
  description: string;
  /** Ícone exibido no seletor */
  icon:        string;
  /** Cor de preview (swatch no seletor) */
  previewBg:   string;
  previewFg:   string;
}

/** Catálogo de temas disponíveis */
export const THEME_CATALOG: Readonly<ThemeDefinition[]> = [
  {
    id:          'nightsky',
    label:       'Night Sky',
    description: 'Azul-meia-noite, dourado e branco quente. Tema padrão.',
    icon:        '🌌',
    previewBg:   '#0B0F1A',
    previewFg:   '#D4A017',
  },
  {
    id:          'light',
    label:       'Light',
    description: 'Branco, cinza e azul. Ideal para uso diurno.',
    icon:        '☀️',
    previewBg:   '#FFFFFF',
    previewFg:   '#1A3A8F',
  },
  {
    id:          'dark',
    label:       'Dark',
    description: 'Preto, cinza e branco. Alto contraste para ambientes escuros.',
    icon:        '🌑',
    previewBg:   '#0A0A0A',
    previewFg:   '#E0E0E0',
  },
] as const;

export interface UserThemePreference {
  mode:    AppThemeMode;
  savedAt: string;
}

export const DEFAULT_THEME_MODE: AppThemeMode = 'nightsky';

// ── Redes sociais ─────────────────────────────────────────────────────────

export interface SocialLinks {
  instagram?: string;
  facebook?:  string;
  youtube?:   string;
  whatsapp?:  string;
  twitter?:   string;
  tiktok?:    string;
}

export const DEFAULT_SOCIAL_LINKS: Readonly<SocialLinks> = {};

// ── Contato & endereço ────────────────────────────────────────────────────

export interface ContactInfo {
  meetingSchedule?: string;
  churchName?:      string;
  addressLine1?:    string;
  addressLine2?:    string;
  phone?:           string;
  email?:           string;
}

export const DEFAULT_CONTACT_INFO: Readonly<ContactInfo> = {};

// ── Suporte técnico ───────────────────────────────────────────────────────

export interface SupportInfo {
  supportEmail?: string;
  docsUrl?:      string;
  supportPhone?: string;
}

export const DEFAULT_SUPPORT_INFO: Readonly<SupportInfo> = {
  supportEmail: 'suporte@clublink.app',
  docsUrl:      'https://docs.clublink.app',
};

// ── Customização do clube (vai ao Firestore) ──────────────────────────────

export interface ClubCustomization {
  clubName?:  string;
  logoUrl?:   string;
  social?:    SocialLinks;
  contact?:   ContactInfo;
  support?:   SupportInfo;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ResolvedClubCustomization {
  clubName:  string;
  logoUrl:   string;
  social:    SocialLinks;
  contact:   ContactInfo;
  support:   SupportInfo;
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_CLUB_CUSTOMIZATION: Readonly<ResolvedClubCustomization> = {
  clubName:  'Meu Clube de Desbravadores',
  logoUrl:   '',
  social:    { ...DEFAULT_SOCIAL_LINKS },
  contact:   { ...DEFAULT_CONTACT_INFO },
  support:   { ...DEFAULT_SUPPORT_INFO },
  updatedAt: new Date(0).toISOString(),
  updatedBy: '',
};
