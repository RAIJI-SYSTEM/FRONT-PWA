'use client';

import { useState } from 'react';
import { CheckCheck, Flag, KeyRound, Lock, Package, Play, Users, X, Check } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { describeBaggage } from '@/features/ride/baggage/baggageTypes';
import { backend, fromBrazilLocal, toCents } from '@/services/backend/client';
import { usePolling } from '@/hooks/usePolling';
import type { BookingApi, DeliveryApi, RideApi } from '@/services/backend/types';
import {
  acceptAllRequests,
  cancelRoute,
  closeBookings,
  decideBaggageChange,
  deliverDelivery,
  finishRide,
  listRideBookings,
  listRideDeliveries,
  pickUpDelivery,
  startRide,
} from '@/services/driverMode';
import { getRide } from '@/services/rides';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';

const pill = { borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;
const RIDE_STATUS: Record<RideApi['status'], string> = {
  PLANNED: 'Publicada',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};
const DELIVERY_STATUS: Record<DeliveryApi['status'], string> = {
  PENDING: 'Pedido',
  CONFIRMED: 'Aguardando coleta',
  IN_TRANSIT: 'Em trânsito',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelada',
};

const keepPolling = () => true;
async function loadRide(rideId: string) {
  const { ride } = await getRide(rideId);
  const [bookings, deliveries] = await Promise.all([
    ride.type === 'CARGO' ? Promise.resolve([] as BookingApi[]) : listRideBookings(rideId),
    ride.type === 'PASSENGER' ? Promise.resolve([] as DeliveryApi[]) : listRideDeliveries(rideId),
  ]);
  return { ride, bookings, deliveries, loadedAt: Date.now() };
}

type CodeDialog = { delivery: DeliveryApi; action: 'pickup' | 'deliver' } | null;

/**
 * Gerenciar uma carona: pedidos de vaga (um a um ou "aceitar todos"), mudanças de
 * bagagem, encomendas (aceitar, coletar com o código do remetente, entregar com a
 * palavra-chave do destinatário) e o ciclo da viagem (encerrar reservas, iniciar, finalizar).
 */
export default function RideManageScreen({ rideId }: { rideId: string }) {
  // Pedidos chegam a qualquer momento: consulta a cada 15s; a "rodada" força recarregar após uma ação
  const [round, setRound] = useState(0);
  const { data, error } = usePolling(`ride-manage:${rideId}:${round}`, () => loadRide(rideId), keepPolling, 15_000);
  const ride = data?.ride ?? null;
  const bookings = data?.bookings ?? [];
  const deliveries = data?.deliveries ?? [];
  const load = async () => setRound((r) => r + 1);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [codeDialog, setCodeDialog] = useState<CodeDialog>(null);
  const [code, setCode] = useState('');

  const run = async (action: () => Promise<unknown>, message?: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      if (message) setNotice(message);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!ride) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const departureAt = fromBrazilLocal(ride.departureDate);
  const planned = ride.status === 'PLANNED';
  const pending = bookings.filter((b) => b.status === 'PENDING');
  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
  const fullRoutePending = pending.filter((b) => b.fullRoute).length;
  const canStart = planned && Date.parse(departureAt) - (data?.loadedAt ?? 0) <= 60 * 60_000;

  const decide = (b: BookingApi, accept: boolean) =>
    run(
      () =>
        backend(`/api/rides/${ride.id}/requests/${b.id}`, {
          method: 'PATCH',
          body: accept ? { decision: 'ACCEPT' } : { decision: 'REJECT', reason: 'Recusado pelo motorista.' },
        }),
      accept ? `${b.passengerName} confirmado(a).` : 'Pedido recusado.',
    );

  const decideDelivery = (d: DeliveryApi, accept: boolean) =>
    run(
      () =>
        backend(`/api/rides/${ride.id}/deliveries/${d.id}`, {
          method: 'PATCH',
          body: accept ? { decision: 'ACCEPT' } : { decision: 'REJECT', reason: 'Recusado pelo motorista.' },
        }),
      accept ? 'Encomenda aceita.' : 'Encomenda recusada.',
    );

  const confirmCode = async () => {
    if (!codeDialog) return;
    const { delivery, action } = codeDialog;
    await run(
      () => (action === 'pickup' ? pickUpDelivery(delivery.id, code) : deliverDelivery(delivery.id, code)),
      action === 'pickup' ? 'Encomenda coletada.' : 'Encomenda entregue!',
    );
    setCodeDialog(null);
    setCode('');
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.15rem' }}>
            {ride.originCity} → {ride.destinationCity}
          </Typography>
          <Chip size="small" label={RIDE_STATUS[ride.status]} color={planned ? 'primary' : 'default'} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {formatDate(departureAt)} às {formatTime(departureAt)}
          {ride.meetingPoint ? ` · ${ride.meetingPoint}` : ''}
        </Typography>
        {ride.totalSeats > 0 && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {ride.availableSeats} de {ride.totalSeats} vagas livres
            {ride.driverReceivesPerPassenger !== null ? ` · você recebe ${formatCurrency(toCents(ride.driverReceivesPerPassenger))} por vaga` : ''}
          </Typography>
        )}
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
          {planned && !ride.bookingsClosed && (
            <Button size="small" variant="outlined" startIcon={<Lock size={16} />} disabled={busy} onClick={() => run(() => closeBookings(ride.id), 'Reservas encerradas.')} sx={pill}>
              Encerrar reservas
            </Button>
          )}
          {planned && (
            <Button size="small" variant="contained" startIcon={<Play size={16} />} disabled={busy || !canStart} onClick={() => run(() => startRide(ride.id), 'Boa viagem!')} sx={pill}>
              Iniciar viagem
            </Button>
          )}
          {ride.status === 'IN_PROGRESS' && (
            <Button size="small" variant="contained" color="success" startIcon={<Flag size={16} />} disabled={busy} onClick={() => run(() => finishRide(ride.id), 'Viagem finalizada.')} sx={pill}>
              Finalizar viagem
            </Button>
          )}
          {planned && (
            <Button
              size="small"
              color="error"
              disabled={busy}
              onClick={() => window.confirm('Cancelar a viagem? Quem reservou é avisado e recebe o estorno.') && run(() => cancelRoute(ride.id), 'Viagem cancelada.')}
              sx={pill}
            >
              Cancelar viagem
            </Button>
          )}
        </Stack>
        {planned && !canStart && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Dá para iniciar a partir de 1h antes da saída. Ao iniciar, os pedidos pendentes são recusados.
          </Typography>
        )}
      </Paper>

      {notice && (
        <Alert severity="info" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {ride.type !== 'CARGO' && (
        <Stack spacing={1.25}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Users size={20} />
              <Typography sx={{ fontWeight: 700 }}>Passageiros</Typography>
            </Stack>
            {planned && fullRoutePending > 0 && (
              <Button size="small" variant="contained" startIcon={<CheckCheck size={16} />} disabled={busy} sx={pill} onClick={() =>
                run(async () => {
                  const r = await acceptAllRequests(ride.id);
                  setNotice(`${r.accepted.length} aceito(s).${r.skipped.length ? ` ${r.skipped.length} para decidir um a um.` : ''}`);
                })
              }>
                Aceitar todos ({fullRoutePending})
              </Button>
            )}
          </Stack>
          {bookings.length === 0 && <Typography color="text.secondary">Nenhum pedido ainda.</Typography>}
          {[...pending, ...confirmed].map((b) => (
            <Paper key={b.id} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>
                    {b.passengerName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {describeBaggage(b.baggage)}
                    {!b.fullRoute && ` · trecho: ${b.pickupAddress ?? 'origem'} → ${b.dropoffAddress ?? 'destino'}`}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 700 }}>{b.price ? formatCurrency(toCents(b.price)) : 'Grátis'}</Typography>
              </Stack>
              {b.status === 'PENDING' && planned && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button size="small" fullWidth variant="outlined" color="inherit" startIcon={<X size={16} />} disabled={busy} onClick={() => decide(b, false)} sx={pill}>
                    Recusar
                  </Button>
                  <Button size="small" fullWidth variant="contained" startIcon={<Check size={16} />} disabled={busy} onClick={() => decide(b, true)} sx={pill}>
                    Aceitar
                  </Button>
                </Stack>
              )}
              {b.status !== 'PENDING' && <Chip size="small" sx={{ mt: 1 }} color="success" label={b.status === 'COMPLETED' ? 'Concluído' : 'Confirmado'} />}
              {b.pendingBaggage.length > 0 && planned && (
                <Alert
                  severity="info"
                  sx={{ mt: 1 }}
                  action={
                    <Stack direction="row" spacing={0.5}>
                      <Button size="small" disabled={busy} onClick={() => run(() => decideBaggageChange(ride.id, b.id, false), 'Mudança recusada.')}>
                        Recusar
                      </Button>
                      <Button size="small" disabled={busy} onClick={() => run(() => decideBaggageChange(ride.id, b.id, true), 'Bagagem aprovada.')}>
                        Aprovar
                      </Button>
                    </Stack>
                  }
                >
                  Quer levar: {describeBaggage(b.pendingBaggage)}
                </Alert>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      {ride.type !== 'PASSENGER' && (
        <Stack spacing={1.25}>
          <Divider />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Package size={20} />
            <Typography sx={{ fontWeight: 700 }}>Encomendas</Typography>
          </Stack>
          {deliveries.length === 0 && <Typography color="text.secondary">Nenhuma encomenda ainda.</Typography>}
          {deliveries.map((d) => (
            <Paper key={d.id} variant="outlined" sx={{ p: 1.5, borderRadius: 3, opacity: d.status === 'CANCELLED' ? 0.6 : 1 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>
                    {d.description} · {d.weightKg} kg {d.fragile ? '· frágil' : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    De {d.senderName ?? 'remetente'} para {d.recipientName} · {d.lengthCm}×{d.widthCm}×{d.heightCm} cm
                  </Typography>
                </Box>
                <Chip size="small" label={DELIVERY_STATUS[d.status]} />
              </Stack>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Você recebe {d.driverReceives ? formatCurrency(toCents(d.driverReceives)) : 'R$ 0,00'}
              </Typography>
              {d.status === 'PENDING' && planned && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button size="small" fullWidth variant="outlined" color="inherit" disabled={busy} onClick={() => decideDelivery(d, false)} sx={pill}>
                    Recusar
                  </Button>
                  <Button size="small" fullWidth variant="contained" disabled={busy} onClick={() => decideDelivery(d, true)} sx={pill}>
                    Aceitar
                  </Button>
                </Stack>
              )}
              {d.status === 'CONFIRMED' && (
                <Button size="small" variant="contained" startIcon={<KeyRound size={16} />} sx={{ ...pill, mt: 1 }} onClick={() => setCodeDialog({ delivery: d, action: 'pickup' })}>
                  Coletar (código do remetente)
                </Button>
              )}
              {d.status === 'IN_TRANSIT' && (
                <Button size="small" variant="contained" color="success" startIcon={<KeyRound size={16} />} sx={{ ...pill, mt: 1 }} onClick={() => setCodeDialog({ delivery: d, action: 'deliver' })}>
                  Entregar (palavra-chave)
                </Button>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={Boolean(codeDialog)} onClose={() => setCodeDialog(null)} fullWidth maxWidth="xs">
        <Stack spacing={2} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {codeDialog?.action === 'pickup' ? 'Código de coleta' : 'Palavra-chave da entrega'}
          </Typography>
          <Typography color="text.secondary">
            {codeDialog?.action === 'pickup'
              ? 'Peça ao remetente o código de 4 números que aparece no app dele.'
              : `Peça a ${codeDialog?.delivery.recipientName ?? 'quem recebe'} a palavra-chave (ex.: SOL-42).`}
          </Typography>
          <TextField autoFocus label={codeDialog?.action === 'pickup' ? 'Código' : 'Palavra-chave'} value={code} onChange={(e) => setCode(e.target.value)} />
          <Stack direction="row" spacing={1.5}>
            <Button fullWidth color="inherit" onClick={() => setCodeDialog(null)} sx={pill}>
              Voltar
            </Button>
            <Button fullWidth variant="contained" disabled={busy || !code.trim()} onClick={confirmCode} sx={pill}>
              Confirmar
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    </Stack>
  );
}
