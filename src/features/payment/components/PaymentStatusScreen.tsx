'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleCheck, CircleX, Hourglass, PackageCheck } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AdSlot from '@/components/AdSlot';
import StatusScreen from '@/components/StatusScreen';
import { getPaymentStatus } from '@/services/payments';
import DeliveryKeyword from '@/features/delivery/components/DeliveryKeyword';
import type { PaymentKind, PaymentStatusResponse } from '@/types/payment';
import { paymentPaths } from '../paths';
import { routes } from '@/utils/routes';

const POLL_INTERVAL_MS = 3000;
const pillButton = { height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

interface PaymentStatusScreenProps {
  kind: PaymentKind;
  paymentIntentId: string;
  /** ID da busca de viagem ou da entrega */
  referenceId?: string;
  offerId?: string;
}

/**
 * "Aguardar retorno" → sucesso ou "Compra não concluída".
 * Viagem: "Passagem adquirida". Encomenda: "Confirmação e palavra-chave recebidas".
 */
export default function PaymentStatusScreen({ kind, paymentIntentId, referenceId, offerId }: PaymentStatusScreenProps) {
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

  if (result.status === 'succeeded' && kind === 'delivery') {
    return (
      <StatusScreen
        icon={PackageCheck}
        tone="success"
        title="Entrega confirmada!"
        description="Pagamento aprovado. O motorista vai buscar o pacote no endereço de origem."
        actions={
          <>
            {referenceId && (
              <Button component={Link} href={routes.delivery(referenceId)} variant="contained" sx={pillButton}>
                Acompanhar entrega
              </Button>
            )}
            <Button component={Link} href="/homepage" color="inherit" sx={pillButton}>
              Voltar ao início
            </Button>
          </>
        }
      >
        {result.keyword && <DeliveryKeyword keyword={result.keyword} />}
      </StatusScreen>
    );
  }

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
    const fallback = kind === 'delivery' ? '/encomenda/nova' : '/viagem/nova';
    const retryHref = referenceId && offerId ? paymentPaths[kind].checkout(referenceId, offerId) : fallback;
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
