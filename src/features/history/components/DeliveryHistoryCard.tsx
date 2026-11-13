'use client';

import { memo } from 'react';
import { KeyRound, Package, User, Wine } from 'lucide-react';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { PACKAGE_SIZES } from '@/features/delivery/packageSizes';
import type { DeliveryHistoryItem } from '@/types/history';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { DELIVERY_STATUS } from '../status';
import DriverRow from './DriverRow';
import HistoryCard from './HistoryCard';

interface DeliveryHistoryCardProps {
  delivery: DeliveryHistoryItem;
  /** Recebe o item: assim a mesma função serve para todos os cartões e o memo funciona */
  onRate: (delivery: DeliveryHistoryItem) => void;
}

function DeliveryHistoryCard({ delivery, onRate }: DeliveryHistoryCardProps) {
  const canceled = delivery.status === 'canceled';
  const size = PACKAGE_SIZES.find((s) => s.value === delivery.size);

  return (
    <HistoryCard
      icon={Package}
      title={delivery.description}
      subtitle={`${formatDate(delivery.date)} · ${formatTime(delivery.date)}`}
      status={DELIVERY_STATUS[delivery.status]}
      origin={delivery.origin}
      destination={delivery.destination}
      muted={canceled}
      details={
        <>
          <Typography sx={{ fontWeight: 700, mr: 0.5 }}>{canceled ? 'Sem cobrança' : formatCurrency(delivery.priceCents)}</Typography>
          {size && <Chip label={size.label} size="small" variant="outlined" />}
          {delivery.fragile && <Chip icon={<Wine size={14} />} label="Frágil" size="small" color="primary" variant="outlined" />}
          <Chip icon={<User size={14} />} label={delivery.recipientName} size="small" variant="outlined" />
          {delivery.pickupCode && (delivery.status === 'requested' || delivery.status === 'awaiting_pickup') && (
            <Chip icon={<KeyRound size={14} />} label={`Código de coleta: ${delivery.pickupCode}`} size="small" color="primary" />
          )}
          {delivery.keyword && delivery.status !== 'delivered' && delivery.status !== 'canceled' && (
            <Chip icon={<KeyRound size={14} />} label={`Palavra-chave: ${delivery.keyword}`} size="small" color="secondary" />
          )}
        </>
      }
      footer={
        <DriverRow
          driver={delivery.driver}
          rating={delivery.rating}
          finished={delivery.status === 'delivered'}
          active={delivery.status === 'awaiting_pickup' || delivery.status === 'in_transit'}
          onRate={() => onRate(delivery)}
        />
      }
    />
  );
}

/** Só redesenha se o item mudar (ex.: foi avaliado), não a cada busca/filtro */
export default memo(DeliveryHistoryCard);
