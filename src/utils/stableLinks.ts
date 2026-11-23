/**
 * O chat assina um link NOVO para o mesmo arquivo a cada consulta (a conversa é consultada a
 * cada 2,5 s). Trocar o src no meio faz o áudio parar e a foto ser baixada de novo. Aqui o app
 * guarda o primeiro link de cada anexo e só troca quando ele está para vencer.
 */
interface StableLink {
  url: string;
  /** Até quando reaproveitar (relógio deste aparelho, contado de quando o link chegou) */
  reuseUntil: number;
}

/** Troca um pouco antes de vencer, com folga para o download terminar */
const SAFETY_MS = 60_000;
/** Link sem validade na URL: reaproveita por pouco tempo */
const FALLBACK_SECONDS = 300;
const MAX_LINKS = 500;

const links = new Map<string, StableLink>();

function lifetimeSeconds(url: string) {
  try {
    const seconds = Number(new URL(url).searchParams.get('X-Amz-Expires'));
    return seconds > 0 ? seconds : FALLBACK_SECONDS;
  } catch {
    return FALLBACK_SECONDS;
  }
}

/** Chame só com link que o servidor acabou de entregar (é ele quem decide se a pessoa pode ver) */
export function stableLink(id: string, freshUrl: string, now = Date.now()): string {
  const known = links.get(id);
  if (known && now < known.reuseUntil) return known.url;

  links.delete(id); // volta para o fim da fila: os mais antigos saem primeiro
  links.set(id, { url: freshUrl, reuseUntil: now + lifetimeSeconds(freshUrl) * 1000 - SAFETY_MS });
  if (links.size > MAX_LINKS) links.delete(links.keys().next().value!);
  return freshUrl;
}
