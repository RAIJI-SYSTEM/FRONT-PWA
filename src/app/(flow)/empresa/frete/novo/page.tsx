'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import NewFreightScreen from '@/features/company/components/NewFreightScreen';

/** /empresa/frete/novo?empresa=... */
export default function NewFreightPage() {
  return (
    <>
      <FlowTopBar title="Novo frete" />
      <WithSearchParams>
        {(params) => {
          const id = params.get('empresa');
          if (!id) return <Redirect to="/empresa" />;
          return <NewFreightScreen companyId={id} />;
        }}
      </WithSearchParams>
    </>
  );
}
