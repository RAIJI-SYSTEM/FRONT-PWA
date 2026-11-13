'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import RideManageScreen from '@/features/driver/components/RideManageScreen';

/** /motorista/rotas/gerenciar?id=... — pedidos, encomendas e ciclo da viagem */
export default function RideManagePage() {
  return (
    <>
      <FlowTopBar title="Gerenciar viagem" backHref="/motorista/rotas" />
      <WithSearchParams>
        {(params) => {
          const id = params.get('id');
          if (!id) return <Redirect to="/motorista/rotas" />;
          return <RideManageScreen rideId={id} />;
        }}
      </WithSearchParams>
    </>
  );
}
