'use client';

import WithSearchParams from '@/components/WithSearchParams';
import DriverWorkScreen from '@/features/driver/components/DriverWorkScreen';

/** Encomendas: disponíveis na região e as que o motorista aceitou */
export default function DriverDeliveriesPage() {
  return (
    <WithSearchParams>{(params) => <DriverWorkScreen kind="delivery" initialTab={params.get('aba') === 'minhas' ? 'minhas' : 'regiao'} />}</WithSearchParams>
  );
}
