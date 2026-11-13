'use client';

import FlowTopBar from '@/components/FlowTopBar';
import DriverFreightScreen from '@/features/driver/components/DriverFreightScreen';

export default function DriverFreightPage() {
  return (
    <>
      <FlowTopBar title="Fretes" backHref="/motorista" />
      <DriverFreightScreen />
    </>
  );
}
