'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RouteSummary from '@/features/activities/components/RouteSummary';
import { useQuery } from '@/hooks/useQuery';
import { getDeliveryApi } from '@/services/deliveries';
import { startPayment } from '@/services/payments';
import { getRide } from '@/services/rides';
import type { PaymentTarget } from '@/types/payment';
import { formatCurrency } from '@/utils/formatCurrency';
import { STRIPE_FONTS, useStripeAppearance } from '../hooks/useStripeAppearance';
import { paymentPaths } from '../paths';
import CheckoutForm from './CheckoutForm';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// Carregado uma única vez, fora do componente, como recomenda o Stripe
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface Summary {
  driverName: string;
  origin: string;
  destination: string;
  description: string;
}

/** Resumo do que está sendo pago (motorista e trajeto), lido do backend */
async function loadSummary(target: PaymentTarget): Promise<Summary> {
  if (target.kind === 'ride') {
    const { ride } = await getRide(target.rideId);
    return {
      driverName: ride.driverName ?? 'Motorista',
      origin: `${ride.originCity}, ${ride.originState}`,
      destination: `${ride.destinationCity}, ${ride.destinationState}`,
      description: 'Vaga na carona',
    };
  }
  const delivery = await getDeliveryApi(target.deliveryId);
  return {
    driverName: delivery.ride?.driverName ?? 'Motorista',
    origin: delivery.pickupAddress ?? delivery.ride?.originCity ?? 'Origem',
    destination: delivery.dropoffAddress ?? delivery.ride?.destinationCity ?? 'Destino',
    description: 'Envio da encomenda',
  };
}

/** "Informar método e dados de pagamento" de uma reserva ou encomenda já aceita pelo motorista */
export default function CheckoutScreen({ target }: { target: PaymentTarget }) {
  const router = useRouter();
  const appearance = useStripeAppearance();
  const statusPath = paymentPaths.status(target);
  // A URL identifica o pedido: a cobrança só é iniciada de novo se o pedido mudar
  const { data, error } = useQuery(stripePromise ? statusPath : null, () =>
    Promise.all([loadSummary(target), startPayment(target), stripePromise]).then(([summary, payment, stripe]) => ({
      summary,
      payment,
      stripe,
    })),
  );
  const alreadySettled = data && !data.payment.clientSecret;

  // Já pago, Pix aguardando o banco ou estornado: não há formulário, só a situação
  useEffect(() => {
    if (alreadySettled) router.replace(statusPath);
  }, [alreadySettled, router, statusPath]);

  if (!stripePromise) {
    return <Alert severity="error" sx={{ mt: 2 }}>Stripe não configurado: defina NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no .env.local</Alert>;
  }
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  const clientSecret = data?.payment.clientSecret;
  if (!data || !clientSecret) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }} role="status" aria-label="Preparando o pagamento">
        <CircularProgress />
      </Stack>
    );
  }

  const { summary, payment } = data;

  return (
    <Stack spacing={2.5}>
      {/* Resumo do que está sendo pago */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>
            {summary.driverName.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }} noWrap>
              {summary.driverName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {summary.description}
            </Typography>
          </Box>
        </Stack>
        <RouteSummary origin={summary.origin} destination={summary.destination} />
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography color="text.secondary">Total</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '1.375rem' }}>{formatCurrency(payment.amountCents)}</Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Forma de pagamento
        </Typography>
        {/* A instância já carregada (e não a promessa): o <Elements> do react-stripe-js 7 perde a
            promessa no modo estrito do React (desenvolvimento) e o formulário não aparece */}
        <Elements
          stripe={data.stripe}
          options={{ clientSecret, appearance, fonts: STRIPE_FONTS, locale: 'pt-BR' }}
        >
          <CheckoutForm amountCents={payment.amountCents} statusPath={statusPath} />
        </Elements>
      </Paper>
    </Stack>
  );
}
