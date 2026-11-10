'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import CheckoutScreen from '@/features/payment/components/CheckoutScreen';

/** /viagem/pagamento?busca=...&oferta=... */
export default function CheckoutPage() {
  return (
    <>
      <FlowTopBar title="Pagamento" />
      <WithSearchParams>
        {(params) => {
          const search = params.get('busca');
          const offer = params.get('oferta');
          if (!search || !offer) return <Redirect to="/viagem/nova" />;
          return <CheckoutScreen kind="ride" referenceId={search} offerId={offer} />;
        }}
      </WithSearchParams>
    </>
  );
}
