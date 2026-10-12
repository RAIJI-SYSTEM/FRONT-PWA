/**
 * Tipos de anúncio premiado (AdMob):
 * - short: "intersticial premiado", curto → vale 1 ponto
 * - long: "premiado" completo, mais longo e onde aparecem os interativos/jogáveis → vale 3 pontos
 * O AdMob não informa se o anúncio exibido foi jogável, por isso o peso vem do formato escolhido.
 */
export type RewardedAdKind = 'short' | 'long';

export const AD_POINTS: Record<RewardedAdKind, number> = { short: 1, long: 3 };

export type CouponStatus = 'available' | 'used' | 'expired';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountCents: number;
  status: CouponStatus;
  expiresAt: string; // ISO 8601
}

/** Missão "assista anúncios e ganhe o primeiro cupom" */
export interface AdChallenge {
  id: string;
  title: string;
  rewardCents: number;
  goal: number;
  progress: number;
  completed: boolean;
}

export interface RewardsState {
  coupons: Coupon[];
  challenge: AdChallenge;
}
