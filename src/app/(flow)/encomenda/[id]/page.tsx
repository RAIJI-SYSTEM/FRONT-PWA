import FlowTopBar from '@/components/FlowTopBar';
import DeliveryScreen from '@/features/delivery/components/DeliveryScreen';

export default async function DeliveryPage({ params }: PageProps<'/encomenda/[id]'>) {
  const { id } = await params;
  return (
    <>
      <FlowTopBar title="Sua encomenda" backHref="/homepage" />
      <DeliveryScreen deliveryId={id} />
    </>
  );
}
