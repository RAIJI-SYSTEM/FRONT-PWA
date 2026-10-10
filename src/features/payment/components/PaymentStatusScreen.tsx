'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleCheck, CircleX, Hourglass } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AdSlot from '@/components/AdSlot';
import StatusScreen from '@/components/StatusScreen';
import { getPaymentStatus } from '@/services/payments';
import type { PaymentStatusResponse } from '@/types/payment';

const POLL_INTERVAL_MS = 3000;
const pillButton = { height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

interface PaymentStatusScreenProps {
  paymentIntentId: string;
  searchId?: string;
  offerId?: string;
}

/** "Aguardar retorno" → "Passagem adquirida" ou "Compra não concluída" */
export default function PaymentStatusScreen({ paymentIntentId, searchId, offerId }: PaymentStatusScreenProps) {
  const [result, setResult] = useState<PaymentStatusResponse>({ status: 'processing' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const data = await getPaymentStatus(paymentIntentId);
        if (!active) return;
        setResult(data);
        // Pix pode levar alguns instantes até o banco confirmar
        if (data.status === 'processing') timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Falha ao consultar o pagamento.');
      }
    };

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [paymentIntentId]);

  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;

  if (result.status === 'succeeded') {
    return (
      <StatusScreen
        icon={CircleCheck}
        tone="success"
        title="Passagem adquirida!"
        description="Pagamento aprovado. O motorista já foi avisado e você pode acompanhar a viagem pelo histórico."
        actions={
          <>
            <Button component={Link} href="/historico" variant="contained" sx={pillButton}>
              Acompanhar viagem
            </Button>
            <Button component={Link} href="/homepage" color="inherit" sx={pillButton}>
              Voltar ao início
            </Button>
          </>
        }
      />
    );
  }

  if (result.status === 'failed') {
    const retryHref = searchId && offerId ? `/viagem/pagamento?busca=${searchId}&oferta=${offerId}` : '/viagem/nova';
    return (
      <StatusScreen
        icon={CircleX}
        tone="error"
        title="Pagamento recusado"
        description={result.message ?? 'A compra não foi concluída. Tente outro cartão ou pague com Pix.'}
        actions={
          <>
            <Button component={Link} href={retryHref} variant="contained" sx={pillButton}>
              Tentar outra forma de pagamento
            </Button>
            <Button component={Link} href="/homepage" color="inherit" sx={pillButton}>
              Voltar ao início
            </Button>
          </>
        }
      />
    );
  }

  return (
    <StatusScreen
      icon={Hourglass}
      title="Confirmando pagamento"
      description="Isso costuma levar poucos segundos. Se pagou com Pix, conclua o pagamento no app do seu banco."
    >
      <CircularProgress aria-label="Aguardando confirmação" />
      <AdSlot adSlotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_WAITING} />
    </StatusScreen>
  );
}
