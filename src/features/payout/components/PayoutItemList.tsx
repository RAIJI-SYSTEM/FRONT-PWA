'use client';

import { Car, Package } from 'lucide-react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { fromBrazilLocal } from '@/services/backend/client';
import type { PayoutItemApi } from '@/services/payouts';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

/** Itens a repassar: o que foi pago, a comissão e a parte do motorista */
export default function PayoutItemList({ items }: { items: PayoutItemApi[] }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3 }}>
      {items.map((item, i) => {
        const Icon = item.kind === 'RIDE' ? Car : Package;
        return (
          <Box key={item.id}>
            {i > 0 && <Divider />}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 1.75 }}>
              <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                <Icon size={20} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {item.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.departureDate ? `${formatDate(fromBrazilLocal(item.departureDate))} · ` : ''}
                  pago {formatCurrency(item.paidCents)} − comissão {formatCurrency(item.feeCents)}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, flexShrink: 0 }}>{formatCurrency(item.driverCents)}</Typography>
            </Stack>
          </Box>
        );
      })}
    </Paper>
  );
}
