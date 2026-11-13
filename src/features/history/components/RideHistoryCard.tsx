'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Briefcase, Car, CreditCard, QrCode, Users } from 'lucide-react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { RideHistoryItem } from '@/types/history';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { RIDE_STATUS } from '../status';
import DriverRow from './DriverRow';
import HistoryCard from './HistoryCard';

interface RideHistoryCardProps {
  ride: RideHistoryItem;
  /** Recebe o item: assim a mesma função serve para todos os cartões e o memo funciona */
  onRate: (ride: RideHistoryItem) => void;
}

function RideHistoryCard({ ride, onRate }: RideHistoryCardProps) {
  const canceled = ride.status === 'canceled';
  const PaymentIcon = ride.paymentMethod === 'pix' ? QrCode : CreditCard;

  return (
    <HistoryCard
      icon={Car}
      title={ride.destination}
      subtitle={`${formatDate(ride.date)} · ${formatTime(ride.date)}`}
      status={RIDE_STATUS[ride.status]}
      origin={ride.origin}
      destination={ride.destination}
      muted={canceled}
      details={
        <>
          <Typography sx={{ fontWeight: 700, mr: 0.5 }}>{canceled ? 'Sem cobrança' : formatCurrency(ride.priceCents)}</Typography>
          <Typography variant="body2" color="text.secondary">
            {ride.distanceKm > 0 ? `${ride.distanceKm.toFixed(1).replace('.', ',')} km` : ''}
          </Typography>
          {ride.shared && <Chip icon={<Users size={14} />} label="Compartilhada" size="small" variant="outlined" />}
          {!canceled && ride.status !== 'requested' && ride.priceCents > 0 && (
            <Chip icon={<PaymentIcon size={14} />} label={ride.paymentMethod === 'pix' ? 'Pix' : 'Cartão'} size="small" variant="outlined" />
          )}
          {ride.baggageSummary && (
            <Chip
              icon={<Briefcase size={14} />}
              label={ride.baggagePending ? `${ride.baggageSummary} · alteração pendente` : ride.baggageSummary}
              size="small"
              variant="outlined"
            />
          )}
          {ride.bookingId && ride.rideId && (ride.status === 'requested' || ride.status === 'scheduled') && (
            <Button
              size="small"
              component={Link}
              href={`/viagem/reserva?id=${encodeURIComponent(ride.bookingId)}&carona=${encodeURIComponent(ride.rideId)}`}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
            >
              Detalhes e bagagem
            </Button>
          )}
        </>
      }
      footer={
        <DriverRow
          driver={ride.driver}
          rating={ride.rating}
          finished={ride.status === 'completed'}
          active={ride.status === 'scheduled' || ride.status === 'in_progress'}
          onRate={() => onRate(ride)}
        />
      }
    />
  );
}

/** Só redesenha se o item mudar (ex.: foi avaliado), não a cada busca/filtro */
export default memo(RideHistoryCard);
