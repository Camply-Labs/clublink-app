export class StringHelper {

  static isNullOrEmpty(value: string | null | undefined): boolean {
    return value === null || value === undefined || value.trim() === '';
  }

  static formatPhoneNumber(value: string): string {
    // Remove todos os caracteres não numéricos
    const digits = value.replace(/\D/g, '');
    // Formata o número no padrão (00) 00000-0000
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    // Formata o número no padrão (00) 0000-0000
    else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    // Retorna o valor original se não for um número de telefone válido
    return value;
  }
}
