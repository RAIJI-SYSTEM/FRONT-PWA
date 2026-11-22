import type { RewardedAdKind, RewardsState } from '@/types/rewards';
import { backend } from './backend/client';

/** Cupons e missão de anúncios da pessoa logada (backend: tabela coupons) */
export const getRewards = () => backend<RewardsState>('/api/rewards');

/**
 * "Assisti ao anúncio" vindo do app. Só vale com o modo de testes ligado no servidor
 * (RAIJI_REWARDS_MOCK_ADS); em produção quem credita é o callback assinado do AdMob (SSV).
 */
export const creditMockAd = (kind: RewardedAdKind, transactionId: string) =>
  backend<RewardsState>('/api/rewards/ad-watched', { method: 'POST', body: { kind, transactionId } });
