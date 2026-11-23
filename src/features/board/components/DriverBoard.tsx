'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Car, ChevronRight, Inbox, LocateFixed, MapPin, Package, Route, Send } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import StatusScreen from '@/components/StatusScreen';
import RouteSummary from '@/features/activities/components/RouteSummary';
import { OFFER_STATUS } from '@/features/company/components/freightLabels';
import { PACKAGE_SIZES } from '@/features/delivery/packageSizes';
import { usePolling } from '@/hooks/usePolling';
import { fromBrazilLocal, toCents } from '@/services/backend/client';
import type { BoardApi, BoardKindApi } from '@/services/backend/types';
import { listBoardOffered, listBoardRegion, offerOnBoard, withdrawBoardOffer } from '@/services/board';
import { listFreightsNearby } from '@/services/companies';
import { getDriverAccount } from '@/services/driverMode';
import { formatPlate } from '@/utils/driverValidation';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { parseMoney, sanitizeMoneyInput } from '@/utils/money';
import { boardKm, boardWhen } from '../boardLabels';

type Position = { lat: number; lng: number };

const pill = { borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;
const POLL_MS = 15_000;
const keepPolling = () => true;

async function load(position: Position | null) {
  const [region, offered, freights, account] = await Promise.all([
    listBoardRegion(position),
    listBoardOffered(),
    position ? listFreightsNearby(position.lat, position.lng).catch(() => []) : Promise.resolve([]),
    getDriverAccount().catch(() => null),
  ]);
  // Minhas ofertas ainda abertas continuam na lista mesmo fora da região (mudei de lugar)
  const ids = new Set(region.map((r) => r.id));
  const waiting = offered.filter((r) => !ids.has(r.id) && r.status === 'OPEN' && r.myOffer?.status === 'PENDING');
  return { requests: [...region, ...waiting], freights: freights.length, vehicles: account?.vehicles ?? [] };
}

/**
 * Mural da região do motorista: pedidos para depois com a saída perto dele ou no caminho das
 * caronas que publicou. Ele oferece um valor, numa carona que já tem ou numa viagem nova.
 */
export default function DriverBoard({ kind }: { kind: BoardKindApi | null }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [denied, setDenied] = useState(false);
  const [round, setRound] = useState(0);
  const key = position ? `${position.lat.toFixed(3)},${position.lng.toFixed(3)}` : 'none';
  const { data, error } = usePolling(`driver-board:${key}:${round}`, () => load(position), keepPolling, POLL_MS);
  const [target, setTarget] = useState<BoardApi | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const locate = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setDenied(false);
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => setDenied(true),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setDenied(true),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  const withdraw = async (request: BoardApi) => {
    setBusy(true);
    try {
      await withdrawBoardOffer(request.id, request.myOffer!.id);
      setNotice({ text: 'Oferta retirada.', ok: true });
    } catch (err) {
      setNotice({ text: err instanceof Error ? err.message : 'Não foi possível retirar.', ok: false });
    } finally {
      setBusy(false);
      setRound((r) => r + 1);
    }
  };

  if (!data) {
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const requests = data.requests.filter((r) => kind === null || r.kind === kind);

  return (
    <Stack spacing={1.5}>
      {notice && (
        <Alert severity={notice.ok ? 'success' : 'warning'} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      {!position && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" startIcon={<LocateFixed size={16} />} onClick={locate} sx={pill}>
              Localizar
            </Button>
          }
        >
          {denied ? 'Sem a sua localização, aparecem só os pedidos no caminho das suas rotas.' : 'Procurando a sua localização…'}
        </Alert>
      )}

      {data.freights > 0 && kind !== 'SEAT' && (
        <ButtonBase
          component={Link}
          href="/motorista/fretes"
          sx={{ p: 1.5, gap: 1.5, borderRadius: 3, justifyContent: 'flex-start', bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.1)' }}
        >
          <Building2 size={20} />
          <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, textAlign: 'left' }}>
            {data.freights === 1 ? '1 frete de empresa perto de você' : `${data.freights} fretes de empresas perto de você`}
          </Typography>
          <ChevronRight size={18} />
        </ButtonBase>
      )}

      {requests.length === 0 ? (
        <StatusScreen
          icon={Inbox}
          title="Nenhum pedido na região"
          description="Caronas e encomendas agendadas com saída a até 30 km de você, ou no caminho das rotas que você publicou, aparecem aqui automaticamente."
        />
      ) : (
        requests.map((request) => (
          <BoardCard key={request.id} request={request} busy={busy} onOffer={() => setTarget(request)} onWithdraw={() => withdraw(request)} />
        ))
      )}

      {target && (
        <OfferDialog
          key={target.id}
          request={target}
          vehicles={data.vehicles}
          onClose={() => setTarget(null)}
          onSent={() => {
            setTarget(null);
            setNotice({ text: 'Oferta enviada. Avisaremos se ela for escolhida.', ok: true });
            setRound((r) => r + 1);
          }}
        />
      )}
    </Stack>
  );
}

function BoardCard({ request: r, busy, onOffer, onWithdraw }: { request: BoardApi; busy: boolean; onOffer: () => void; onWithdraw: () => void }) {
  const size = PACKAGE_SIZES.find((s) => s.value === r.size?.toLowerCase());
  const offer = r.myOffer;
  const waiting = offer?.status === 'PENDING';
  const Icon = r.kind === 'SEAT' ? Car : Package;

  return (
    <Paper variant="outlined" component="article" sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Icon size={20} style={{ flexShrink: 0 }} color="var(--mui-palette-primary-main)" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }} noWrap>
            {r.kind === 'SEAT' ? 'Carona' : 'Encomenda'} · {r.companyName ?? r.requesterName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {boardWhen(r)}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {boardKm(r.tripDistanceMeters)} em linha reta
        </Typography>
      </Stack>

      <RouteSummary origin={`${r.originCity}/${r.originState}`} destination={`${r.destinationCity}/${r.destinationState}`} />

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        {r.distanceMeters !== null && <Chip size="small" variant="outlined" icon={<MapPin size={14} />} label={`Saída a ${boardKm(r.distanceMeters)}`} />}
        {r.matchingRide && <Chip size="small" color="primary" icon={<Route size={14} />} label="No caminho da sua carona" />}
        {size && <Chip size="small" variant="outlined" label={size.label} />}
        {r.weightKg !== null && <Chip size="small" variant="outlined" label={`${String(r.weightKg).replace('.', ',')} kg`} />}
        {r.fragile && <Chip size="small" variant="outlined" label="Frágil" />}
      </Stack>
      {r.description && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {r.description}
        </Typography>
      )}
      {r.notes && (
        <Typography variant="body2" color="text.secondary">
          “{r.notes}”
        </Typography>
      )}

      {waiting ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Sua oferta: {formatCurrency(toCents(offer.price))}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {OFFER_STATUS.PENDING} · você recebe {formatCurrency(toCents(offer.driverReceives))}
            </Typography>
          </Box>
          <Button size="small" color="inherit" disabled={busy} onClick={onWithdraw} sx={pill}>
            Retirar
          </Button>
        </Stack>
      ) : (
        <Button fullWidth variant="contained" startIcon={<Send size={16} />} disabled={busy} onClick={onOffer} sx={{ ...pill, mt: 1.5, height: 44 }}>
          Oferecer valor
        </Button>
      )}
    </Paper>
  );
}

interface OfferDialogProps {
  request: BoardApi;
  vehicles: { id: string; model: string; plate: string }[];
  onClose: () => void;
  onSent: () => void;
}

/** Valor + onde levar: numa carona que já passa pelo caminho ou numa viagem nova */
function OfferDialog({ request, vehicles, onClose, onSent }: OfferDialogProps) {
  const ride = request.matchingRide;
  const [where, setWhere] = useState<'ride' | 'new'>(ride ? 'ride' : 'new');
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const send = async () => {
    const cents = parseMoney(price);
    if (!cents || Number.isNaN(cents)) return setError('Informe o valor.');
    if (where === 'new' && !vehicleId) return setError('Cadastre um veículo no seu perfil.');
    setError(null);
    setSending(true);
    try {
      await offerOnBoard(request.id, {
        price: cents / 100,
        ...(where === 'ride' && ride ? { rideId: ride.id } : { vehicleId }),
        message: message.trim() || undefined,
      });
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a oferta.');
      setSending(false);
    }
  };

  const rideAt = ride ? fromBrazilLocal(ride.departureDate) : null;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <Stack spacing={2} sx={{ p: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Sua oferta
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {request.originCity} → {request.destinationCity} · {boardWhen(request)}
          </Typography>
        </Box>
        <TextField
          label="Valor"
          value={price}
          onChange={(e) => setPrice(sanitizeMoneyInput(e.target.value))}
          slotProps={{ htmlInput: { inputMode: 'decimal' }, input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
        />
        {ride && rideAt && (
          <RadioGroup value={where} onChange={(_, v) => setWhere(v as 'ride' | 'new')} aria-label="Onde levar">
            <FormControlLabel
              value="ride"
              control={<Radio />}
              label={`Na minha carona ${ride.originCity} → ${ride.destinationCity}, ${formatDate(rideAt)} às ${formatTime(rideAt)}`}
            />
            <FormControlLabel value="new" control={<Radio />} label="Numa viagem nova, só para este pedido" />
          </RadioGroup>
        )}
        {where === 'new' &&
          (vehicles.length === 0 ? (
            <Alert severity="warning">Cadastre um veículo no seu perfil para fazer uma oferta.</Alert>
          ) : (
            <TextField select label="Veículo" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {vehicles.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.model} · {formatPlate(v.plate)}
                </MenuItem>
              ))}
            </TextField>
          ))}
        <TextField
          label="Mensagem (opcional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction="row" spacing={1.5}>
          <Button fullWidth color="inherit" onClick={onClose} sx={pill}>
            Voltar
          </Button>
          <Button fullWidth variant="contained" disabled={sending || (where === 'new' && !vehicleId)} onClick={send} sx={pill}>
            Enviar oferta
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}
