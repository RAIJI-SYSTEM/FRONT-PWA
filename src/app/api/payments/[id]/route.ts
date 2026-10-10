import { getStripe, StripeNotConfiguredError } from '@/server/stripe';
import type { PaymentStatusResponse } from '@/types/payment';

/** "Aguardar retorno": a tela de status consulta aqui até o pagamento ser aprovado ou recusado */
export async function GET(_request: Request, ctx: RouteContext<'/api/payments/[id]'>) {
  const { id } = await ctx.params;

  try {
    const intent = await getStripe().paymentIntents.retrieve(id);

    let body: PaymentStatusResponse;
    if (intent.status === 'succeeded') {
      body = { status: 'succeeded' };
    } else if (intent.status === 'canceled' || intent.last_payment_error) {
      body = { status: 'failed', message: intent.last_payment_error?.message };
    } else {
      // processing / requires_action (ex.: Pix aguardando o QR Code ser pago)
      body = { status: 'processing' };
    }
    return Response.json(body);
  } catch (error) {
    if (error instanceof StripeNotConfiguredError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    return Response.json({ error: 'Pagamento não encontrado.' }, { status: 404 });
  }
}
