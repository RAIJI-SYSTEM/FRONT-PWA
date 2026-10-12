import FlowTopBar from '@/components/FlowTopBar';
import DeliveryDetailsScreen from '@/features/delivery/components/DeliveryDetailsScreen';

export default async function DeliveryDetailsPage({ params }: PageProps<'/encomenda/[id]/produto'>) {
  const { id } = await params;
  return (
    <>
      <FlowTopBar title="Dados do pacote" />
      <DeliveryDetailsScreen deliveryId={id} />
    </>
  );
}
