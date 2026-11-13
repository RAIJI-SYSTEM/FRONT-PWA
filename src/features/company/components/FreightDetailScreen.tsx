'use client';

import { useState } from 'react';
import { Check, KeyRound } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DeliveryKeyword from '@/features/delivery/components/DeliveryKeyword';
import { fromBrazilLocal, toCents } from '@/services/backend/client';
import { usePolling } from '@/hooks/usePolling';
import { acceptFreightOffer, cancelFreight, getFreight, listFreightOffers } from '@/services/companies';
import { getDeliveryApi } from '@/services/deliveries';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { FREIGHT_STATUS, OFFER_STATUS } from './freightLabels';

const keepPolling = () => true;
const loadFreight = async (id: string) => {
  const freight = await getFreight(id);
  const offers = freight.direct ? [] : await listFreightOffers(id);
  const delivery = freight.deliveryId ? await getDeliveryApi(freight.deliveryId) : null;
  return { freight, offers, delivery };
};

const pill = { borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;

/** Um frete da empresa: ofertas (pedido público), escolher, cancelar; fechado = códigos da encomenda */
export default function FreightDetailScreen({ freightId }: { freightId: string }) {
  // Ofertas chegam a qualquer momento: consulta a cada 20s
  const [round, setRound] = useState(0);
  const { data, error } = usePolling(`freight:${freightId}:${round}`, () => loadFreight(freightId), keepPolling, 20_000);
  const freight = data?.freight ?? null;
  const offers = data?.offers ?? [];
  const delivery = data?.delivery ?? null;
  const load = async () => setRound((r) => r + 1);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice(message);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!freight) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const at = fromBrazilLocal(freight.desiredDate);
  const status = FREIGHT_STATUS[freight.status];
  const open = freight.status === 'OPEN';

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 800 }}>
            {freight.originCity} → {freight.destinationCity}
          </Typography>
          <Chip size="small" label={status.label} color={status.color} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {formatDate(at)} às {formatTime(at)} · {freight.direct ? 'Proposta direta' : 'Pedido público'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {freight.description} · {freight.weightKg} kg{freight.fragile ? ' · frágil' : ''}
        </Typography>
        <Typography variant="body2">Para {freight.recipientName} · {freight.recipientPhone}</Typography>
        {freight.offeredPrice !== null && (
          <Typography sx={{ fontWeight: 700, mt: 1 }}>
            {freight.direct ? 'Valor proposto' : 'Referência'}: {formatCurrency(toCents(freight.offeredPrice))}
          </Typography>
        )}
        {freight.declineReason && <Alert severity="warning" sx={{ mt: 1 }}>Recusado: {freight.declineReason}</Alert>}
        {open && (
          <Button color="error" size="small" disabled={busy} sx={{ ...pill, mt: 1 }} onClick={() => run(() => cancelFreight(freight.id), 'Frete cancelado.')}>
            Cancelar frete
          </Button>
        )}
      </Paper>

      {notice && (
        <Alert severity="info" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {!freight.direct && (
        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 700 }}>Ofertas dos motoristas</Typography>
          {offers.length === 0 && <Typography color="text.secondary">Ainda sem ofertas. Avisaremos quando chegar uma.</Typography>}
          {offers.map((o, i) => (
            <Paper key={o.id} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{o.driverName ?? 'Motorista'}</Typography>
                  {o.message && (
                    <Typography variant="body2" color="text.secondary">
                      “{o.message}”
                    </Typography>
                  )}
                </Box>
                <Stack sx={{ alignItems: 'flex-end' }}>
                  <Typography sx={{ fontWeight: 800 }}>{formatCurrency(toCents(o.price))}</Typography>
                  {i === 0 && o.status === 'PENDING' && <Chip size="small" color="primary" label="Mais barata" />}
                  {o.status !== 'PENDING' && <Chip size="small" label={OFFER_STATUS[o.status]} />}
                </Stack>
              </Stack>
              {open && o.status === 'PENDING' && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Check size={16} />}
                  disabled={busy}
                  sx={{ ...pill, mt: 1 }}
                  onClick={() => run(() => acceptFreightOffer(freight.id, o.id), 'Frete fechado! A viagem foi criada para o motorista.')}
                >
                  Escolher esta oferta
                </Button>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      {delivery && (
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700, alignSelf: 'flex-start' }}>Encomenda: {delivery.status === 'DELIVERED' ? 'entregue' : 'em andamento'}</Typography>
          {delivery.pickupCode && delivery.status === 'CONFIRMED' && (
            <Paper variant="outlined" sx={{ width: '100%', maxWidth: 420, p: 2.5, borderRadius: 3, textAlign: 'center' }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center', color: 'text.secondary' }}>
                <KeyRound size={16} />
                <Typography variant="body2">Código de coleta (mostre ao motorista)</Typography>
              </Stack>
              <Typography sx={{ fontWeight: 800, fontSize: '2rem', letterSpacing: 6 }}>{delivery.pickupCode}</Typography>
            </Paper>
          )}
          {delivery.deliveryKeyword && delivery.status !== 'DELIVERED' && (
            <DeliveryKeyword keyword={delivery.deliveryKeyword} recipientName={delivery.recipientName} />
          )}
        </Stack>
      )}
    </Stack>
  );
}
