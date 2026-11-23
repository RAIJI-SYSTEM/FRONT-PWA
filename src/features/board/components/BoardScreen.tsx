'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, KeyRound, Megaphone, Package } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RouteSummary from '@/features/activities/components/RouteSummary';
import { OFFER_STATUS } from '@/features/company/components/freightLabels';
import DeliveryKeyword from '@/features/delivery/components/DeliveryKeyword';
import { paymentPaths } from '@/features/payment/paths';
import { usePolling } from '@/hooks/usePolling';
import { fromBrazilLocal, toCents } from '@/services/backend/client';
import { acceptBoardOffer, cancelBoard, getBoard, listBoardOffers } from '@/services/board';
import { getDeliveryApi } from '@/services/deliveries';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { BOARD_STATUS, boardWhen } from '../boardLabels';

const pill = { borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;
/** Ofertas podem chegar a qualquer momento enquanto o pedido está no mural */
const keepPolling = (data: Awaited<ReturnType<typeof load>>) => data.request.status === 'OPEN';

async function load(id: string) {
  const [request, offers] = await Promise.all([getBoard(id), listBoardOffers(id)]);
  const delivery = request.deliveryId ? await getDeliveryApi(request.deliveryId) : null;
  return { request, offers, delivery };
}

/** Meu pedido no mural: as ofertas dos motoristas, escolher uma ou retirar o pedido */
export default function BoardScreen({ requestId }: { requestId: string }) {
  const [round, setRound] = useState(0);
  const { data, error } = usePolling(`board:${requestId}:${round}`, () => load(requestId), keepPolling, 10_000);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  if (!data) {
    return error ? (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    ) : (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const { request, offers, delivery } = data;
  const seat = request.kind === 'SEAT';
  const open = request.status === 'OPEN';
  const status = BOARD_STATUS[request.status];

  const run = async (key: string, action: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    setNotice(null);
    try {
      await action();
      setNotice({ text: ok, ok: true });
    } catch (err) {
      setNotice({ text: err instanceof Error ? err.message : 'Não foi possível concluir.', ok: false });
    } finally {
      setBusy(null);
      setRound((r) => r + 1);
    }
  };

  return (
    <Stack spacing={2.5} sx={{ pb: 3 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
          {seat ? <Car size={20} /> : <Package size={20} />}
          <Typography sx={{ fontWeight: 800, flex: 1 }}>{seat ? 'Carona' : request.description}</Typography>
          <Chip size="small" label={status.label} color={status.color} />
        </Stack>
        <RouteSummary
          origin={request.originAddress ?? `${request.originCity}/${request.originState}`}
          destination={request.destinationAddress ?? `${request.destinationCity}/${request.destinationState}`}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          {boardWhen(request)}
          {request.weightKg !== null && ` · ${String(request.weightKg).replace('.', ',')} kg`}
          {request.fragile ? ' · frágil' : ''}
          {request.companyName ? ` · ${request.companyName}` : ''}
        </Typography>
        {request.recipientName && (
          <Typography variant="body2" color="text.secondary">
            Para {request.recipientName} · {request.recipientPhone}
          </Typography>
        )}
        {open && (
          <Button
            size="small"
            color="inherit"
            disabled={busy !== null}
            sx={{ ...pill, mt: 1 }}
            onClick={() => run('cancel', () => cancelBoard(request.id), 'Pedido retirado do mural.')}
          >
            Retirar do mural
          </Button>
        )}
      </Paper>

      {notice && (
        <Alert severity={notice.ok ? 'success' : 'warning'} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      {open && offers.length === 0 && (
        <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', py: 3, color: 'text.secondary' }}>
          <Megaphone size={36} />
          <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Publicado no mural da região</Typography>
          <Typography variant="body2">
            Motoristas perto da saída ou que vão passar por esse caminho já podem ver e mandar um valor. Avisaremos quando chegar uma oferta.
          </Typography>
        </Stack>
      )}

      {request.status === 'EXPIRED' && <Alert severity="info">O horário passou sem uma oferta escolhida. Publique de novo com outro horário.</Alert>}

      {request.status === 'ACCEPTED' && (
        <Stack spacing={1.5}>
          {seat && request.bookingId && (
            <Button component={Link} href={`/viagem/reserva?id=${encodeURIComponent(request.bookingId)}`} variant="contained" sx={{ ...pill, height: 52 }}>
              Ver reserva e pagar
            </Button>
          )}
          {delivery && (
            <>
              {delivery.status === 'CONFIRMED' && delivery.paymentStatus === 'UNPAID' && (
                <Button component={Link} href={paymentPaths.checkout({ kind: 'delivery', deliveryId: delivery.id })} variant="contained" sx={{ ...pill, height: 52 }}>
                  Pagar {formatCurrency(toCents(delivery.price))}
                </Button>
              )}
              {delivery.pickupCode && delivery.status === 'CONFIRMED' && (
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, textAlign: 'center' }}>
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
              <Button component={Link} href="/encomendas" color="inherit" sx={pill}>
                Ver minhas encomendas
              </Button>
            </>
          )}
        </Stack>
      )}

      {offers.length > 0 && (
        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 700 }}>Ofertas dos motoristas</Typography>
          {offers.map((offer, index) => {
            const departure = offer.departureDate ? fromBrazilLocal(offer.departureDate) : null;
            return (
              <Paper key={offer.id} variant="outlined" sx={{ p: 1.75, borderRadius: 3 }}>
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }}>{offer.driverName ?? 'Motorista'}</Typography>
                    {offer.vehicle && (
                      <Typography variant="body2" color="text.secondary">
                        {offer.vehicle}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {departure ? `Numa carona que sai ${formatDate(departure)} às ${formatTime(departure)}` : `Viagem só sua, no horário pedido`}
                    </Typography>
                    {offer.message && <Typography variant="body2">“{offer.message}”</Typography>}
                  </Box>
                  <Stack sx={{ alignItems: 'flex-end', flexShrink: 0 }} spacing={0.5}>
                    <Typography sx={{ fontWeight: 800 }}>{formatCurrency(toCents(offer.price))}</Typography>
                    {open && index === 0 && offers.length > 1 && <Chip size="small" color="primary" label="Mais barata" />}
                    {offer.status !== 'PENDING' && <Chip size="small" label={OFFER_STATUS[offer.status]} />}
                  </Stack>
                </Stack>
                {open && offer.status === 'PENDING' && (
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={busy !== null}
                    startIcon={busy === offer.id ? <CircularProgress size={16} color="inherit" /> : undefined}
                    sx={{ ...pill, mt: 1.25 }}
                    onClick={() =>
                      run(
                        offer.id,
                        () => acceptBoardOffer(request.id, offer.id),
                        seat ? 'Combinado! Sua vaga está confirmada.' : 'Combinado! Sua encomenda está confirmada.',
                      )
                    }
                  >
                    Escolher esta oferta
                  </Button>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
