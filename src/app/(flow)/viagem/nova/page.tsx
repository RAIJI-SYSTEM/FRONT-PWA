import NewRideScreen from '@/features/ride/components/NewRideScreen';

export default async function NewRidePage({ searchParams }: PageProps<'/viagem/nova'>) {
  const { quando } = await searchParams;
  // A barra de título fica dentro da tela, que ocupa a viewport inteira por causa do mapa
  return <NewRideScreen initialMode={quando === 'agendar' ? 'scheduled' : 'now'} />;
}
