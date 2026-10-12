'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, Package, Truck, X } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { RewardedAdKind } from '@/types/rewards';

/** Duração simulada: o curto imita um intersticial premiado; o longo, um premiado completo */
const DURATION_SECONDS: Record<RewardedAdKind, number> = { short: 5, long: 15 };
const BOXES = 3;

interface MockAdDialogProps {
  kind: RewardedAdKind;
  /** watched = assistiu até ganhar a recompensa */
  onFinish: (watched: boolean) => void;
}

/**
 * Anúncio SIMULADO para testar no navegador (o AdMob só existe no app nativo).
 * O "longo" tem um minijogo para representar os anúncios jogáveis.
 */
export default function MockAdDialog({ kind, onFinish }: MockAdDialogProps) {
  const duration = DURATION_SECONDS[kind];
  const [elapsed, setElapsed] = useState(0);
  const [delivered, setDelivered] = useState<number[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => Math.min(duration, s + 1)), 1000);
    return () => clearInterval(timer);
  }, [duration]);

  const gameDone = kind === 'short' || delivered.length === BOXES;
  const done = elapsed >= duration && gameDone;
  const remaining = duration - elapsed;

  return (
    <Dialog open fullScreen onClose={() => onFinish(done)} aria-labelledby="mock-ad-title">
      <Stack sx={{ height: '100%', bgcolor: '#111827', color: '#fff' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: 1.5 }}>
          <Chip label="Anúncio de teste" size="small" sx={{ bgcolor: 'rgba(255 255 255 / 0.15)', color: '#fff', fontWeight: 600 }} />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" aria-live="polite">
              {done ? 'Recompensa garantida' : remaining > 0 ? `Recompensa em ${remaining}s` : 'Termine o jogo'}
            </Typography>
            <IconButton
              onClick={() => onFinish(done)}
              aria-label={done ? 'Fechar anúncio' : 'Fechar sem ganhar a recompensa'}
              sx={{ color: '#fff' }}
            >
              <X size={22} />
            </IconButton>
          </Stack>
        </Stack>
        <LinearProgress variant="determinate" value={(elapsed / duration) * 100} sx={{ mx: 1.5, borderRadius: 999 }} />

        <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 3, gap: 3 }}>
          {kind === 'short' ? (
            <>
              <Truck size={96} strokeWidth={1.25} />
              <Typography id="mock-ad-title" variant="h5" sx={{ fontWeight: 800 }}>
                Sua marca aqui
              </Typography>
              <Typography sx={{ opacity: 0.8, maxWidth: 320 }}>
                Este espaço mostrará um anúncio real do AdMob no app para celular.
              </Typography>
            </>
          ) : (
            <>
              <Typography id="mock-ad-title" variant="h5" sx={{ fontWeight: 800 }}>
                Entregue os pacotes!
              </Typography>
              <Typography sx={{ opacity: 0.8 }}>Toque nas {BOXES} caixas para carregá-las no caminhão.</Typography>
              <Stack direction="row" spacing={2}>
                {Array.from({ length: BOXES }, (_, index) => {
                  const ok = delivered.includes(index);
                  return (
                    <ButtonBase
                      key={index}
                      disabled={ok}
                      onClick={() => setDelivered((d) => [...d, index])}
                      aria-label={ok ? `Caixa ${index + 1} entregue` : `Entregar caixa ${index + 1}`}
                      sx={{
                        width: 76,
                        height: 76,
                        borderRadius: 3,
                        bgcolor: ok ? 'success.main' : 'primary.main',
                        color: '#fff',
                        transition: 'transform 150ms, background-color 150ms',
                        '&:active': { transform: 'scale(0.92)' },
                      }}
                    >
                      {ok ? <CircleCheck size={34} /> : <Package size={34} />}
                    </ButtonBase>
                  );
                })}
              </Stack>
              <Truck size={72} strokeWidth={1.25} style={{ opacity: gameDone ? 1 : 0.4 }} />
            </>
          )}
        </Stack>

        <Box sx={{ p: 2, pb: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <Button
            fullWidth
            variant="contained"
            disabled={!done}
            onClick={() => onFinish(true)}
            sx={{ height: 52, borderRadius: 999, fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
          >
            {done ? 'Fechar e receber recompensa' : 'Aguarde para receber a recompensa'}
          </Button>
        </Box>
      </Stack>
    </Dialog>
  );
}
