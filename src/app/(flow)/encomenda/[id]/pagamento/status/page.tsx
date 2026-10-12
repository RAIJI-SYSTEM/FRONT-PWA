import { redirect } from 'next/navigation';
import FlowTopBar from '@/components/FlowTopBar';
import PaymentStatusScreen from '@/features/payment/components/PaymentStatusScreen';

export default async function DeliveryPaymentStatusPage({
  params,
  searchParams,
}: PageProps<'/encomenda/[id]/pagamento/status'>) {
  const { id } = await params;
  // payment_intent é adicionado pelo app ou pelo próprio Stripe (ao voltar de um redirecionamento)
  const { payment_intent, oferta } = await searchParams;
  if (typeof payment_intent !== 'string') redirect(`/encomenda/${id}`);

  return (
    <>
      <FlowTopBar title="Pagamento" backHref="/homepage" />
      <PaymentStatusScreen
        kind="delivery"
        paymentIntentId={payment_intent}
        referenceId={id}
        offerId={typeof oferta === 'string' ? oferta : undefined}
      />
    </>
  );
}
