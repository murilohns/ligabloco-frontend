const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Formats a number as Brazilian Real. Example: 1250 → "R$ 1.250,00"
 */
export function formatBRL(value: number): string {
  return BRL.format(value);
}
