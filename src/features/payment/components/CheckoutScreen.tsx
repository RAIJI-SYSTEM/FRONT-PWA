'use client';

import { useEffect, useState } from 'react';
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
import { getDelivery } from '@/services/deliveries';
import { createPayment } from '@/services/payments';
import { getRideSearch } from '@/services/rideSearch';
import type { CreatePaymentResponse, PaymentKind } from '@/types/payment';
import type { Place } from '@/types/place';
import type { RideOffer } from '@/types/ride';
import { formatCurrency } from '@/utils/formatCurrency';
import { useStripeAppearance } from '../hooks/useStripeAppearance';
import { paymentPaths } from '../paths';
import CheckoutForm from './CheckoutForm';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// Carregado uma única vez, fora do componente, como recomenda o Stripe
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface CheckoutScreenProps {
  kind: PaymentKind;
  /** ID da busca de viagem ou da entrega */
  referenceId: string;
  offerId: string;
}

interface CheckoutData {
  route: { origin: Place; destination: Place };
  offer: RideOffer;
  payment: CreatePaymentResponse;
}

/** Viagem e encomenda têm origem, destino e ofertas: basta buscar no lugar certo */
const loadReference = (kind: PaymentKind, id: string) => (kind === 'delivery' ? getDelivery(id) : getRideSearch(id));

export default function CheckoutScreen({ kind, referenceId, offerId }: CheckoutScreenProps) {
  const appearance = useStripeAppearance();
  const [data, setData] = useState<CheckoutData | null>(null);
  const [error, setError] = useState<string | null>(stripePromise ? null : 'Stripe não configurado: defina NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no .env.local');

  useEffect(() => {
    if (!stripePromise) return;
    let active = true;

    Promise.all([loadReference(kind, referenceId), createPayment({ kind, referenceId, offerId })])
      .then(([reference, payment]) => {
        const offer = reference.offers.find((o) => o.id === offerId);
        if (!active) return;
        if (!offer) throw new Error('Esta oferta não está mais disponível.');
        setData({ route: { origin: reference.origin, destination: reference.destination }, offer, payment });
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento.'));

    return () => {
      active = false;
    };
  }, [kind, referenceId, offerId]);

  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  if (!data) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const { route, offer, payment } = data;
  const statusPath = paymentPaths[kind].status(referenceId, offerId);

  return (
    <Stack spacing={2.5}>
      {/* Resumo da viagem escolhida */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>
            {offer.driverName.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }} noWrap>
              {offer.driverName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {offer.vehicle}
            </Typography>
          </Box>
        </Stack>
        <RouteSummary origin={route.origin.name} destination={route.destination.name} />
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
        <Elements stripe={stripePromise} options={{ clientSecret: payment.clientSecret, appearance, locale: 'pt-BR' }}>
          <CheckoutForm amountCents={payment.amountCents} statusPath={statusPath} />
        </Elements>
      </Paper>
    </Stack>
  );
}
