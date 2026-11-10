'use client';

import { memo } from 'react';
import { Car, Clock, Package, Star, Users, Wine, X, Check } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RouteSummary from '@/features/activities/components/RouteSummary';
import { PACKAGE_SIZES } from '@/features/delivery/packageSizes';
import type { RegionRequest } from '@/types/driverMode';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';

interface RequestCardProps {
  request: RegionRequest;
  /** Qual ação está em andamento neste cartão */
  busy: 'accept' | 'reject' | null;
  onRespond: (request: RegionRequest, action: 'accept' | 'reject') => void;
}

/** Pedido da região: quem pede, trajeto, quando, quanto rende e os botões de aceitar/recusar */
function RequestCard({ request, busy, onRespond }: RequestCardProps) {
  const isRide = request.kind === 'ride';
  const Icon = isRide ? Car : Package;
  const size = PACKAGE_SIZES.find((s) => s.value === request.packageSize);
  const when =
    request.when.type === 'now' ? 'Agora' : `${formatDate(request.when.at)} · ${formatTime(request.when.at)}`;

  return (
    <Paper variant="outlined" component="article" sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Box
          aria-hidden
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: 'primary.main',
            bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)',
          }}
        >
          <Icon size={20} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }} noWrap>
            {isRide ? 'Corrida' : 'Encomenda'} · {request.customerName}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
            <Star size={12} fill="var(--mui-palette-primary-main)" color="var(--mui-palette-primary-main)" />
            <Typography variant="caption">{request.customerRating.toFixed(1).replace('.', ',')}</Typography>
            <Clock size={12} style={{ marginLeft: 6 }} />
            <Typography variant="caption" noWrap>
              {when}
            </Typography>
          </Stack>
        </Box>
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.1 }}>{formatCurrency(request.earningsCents)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {request.distanceKm.toFixed(1).replace('.', ',')} km
          </Typography>
        </Box>
      </Stack>

      <RouteSummary origin={request.origin} destination={request.destination} />

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        {isRide && request.passengers && (
          <Chip size="small" variant="outlined" icon={<Users size={14} />} label={`${request.passengers} passageiro${request.passengers === 1 ? '' : 's'}`} />
        )}
        {size && <Chip size="small" variant="outlined" label={`${size.label} · ${size.hint}`} />}
        {request.fragile && <Chip size="small" color="primary" icon={<Wine size={14} />} label="Frágil" />}
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      <Stack direction="row" spacing={1.5}>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          disabled={busy !== null}
          onClick={() => onRespond(request, 'reject')}
          startIcon={busy === 'reject' ? <CircularProgress size={16} color="inherit" /> : <X size={18} />}
          aria-label={`Recusar ${isRide ? 'corrida' : 'encomenda'} de ${request.customerName}`}
          sx={{ height: 44, borderRadius: 999, textTransform: 'none', fontWeight: 600, borderColor: 'divider' }}
        >
          Recusar
        </Button>
        <Button
          fullWidth
          variant="contained"
          disabled={busy !== null}
          onClick={() => onRespond(request, 'accept')}
          startIcon={busy === 'accept' ? <CircularProgress size={16} color="inherit" /> : <Check size={18} />}
          aria-label={`Aceitar ${isRide ? 'corrida' : 'encomenda'} de ${request.customerName}`}
          sx={{ height: 44, borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
        >
          Aceitar
        </Button>
      </Stack>
    </Paper>
  );
}

export default memo(RequestCard);
