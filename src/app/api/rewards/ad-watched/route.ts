import { creditAdWatched } from '@/server/rewards';
import type { RewardedAdKind } from '@/types/rewards';

/** Só existe para testar no navegador, onde não há AdMob. Em produção quem credita é o SSV. */
const mockEnabled = process.env.NODE_ENV !== 'production' || process.env.ADS_MOCK === 'true';

export async function POST(request: Request) {
  if (!mockEnabled) return Response.json({ error: 'Indisponível.' }, { status: 404 });

  const { kind, transactionId } = (await request.json().catch(() => ({}))) as { kind?: RewardedAdKind; transactionId?: string };
  if ((kind !== 'short' && kind !== 'long') || !transactionId) {
    return Response.json({ error: 'Dados do anúncio inválidos.' }, { status: 400 });
  }
  return Response.json(creditAdWatched(kind, transactionId));
}
