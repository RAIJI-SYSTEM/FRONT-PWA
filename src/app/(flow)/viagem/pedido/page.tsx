'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import RideRequestScreen from '@/features/ride/components/RideRequestScreen';

/** /viagem/pedido?busca=...&carona=... — pedir vaga numa carona encontrada */
export default function RideRequestPage() {
  return (
    <>
      <FlowTopBar title="Pedir vaga" />
      <WithSearchParams>
        {(params) => {
          const search = params.get('busca');
          const ride = params.get('carona');
          if (!search || !ride) return <Redirect to="/viagem/nova" />;
          return <RideRequestScreen searchId={search} rideId={ride} />;
        }}
      </WithSearchParams>
    </>
  );
}
