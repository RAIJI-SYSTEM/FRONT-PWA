'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { routes } from '@/utils/routes';

/** Já há caronas no caminho, mas a pessoa pode preferir receber ofertas no mural */
export default function PublishOnBoard({ publish }: { publish: () => Promise<{ id: string }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async () => {
    setError(null);
    setBusy(true);
    try {
      router.push(routes.board((await publish()).id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível publicar.');
      setBusy(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Typography sx={{ fontWeight: 700 }}>Nenhuma serve?</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Publique no mural: os motoristas da região veem seu pedido e mandam um valor. Você escolhe.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      <Button
        fullWidth
        variant="outlined"
        disabled={busy}
        onClick={handle}
        startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <Megaphone size={18} />}
        sx={{ height: 48, borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
      >
        Publicar no mural
      </Button>
    </Paper>
  );
}
