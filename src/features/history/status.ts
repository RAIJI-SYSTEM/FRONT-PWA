import type { DeliveryHistoryStatus, RideHistoryStatus } from '@/types/history';

type ChipColor = 'default' | 'primary' | 'secondary' | 'success';

export const RIDE_STATUS: Record<RideHistoryStatus, { label: string; color: ChipColor }> = {
  requested: { label: 'Aguardando motorista', color: 'default' },
  scheduled: { label: 'Agendada', color: 'secondary' },
  in_progress: { label: 'Em andamento', color: 'primary' },
  completed: { label: 'Concluída', color: 'success' },
  canceled: { label: 'Cancelada', color: 'default' },
};

export const DELIVERY_STATUS: Record<DeliveryHistoryStatus, { label: string; color: ChipColor }> = {
  requested: { label: 'Aguardando motorista', color: 'default' },
  awaiting_pickup: { label: 'Aguardando coleta', color: 'secondary' },
  in_transit: { label: 'A caminho', color: 'primary' },
  delivered: { label: 'Entregue', color: 'success' },
  canceled: { label: 'Cancelada', color: 'default' },
};
