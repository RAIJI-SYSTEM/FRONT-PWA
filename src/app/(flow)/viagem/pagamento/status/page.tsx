import { redirect } from 'next/navigation';
import FlowTopBar from '@/components/FlowTopBar';
import PaymentStatusScreen from '@/features/payment/components/PaymentStatusScreen';

export default async function PaymentStatusPage({ searchParams }: PageProps<'/viagem/pagamento/status'>) {
  // payment_intent é adicionado pelo app ou pelo próprio Stripe (ao voltar de um redirecionamento)
  const { payment_intent, busca, oferta } = await searchParams;
  if (typeof payment_intent !== 'string') redirect('/homepage');

  return (
    <>
      <FlowTopBar title="Pagamento" backHref="/homepage" />
      <PaymentStatusScreen
        paymentIntentId={payment_intent}
        searchId={typeof busca === 'string' ? busca : undefined}
        offerId={typeof oferta === 'string' ? oferta : undefined}
      />
    </>
  );
}
