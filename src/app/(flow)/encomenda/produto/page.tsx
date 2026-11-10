'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import DeliveryDetailsScreen from '@/features/delivery/components/DeliveryDetailsScreen';

/** /encomenda/produto?id=... */
export default function DeliveryDetailsPage() {
  return (
    <>
      <FlowTopBar title="Dados do pacote" />
      <WithSearchParams>
        {(params) => {
          const id = params.get('id');
          return id ? <DeliveryDetailsScreen deliveryId={id} /> : <Redirect to="/encomenda/nova" />;
        }}
      </WithSearchParams>
    </>
  );
}
