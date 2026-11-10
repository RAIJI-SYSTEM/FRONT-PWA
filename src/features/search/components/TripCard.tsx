import { Armchair, MapPin, Package, Star } from 'lucide-react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { participantColor } from '@/features/messages/participantColor';
import type { PublicTrip } from '@/types/drivers';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import PersonTypeChip from './PersonTypeChip';

/** Viagem publicada entre cidades: horário, ponto de saída, motorista, lugares e preço por lugar */
export default function TripCard({ trip }: { trip: PublicTrip }) {
  const full = trip.seatsAvailable === 0;

  return (
    <Paper variant="outlined" component="article" sx={{ p: 2, borderRadius: 3, opacity: full ? 0.6 : 1 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.375rem', lineHeight: 1.1 }}>{formatTime(trip.departureAt)}</Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(trip.departureAt)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.1 }}>{formatCurrency(trip.pricePerSeatCents)}</Typography>
          <Typography variant="caption" color="text.secondary">
            por lugar
          </Typography>
        </Box>
      </Stack>

      <Typography sx={{ fontWeight: 700, mt: 1.5 }}>
        {trip.originCity} → {trip.destinationCity}
      </Typography>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
        <MapPin size={14} style={{ flexShrink: 0 }} />
        <Typography variant="body2" noWrap>
          Saída: {trip.departurePoint}
        </Typography>
      </Stack>

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        <Chip
          size="small"
          icon={<Armchair size={14} />}
          label={full ? 'Lotada' : `${trip.seatsAvailable} lugar${trip.seatsAvailable === 1 ? '' : 'es'}`}
          color={full ? 'default' : 'success'}
          sx={{ fontWeight: 600 }}
        />
        {trip.acceptsPackages && <Chip size="small" variant="outlined" icon={<Package size={14} />} label="Leva encomendas" />}
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: participantColor(trip.driver.id), color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
          {trip.driver.name.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {trip.driver.name}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Star size={12} fill="var(--mui-palette-primary-main)" color="var(--mui-palette-primary-main)" />
            <Typography variant="caption" color="text.secondary" noWrap>
              {trip.driver.rating.toFixed(1).replace('.', ',')} · {trip.driver.vehicle}
            </Typography>
          </Stack>
        </Box>
        <PersonTypeChip driver={trip.driver} />
      </Stack>
    </Paper>
  );
}
