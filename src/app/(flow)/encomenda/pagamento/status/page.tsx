'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import PaymentStatusScreen from '@/features/payment/components/PaymentStatusScreen';
import { paymentTargetFrom } from '@/features/payment/paths';

/** Situação do pagamento, conferida pelo backend (o Stripe também volta para cá após o 3DS) */
export default function PaymentStatusPage() {
  return (
    <>
      <FlowTopBar title="Pagamento" backHref="/encomendas" />
      <WithSearchParams>
        {(params) => {
          const target = paymentTargetFrom('delivery', params);
          return target ? <PaymentStatusScreen target={target} /> : <Redirect to="/encomendas" />;
        }}
      </WithSearchParams>
    </>
  );
}
