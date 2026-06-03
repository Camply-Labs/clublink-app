// ============================================================
//  MODELO DE PONTUAÇÕES PADRÃO
// ============================================================

export interface ScoringItem {
  id:          string;
  name:        string;
  description: string;
  /** Positivo = dá pontos; Negativo = tira pontos */
  points:      number;
  /** Categoria visual */
  category:    string;
  createdAt?:  string;
  createdBy?:  string;
}

export interface ScoringItemPayload {
  name:        string;
  description: string;
  points:      number;
  category:    string;
}
