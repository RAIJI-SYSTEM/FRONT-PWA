import { findPayableOffer } from '@/server/payments';
import { getStripe, StripeConfigError } from '@/server/stripe';
import type { CreatePaymentRequest, CreatePaymentResponse } from '@/types/payment';

/**
 * Cria o PaymentIntent da passagem ou encomenda escolhida.
 * O valor vem da oferta guardada no servidor — o cliente só informa quais IDs escolheu.
 */
export async function POST(request: Request) {
  const { kind, referenceId, offerId } = (await request.json().catch(() => ({}))) as Partial<CreatePaymentRequest>;
  if ((kind !== 'ride' && kind !== 'delivery') || !referenceId || !offerId) {
    return Response.json({ error: 'Informe o que está sendo pago e a oferta escolhida.' }, { status: 400 });
  }

  const offer = findPayableOffer(kind, referenceId, offerId);
  if (!offer) return Response.json({ error: 'Oferta não encontrada ou expirada.' }, { status: 404 });

  try {
    const paymentIntent = await getStripe().paymentIntents.create(
      {
        amount: offer.priceCents,
        currency: 'brl',
        // Método de pagamento? → cartão ou pix (o Payment Element mostra as duas abas)
        allowed_payment_method_types: ['card', 'pix'],
        metadata: { kind, referenceId, offerId },
      },
      // Evita cobrar duas vezes se o passageiro tocar no botão de novo
      { idempotencyKey: `${kind}-${referenceId}-${offerId}` },
    );

    const body: CreatePaymentResponse = {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      amountCents: paymentIntent.amount,
    };
    return Response.json(body, { status: 201 });
  } catch (error) {
    if (error instanceof StripeConfigError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error('[payments] erro ao criar PaymentIntent', error);
    return Response.json({ error: 'Não foi possível iniciar o pagamento.' }, { status: 502 });
  }
}
