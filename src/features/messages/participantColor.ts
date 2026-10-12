/** Cores que funcionam no tema claro e no escuro, para diferenciar quem fala no grupo */
const COLORS = ['#EF6C00', '#0288D1', '#7B1FA2', '#2E7D32', '#C2185B', '#00838F', '#6D4C41'];

/** Sempre a mesma cor para o mesmo participante */
export function participantColor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

/**
 * Estilo do nome de quem fala: a cor do participante, clareada no modo escuro
 * para manter contraste legível sobre o fundo dos balões.
 */
export function participantNameSx(id: string) {
  const color = participantColor(id);
  return {
    color,
    '@media (prefers-color-scheme: dark)': { color: `color-mix(in srgb, ${color} 55%, white)` },
  };
}
