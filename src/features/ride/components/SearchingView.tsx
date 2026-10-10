'use client';

import { useEffect, useState } from 'react';
import { Car, X } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AdSlot from '@/components/AdSlot';
import RouteSummary from '@/features/activities/components/RouteSummary';
import type { RideSearch } from '@/types/ride';

interface SearchingViewProps {
  search: RideSearch;
  onCancel: () => void;
  canceling?: boolean;
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "Aguardar resposta": animação de busca + espaço de anúncio enquanto nenhum motorista aceita */
export default function SearchingView({ search, onCancel, canceling }: SearchingViewProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.parse(search.createdAt);
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [search.createdAt]);

  return (
    <Stack spacing={3} sx={{ alignItems: 'center', pb: 2 }}>
      {/* Radar: círculos pulsando em volta do carro */}
      <Box
        role="status"
        aria-label="Procurando motoristas"
        sx={{
          position: 'relative',
          width: 200,
          height: 200,
          display: 'grid',
          placeItems: 'center',
          mt: 2,
          '@keyframes radar': {
            from: { transform: 'scale(0.35)', opacity: 0.7 },
            to: { transform: 'scale(1)', opacity: 0 },
          },
          '& .pulse': {
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            animation: 'radar 2.4s ease-out infinite',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.12 },
          },
        }}
      >
        <span className="pulse" />
        <span className="pulse" style={{ animationDelay: '0.8s' }} />
        <span className="pulse" style={{ animationDelay: '1.6s' }} />
        <Box
          sx={{
            position: 'relative',
            width: 84,
            height: 84,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: 'primary.contrastText',
            background:
              'linear-gradient(135deg, var(--mui-palette-primary-light) 0%, var(--mui-palette-primary-main) 100%)',
            boxShadow: 4,
          }}
        >
          <Car size={38} />
        </Box>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
          Procurando motoristas
        </Typography>
        <Typography color="text.secondary">
          Avisamos assim que alguém aceitar · {formatElapsed(elapsed)}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ width: '100%', p: 2.5, borderRadius: 3 }}>
        <RouteSummary origin={search.origin.name} destination={search.destination.name} />
      </Paper>

      <AdSlot adSlotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_WAITING} />

      <Button
        variant="outlined"
        color="inherit"
        onClick={onCancel}
        disabled={canceling}
        startIcon={<X size={18} />}
        sx={{ borderRadius: 999, height: 48, px: 3, borderColor: 'divider', textTransform: 'none', fontWeight: 600 }}
      >
        Cancelar busca
      </Button>
    </Stack>
  );
}
