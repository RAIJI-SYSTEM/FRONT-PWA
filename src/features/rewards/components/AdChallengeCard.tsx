'use client';

import { Gamepad2, PlayCircle, Sparkles } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AD_POINTS, type AdChallenge, type RewardedAdKind } from '@/types/rewards';
import { formatCurrency } from '@/utils/formatCurrency';

interface AdChallengeCardProps {
  challenge: AdChallenge;
  /** Qual anúncio está abrindo/carregando agora */
  loading: RewardedAdKind | null;
  onWatch: (kind: RewardedAdKind) => void;
}

/** Missão: 3 anúncios curtos (+1 cada) OU 1 anúncio premiado completo (+3) liberam o cupom */
export default function AdChallengeCard({ challenge, loading, onWatch }: AdChallengeCardProps) {
  const remaining = challenge.goal - challenge.progress;
  const busy = loading !== null;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
      <Box
        aria-hidden
        sx={{ position: 'absolute', right: -18, top: -18, color: 'primary.main', opacity: 0.12, '& svg': { width: 120, height: 120 } }}
      >
        <Sparkles />
      </Box>

      <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1 }}>
        Missão
      </Typography>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
        {challenge.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Assista a 3 anúncios curtos <b>ou</b> a 1 anúncio premiado completo (que pode ser interativo).
      </Typography>

      {/* Progresso em etapas: uma barra por ponto */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ mt: 2 }}
        role="progressbar"
        aria-label="Progresso da missão"
        aria-valuemin={0}
        aria-valuemax={challenge.goal}
        aria-valuenow={challenge.progress}
        aria-valuetext={`${challenge.progress} de ${challenge.goal}`}
      >
        {Array.from({ length: challenge.goal }, (_, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              height: 10,
              borderRadius: 999,
              bgcolor: index < challenge.progress ? 'primary.main' : 'divider',
              transition: 'background-color 300ms',
            }}
          />
        ))}
      </Stack>
      <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
        {challenge.progress} de {challenge.goal} · falta{remaining === 1 ? '' : 'm'} {remaining} para ganhar{' '}
        {formatCurrency(challenge.rewardCents)}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2.5 }}>
        <Button
          fullWidth
          variant="outlined"
          disabled={busy}
          onClick={() => onWatch('short')}
          startIcon={loading === 'short' ? <CircularProgress size={18} /> : <PlayCircle size={20} />}
          sx={{ height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
        >
          Anúncio curto (+{AD_POINTS.short})
        </Button>
        <Button
          fullWidth
          variant="contained"
          disabled={busy}
          onClick={() => onWatch('long')}
          startIcon={loading === 'long' ? <CircularProgress size={18} color="inherit" /> : <Gamepad2 size={20} />}
          sx={{ height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600, boxShadow: 3 }}
        >
          Anúncio completo (+{AD_POINTS.long})
        </Button>
      </Stack>
    </Paper>
  );
}
