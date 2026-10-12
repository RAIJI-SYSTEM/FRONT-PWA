'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Coupon } from '@/types/rewards';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const STATUS_LABEL = { available: 'Disponível', used: 'Usado', expired: 'Expirado' } as const;

/** Cupom em formato de ticket: valor à esquerda, detalhes à direita, separados por "picote" */
export default function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const available = coupon.status === 'available';

  const copy = async () => {
    await navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Recorte semicircular nas bordas do picote (cor do fundo da página)
  const notch = {
    position: 'absolute',
    left: -10,
    width: 20,
    height: 20,
    borderRadius: '50%',
    bgcolor: 'background.default',
    border: 1,
    borderColor: 'divider',
  } as const;

  return (
    <Stack
      direction="row"
      sx={{
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        opacity: available ? 1 : 0.55,
        filter: available ? 'none' : 'grayscale(1)',
      }}
    >
      <Stack
        sx={{
          width: 104,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          p: 1.5,
          color: 'primary.contrastText',
          background: 'linear-gradient(160deg, var(--mui-palette-primary-light) 0%, var(--mui-palette-primary-main) 100%)',
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: '1.375rem', lineHeight: 1.1 }}>
          {formatCurrency(coupon.discountCents).replace(',00', '')}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.9 }}>
          OFF
        </Typography>
      </Stack>

      <Box sx={{ position: 'relative', flex: 1, minWidth: 0, p: 2, borderLeft: '2px dashed', borderColor: 'divider' }}>
        <Box sx={{ ...notch, top: -11 }} />
        <Box sx={{ ...notch, bottom: -11 }} />

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography sx={{ fontWeight: 700 }}>{coupon.title}</Typography>
          <Chip
            label={STATUS_LABEL[coupon.status]}
            size="small"
            color={available ? 'success' : 'default'}
            variant={available ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600, flexShrink: 0 }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {coupon.description}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 800, letterSpacing: 1, fontFamily: 'monospace' }}>{coupon.code}</Typography>
            <Typography variant="caption" color="text.secondary">
              {coupon.status === 'expired' ? 'Venceu em' : 'Válido até'} {formatDate(coupon.expiresAt)}
            </Typography>
          </Box>
          {available && (
            <Button
              size="small"
              variant="outlined"
              onClick={copy}
              startIcon={copied ? <Check size={16} /> : <Copy size={16} />}
              aria-label={`Copiar código ${coupon.code}`}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
            >
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
