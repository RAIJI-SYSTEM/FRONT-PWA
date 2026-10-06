import type { ShipmentStatus } from '@/types/shipment';

type ChipColor = 'default' | 'primary' | 'secondary' | 'success' | 'error';

export const shipmentStatusConfig: Record<ShipmentStatus, { label: string; color: ChipColor }> = {
  pending: { label: 'Aguardando', color: 'secondary' },
  in_transit: { label: 'Em trânsito', color: 'primary' },
  delivered: { label: 'Entregue', color: 'success' },
  canceled: { label: 'Cancelado', color: 'error' },
};
