'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarClock, Car, Map as MapIcon, Minus, Package, Plus, Route, Send, Users } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ActionBar from '@/components/ActionBar';
import FlowTopBar from '@/components/FlowTopBar';
import RouteSummary from '@/features/activities/components/RouteSummary';
import RoutePicker from '@/features/map/components/RoutePicker';
import { usePolling } from '@/hooks/usePolling';
import { ApiError } from '@/services/api';
import { getDriverAccount, publishRoute } from '@/services/driverMode';
import type { DrivingRoute } from '@/services/mapbox';
import { previewPrice } from '@/services/rides';
import type { PriceBreakdownApi } from '@/services/backend/types';
import type { Place } from '@/types/place';
import { formatPlate } from '@/utils/driverValidation';
import { formatCurrency } from '@/utils/formatCurrency';
import { parseMoney, sanitizeMoneyInput } from '@/utils/money';

const loadOnce = () => false;
const pillButton = { height: 52, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none' } as const;
/** Antecedência mínima para publicar uma rota */
const MIN_ADVANCE_MINUTES = 15;

type StepKey = 'route' | 'when' | 'offer' | 'review';
const STEPS: { key: StepKey; label: string }[] = [
  { key: 'route', label: 'Rota' },
  { key: 'when', label: 'Saída' },
  { key: 'offer', label: 'Lugares' },
  { key: 'review', label: 'Revisar' },
];

const MAP_LABELS = {
  origin: 'Saindo de',
  destination: 'Indo para',
  originStep: 'Ponto de partida',
  destinationStep: 'Ponto de chegada',
};

const formatDeparture = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );

/** A saída precisa ter um mínimo de antecedência (fora do render: usa o relógio) */
const tooSoon = (time: number) => time < Date.now() + MIN_ADVANCE_MINUTES * 60_000;

const placeLine = (place: Place) => (place.address && place.address !== place.name ? `${place.name}, ${place.address}` : place.name);

/**
 * Publicar rota em etapas:
 * 1. Rota: no mapa, o ponto exato de partida e de chegada (arrastando o pino ou pesquisando)
 * 2. Saída: referência do ponto de encontro, data/horário e veículo
 * 3. Lugares: vagas, preço e encomendas
 * 4. Revisar e publicar
 */
export default function NewRouteScreen() {
  const router = useRouter();
  const { data: account, error: loadError } = usePolling('driver-account', getDriverAccount, loadOnce);
  const [step, setStep] = useState<StepKey>('route');
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [directions, setDirections] = useState<DrivingRoute | null>(null);
  const [departurePoint, setDeparturePoint] = useState('');
  const [departureAt, setDepartureAt] = useState('');
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [seats, setSeats] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [acceptsPackages, setAcceptsPackages] = useState(true);
  const [packagePrice, setPackagePrice] = useState('');
  const [maxCargoKg, setMaxCargoKg] = useState('30');
  const [preview, setPreview] = useState<{ price: string; breakdown: PriceBreakdownApi } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Prévia: quanto fica com a plataforma (comissão) e quanto o motorista recebe por lugar
  useEffect(() => {
    const cents = parseMoney(price);
    if (!cents || Number.isNaN(cents)) return;
    const timer = setTimeout(() => {
      previewPrice(cents / 100)
        .then((breakdown) => setPreview({ price, breakdown }))
        .catch(() => undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [price]);
  // Só vale a prévia do preço que está no campo agora
  const breakdown = preview && preview.price === price ? preview.breakdown : null;

  const goTo = (next: StepKey) => {
    setErrors({});
    setApiError(null);
    setStep(next);
    window.scrollTo(0, 0);
  };

  // 1. Mapa em tela cheia: ponto exato de partida e de chegada
  if (step === 'route' || !origin || !destination) {
    return (
      <RoutePicker
        title="Publicar rota"
        backHref="/motorista/rotas"
        labels={MAP_LABELS}
        initialOrigin={origin}
        initialDestination={destination}
        onSubmit={(o, d, route) => {
          setOrigin(o);
          setDestination(d);
          setDirections(route);
          goTo('when');
        }}
        renderReview={() => (
          <Button type="submit" variant="contained" endIcon={<ArrowRight size={20} />} sx={{ ...pillButton, boxShadow: 3 }}>
            Continuar
          </Button>
        )}
      />
    );
  }

  const index = STEPS.findIndex((s) => s.key === step);
  const header = (
    <>
      <FlowTopBar title="Publicar rota" onBack={() => goTo(STEPS[index - 1].key)} />
      <Stepper activeStep={index} alternativeLabel sx={{ mb: 3 }}>
        {STEPS.map((s) => (
          <Step key={s.key}>
            <StepLabel>{s.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </>
  );

  if (loadError) return <>{header}<Alert severity="error">{loadError}</Alert></>;
  if (!account) {
    return (
      <>
        {header}
        <Stack sx={{ alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Stack>
      </>
    );
  }

  // Padrões: veículo principal e todos os lugares dele livres
  const vehicle = account.vehicles.find((v) => v.id === vehicleId) ?? account.vehicles.find((v) => v.primary) ?? account.vehicles[0];
  const maxSeats = vehicle?.seats ?? 0;
  const seatCount = Math.min(seats ?? maxSeats, maxSeats);
  const priceCents = parseMoney(price);
  const packageCents = parseMoney(packagePrice);

  const validateWhen = () => {
    const found: Record<string, string> = {};
    const time = Date.parse(departureAt);
    if (Number.isNaN(time)) found.departureAt = 'Informe a data e o horário.';
    else if (tooSoon(time))
      found.departureAt = `A saída precisa ser daqui a pelo menos ${MIN_ADVANCE_MINUTES} minutos.`;
    if (!vehicle) found.vehicle = 'Cadastre um veículo antes de publicar.';
    return found;
  };

  const validateOffer = () => {
    const found: Record<string, string> = {};
    if (seatCount > 0 && (!priceCents || Number.isNaN(priceCents))) found.pricePerSeatCents = 'Informe o preço por lugar.';
    if (seatCount === 0 && !acceptsPackages) found.seats = 'Ofereça pelo menos 1 lugar ou aceite encomendas.';
    if (acceptsPackages && Number.isNaN(packageCents)) found.pricePerPackageCents = 'Preço inválido.';
    if (acceptsPackages && !(Number(maxCargoKg) > 0)) found.maxCargoKg = 'Informe o peso máximo.';
    return found;
  };

  const next = () => {
    const found = step === 'when' ? validateWhen() : validateOffer();
    setErrors(found);
    if (Object.keys(found).length === 0) goTo(step === 'when' ? 'offer' : 'review');
  };

  const submit = async () => {
    setApiError(null);
    setSaving(true);
    try {
      await publishRoute({
        origin,
        destination,
        directions,
        departurePoint: departurePoint.trim(),
        departureAt: new Date(departureAt).toISOString(),
        vehicleId: vehicle!.id,
        seats: seatCount,
        pricePerSeatCents: seatCount > 0 ? priceCents : 0,
        acceptsPackages,
        pricePerPackageCents: acceptsPackages ? packageCents || 0 : 0,
        maxCargoKg: acceptsPackages ? Number(maxCargoKg) : null,
      });
      router.push('/motorista/rotas');
    } catch (err) {
      // O servidor diz qual campo está errado
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setApiError(err instanceof Error ? err.message : 'Não foi possível publicar.');
      setSaving(false);
    }
  };

  const routeCard = (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <RouteSummary origin={placeLine(origin)} destination={placeLine(destination)} />
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1.5, gap: 1, flexWrap: 'wrap' }}>
        {directions ? (
          <Chip
            size="small"
            icon={<Route size={14} />}
            label={`${(directions.distanceMeters / 1000).toFixed(0)} km · ${formatDuration(directions.durationSeconds)}`}
            sx={{ fontWeight: 600 }}
          />
        ) : (
          <span />
        )}
        <Button size="small" startIcon={<MapIcon size={16} />} onClick={() => goTo('route')} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Alterar no mapa
        </Button>
      </Stack>
    </Paper>
  );

  return (
    <>
      {header}
      <Stack spacing={2.5}>
        {step === 'when' && (
          <>
            {routeCard}
            <TextField
              label="Referência do ponto de partida (opcional)"
              placeholder="Ex.: Metrô Barra Funda, saída 2"
              value={departurePoint}
              onChange={(e) => setDeparturePoint(e.target.value)}
              error={Boolean(errors.departurePoint)}
              helperText={errors.departurePoint ?? 'Ajuda o passageiro a achar você no ponto marcado no mapa.'}
            />
            <TextField
              type="datetime-local"
              label="Data e horário de saída"
              value={departureAt}
              onChange={(e) => setDepartureAt(e.target.value)}
              error={Boolean(errors.departureAt)}
              helperText={errors.departureAt}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {account.vehicles.length > 1 && (
              <Box role="radiogroup" aria-label="Veículo">
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                  Veículo
                </Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {account.vehicles.map((v) => {
                    const selected = v.id === vehicle?.id;
                    return (
                      <Chip
                        key={v.id}
                        role="radio"
                        aria-checked={selected}
                        label={`${v.model} · ${formatPlate(v.plate)}`}
                        onClick={() => {
                          setVehicleId(v.id);
                          setSeats(null); // volta ao máximo do novo veículo
                        }}
                        color={selected ? 'primary' : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 600 }}
                      />
                    );
                  })}
                </Stack>
              </Box>
            )}
            {errors.vehicle && <Alert severity="warning">{errors.vehicle}</Alert>}
          </>
        )}

        {step === 'offer' && (
          <>
            <Box>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Lugares oferecidos</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vehicle ? `${vehicle.model}: até ${maxSeats}` : ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <IconButton aria-label="Menos um lugar" onClick={() => setSeats(Math.max(0, seatCount - 1))} disabled={seatCount <= 0} sx={{ border: 1, borderColor: 'divider' }}>
                    <Minus size={18} />
                  </IconButton>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', minWidth: 24, textAlign: 'center' }} aria-live="polite">
                    {seatCount}
                  </Typography>
                  <IconButton aria-label="Mais um lugar" onClick={() => setSeats(Math.min(maxSeats, seatCount + 1))} disabled={seatCount >= maxSeats} sx={{ border: 1, borderColor: 'divider' }}>
                    <Plus size={18} />
                  </IconButton>
                </Stack>
              </Stack>
              {errors.seats && <FormHelperText error>{errors.seats}</FormHelperText>}
            </Box>

            <TextField
              label="Preço por lugar"
              value={price}
              onChange={(e) => setPrice(sanitizeMoneyInput(e.target.value))}
              error={Boolean(errors.pricePerSeatCents)}
              disabled={seatCount === 0}
              helperText={
                errors.pricePerSeatCents ??
                (breakdown && breakdown.driverReceives !== null
                  ? `Você recebe ${formatCurrency(Math.round(breakdown.driverReceives * 100))} por lugar (comissão da plataforma: ${String(breakdown.platformFeePercent).replace('.', ',')}%). Quem embarca no meio do caminho paga o proporcional.`
                  : 'Quanto cada passageiro paga pela viagem inteira.')
              }
              slotProps={{
                htmlInput: { inputMode: 'decimal' },
                input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> },
              }}
            />

            <Stack component="label" direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 1.5, borderRadius: 3, border: 1, borderColor: 'divider', cursor: 'pointer' }}>
              <Package size={22} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>Aceito levar encomendas</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pacotes no porta-malas, combinados pelo app.
                </Typography>
              </Box>
              <Switch checked={acceptsPackages} onChange={(e) => setAcceptsPackages(e.target.checked)} slotProps={{ input: { 'aria-label': 'Aceito levar encomendas' } }} />
            </Stack>

            {acceptsPackages && (
              <Stack direction="row" spacing={1.5}>
                <TextField
                  fullWidth
                  label="Preço por encomenda"
                  value={packagePrice}
                  onChange={(e) => setPackagePrice(sanitizeMoneyInput(e.target.value))}
                  error={Boolean(errors.pricePerPackageCents)}
                  helperText={errors.pricePerPackageCents ?? 'Vazio = grátis'}
                  slotProps={{
                    htmlInput: { inputMode: 'decimal' },
                    input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> },
                  }}
                />
                <TextField
                  fullWidth
                  label="Peso máximo"
                  value={maxCargoKg}
                  onChange={(e) => setMaxCargoKg(e.target.value.replace(/[^\d]/g, ''))}
                  error={Boolean(errors.maxCargoKg)}
                  helperText={errors.maxCargoKg ?? 'Encomendas + bagagens'}
                  slotProps={{ htmlInput: { inputMode: 'numeric' }, input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }}
                />
              </Stack>
            )}
          </>
        )}

        {step === 'review' && (
          <>
            {routeCard}
            <Paper variant="outlined" sx={{ borderRadius: 3 }}>
              <ReviewRow icon={<CalendarClock size={20} />} label="Saída" onEdit={() => goTo('when')}>
                {formatDeparture(departureAt)}
                {departurePoint.trim() && (
                  <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                    {departurePoint.trim()}
                  </Typography>
                )}
              </ReviewRow>
              <Divider />
              <ReviewRow icon={<Car size={20} />} label="Veículo" onEdit={() => goTo('when')}>
                {vehicle ? `${vehicle.model} · ${formatPlate(vehicle.plate)}` : '—'}
              </ReviewRow>
              <Divider />
              <ReviewRow icon={<Users size={20} />} label="Lugares" onEdit={() => goTo('offer')}>
                {seatCount > 0 ? `${seatCount} ${seatCount === 1 ? 'lugar' : 'lugares'} · ${formatCurrency(priceCents ?? 0)} cada` : 'Sem passageiros'}
              </ReviewRow>
              <Divider />
              <ReviewRow icon={<Package size={20} />} label="Encomendas" onEdit={() => goTo('offer')}>
                {acceptsPackages
                  ? `${packageCents ? formatCurrency(packageCents) : 'Grátis'} · até ${maxCargoKg} kg`
                  : 'Não aceita'}
              </ReviewRow>
            </Paper>
          </>
        )}

        {apiError && <Alert severity="error">{apiError}</Alert>}

        <ActionBar>
          {step === 'review' ? (
            <Button
              fullWidth
              variant="contained"
              onClick={submit}
              disabled={saving || !vehicle}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Send size={18} />}
              sx={{ ...pillButton, boxShadow: 3 }}
            >
              Publicar rota
            </Button>
          ) : (
            <Button fullWidth variant="contained" onClick={next} endIcon={<ArrowRight size={20} />} sx={{ ...pillButton, boxShadow: 3 }}>
              Continuar
            </Button>
          )}
        </ActionBar>
      </Stack>
    </>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function ReviewRow({ icon, label, onEdit, children }: { icon: ReactNode; label: string; onEdit: () => void; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 2 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 600 }}>{children}</Typography>
      </Box>
      <Button size="small" onClick={onEdit} sx={{ textTransform: 'none', fontWeight: 600 }}>
        Alterar
      </Button>
    </Stack>
  );
}
