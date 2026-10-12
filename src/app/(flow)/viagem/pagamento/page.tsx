import { redirect } from 'next/navigation';
import FlowTopBar from '@/components/FlowTopBar';
import CheckoutScreen from '@/features/payment/components/CheckoutScreen';

export default async function CheckoutPage({ searchParams }: PageProps<'/viagem/pagamento'>) {
  const { busca, oferta } = await searchParams;
  if (typeof busca !== 'string' || typeof oferta !== 'string') redirect('/viagem/nova');

  return (
    <>
      <FlowTopBar title="Pagamento" />
      <CheckoutScreen kind="ride" referenceId={busca} offerId={oferta} />
    </>
  );
}
