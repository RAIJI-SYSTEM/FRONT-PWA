import type { ShipmentStatus } from '@/types/shipment';
import type { TripStatus } from '@/types/trip';

export type StatusColor = 'default' | 'primary' | 'secondary' | 'success' | 'error';

interface StatusConfig {
  label: string;
  color: StatusColor;
}

export const tripStatusConfig: Record<TripStatus, StatusConfig> = {
  scheduled: { label: 'Agendada', color: 'secondary' },
  driver_on_the_way: { label: 'Motorista a caminho', color: 'primary' },
  in_progress: { label: 'Em andamento', color: 'primary' },
  finished: { label: 'Finalizada', color: 'success' },
  canceled: { label: 'Cancelada', color: 'error' },
};

export const shipmentStatusConfig: Record<ShipmentStatus, StatusConfig> = {
  awaiting_pickup: { label: 'Aguardando coleta', color: 'secondary' },
  in_transit: { label: 'Em trânsito', color: 'primary' },
  delivered: { label: 'Entregue', color: 'success' },
  canceled: { label: 'Cancelada', color: 'error' },
};
