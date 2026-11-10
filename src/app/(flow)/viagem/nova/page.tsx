'use client';

import WithSearchParams from '@/components/WithSearchParams';
import NewRideScreen from '@/features/ride/components/NewRideScreen';

export default function NewRidePage() {
  // A barra de título fica dentro da tela, que ocupa a viewport inteira por causa do mapa
  return <WithSearchParams>{(params) => <NewRideScreen initialMode={params.get('quando') === 'agendar' ? 'scheduled' : 'now'} />}</WithSearchParams>;
}
