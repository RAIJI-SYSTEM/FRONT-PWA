'use client';

import { useState } from 'react';
import { getSession } from '@/services/auth';
import { creditMockAd } from '@/services/rewards';
import type { RewardedAdKind } from '@/types/rewards';
import { isNativeApp, showNativeRewardedAd } from './ads/admob';


interface MockAdState {
  kind: RewardedAdKind;
  resolve: (watched: boolean) => void;
}

/**
 * Mostra um anúncio premiado: AdMob de verdade no app nativo; anúncio simulado no navegador.
 * Resolve com `rewarded` = o usuário assistiu até ganhar.
 */
export function useRewardedAd() {
  const [mockAd, setMockAd] = useState<MockAdState | null>(null);

  const show = async (kind: RewardedAdKind): Promise<{ rewarded: boolean; native: boolean }> => {
    if (isNativeApp()) {
      // Em produção os pontos chegam pelo callback SSV do Google (user_id = a pessoa logada).
      // No modo de testes do servidor, o app também avisa (o Google não alcança o PC na rede local).
      const { rewarded } = await showNativeRewardedAd(kind, getSession()?.user.id ?? '');
      if (rewarded) await creditMockAd(kind, crypto.randomUUID()).catch(() => null);
      return { rewarded, native: true };
    }

    const watched = await new Promise<boolean>((resolve) => setMockAd({ kind, resolve }));
    setMockAd(null);
    if (watched) await creditMockAd(kind, crypto.randomUUID());
    return { rewarded: watched, native: false };
  };

  return {
    show,
    /** Props do anúncio simulado (renderize <MockAdDialog {...mockAdProps} /> quando existir) */
    mockAdProps: mockAd ? { kind: mockAd.kind, onFinish: mockAd.resolve } : null,
  };
}
