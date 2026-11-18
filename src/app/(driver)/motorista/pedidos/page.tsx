'use client';

import WithSearchParams from '@/components/WithSearchParams';
import DriverWorkScreen, { workFilterFromParam } from '@/features/driver/components/DriverWorkScreen';

/** Pedidos de vaga e de encomenda nas viagens do motorista (?aba=minhas, ?tipo=caronas|encomendas) */
export default function DriverRequestsPage() {
  return (
    <WithSearchParams>
      {(params) => (
        <DriverWorkScreen initialKind={workFilterFromParam(params.get('tipo'))} initialTab={params.get('aba') === 'minhas' ? 'minhas' : 'regiao'} />
      )}
    </WithSearchParams>
  );
}
