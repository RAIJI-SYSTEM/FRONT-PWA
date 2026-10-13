'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PartyPopper, TicketPercent } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusScreen from '@/components/StatusScreen';
import { usePolling } from '@/hooks/usePolling';
import { getRewards } from '@/services/rewards';
import type { Coupon, RewardedAdKind } from '@/types/rewards';
import { formatCurrency } from '@/utils/formatCurrency';
import { useRewardedAd } from '../hooks';
import AdChallengeCard from './AdChallengeCard';
import CouponCard from './CouponCard';

// Anúncio simulado: só usado no navegador (no app nativo quem exibe é o AdMob), então nunca
// entra no carregamento inicial — é baixado apenas se o usuário tocar em "assistir" na web
const MockAdDialog = dynamic(() => import('./MockAdDialog'));

const loadOnce = () => false;
/** No app nativo o ponto chega pelo callback SSV do Google, que pode levar alguns segundos */
const SSV_RETRIES = 6;
const SSV_RETRY_MS = 1500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Recompensas: missão de anúncios premiados + cupons do usuário */
export default function RewardsScreen() {
  const { data: rewards, error, setData } = usePolling('rewards', getRewards, loadOnce);
  const { show, mockAdProps } = useRewardedAd();
  const [loading, setLoading] = useState<RewardedAdKind | null>(null);
  const [adError, setAdError] = useState<string | null>(null);
  const [wonCoupon, setWonCoupon] = useState<Coupon | null>(null);

  const watch = async (kind: RewardedAdKind) => {
    if (!rewards) return;
    const before = rewards.challenge.progress;
    setAdError(null);
    setLoading(kind);
    try {
      const { rewarded, native } = await show(kind);
      if (!rewarded) {
        setAdError('Você fechou o anúncio antes do fim, então ele não contou. Tente de novo quando quiser.');
        return;
      }
      // Busca o progresso atualizado (no app nativo, espera o callback do Google chegar)
      let updated = await getRewards();
      for (let i = 0; native && updated.challenge.progress === before && i < SSV_RETRIES; i++) {
        await sleep(SSV_RETRY_MS);
        updated = await getRewards();
      }
      setData(updated);
      if (updated.challenge.completed && !rewards.challenge.completed) setWonCoupon(updated.coupons[0]);
    } catch {
      setAdError('Nenhum anúncio disponível agora. Tente novamente em alguns minutos.');
    } finally {
      setLoading(null);
    }
  };

  if (!rewards) {
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const { challenge, coupons } = rewards;
  const available = coupons.filter((c) => c.status === 'available');
  // Disponíveis primeiro; usados e expirados no fim
  const sorted = [...available, ...coupons.filter((c) => c.status !== 'available')];

  return (
    <Stack spacing={3}>
      {!challenge.completed && <AdChallengeCard challenge={challenge} loading={loading} onWatch={watch} />}
      {adError && (
        <Alert severity="info" onClose={() => setAdError(null)}>
          {adError}
        </Alert>
      )}

      <Box component="section" aria-labelledby="coupons-title">
        <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography id="coupons-title" component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            Seus cupons
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {available.length} disponíve{available.length === 1 ? 'l' : 'is'}
          </Typography>
        </Stack>

        {sorted.length === 0 ? (
          <StatusScreen
            icon={TicketPercent}
            title="Nenhum cupom ainda"
            description="Complete a missão acima para ganhar seu primeiro cupom."
          />
        ) : (
          <Stack spacing={1.5}>
            {sorted.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </Stack>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        Os anúncios são exibidos pelo Google AdMob. O ponto só conta quando o anúncio termina.
      </Typography>

      {mockAdProps && <MockAdDialog {...mockAdProps} />}

      {/* Comemoração ao completar a missão */}
      <Dialog open={Boolean(wonCoupon)} onClose={() => setWonCoupon(null)} aria-labelledby="won-title" fullWidth maxWidth="xs">
        {wonCoupon && (
          <Stack spacing={2} sx={{ p: 3, alignItems: 'center', textAlign: 'center' }}>
            <Box
              sx={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                color: 'primary.contrastText',
                background: 'linear-gradient(135deg, var(--mui-palette-primary-light) 0%, var(--mui-palette-primary-main) 100%)',
              }}
            >
              <PartyPopper size={42} />
            </Box>
            <Typography id="won-title" variant="h5" sx={{ fontWeight: 800 }}>
              Você ganhou {formatCurrency(wonCoupon.discountCents)}!
            </Typography>
            <Typography color="text.secondary">
              O cupom <b>{wonCoupon.code}</b> já está na sua lista e vale para corridas ou encomendas.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setWonCoupon(null)}
              sx={{ height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
              autoFocus
            >
              Ver meus cupons
            </Button>
          </Stack>
        )}
      </Dialog>
    </Stack>
  );
}
