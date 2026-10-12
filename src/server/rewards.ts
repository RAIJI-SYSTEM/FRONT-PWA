/**
 * SIMULAÇÃO das recompensas (um único usuário, em memória).
 * Em produção: banco de dados por usuário, e pontos creditados SÓ pelo callback de
 * verificação do AdMob (SSV, ver server/admobSsv.ts) — nunca por uma chamada do app.
 */
import { AD_POINTS, type AdChallenge, type Coupon, type RewardedAdKind, type RewardsState } from '@/types/rewards';

const FIRST_COUPON_CENTS = 1500;
const COUPON_VALIDITY_DAYS = 30;

interface StoredRewards {
  coupons: Coupon[];
  challenge: AdChallenge;
  /** IDs de transação já creditados: o mesmo anúncio nunca vale duas vezes */
  creditedTransactions: Set<string>;
}

function seed(): StoredRewards {
  return {
    coupons: [
      {
        id: 'boas-vindas-encomenda',
        code: 'ENVIA5',
        title: 'R$ 5 na primeira encomenda',
        description: 'Válido para envios de qualquer tamanho.',
        discountCents: 500,
        status: 'available',
        expiresAt: new Date(Date.now() + 12 * 86_400_000).toISOString(),
      },
      {
        id: 'carnaval',
        code: 'FOLIA10',
        title: 'R$ 10 em corridas',
        description: 'Campanha de carnaval.',
        discountCents: 1000,
        status: 'expired',
        expiresAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
      },
    ],
    challenge: {
      id: 'primeiro-cupom',
      title: 'Ganhe R$ 15 no seu primeiro cupom',
      rewardCents: FIRST_COUPON_CENTS,
      goal: 3,
      progress: 0,
      completed: false,
    },
    creditedTransactions: new Set(),
  };
}

const globalStore = globalThis as unknown as { rewards?: StoredRewards };
const store = (globalStore.rewards ??= seed());

const toPublic = (): RewardsState => ({ coupons: store.coupons, challenge: store.challenge });

export function getRewards(): RewardsState {
  // Atualiza cupons vencidos na leitura
  for (const coupon of store.coupons) {
    if (coupon.status === 'available' && Date.parse(coupon.expiresAt) < Date.now()) coupon.status = 'expired';
  }
  return toPublic();
}

/**
 * Credita um anúncio assistido. Idempotente pelo `transactionId`
 * (o AdMob manda o mesmo ID se repetir o callback).
 */
export function creditAdWatched(kind: RewardedAdKind, transactionId: string): RewardsState {
  const { challenge } = store;
  if (challenge.completed || store.creditedTransactions.has(transactionId)) return getRewards();

  store.creditedTransactions.add(transactionId);
  challenge.progress = Math.min(challenge.goal, challenge.progress + AD_POINTS[kind]);

  if (challenge.progress >= challenge.goal) {
    challenge.completed = true;
    store.coupons.unshift({
      id: `anuncios-${transactionId}`,
      code: `BEMVINDO${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'R$ 15 de desconto',
      description: 'Seu primeiro cupom! Vale para corridas ou encomendas.',
      discountCents: FIRST_COUPON_CENTS,
      status: 'available',
      expiresAt: new Date(Date.now() + COUPON_VALIDITY_DAYS * 86_400_000).toISOString(),
    });
  }
  return getRewards();
}
