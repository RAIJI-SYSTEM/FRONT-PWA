'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import CheckoutScreen from '@/features/payment/components/CheckoutScreen';
import { routes } from '@/utils/routes';

/** /encomenda/pagamento?id=...&oferta=... */
export default function DeliveryCheckoutPage() {
  return (
    <>
      <FlowTopBar title="Pagamento" />
      <WithSearchParams>
        {(params) => {
          const id = params.get('id');
          const offer = params.get('oferta');
          if (!id) return <Redirect to="/encomenda/nova" />;
          if (!offer) return <Redirect to={routes.delivery(id)} />;
          return <CheckoutScreen kind="delivery" referenceId={id} offerId={offer} />;
        }}
      </WithSearchParams>
    </>
  );
}
