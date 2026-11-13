'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import CompanyDetailScreen from '@/features/company/components/CompanyDetailScreen';

/** /empresa/detalhe?id=... */
export default function CompanyDetailPage() {
  return (
    <>
      <FlowTopBar title="Empresa" backHref="/empresa" />
      <WithSearchParams>
        {(params) => {
          const id = params.get('id');
          if (!id) return <Redirect to="/empresa" />;
          return <CompanyDetailScreen companyId={id} />;
        }}
      </WithSearchParams>
    </>
  );
}
