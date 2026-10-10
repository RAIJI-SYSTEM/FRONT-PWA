import Stripe from 'stripe';

let client: Stripe | null = null;

export class StripeNotConfiguredError extends Error {
  constructor() {
    super('Stripe não configurado: defina STRIPE_SECRET_KEY no .env.local');
  }
}

/** Cliente do Stripe para uso exclusivo no servidor (a chave secreta nunca vai para o navegador). */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new StripeNotConfiguredError();
  client ??= new Stripe(key);
  return client;
}
