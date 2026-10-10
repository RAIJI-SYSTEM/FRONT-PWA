export function formatCurrency(cents: number, locale = 'pt-BR', currency = 'BRL') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}
