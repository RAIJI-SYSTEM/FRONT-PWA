'use client';

import { useState } from 'react';
import { Copy, Hash, Share2 } from 'lucide-react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@/hooks/useQuery';
import { getMyDriverCode } from '@/services/drivers';
import { formatDriverCode } from '@/types/drivers';

/** Código do motorista: o passageiro digita em Buscar → Por código para achar as viagens e conversar */
export default function DriverCodeCard() {
  const { data, error } = useQuery('my-driver-code', getMyDriverCode);
  const [copied, setCopied] = useState(false);
  const code = data ? formatDriverCode(data.code) : null;
  const message = code ? `Me encontre no Raiji pelo código ${code} (Buscar → Por código).` : '';

  const share = async () => {
    if (!code) return;
    if (navigator.share) {
      await navigator.share({ text: message }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(message);
    setCopied(true);
  };

  if (error) return null;
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>
          <Hash size={22} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Seu código de motorista
          </Typography>
          {code ? (
            <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: 2, fontFamily: 'monospace' }}>{code}</Typography>
          ) : (
            <Skeleton width={140} height={34} />
          )}
          <Typography variant="caption" color={copied ? 'success.main' : 'text.secondary'}>
            {copied ? 'Copiado!' : 'Passageiros acham suas viagens e falam com você por ele.'}
          </Typography>
        </Box>
        <IconButton
          aria-label="Copiar código"
          disabled={!code}
          onClick={() => code && navigator.clipboard?.writeText(code.replace('-', '')).then(() => setCopied(true))}
        >
          <Copy size={18} />
        </IconButton>
        <IconButton aria-label="Compartilhar código" disabled={!code} onClick={share}>
          <Share2 size={18} />
        </IconButton>
      </Stack>
    </Paper>
  );
}
