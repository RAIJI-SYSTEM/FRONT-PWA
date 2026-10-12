/**
 * Anúncios premiados via AdMob (plugin @capacitor-community/admob).
 * Só funciona dentro do app nativo (Android/iOS gerado pelo Capacitor).
 * No navegador o app usa o anúncio simulado (MockAdDialog).
 */
import { Capacitor } from '@capacitor/core';
import type { RewardedAdKind } from '@/types/rewards';

/** Rodando dentro do app Android/iOS? */
export const isNativeApp = () => Capacitor.isNativePlatform();

const TESTING = process.env.NEXT_PUBLIC_ADMOB_TESTING !== 'false';

/**
 * IDs de teste oficiais do Google: sempre mostram anúncios de exemplo e não geram receita
 * (usar IDs reais durante o desenvolvimento pode suspender a conta do AdMob).
 */
const TEST_AD_UNITS: Record<RewardedAdKind, { android: string; ios: string }> = {
  short: { android: 'ca-app-pub-3940256099942544/5354046379', ios: 'ca-app-pub-3940256099942544/6978759866' },
  long: { android: 'ca-app-pub-3940256099942544/5224354917', ios: 'ca-app-pub-3940256099942544/1712485313' },
};

const AD_UNITS: Record<RewardedAdKind, { android?: string; ios?: string }> = {
  short: { android: process.env.NEXT_PUBLIC_ADMOB_SHORT_ANDROID, ios: process.env.NEXT_PUBLIC_ADMOB_SHORT_IOS },
  long: { android: process.env.NEXT_PUBLIC_ADMOB_LONG_ANDROID, ios: process.env.NEXT_PUBLIC_ADMOB_LONG_IOS },
};

function adUnitFor(kind: RewardedAdKind) {
  const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  const id = TESTING ? TEST_AD_UNITS[kind][platform] : AD_UNITS[kind][platform];
  if (!id) throw new Error(`ID do bloco de anúncio "${kind}" não configurado para ${platform}.`);
  return id;
}

let initialization: Promise<void> | null = null;

/**
 * Mostra um anúncio premiado e resolve quando ele é fechado.
 * `rewarded` diz se o usuário assistiu até ganhar a recompensa. Os pontos em si são
 * creditados pelo servidor quando o Google chama o callback SSV (/api/rewards/admob-ssv).
 */
export async function showNativeRewardedAd(kind: RewardedAdKind, userId: string): Promise<{ rewarded: boolean }> {
  // Import dinâmico: o plugin nativo não é carregado no navegador
  const { AdMob, RewardAdPluginEvents, RewardInterstitialAdPluginEvents } = await import('@capacitor-community/admob');

  initialization ??= AdMob.initialize({ initializeForTesting: TESTING });
  await initialization;

  const options = {
    adId: adUnitFor(kind),
    isTesting: TESTING,
    // Vai no callback SSV: quem ganhou e qual tipo de anúncio (o peso do ponto)
    ssv: { userId, customData: kind },
  };

  // Os eventos dizem se o usuário ganhou a recompensa e quando fechou o anúncio (ele pode fechar antes do fim)
  let rewarded = false;
  let onClosed!: () => void;
  const closed = new Promise<void>((resolve) => (onClosed = resolve));
  const markRewarded = () => {
    rewarded = true;
  };

  const handles =
    kind === 'short'
      ? await Promise.all([
          AdMob.addListener(RewardInterstitialAdPluginEvents.Rewarded, markRewarded),
          AdMob.addListener(RewardInterstitialAdPluginEvents.Dismissed, () => onClosed()),
        ])
      : await Promise.all([
          AdMob.addListener(RewardAdPluginEvents.Rewarded, markRewarded),
          AdMob.addListener(RewardAdPluginEvents.Dismissed, () => onClosed()),
        ]);

  try {
    if (kind === 'short') {
      await AdMob.prepareRewardInterstitialAd(options);
      await AdMob.showRewardInterstitialAd();
    } else {
      await AdMob.prepareRewardVideoAd(options);
      await AdMob.showRewardVideoAd();
    }
    await closed;
    return { rewarded };
  } finally {
    await Promise.all(handles.map((handle) => handle.remove()));
  }
}
