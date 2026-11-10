'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import PaymentStatusScreen from '@/features/payment/components/PaymentStatusScreen';

/** /viagem/pagamento/status?busca=...&oferta=...&payment_intent=... */
export default function PaymentStatusPage() {
  return (
    <>
      <FlowTopBar title="Pagamento" backHref="/homepage" />
      <WithSearchParams>
        {(params) => {
          // payment_intent é adicionado pelo app ou pelo próprio Stripe (ao voltar de um redirecionamento)
          const paymentIntent = params.get('payment_intent');
          if (!paymentIntent) return <Redirect to="/homepage" />;
          return (
            <PaymentStatusScreen
              kind="ride"
              paymentIntentId={paymentIntent}
              referenceId={params.get('busca') ?? undefined}
              offerId={params.get('oferta') ?? undefined}
            />
          );
        }}
      </WithSearchParams>
    </>
  );
}
