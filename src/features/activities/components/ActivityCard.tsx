'use client';

import { Boxes, Car, CarFront, Clock, Package, Truck } from 'lucide-react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Activity } from '@/types/activity';
import { formatDate, formatTime } from '@/utils/formatDate';
import { shipmentStatusConfig, tripStatusConfig } from '../status';
import RouteSummary from './RouteSummary';
import { routes } from '@/utils/routes';

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const isTrip = activity.kind === 'trip';
  const status = isTrip ? tripStatusConfig[activity.status] : shipmentStatusConfig[activity.status];
  const date = isTrip ? activity.scheduledAt : activity.estimatedDelivery;
  const href = isTrip ? '/corridas' : routes.delivery(activity.id);
  const Icon = isTrip ? Car : Package;
  // Ilustração de fundo para identificar o tipo à primeira vista (carro = viagem, caixas = encomenda)
  const Illustration = isTrip ? CarFront : Boxes;

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 5,
        position: 'relative',
        overflow: 'hidden',
        backgroundImage:
          'linear-gradient(315deg, rgba(var(--mui-palette-primary-mainChannel) / 0.10) 0%, transparent 55%)',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          right: { xs: -20, sm: -16 },
          bottom: { xs: -24, sm: -20 },
          color: 'primary.main',
          opacity: 0.14,
          transform: 'rotate(-10deg)',
          pointerEvents: 'none',
          '& svg': { width: { xs: 150, sm: 170 }, height: { xs: 150, sm: 170 } },
        }}
      >
        <Illustration strokeWidth={1.25} />
      </Box>

      <CardActionArea component={Link} href={href} sx={{ height: '100%', position: 'relative' }}>
        <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              aria-hidden
              sx={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                color: 'primary.main',
                bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)',
              }}
            >
              <Icon size={22} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>
                {isTrip ? 'Viagem' : `Encomenda ${activity.code}`}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                <Clock size={14} />
                <Typography variant="body2">
                  {isTrip ? 'Saída' : 'Previsão'} {formatDate(date)} · {formatTime(date)}
                </Typography>
              </Stack>
            </Box>
            <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 600 }} />
          </Stack>

          <RouteSummary origin={activity.origin} destination={activity.destination} />

          {isTrip ? (
            activity.driverName && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
                {activity.driverName} · {activity.vehicle}
              </Typography>
            )
          ) : (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 'auto' }}>
              <LinearProgress
                variant="determinate"
                value={activity.progress}
                aria-label="Progresso da entrega"
                sx={{ flex: 1, height: 6, borderRadius: 999, bgcolor: 'divider' }}
              />
              <Truck size={18} />
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
