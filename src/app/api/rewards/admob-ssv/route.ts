import { verifyAdMobCallback } from '@/server/admobSsv';
import { creditAdWatched } from '@/server/rewards';

/**
 * Callback de verificação do AdMob (configure esta URL em cada bloco de anúncio premiado:
 * AdMob → Bloco de anúncios → Configurações avançadas → Verificação do lado do servidor).
 * O app envia em `custom_data` o tipo do anúncio ("short" ou "long").
 */
export async function GET(request: Request) {
  // A assinatura cobre a query exatamente como chegou, então usamos o texto cru
  const rawQuery = request.url.split('?')[1] ?? '';
  const callback = await verifyAdMobCallback(rawQuery).catch(() => null);
  if (!callback) return new Response('Assinatura inválida', { status: 403 });

  // O botão "Verificar URL" do painel do AdMob envia um callback sem usuário: só confirmamos que recebemos
  if (!callback.userId || !callback.transactionId) return new Response('OK');

  const kind = callback.customData === 'long' ? 'long' : 'short';
  // TODO: com usuários reais, creditar na conta de `callback.userId`
  creditAdWatched(kind, callback.transactionId);
  return new Response('OK');
}
