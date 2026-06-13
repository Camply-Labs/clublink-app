// ============================================================
//  MODELO DE AVISOS (Quadro de Avisos)
// ============================================================

export interface Notice {
  id:          string;
  title:       string;
  /** Conteúdo em Markdown */
  content:     string;
  /** URL ou base64 da imagem de capa (opcional) */
  coverImage?: string;
  authorUid:   string;
  authorName:  string;
  /** Cor de destaque do card (hex) */
  color:       string;
  pinned:      boolean;
  /** Contador desnormalizado de respostas — atualizado via transação */
  replyCount:  number;
  createdAt:   string;   // ISO string
  updatedAt?:  string;
}

export interface NoticePayload {
  title:       string;
  content:     string;
  coverImage?: string;
  color:       string;
  pinned:      boolean;
}

export const NOTICE_COLORS = [
  { label: 'Dourado',  value: '#c9a84c' },
  { label: 'Azul',     value: '#4299e1' },
  { label: 'Verde',    value: '#48bb78' },
  { label: 'Vermelho', value: '#fc5252' },
  { label: 'Roxo',     value: '#9f7aea' },
  { label: 'Laranja',  value: '#ed8936' },
];

// ── Respostas (tópico de discussão linear) ──────────────────

export interface NoticeReply {
  id:         string;
  noticeId:   string;
  authorUid:  string;
  authorName: string;
  authorPhoto?: string;
  /** Texto simples — sem Markdown nem imagens */
  text:       string;
  /** Lista de UIDs que curtiram */
  likedBy:    string[];
  /** Apenas o autor do AVISO pode fixar uma resposta */
  pinned:     boolean;
  createdAt:  string;
}

export interface NoticeReplyPayload {
  text: string;
}
