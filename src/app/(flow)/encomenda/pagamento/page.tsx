'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import CheckoutScreen from '@/features/payment/components/CheckoutScreen';
import { paymentTargetFrom } from '@/features/payment/paths';

/** /encomenda/pagamento?id=... — pagar depois que o motorista aceitou */
export default function CheckoutPage() {
  return (
    <>
      <FlowTopBar title="Pagamento" />
      <WithSearchParams>
        {(params) => {
          const target = paymentTargetFrom('delivery', params);
          return target ? <CheckoutScreen target={target} /> : <Redirect to="/encomendas" />;
        }}
      </WithSearchParams>
    </>
  );
}
