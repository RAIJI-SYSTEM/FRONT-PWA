'use client';

import { useState } from 'react';
import { Check, Copy, KeyRound, Share2 } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface DeliveryKeywordProps {
  keyword: string;
  recipientName?: string;
}

/**
 * Palavra-chave da entrega ("Gerar palavra-chave da entrega" no BPMN).
 * O destinatário informa a palavra ao motorista, que só entrega o pacote se ela estiver correta.
 */
export default function DeliveryKeyword({ keyword, recipientName }: DeliveryKeywordProps) {
  const [copied, setCopied] = useState(false);
  // Seguro calcular aqui: este componente só aparece após uma consulta feita no navegador (nunca no HTML do servidor)
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  const message = `Sua encomenda está a caminho! Informe a palavra-chave "${keyword}" ao motorista para receber.`;

  const copy = async () => {
    await navigator.clipboard.writeText(keyword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Paper variant="outlined" sx={{ width: '100%', maxWidth: 420, p: 2.5, borderRadius: 3, textAlign: 'center' }}>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center', color: 'text.secondary' }}>
        <KeyRound size={16} />
        <Typography variant="body2">Palavra-chave da entrega</Typography>
      </Stack>

      <Box
        sx={{
          my: 1.5,
          py: 1.5,
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'primary.main',
          bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.08)',
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: 2, color: 'primary.main' }} aria-live="polite">
          {keyword}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Envie para {recipientName ?? 'quem vai receber'}. O motorista só entrega o pacote para quem informar essa palavra.
      </Typography>

      <Stack direction="row" spacing={1.5}>
        <Button
          fullWidth
          variant="outlined"
          onClick={copy}
          startIcon={copied ? <Check size={18} /> : <Copy size={18} />}
          sx={{ borderRadius: 999, height: 44, textTransform: 'none', fontWeight: 600 }}
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </Button>
        {canShare && (
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigator.share({ text: message }).catch(() => undefined)}
            startIcon={<Share2 size={18} />}
            sx={{ borderRadius: 999, height: 44, textTransform: 'none', fontWeight: 600 }}
          >
            Compartilhar
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
