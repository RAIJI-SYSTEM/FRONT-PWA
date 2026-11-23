'use client';

import WithSearchParams from '@/components/WithSearchParams';
import DriverWorkScreen, { workFilterFromParam, workTabFromParam } from '@/features/driver/components/DriverWorkScreen';

/** Mural da região e pedidos nas viagens do motorista (?aba=regiao|pedidos|minhas, ?tipo=caronas|encomendas) */
export default function DriverRequestsPage() {
  return (
    <WithSearchParams>
      {(params) => (
        <DriverWorkScreen initialKind={workFilterFromParam(params.get('tipo'))} initialTab={workTabFromParam(params.get('aba'))} />
      )}
    </WithSearchParams>
  );
}
