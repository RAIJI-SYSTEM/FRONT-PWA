import { redirect } from 'next/navigation';
import FlowTopBar from '@/components/FlowTopBar';
import CheckoutScreen from '@/features/payment/components/CheckoutScreen';

export default async function DeliveryCheckoutPage({ params, searchParams }: PageProps<'/encomenda/[id]/pagamento'>) {
  const { id } = await params;
  const { oferta } = await searchParams;
  if (typeof oferta !== 'string') redirect(`/encomenda/${id}`);

  return (
    <>
      <FlowTopBar title="Pagamento" />
      <CheckoutScreen kind="delivery" referenceId={id} offerId={oferta} />
    </>
  );
}
