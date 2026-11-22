'use client';

import { TicketPercent } from 'lucide-react';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Coupon } from '@/types/rewards';
import { formatCurrency } from '@/utils/formatCurrency';

interface CouponPickerProps {
  coupons: Coupon[];
  /** Cupom aplicado (null = sem cupom) */
  selected: string | null;
  busy: boolean;
  onChange: (couponId: string | null) => void;
}

/** Cupons disponíveis para este pagamento: toque para aplicar ou tirar */
export default function CouponPicker({ coupons, selected, busy, onChange }: CouponPickerProps) {
  if (coupons.length === 0) return null;
  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <TicketPercent size={18} />
        <Typography sx={{ fontWeight: 700 }}>Cupom</Typography>
        {busy && <CircularProgress size={14} />}
      </Stack>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label="Sem cupom"
          variant={selected === null ? 'filled' : 'outlined'}
          color={selected === null ? 'primary' : 'default'}
          disabled={busy}
          onClick={() => selected !== null && onChange(null)}
        />
        {coupons.map((c) => (
          <Chip
            key={c.id}
            label={`${formatCurrency(c.discountCents).replace(',00', '')} · ${c.code}`}
            variant={selected === c.id ? 'filled' : 'outlined'}
            color={selected === c.id ? 'primary' : 'default'}
            disabled={busy}
            onClick={() => selected !== c.id && onChange(c.id)}
          />
        ))}
      </Stack>
    </Stack>
  );
}
