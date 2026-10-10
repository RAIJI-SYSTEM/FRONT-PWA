'use client';

import { Clock, Star } from 'lucide-react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ProviderType, RideOffer } from '@/types/ride';
import { formatCurrency } from '@/utils/formatCurrency';

const providerLabel: Record<ProviderType, string> = { cnpj: 'Empresa', mei: 'MEI', autonomo: 'Autônomo' };

interface OfferCardProps {
  offer: RideOffer;
  selected: boolean;
  onSelect: () => void;
  highlight?: string;
}

export default function OfferCard({ offer, selected, onSelect, highlight }: OfferCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderWidth: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.06)' : 'background.paper',
        transition: 'border-color 150ms, background-color 150ms',
      }}
    >
      <CardActionArea onClick={onSelect} role="radio" aria-checked={selected} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>
            {offer.driverName.charAt(0)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>
                {offer.driverName}
              </Typography>
              <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center', color: 'primary.main', flexShrink: 0 }}>
                <Star size={14} fill="currentColor" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {offer.driverRating.toFixed(1)}
                </Typography>
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary" noWrap>
              {offer.vehicle}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.75, alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                <Clock size={14} />
                <Typography variant="caption">chega em {offer.etaMinutes} min</Typography>
              </Stack>
              <Chip label={providerLabel[offer.providerType]} size="small" variant="outlined" />
              {highlight && <Chip label={highlight} size="small" color="primary" />}
            </Stack>
          </Box>

          <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', flexShrink: 0 }}>
            {formatCurrency(offer.priceCents)}
          </Typography>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
