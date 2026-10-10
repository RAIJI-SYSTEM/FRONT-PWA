/** Status simplificado do pagamento, derivado do PaymentIntent do Stripe */
export type PaymentStatus = 'processing' | 'succeeded' | 'failed';

export interface CreatePaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
}

export interface PaymentStatusResponse {
  status: PaymentStatus;
  /** Motivo da recusa, quando houver */
  message?: string;
}
