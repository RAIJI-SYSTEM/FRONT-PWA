import type { BoardApi } from '@/services/backend/types';
import { fromBrazilLocal } from '@/services/backend/client';
import { formatDate, formatTime } from '@/utils/formatDate';

export const BOARD_STATUS: Record<BoardApi['status'], { label: string; color: 'default' | 'primary' | 'success' | 'error' }> = {
  OPEN: { label: 'No mural', color: 'primary' },
  ACCEPTED: { label: 'Fechado', color: 'success' },
  CANCELLED: { label: 'Retirado', color: 'default' },
  EXPIRED: { label: 'Horário passou', color: 'default' },
};

export const boardWhen = (request: Pick<BoardApi, 'desiredAt'>) => {
  const at = fromBrazilLocal(request.desiredAt);
  return `${formatDate(at)} às ${formatTime(at)}`;
};

export const boardKm = (meters: number) => `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0).replace('.', ',')} km`;
