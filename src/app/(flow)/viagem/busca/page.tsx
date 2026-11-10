'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import RideSearchScreen from '@/features/ride/components/RideSearchScreen';

/** /viagem/busca?id=... */
export default function RideSearchPage() {
  return (
    <>
      <FlowTopBar title="Sua viagem" backHref="/homepage" />
      <WithSearchParams>
        {(params) => {
          const id = params.get('id');
          return id ? <RideSearchScreen key={id} searchId={id} /> : <Redirect to="/viagem/nova" />;
        }}
      </WithSearchParams>
    </>
  );
}
