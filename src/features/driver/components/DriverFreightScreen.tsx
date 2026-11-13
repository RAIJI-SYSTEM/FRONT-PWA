'use client';

import { useState } from 'react';
import { Building2, Check, LocateFixed, Send, X } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { fromBrazilLocal, toCents } from '@/services/backend/client';
import { usePolling } from '@/hooks/usePolling';
import type { FreightApi } from '@/services/backend/types';
import {
  acceptDirectFreight,
  declineDirectFreight,
  listFreightsForMe,
  listFreightsNearby,
  offerOnFreight,
  withdrawFreightOffer,
} from '@/services/companies';
import { getDriverAccount } from '@/services/driverMode';
import type { Vehicle } from '@/types/driverMode';
import { formatPlate } from '@/utils/driverValidation';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatTime } from '@/utils/formatDate';
import { parseMoney, sanitizeMoneyInput } from '@/utils/money';
import { OFFER_STATUS } from '@/features/company/components/freightLabels';

const keepPolling = () => true;
async function loadFreights(position: { lat: number; lng: number } | null) {
  const [forMe, nearby, account] = await Promise.all([
    listFreightsForMe(),
    position ? listFreightsNearby(position.lat, position.lng) : Promise.resolve(null),
    getDriverAccount().catch(() => null),
  ]);
  return { forMe, nearby, vehicles: account?.vehicles ?? [] };
}

const pill = { borderRadius: 999, textTransform: 'none', fontWeight: 600 } as const;
type Action = { freight: FreightApi; kind: 'accept' | 'offer' } | null;

/**
 * Fretes de empresas para o motorista:
 * - "Para mim": propostas diretas (aceitar escolhendo o veículo, ou recusar);
 * - "Perto de mim": pedidos públicos com coleta perto; o motorista oferece um valor.
 * Fechado o frete, ele vira uma viagem exclusiva em "Minhas rotas".
 */
export default function DriverFreightScreen() {
  const [tab, setTab] = useState<'mine' | 'nearby'>('mine');
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [round, setRound] = useState(0);
  const posKey = position ? `${position.lat.toFixed(3)},${position.lng.toFixed(3)}` : 'none';
  const { data, error: loadError } = usePolling(`freights:${posKey}:${round}`, () => loadFreights(position), keepPolling, 30_000);
  const forMe = data?.forMe ?? null;
  const nearby = data?.nearby ?? null;
  const vehicles: Vehicle[] = data?.vehicles ?? [];
  const [geoError, setError] = useState<string | null>(null);
  const error = loadError ?? geoError;
  const [notice, setNotice] = useState<string | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [chosenVehicle, setVehicleId] = useState('');
  const vehicleId = chosenVehicle || vehicles[0]?.id || '';
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => setRound((r) => r + 1);

  const locate = () => {
    if (!navigator.geolocation) return setError('Localização indisponível neste aparelho.');
    navigator.geolocation.getCurrentPosition(
      (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setError('Permita o acesso à localização para ver os fretes perto de você.'),
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  };

  const confirm = async () => {
    if (!action) return;
    setBusy(true);
    setNotice(null);
    try {
      if (action.kind === 'accept') {
        await acceptDirectFreight(action.freight.id, vehicleId);
        setNotice('Frete aceito! A viagem está em "Minhas rotas".');
      } else {
        const cents = parseMoney(price);
        if (!cents || Number.isNaN(cents)) throw new Error('Informe o valor.');
        await offerOnFreight(action.freight.id, cents / 100, vehicleId, message.trim() || undefined);
        setNotice('Oferta enviada. A empresa escolhe e avisamos você.');
      }
      setAction(null);
      setPrice('');
      setMessage('');
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  };

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      setNotice(msg);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  };

  const card = (f: FreightApi, actions: React.ReactNode) => {
    const at = fromBrazilLocal(f.desiredDate);
    return (
      <Paper key={f.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Building2 size={18} />
          <Typography sx={{ fontWeight: 700, flex: 1 }} noWrap>
            {f.companyName}
          </Typography>
          {f.offeredPrice !== null && <Typography sx={{ fontWeight: 800 }}>{formatCurrency(toCents(f.offeredPrice))}</Typography>}
        </Stack>
        <Typography sx={{ mt: 0.5 }}>
          {f.originCity}/{f.originState} → {f.destinationCity}/{f.destinationState}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatDate(at)} às {formatTime(at)} · {f.description} · {f.weightKg} kg{f.fragile ? ' · frágil' : ''}
        </Typography>
        {f.notes && (
          <Typography variant="body2" color="text.secondary">
            “{f.notes}”
          </Typography>
        )}
        <Box sx={{ mt: 1 }}>{actions}</Box>
      </Paper>
    );
  };

  if (error) return <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>;

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
          Fretes de empresas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Empresas que precisam levar encomendas. Ao fechar, vira uma viagem só sua.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
        <Tab value="mine" label={`Para mim (${forMe?.length ?? 0})`} />
        <Tab value="nearby" label="Perto de mim" />
      </Tabs>

      {notice && (
        <Alert severity="info" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {tab === 'mine' &&
        (!forMe ? (
          <CircularProgress sx={{ alignSelf: 'center' }} />
        ) : forMe.length === 0 ? (
          <Typography color="text.secondary">Nenhuma proposta direta agora.</Typography>
        ) : (
          forMe.map((f) =>
            card(
              f,
              <Stack direction="row" spacing={1}>
                <Button size="small" fullWidth variant="outlined" color="inherit" startIcon={<X size={16} />} disabled={busy} onClick={() => run(() => declineDirectFreight(f.id), 'Proposta recusada.')} sx={pill}>
                  Recusar
                </Button>
                <Button size="small" fullWidth variant="contained" startIcon={<Check size={16} />} disabled={busy || vehicles.length === 0} onClick={() => setAction({ freight: f, kind: 'accept' })} sx={pill}>
                  Aceitar
                </Button>
              </Stack>,
            ),
          )
        ))}

      {tab === 'nearby' &&
        (!position ? (
          <Button variant="outlined" startIcon={<LocateFixed size={18} />} onClick={locate} sx={pill}>
            Usar minha localização
          </Button>
        ) : !nearby ? (
          <CircularProgress sx={{ alignSelf: 'center' }} />
        ) : nearby.length === 0 ? (
          <Typography color="text.secondary">Nenhum pedido de frete perto de você agora.</Typography>
        ) : (
          nearby.map((f) =>
            card(
              f,
              f.myOffer ? (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Chip size="small" label={`Sua oferta: ${formatCurrency(toCents(f.myOffer.price))} · ${OFFER_STATUS[f.myOffer.status]}`} />
                  {f.myOffer.status === 'PENDING' && (
                    <Button size="small" color="inherit" disabled={busy} onClick={() => run(() => withdrawFreightOffer(f.id, f.myOffer!.id), 'Oferta retirada.')}>
                      Retirar
                    </Button>
                  )}
                </Stack>
              ) : (
                <Button size="small" variant="contained" startIcon={<Send size={16} />} disabled={busy || vehicles.length === 0} onClick={() => setAction({ freight: f, kind: 'offer' })} sx={pill}>
                  Oferecer valor
                </Button>
              ),
            ),
          )
        ))}

      {vehicles.length === 0 && <Alert severity="warning">Cadastre um veículo no seu perfil para aceitar fretes.</Alert>}

      <Dialog open={Boolean(action)} onClose={() => setAction(null)} fullWidth maxWidth="xs">
        <Stack spacing={2} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {action?.kind === 'accept' ? 'Aceitar o frete' : 'Sua oferta'}
          </Typography>
          <TextField select label="Veículo" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {vehicles.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                {v.model} · {formatPlate(v.plate)}
              </MenuItem>
            ))}
          </TextField>
          {action?.kind === 'offer' && (
            <>
              <TextField
                label="Valor"
                value={price}
                onChange={(e) => setPrice(sanitizeMoneyInput(e.target.value))}
                slotProps={{ htmlInput: { inputMode: 'decimal' }, input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
              />
              <TextField label="Mensagem (opcional)" value={message} onChange={(e) => setMessage(e.target.value)} />
            </>
          )}
          <Stack direction="row" spacing={1.5}>
            <Button fullWidth color="inherit" onClick={() => setAction(null)} sx={pill}>
              Voltar
            </Button>
            <Button fullWidth variant="contained" disabled={busy || !vehicleId} onClick={confirm} sx={pill}>
              Confirmar
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    </Stack>
  );
}
