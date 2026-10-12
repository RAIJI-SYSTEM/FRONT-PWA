import type Stripe from 'stripe';
import { handlePaymentSucceeded } from '@/server/payments';
import { getStripe } from '@/server/stripe';

/**
 * Webhook do Stripe: a fonte da verdade sobre o pagamento.
 * A tela de status é só para o passageiro; quem confirma a passagem de fato é este endpoint,
 * porque ele roda mesmo que o passageiro feche o app (importante no Pix, que é assíncrono).
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!secret || !signature) return new Response('Webhook não configurado', { status: 400 });

  let event: Stripe.Event;
  try {
    // A assinatura é calculada sobre o corpo bruto, por isso request.text() e não request.json()
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response('Assinatura inválida', { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      // "Pagamento concluído" (encomendas: gera a palavra-chave)
      handlePaymentSucceeded(event.data.object.metadata);
      console.info('[stripe] pagamento aprovado', event.data.object.metadata);
      break;
    }
    case 'payment_intent.payment_failed': {
      // TODO: "Avisar recusa" → registrar e notificar o passageiro (push/e-mail)
      console.info('[stripe] pagamento recusado', event.data.object.id);
      break;
    }
  }

  return Response.json({ received: true });
}
