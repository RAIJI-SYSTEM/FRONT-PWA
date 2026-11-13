'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import BookingDetailScreen from '@/features/ride/components/BookingDetailScreen';

/** /viagem/reserva?id=... — detalhes da minha reserva (bagagem, cancelar) */
export default function BookingPage() {
  return (
    <>
      <FlowTopBar title="Minha reserva" backHref="/corridas" />
      <WithSearchParams>
        {(params) => {
          const id = params.get('id');
          if (!id) return <Redirect to="/corridas" />;
          return <BookingDetailScreen bookingId={id} />;
        }}
      </WithSearchParams>
    </>
  );
}
