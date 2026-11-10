'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import DeliveryScreen from '@/features/delivery/components/DeliveryScreen';

/** /encomenda?id=... */
export default function DeliveryPage() {
  return (
    <>
      <FlowTopBar title="Sua encomenda" backHref="/homepage" />
      <WithSearchParams>
        {(params) => {
          const id = params.get('id');
          return id ? <DeliveryScreen deliveryId={id} /> : <Redirect to="/encomenda/nova" />;
        }}
      </WithSearchParams>
    </>
  );
}
