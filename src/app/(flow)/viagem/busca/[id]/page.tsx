import FlowTopBar from '@/components/FlowTopBar';
import RideSearchScreen from '@/features/ride/components/RideSearchScreen';

export default async function RideSearchPage({ params }: PageProps<'/viagem/busca/[id]'>) {
  const { id } = await params;

  return (
    <>
      <FlowTopBar title="Sua viagem" backHref="/homepage" />
      <RideSearchScreen searchId={id} />
    </>
  );
}
