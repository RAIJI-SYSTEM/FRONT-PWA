'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CircleCheck, CircleX, Hourglass, PackageCheck, Undo2 } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AdSlot from '@/components/AdSlot';
import StatusScreen from '@/components/StatusScreen';
import { getPayment } from '@/services/payments';
import type { PaymentApi } from '@/services/backend/types';
import type { PaymentTarget } from '@/types/payment';
import { formatCurrency } from '@/utils/formatCurrency';
import { routes } from '@/utils/routes';
import { paymentPaths } from '../paths';

const POLL_INTERVAL_MS = 3000;
/** Logo depois de pagar com cartão o Stripe já confirmou; se seguir "não pago", espera um pouco antes de dar erro */
const UNPAID_RETRIES = 4;
const pillButton = { height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

/** Onde acompanhar o pedido depois de pago */
const detailHref = (target: PaymentTarget) =>
  target.kind === 'ride' ? `/viagem/reserva?id=${encodeURIComponent(target.requestId)}` : routes.delivery(target.deliveryId);

/**
 * "Aguardar retorno" → pago, Pix aguardando o banco, ou "Pagamento não concluído".
 * Quem diz se está pago é o backend, que confere no Stripe.
 */
export default function PaymentStatusScreen({ target }: { target: PaymentTarget }) {
  const [payment, setPayment] = useState<PaymentApi | null>(null);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // `key` identifica o pedido; o objeto target muda de identidade a cada renderização
  const key = paymentPaths.status(target);
  const targetRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
  });

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let unpaidChecks = 0;

    const poll = async () => {
      try {
        const data = await getPayment(targetRef.current);
        if (!active) return;
        setPayment(data);
        if (data.status === 'PROCESSING') {
          // Pix: só conclui quando o banco confirma
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        } else if (data.status === 'UNPAID') {
          unpaidChecks += 1;
          if (unpaidChecks < UNPAID_RETRIES) timer = setTimeout(poll, POLL_INTERVAL_MS);
          else setFailed(true);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Falha ao consultar o pagamento.');
      }
    };

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [key]);

  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;

  const isRide = target.kind === 'ride';
  const backHome = (
    <Button component={Link} href="/homepage" color="inherit" sx={pillButton}>
      Voltar ao início
    </Button>
  );

  if (payment?.status === 'PAID') {
    return (
      <StatusScreen
        icon={isRide ? CircleCheck : PackageCheck}
        tone="success"
        title={isRide ? 'Vaga paga!' : 'Encomenda paga!'}
        description={`Pagamento de ${formatCurrency(payment.amountCents)} confirmado. O motorista já foi avisado.`}
        actions={
          <>
            <Button component={Link} href={detailHref(target)} variant="contained" sx={pillButton}>
              {isRide ? 'Ver minha reserva' : 'Acompanhar encomenda'}
            </Button>
            {backHome}
          </>
        }
      />
    );
  }

  if (payment?.status === 'REFUNDED') {
    return (
      <StatusScreen
        icon={Undo2}
        title="Pagamento estornado"
        description={`O pedido foi cancelado e ${formatCurrency(payment.amountCents)} voltam pela mesma forma de pagamento.`}
        actions={backHome}
      />
    );
  }

  if (payment?.status === 'NOT_REQUIRED') {
    return (
      <StatusScreen
        icon={CircleCheck}
        tone="success"
        title="Nada a pagar"
        description="Este pedido é gratuito."
        actions={
          <>
            <Button component={Link} href={detailHref(target)} variant="contained" sx={pillButton}>
              {isRide ? 'Ver minha reserva' : 'Ver encomenda'}
            </Button>
            {backHome}
          </>
        }
      />
    );
  }

  if (failed) {
    return (
      <StatusScreen
        icon={CircleX}
        tone="error"
        title="Pagamento não concluído"
        description="O pagamento não foi aprovado. Tente outro cartão ou pague com Pix."
        actions={
          <>
            <Button component={Link} href={paymentPaths.checkout(target)} variant="contained" sx={pillButton}>
              Tentar de novo
            </Button>
            {backHome}
          </>
        }
      />
    );
  }

  return (
    <StatusScreen
      icon={Hourglass}
      title="Confirmando pagamento"
      description={
        payment?.status === 'PROCESSING'
          ? 'Pix gerado. Conclua o pagamento no app do seu banco; esta tela atualiza sozinha.'
          : 'Isso costuma levar poucos segundos.'
      }
    >
      <CircularProgress aria-label="Aguardando confirmação" />
      <AdSlot adSlotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_WAITING} />
    </StatusScreen>
  );
}
