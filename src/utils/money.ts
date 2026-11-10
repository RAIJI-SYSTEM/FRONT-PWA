/** "12,50" → 1250 centavos; vazio → undefined; inválido → NaN */
export function parseMoney(value: string) {
  if (!value.trim()) return undefined;
  const number = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) : NaN;
}

/** Mantém só o que faz sentido num valor em reais enquanto a pessoa digita */
export const sanitizeMoneyInput = (value: string) => value.replace(/[^\d.,]/g, '');
