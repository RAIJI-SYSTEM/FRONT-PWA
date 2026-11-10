'use client';

import WithSearchParams from '@/components/WithSearchParams';
import DriverWorkScreen from '@/features/driver/components/DriverWorkScreen';

/** Caronas: disponíveis na região e as que o motorista aceitou */
export default function DriverRidesPage() {
  return <WithSearchParams>{(params) => <DriverWorkScreen kind="ride" initialTab={params.get('aba') === 'minhas' ? 'minhas' : 'regiao'} />}</WithSearchParams>;
}
