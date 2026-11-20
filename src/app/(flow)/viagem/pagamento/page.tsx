'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import CheckoutScreen from '@/features/payment/components/CheckoutScreen';
import { paymentTargetFrom } from '@/features/payment/paths';

/** /viagem/pagamento?carona=...&reserva=... — pagar depois que o motorista aceitou */
export default function CheckoutPage() {
  return (
    <>
      <FlowTopBar title="Pagamento" />
      <WithSearchParams>
        {(params) => {
          const target = paymentTargetFrom('ride', params);
          return target ? <CheckoutScreen target={target} /> : <Redirect to="/corridas" />;
        }}
      </WithSearchParams>
    </>
  );
}
