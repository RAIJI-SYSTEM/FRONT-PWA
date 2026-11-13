'use client';

import FlowTopBar from '@/components/FlowTopBar';
import CompanyHomeScreen from '@/features/company/components/CompanyHomeScreen';

export default function CompanyPage() {
  return (
    <>
      <FlowTopBar title="Empresa" />
      <CompanyHomeScreen />
    </>
  );
}
