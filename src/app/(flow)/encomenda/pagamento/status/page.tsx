'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import PaymentStatusScreen from '@/features/payment/components/PaymentStatusScreen';
import { routes } from '@/utils/routes';

/** /encomenda/pagamento/status?id=...&oferta=...&payment_intent=... */
export default function DeliveryPaymentStatusPage() {
  return (
    <>
      <FlowTopBar title="Pagamento" backHref="/homepage" />
      <WithSearchParams>
        {(params) => {
          const id = params.get('id');
          // payment_intent é adicionado pelo app ou pelo próprio Stripe (ao voltar de um redirecionamento)
          const paymentIntent = params.get('payment_intent');
          if (!id) return <Redirect to="/homepage" />;
          if (!paymentIntent) return <Redirect to={routes.delivery(id)} />;
          return (
            <PaymentStatusScreen kind="delivery" paymentIntentId={paymentIntent} referenceId={id} offerId={params.get('oferta') ?? undefined} />
          );
        }}
      </WithSearchParams>
    </>
  );
}
