'use client';

import { Package, User } from 'lucide-react';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { PACKAGE_SIZES } from '@/features/delivery/packageSizes';
import type { DeliveryHistoryItem } from '@/types/history';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { DELIVERY_STATUS } from '../status';
import DriverRow from './DriverRow';
import HistoryCard from './HistoryCard';

export default function DeliveryHistoryCard({ delivery, onRate }: { delivery: DeliveryHistoryItem; onRate: () => void }) {
  const canceled = delivery.status === 'canceled';
  const size = PACKAGE_SIZES.find((s) => s.value === delivery.size);

  return (
    <HistoryCard
      icon={Package}
      title={`${delivery.description} · ${delivery.code}`}
      subtitle={`${formatDate(delivery.date)} · ${formatTime(delivery.date)}`}
      status={DELIVERY_STATUS[delivery.status]}
      origin={delivery.origin}
      destination={delivery.destination}
      muted={canceled}
      details={
        <>
          <Typography sx={{ fontWeight: 700, mr: 0.5 }}>{canceled ? 'Sem cobrança' : formatCurrency(delivery.priceCents)}</Typography>
          {size && <Chip label={size.label} size="small" variant="outlined" />}
          <Chip icon={<User size={14} />} label={delivery.recipientName} size="small" variant="outlined" />
        </>
      }
      footer={
        <DriverRow
          driver={delivery.driver}
          rating={delivery.rating}
          finished={delivery.status === 'delivered'}
          active={delivery.status === 'awaiting_pickup' || delivery.status === 'in_transit'}
          onRate={onRate}
        />
      }
    />
  );
}
