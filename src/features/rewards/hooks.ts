'use client';

import { useState } from 'react';
import { creditMockAd } from '@/services/rewards';
import type { RewardedAdKind } from '@/types/rewards';
import { isNativeApp, showNativeRewardedAd } from './ads/admob';

// TODO: usar o ID do usuário logado (vai no callback SSV para creditar a conta certa)
const CURRENT_USER_ID = 'usuario-demo';

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
      // Os pontos chegam pelo callback SSV no servidor; a tela recarrega o progresso depois
      const { rewarded } = await showNativeRewardedAd(kind, CURRENT_USER_ID);
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
