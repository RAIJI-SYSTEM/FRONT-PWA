'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Briefcase, Car, CreditCard, Users } from 'lucide-react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import PaymentChip from '@/features/payment/components/PaymentChip';
import { paymentPaths } from '@/features/payment/paths';
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
  const payTarget = ride.rideId && ride.bookingId ? ({ kind: 'ride', rideId: ride.rideId, requestId: ride.bookingId } as const) : null;
  // Aceita pelo motorista e ainda não paga
  const canPay = payTarget && ride.status === 'scheduled' && ride.paymentStatus === 'UNPAID';

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
          {ride.status !== 'requested' && <PaymentChip status={ride.paymentStatus} />}
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
          {canPay && (
            <Button
              size="small"
              variant="contained"
              component={Link}
              href={paymentPaths.checkout(payTarget)}
              startIcon={<CreditCard size={16} />}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
            >
              Pagar {formatCurrency(ride.priceCents)}
            </Button>
          )}
        </>
      }
      footer={
        <DriverRow
          driver={ride.driver}
          rating={ride.rating}
          finished={ride.status === 'completed'}
          active={ride.status === 'requested' || ride.status === 'scheduled' || ride.status === 'in_progress'}
          chat={
            ride.rideId
              ? {
                  userId: ride.driver.id,
                  name: ride.driver.name,
                  role: 'driver',
                  myRole: 'passenger',
                  context: { kind: 'ride', refId: ride.rideId, subId: ride.bookingId, label: 'Carona', origin: ride.origin, destination: ride.destination },
                }
              : undefined
          }
          onRate={() => onRate(ride)}
        />
      }
    />
  );
}

/** Só redesenha se o item mudar (ex.: foi avaliado), não a cada busca/filtro */
export default memo(RideHistoryCard);
