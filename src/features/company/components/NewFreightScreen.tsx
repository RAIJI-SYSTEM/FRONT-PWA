'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleDot, MapPin, Send } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import ActionBar from '@/components/ActionBar';
import FragileToggle from '@/features/delivery/components/details/FragileToggle';
import PackageSizePicker from '@/features/delivery/components/PackageSizePicker';
import { MAX_WEIGHT_KG } from '@/features/delivery/packageSizes';
import PlaceAutocomplete from '@/features/ride/components/PlaceAutocomplete';
import type { DeliveryApi, PackageSizeApi } from '@/services/backend/types';
import { createFreight } from '@/services/companies';
import { listMyDeliveries } from '@/services/deliveries';
import { stateOf } from '@/services/driverMode';
import type { PackageSize } from '@/types/delivery';
import type { Place } from '@/types/place';
import { parseMoney, sanitizeMoneyInput } from '@/utils/money';

const pillButton = { height: 52, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none' } as const;

const toFreightPlace = (p: Place) => ({
  city: p.city ?? p.name,
  state: stateOf(p),
  latitude: p.coordinates[1],
  longitude: p.coordinates[0],
  address: p.address ? `${p.name}, ${p.address}` : p.name,
});

/**
 * Novo frete da empresa:
 * - pedido público: motoristas da região se oferecem com um valor e a empresa escolhe;
 * - direto: proposta com valor para um motorista que já levou encomendas da empresa (ele aceita ou recusa).
 */
export default function NewFreightScreen({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<'public' | 'direct'>('public');
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [when, setWhen] = useState('');
  const [size, setSize] = useState<PackageSize | null>(null);
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [fragile, setFragile] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [driverSub, setDriverSub] = useState('');
  const [history, setHistory] = useState<DeliveryApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Motoristas que já levaram encomendas desta empresa (para a proposta direta)
  useEffect(() => {
    listMyDeliveries().then(setHistory).catch(() => setHistory([]));
  }, []);
  const knownDrivers = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of history) {
      if (d.companyId === companyId && d.ride && d.status !== 'CANCELLED') map.set(d.ride.driverSub, d.ride.driverName ?? 'Motorista');
    }
    return [...map.entries()];
  }, [history, companyId]);

  const submit = async () => {
    setError(null);
    const priceCents = parseMoney(price);
    const kg = Number(weight.replace(',', '.'));
    if (!origin || !destination) return setError('Escolha a coleta e a entrega.');
    if (!when) return setError('Escolha a data e o horário.');
    if (!size) return setError('Escolha o tamanho do pacote.');
    if (!description.trim()) return setError('Descreva o pacote.');
    if (!(kg > 0)) return setError('Informe o peso.');
    if (kg > MAX_WEIGHT_KG[size]) return setError(`Até ${MAX_WEIGHT_KG[size]} kg nesse tamanho. Escolha um maior.`);
    if (!recipientName.trim() || recipientPhone.replace(/\D/g, '').length < 10) return setError('Informe nome e telefone de quem recebe.');
    if (mode === 'direct' && !driverSub) return setError('Escolha o motorista.');
    if (mode === 'direct' && (!priceCents || Number.isNaN(priceCents))) return setError('Na proposta direta, informe o valor.');

    setSaving(true);
    try {
      const created = await createFreight(companyId, {
        targetDriverSub: mode === 'direct' ? driverSub : null,
        offeredPrice: priceCents && !Number.isNaN(priceCents) ? priceCents / 100 : null,
        origin: toFreightPlace(origin),
        destination: toFreightPlace(destination),
        desiredDate: new Date(when),
        pkg: {
          size: size.toUpperCase() as PackageSizeApi,
          description: description.trim(),
          weightKg: kg,
          fragile,
          recipientName: recipientName.trim(),
          recipientPhone,
        },
        notes: notes.trim() || undefined,
      });
      router.push(`/empresa/frete?id=${encodeURIComponent(created.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o frete.');
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <ToggleButtonGroup exclusive fullWidth value={mode} onChange={(_, v) => v && setMode(v)} aria-label="Tipo de frete">
        <ToggleButton value="public" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Motoristas se oferecem
        </ToggleButton>
        <ToggleButton value="direct" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Direto a um motorista
        </ToggleButton>
      </ToggleButtonGroup>
      <Typography variant="body2" color="text.secondary">
        {mode === 'public'
          ? 'Motoristas perto da coleta veem o pedido e mandam um valor. Você escolhe a melhor oferta.'
          : 'Proposta com valor para um motorista que já levou encomendas da empresa. Ele aceita ou recusa.'}
      </Typography>

      {mode === 'direct' &&
        (knownDrivers.length === 0 ? (
          <Alert severity="info">Ainda não há motoristas que levaram encomendas da empresa. Use o pedido público.</Alert>
        ) : (
          <TextField select label="Motorista" value={driverSub} onChange={(e) => setDriverSub(e.target.value)}>
            {knownDrivers.map(([sub, name]) => (
              <MenuItem key={sub} value={sub}>
                {name}
              </MenuItem>
            ))}
          </TextField>
        ))}

      <PlaceAutocomplete label="Coleta" value={origin} onChange={setOrigin} icon={<CircleDot size={18} />} size="medium" noOptionsText="Digite o endereço" />
      <PlaceAutocomplete label="Entrega" value={destination} onChange={setDestination} icon={<MapPin size={18} />} size="medium" noOptionsText="Digite o endereço" />
      <TextField type="datetime-local" label="Quando coletar" value={when} onChange={(e) => setWhen(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />

      <FragileToggle checked={fragile} onChange={setFragile} />
      <PackageSizePicker value={size} onChange={setSize} />
      <TextField label="O que vai no pacote" value={description} onChange={(e) => setDescription(e.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} />
      <TextField
        label="Peso"
        value={weight}
        onChange={(e) => setWeight(e.target.value.replace(/[^\d.,]/g, ''))}
        slotProps={{ htmlInput: { inputMode: 'decimal' }, input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }}
      />
      <TextField label="Quem recebe" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
      <TextField label="Telefone de quem recebe" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} slotProps={{ htmlInput: { inputMode: 'tel' } }} />
      <TextField
        label={mode === 'direct' ? 'Valor oferecido' : 'Valor de referência (opcional)'}
        value={price}
        onChange={(e) => setPrice(sanitizeMoneyInput(e.target.value))}
        slotProps={{ htmlInput: { inputMode: 'decimal' }, input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
      />
      <TextField label="Observações (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} />

      {error && <Alert severity="error">{error}</Alert>}

      <ActionBar>
        <Button
          fullWidth
          variant="contained"
          onClick={submit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Send size={18} />}
          sx={{ ...pillButton, boxShadow: 3 }}
        >
          {mode === 'direct' ? 'Enviar proposta' : 'Publicar pedido de frete'}
        </Button>
      </ActionBar>
    </Stack>
  );
}
