'use client';

import { useState } from 'react';
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
import { searchCities } from '@/services/mapbox';
import type { Place } from '@/types/place';
import { formatPlate } from '@/utils/driverValidation';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    const found: Record<string, string> = {};
    if (!origin) found.originCity = 'Escolha a cidade de saída.';
    if (!destination) found.destinationCity = 'Escolha a cidade de destino.';
    if (!departurePoint.trim()) found.departurePoint = 'Informe o ponto de encontro.';
    if (!departureAt) found.departureAt = 'Informe a data e o horário.';
    if (!priceCents || Number.isNaN(priceCents)) found.pricePerSeatCents = 'Informe o preço por lugar.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await publishRoute({
        originCity: origin!.name,
        destinationCity: destination!.name,
        departurePoint,
        departureAt: new Date(departureAt).toISOString(),
        vehicleId: vehicle!.id,
        seats: seatCount,
        pricePerSeatCents: priceCents,
        acceptsPackages,
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
        label="Saindo de (cidade)"
        value={origin}
        onChange={setOrigin}
        icon={<CircleDot size={18} />}
        search={searchCities}
        noOptionsText="Digite pelo menos 3 letras da cidade"
        size="medium"
        error={errors.originCity}
      />
      <TextField
        label="Ponto de encontro"
        placeholder="Ex.: Metrô Barra Funda, saída 2"
        value={departurePoint}
        onChange={(e) => setDeparturePoint(e.target.value)}
        error={Boolean(errors.departurePoint)}
        helperText={errors.departurePoint}
      />
      <PlaceAutocomplete
        label="Indo para (cidade)"
        value={destination}
        onChange={setDestination}
        icon={<MapPin size={18} />}
        search={searchCities}
        noOptionsText="Digite pelo menos 3 letras da cidade"
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
        helperText={errors.pricePerSeatCents ?? 'Quanto cada passageiro paga.'}
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
