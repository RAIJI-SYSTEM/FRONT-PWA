'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import FreightDetailScreen from '@/features/company/components/FreightDetailScreen';

/** /empresa/frete?id=... */
export default function FreightPage() {
  return (
    <>
      <FlowTopBar title="Frete" />
      <WithSearchParams>
        {(params) => {
          const id = params.get('id');
          if (!id) return <Redirect to="/empresa" />;
          return <FreightDetailScreen freightId={id} />;
        }}
      </WithSearchParams>
    </>
  );
}
