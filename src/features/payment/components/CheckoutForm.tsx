'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Lock } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatCurrency } from '@/utils/formatCurrency';

interface CheckoutFormProps {
  amountCents: number;
  /** Página de status para onde o passageiro vai após confirmar (inclui busca e oferta na query) */
  statusPath: string;
}

/** "Informar método e dados de pagamento": abas de cartão e Pix do Payment Element */
export default function CheckoutForm({ amountCents, statusPath }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setError(null);
    setSubmitting(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      // Usado só por métodos que redirecionam (ex.: autenticação 3DS de alguns bancos)
      confirmParams: { return_url: `${window.location.origin}${statusPath}` },
      // Cartão e Pix são resolvidos aqui mesmo (o Pix abre o QR Code numa janela do Stripe)
      redirect: 'if_required',
    });

    if (stripeError) {
      // Cartão recusado, dados inválidos etc.: o passageiro pode corrigir e tentar de novo
      setError(stripeError.message ?? 'Pagamento não autorizado.');
      setSubmitting(false);
      return;
    }

    const separator = statusPath.includes('?') ? '&' : '?';
    router.push(`${statusPath}${separator}payment_intent=${paymentIntent.id}`);
  };

  return (
    <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
      <PaymentElement
        onReady={() => setReady(true)}
        options={{ layout: 'tabs', paymentMethodOrder: ['card', 'pix'] }}
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Button
        type="submit"
        variant="contained"
        disabled={!stripe || !ready || submitting}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Lock size={18} />}
        sx={{ height: 56, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none', boxShadow: 3 }}
      >
        Pagar {formatCurrency(amountCents)}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        Pagamento processado com segurança pelo Stripe. Não armazenamos os dados do seu cartão.
      </Typography>
    </Stack>
  );
}
