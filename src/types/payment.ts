/** O que está sendo pago: uma passagem ou uma encomenda */
export type PaymentKind = 'ride' | 'delivery';

/** Status simplificado do pagamento, derivado do PaymentIntent do Stripe */
export type PaymentStatus = 'processing' | 'succeeded' | 'failed';

export interface CreatePaymentRequest {
  kind: PaymentKind;
  /** ID da busca de viagem ou da entrega */
  referenceId: string;
  offerId: string;
}

export interface CreatePaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
}

export interface PaymentStatusResponse {
  status: PaymentStatus;
  /** Motivo da recusa, quando houver */
  message?: string;
  /** Encomendas: palavra-chave gerada após o pagamento */
  keyword?: string;
}
