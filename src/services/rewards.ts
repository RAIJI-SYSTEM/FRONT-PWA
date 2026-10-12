import type { RewardedAdKind, RewardsState } from '@/types/rewards';
import { apiFetch } from './api';

export const getRewards = () => apiFetch<RewardsState>('/api/rewards');

/** Só para o modo de teste no navegador (no celular, quem credita é o callback SSV do AdMob) */
export const creditMockAd = (kind: RewardedAdKind, transactionId: string) =>
  apiFetch<RewardsState>('/api/rewards/ad-watched', { method: 'POST', body: JSON.stringify({ kind, transactionId }) });
