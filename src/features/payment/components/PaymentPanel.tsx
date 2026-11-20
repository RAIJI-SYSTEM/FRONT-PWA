'use client';

import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { PaymentStatusApi } from '@/services/backend/types';
import type { PaymentTarget } from '@/types/payment';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { paymentPaths } from '../paths';

interface PaymentPanelProps {
  target: PaymentTarget;
  status: PaymentStatusApi;
  amountCents: number;
  paidAt: string | null;
  /** O motorista ainda não aceitou: paga-se depois do aceite */
  awaitingAcceptance: boolean;
  /** Aceito e ainda em tempo de pagar */
  canPay: boolean;
}

/** Situação do pagamento de quem paga (passageiro ou remetente), com o botão "Pagar" quando cabe */
export default function PaymentPanel({ target, status, amountCents, paidAt, awaitingAcceptance, canPay }: PaymentPanelProps) {
  if (status === 'NOT_REQUIRED') return null;

  if (status === 'PAID') {
    return (
      <Alert severity="success">
        <b>Pago</b> · {formatCurrency(amountCents)}
        {paidAt && ` em ${formatDate(paidAt)} às ${formatTime(paidAt)}`}
      </Alert>
    );
  }

  if (status === 'REFUNDED') {
    return <Alert severity="info">Pagamento estornado: {formatCurrency(amountCents)} voltam pela mesma forma de pagamento.</Alert>;
  }

  if (status === 'PROCESSING') {
    return (
      <Alert
        severity="warning"
        action={
          <Button component={Link} href={paymentPaths.status(target)} color="inherit" size="small" sx={{ fontWeight: 700 }}>
            Ver
          </Button>
        }
      >
        Pix aguardando a confirmação do banco.
      </Alert>
    );
  }

  if (awaitingAcceptance) {
    return <Alert severity="info">Você paga {formatCurrency(amountCents)} depois que o motorista aceitar o pedido.</Alert>;
  }

  if (!canPay) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: 'primary.main' }}>
      <Stack spacing={1.5}>
        <div>
          <Typography sx={{ fontWeight: 800 }}>Pagamento pendente</Typography>
          <Typography variant="body2" color="text.secondary">
            O motorista aceitou. Pague com cartão ou Pix para garantir seu lugar.
          </Typography>
        </div>
        <Button
          component={Link}
          href={paymentPaths.checkout(target)}
          variant="contained"
          startIcon={<CreditCard size={18} />}
          sx={{ height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
        >
          Pagar {formatCurrency(amountCents)}
        </Button>
      </Stack>
    </Paper>
  );
}
