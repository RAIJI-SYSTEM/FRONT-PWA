import Chip from '@mui/material/Chip';
import type { PaymentStatusApi } from '@/services/backend/types';

const CHIP: Record<Exclude<PaymentStatusApi, 'NOT_REQUIRED'>, { label: string; color: 'default' | 'success' | 'warning' }> = {
  UNPAID: { label: 'Aguardando pagamento', color: 'warning' },
  PROCESSING: { label: 'Pix em confirmação', color: 'warning' },
  PAID: { label: 'Pago', color: 'success' },
  REFUNDED: { label: 'Estornado', color: 'default' },
};

/** Etiqueta curta da situação do pagamento (para o motorista e nas listas). Gratuito não mostra nada. */
export default function PaymentChip({ status }: { status: PaymentStatusApi }) {
  if (status === 'NOT_REQUIRED') return null;
  const { label, color } = CHIP[status];
  return <Chip size="small" variant="outlined" color={color} label={label} />;
}
