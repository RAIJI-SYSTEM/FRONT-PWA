'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleDot, MapPin, Minus, Package, Plus, Send } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ActionBar from '@/components/ActionBar';
import PlaceAutocomplete from '@/features/ride/components/PlaceAutocomplete';
import { usePolling } from '@/hooks/usePolling';
import { ApiError } from '@/services/api';
import { getDriverAccount, publishRoute } from '@/services/driverMode';
import { previewPrice } from '@/services/rides';
import type { PriceBreakdownApi } from '@/services/backend/types';
import type { Place } from '@/types/place';
import { formatPlate } from '@/utils/driverValidation';
import { formatCurrency } from '@/utils/formatCurrency';
import { parseMoney, sanitizeMoneyInput } from '@/utils/money';

const loadOnce = () => false;
const pillButton = { height: 52, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none' } as const;

/** Publicar rota: de onde, para onde, quando, com qual veículo, quantos lugares e por quanto */
export default function NewRouteScreen() {
  const router = useRouter();
  const { data: account, error: loadError } = usePolling('driver-account', getDriverAccount, loadOnce);
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
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

  if (loadError) return <Alert severity="error">{loadError}</Alert>;
  if (!account) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  // Padrões: veículo principal e todos os lugares dele livres
  const vehicle = account.vehicles.find((v) => v.id === vehicleId) ?? account.vehicles.find((v) => v.primary) ?? account.vehicles[0];
  const maxSeats = vehicle?.seats ?? 0;
  const seatCount = Math.min(seats ?? maxSeats, maxSeats);

  const submit = async () => {
    setApiError(null);
    const priceCents = parseMoney(price);
    const packageCents = parseMoney(packagePrice);
    const found: Record<string, string> = {};
    if (!origin) found.originCity = 'Escolha de onde sai.';
    if (!destination) found.destinationCity = 'Escolha para onde vai.';
    if (!departureAt) found.departureAt = 'Informe a data e o horário.';
    if (seatCount > 0 && (!priceCents || Number.isNaN(priceCents))) found.pricePerSeatCents = 'Informe o preço por lugar.';
    if (seatCount === 0 && !acceptsPackages) found.seats = 'Ofereça pelo menos 1 lugar ou aceite encomendas.';
    if (acceptsPackages && Number.isNaN(packageCents)) found.pricePerPackageCents = 'Preço inválido.';
    if (acceptsPackages && !(Number(maxCargoKg) > 0)) found.maxCargoKg = 'Informe o peso máximo.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await publishRoute({
        origin: origin!,
        destination: destination!,
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
      // O servidor diz qual campo está errado: mostra embaixo dele
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setApiError(err instanceof Error ? err.message : 'Não foi possível publicar.');
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <PlaceAutocomplete
        label="Saindo de"
        value={origin}
        onChange={setOrigin}
        icon={<CircleDot size={18} />}
        noOptionsText="Digite o endereço, bairro ou cidade"
        size="medium"
        error={errors.originCity}
      />
      <TextField
        label="Ponto de encontro (opcional)"
        placeholder="Ex.: Metrô Barra Funda, saída 2"
        value={departurePoint}
        onChange={(e) => setDeparturePoint(e.target.value)}
        error={Boolean(errors.departurePoint)}
        helperText={errors.departurePoint}
      />
      <PlaceAutocomplete
        label="Indo para"
        value={destination}
        onChange={setDestination}
        icon={<MapPin size={18} />}
        noOptionsText="Digite o endereço, bairro ou cidade"
        size="medium"
        error={errors.destinationCity}
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

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <ActionBar>
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
      </ActionBar>
    </Stack>
  );
}
