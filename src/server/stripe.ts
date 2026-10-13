/**
 * Cliente do Stripe — EXCLUSIVO DO SERVIDOR.
 *
 * Toda chamada que usa a chave secreta (criar cobrança, consultar pagamento, reembolsar,
 * validar webhook) passa por aqui. O `import 'server-only'` faz o build falhar se algum
 * componente do navegador importar este arquivo, então a chave secreta nunca vaza para o app.
 */
import 'server-only';
import Stripe from 'stripe';

/**
 * Versão da API fixada (a mesma do SDK instalado). Assim, uma mudança do Stripe não altera
 * o formato das respostas sem você perceber. Atualize junto com o pacote `stripe`.
 */
const API_VERSION: Stripe.LatestApiVersion = '2026-09-30.endive';

export type StripeMode = 'test' | 'live';

export class StripeConfigError extends Error {}

export class StripeNotConfiguredError extends StripeConfigError {
  constructor(variable = 'STRIPE_SECRET_KEY') {
    super(`Stripe não configurado: defina ${variable} no .env.local`);
  }
}

/** "sk_test_..." → "test" */
const modeOf = (key: string): StripeMode => (key.includes('_live_') ? 'live' : 'test');

/**
 * Lê e valida a chave secreta. Aceita a secreta (sk_) ou, de preferência em produção,
 * uma chave restrita (rk_), que só tem as permissões que o app usa.
 */
function readSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new StripeNotConfiguredError();
  if (key.startsWith('pk_')) {
    throw new StripeConfigError('STRIPE_SECRET_KEY contém a chave publicável (pk_). Use a chave secreta (sk_) ou restrita (rk_).');
  }
  if (!/^(sk|rk)_(test|live)_/.test(key)) {
    throw new StripeConfigError('STRIPE_SECRET_KEY em formato inesperado. Copie a chave em dashboard.stripe.com/apikeys.');
  }

  // As duas chaves precisam ser do mesmo modo: teste com teste, produção com produção
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (publishable && modeOf(publishable) !== modeOf(key)) {
    throw new StripeConfigError('As chaves do Stripe estão misturadas: uma é de teste e a outra de produção.');
  }
  if (process.env.NODE_ENV !== 'production' && modeOf(key) === 'live') {
    console.warn('[stripe] Usando chave de PRODUÇÃO fora do ambiente de produção. Pagamentos serão reais.');
  }
  return key;
}

let client: Stripe | null = null;

/** Cliente do Stripe (criado uma vez e reaproveitado) */
export function getStripe() {
  client ??= new Stripe(readSecretKey(), {
    apiVersion: API_VERSION,
    // Repete automaticamente falhas de rede (o SDK usa chave de idempotência nas repetições)
    maxNetworkRetries: 2,
    timeout: 20_000,
    appInfo: { name: 'Raiji', version: process.env.npm_package_version ?? '0.1.0' },
  });
  return client;
}

/** Modo atual: "test" ou "live" (útil para avisos na interface de administração) */
export const getStripeMode = (): StripeMode => modeOf(readSecretKey());

/** Segredo usado para validar que um webhook veio mesmo do Stripe */
export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new StripeNotConfiguredError('STRIPE_WEBHOOK_SECRET');
  if (!secret.startsWith('whsec_')) throw new StripeConfigError('STRIPE_WEBHOOK_SECRET deve começar com "whsec_".');
  return secret;
}
