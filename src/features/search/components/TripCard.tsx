'use client';

import { useRouter } from 'next/navigation';
import { Armchair, MapPin, Package, Send } from 'lucide-react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MessageButton from '@/features/messages/components/MessageButton';
import { participantColor } from '@/features/messages/participantColor';
import { useSession } from '@/hooks/useSession';
import { fromBrazilLocal, toCents } from '@/services/backend/client';
import type { RideApi } from '@/services/backend/types';
import { prepareDirectRequest } from '@/services/rideSearch';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';

/** Viagem publicada: horário, ponto de saída, motorista, lugares e preço; pedir vaga ou mandar mensagem */
export default function TripCard({ ride, showDriver = true }: { ride: RideApi; showDriver?: boolean }) {
  const router = useRouter();
  const session = useSession();
  const departureAt = fromBrazilLocal(ride.departureDate);
  const carriesPeople = ride.type !== 'CARGO';
  const full = carriesPeople && ride.availableSeats === 0;
  const mine = session?.user.id === ride.driverSub;
  const driverName = ride.driverName ?? 'Motorista';

  return (
    <Paper variant="outlined" component="article" sx={{ p: 2, borderRadius: 3, opacity: full ? 0.6 : 1 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.375rem', lineHeight: 1.1 }}>{formatTime(departureAt)}</Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(departureAt)}
          </Typography>
        </Box>
        {carriesPeople && (
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.1 }}>
              {ride.pricePerPassenger ? formatCurrency(toCents(ride.pricePerPassenger)) : 'Grátis'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              por lugar
            </Typography>
          </Box>
        )}
      </Stack>

      <Typography sx={{ fontWeight: 700, mt: 1.5 }}>
        {ride.originCity} → {ride.destinationCity}
      </Typography>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
        <MapPin size={14} style={{ flexShrink: 0 }} />
        <Typography variant="body2" noWrap>
          Saída: {ride.meetingPoint ?? ride.originAddress ?? ride.originCity}
        </Typography>
      </Stack>

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        {carriesPeople && (
          <Chip
            size="small"
            icon={<Armchair size={14} />}
            label={full ? 'Lotada' : `${ride.availableSeats} lugar${ride.availableSeats === 1 ? '' : 'es'}`}
            color={full ? 'default' : 'success'}
            sx={{ fontWeight: 600 }}
          />
        )}
        {ride.type !== 'PASSENGER' && <Chip size="small" variant="outlined" icon={<Package size={14} />} label="Leva encomendas" />}
      </Stack>

      {showDriver && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: participantColor(ride.driverSub), color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
              {driverName.charAt(0)}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>
              {driverName}
            </Typography>
            {!mine && (
              <MessageButton
                target={{
                  userId: ride.driverSub,
                  name: ride.driverName,
                  role: 'driver',
                  myRole: 'passenger',
                  context: {
                    kind: 'ride',
                    refId: ride.id,
                    label: 'Carona',
                    origin: `${ride.originCity}/${ride.originState}`,
                    destination: `${ride.destinationCity}/${ride.destinationState}`,
                  },
                }}
              />
            )}
          </Stack>
        </>
      )}

      {carriesPeople && !full && !mine && (
        <Button
          fullWidth
          variant="contained"
          startIcon={<Send size={16} />}
          onClick={() => router.push(prepareDirectRequest(ride))}
          sx={{ mt: 1.5, borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
        >
          Pedir vaga
        </Button>
      )}
    </Paper>
  );
}
