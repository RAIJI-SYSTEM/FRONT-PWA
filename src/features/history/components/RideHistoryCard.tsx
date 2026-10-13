'use client';

import { Car, CreditCard, QrCode, Users } from 'lucide-react';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { RideHistoryItem } from '@/types/history';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { RIDE_STATUS } from '../status';
import DriverRow from './DriverRow';
import HistoryCard from './HistoryCard';

export default function RideHistoryCard({ ride, onRate }: { ride: RideHistoryItem; onRate: () => void }) {
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
            {ride.distanceKm.toFixed(1).replace('.', ',')} km
          </Typography>
          {ride.shared && <Chip icon={<Users size={14} />} label="Compartilhada" size="small" variant="outlined" />}
          {!canceled && (
            <Chip icon={<PaymentIcon size={14} />} label={ride.paymentMethod === 'pix' ? 'Pix' : 'Cartão'} size="small" variant="outlined" />
          )}
        </>
      }
      footer={
        <DriverRow
          driver={ride.driver}
          rating={ride.rating}
          finished={ride.status === 'completed'}
          active={ride.status === 'scheduled' || ride.status === 'in_progress'}
          onRate={onRate}
        />
      }
    />
  );
}
